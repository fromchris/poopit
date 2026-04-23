/**
 * Static analysis for LLM-generated playable bundles.
 *
 * Rejects on any of:
 *   - parse failure
 *   - banned identifiers / globals (eval, Function, Worker, fetch, XMLHttpRequest,
 *     importScripts, document.cookie, localStorage, sessionStorage, indexedDB,
 *     navigator.sendBeacon, credentials)
 *   - dynamic script / iframe injection
 *   - url() with external origin in stylesheets
 *   - overly large output (> 150 KB of JS)
 *
 * This is defense-in-depth; the iframe also runs with `sandbox="allow-scripts"`
 * (no `allow-same-origin`), so even if analysis missed something, it cannot
 * touch our cookies, make same-origin requests, or escape the frame.
 */
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import type { Node } from "@babel/types";

const BANNED_IDENTIFIERS = new Set([
  "eval",
  "Function",
  "Worker",
  "SharedWorker",
  "ServiceWorker",
  "importScripts",
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "EventSource",
  "Credential",
  "PublicKeyCredential",
  "indexedDB",
  "localStorage",
  "sessionStorage",
]);

const BANNED_MEMBER_KEYS = new Set([
  "cookie",
  "sendBeacon",
  "postMessage", // we allow iframes to receive messages, not send up arbitrarily
]);

export type AnalyzeResult =
  | { ok: true; stats: { jsBytes: number } }
  | { ok: false; reason: string };

const MAX_BUNDLE = 300 * 1024; // 300KB total HTML
const MAX_JS = 150 * 1024;

export function analyzeBundle(html: string): AnalyzeResult {
  if (html.length > MAX_BUNDLE)
    return { ok: false, reason: `bundle too large (${html.length} bytes)` };

  // Extract inline scripts. We don't allow external <script src="...">.
  const externalScript = /<script\b[^>]*\bsrc\s*=/i.test(html);
  if (externalScript) return { ok: false, reason: "external <script src> banned" };

  const linkHref = /<link\b[^>]*\bhref\s*=\s*["'](?!data:|\/|#|about:)[^"'>]+/i;
  if (linkHref.test(html))
    return { ok: false, reason: "external <link href> banned" };

  // Block srcdoc/iframe-in-iframe chaining & meta refresh / http-equiv redirects.
  if (/<meta\b[^>]*http-equiv/i.test(html))
    return { ok: false, reason: "meta http-equiv banned" };
  if (/<iframe\b/i.test(html))
    return { ok: false, reason: "nested <iframe> banned" };
  if (/<object\b|<embed\b|<applet\b/i.test(html))
    return { ok: false, reason: "object/embed/applet banned" };

  // Block event handlers that phone home via url()-like attributes.
  if (/\burl\(\s*["']?(?:https?:|\/\/)[^)]+\)/i.test(html))
    return { ok: false, reason: "external url() in styles banned" };

  // Block external hrefs/srcs on tags EXCEPT same-origin (/api/files/..., /dramas/...),
  // relative paths, anchors (#…), data: and blob: URIs. Covers <img>, <video>,
  // <source>, <audio>, <a href>, etc.
  const offSite = html.match(
    /\b(?:src|href|srcset|poster|action|background)\s*=\s*["'](?!data:|blob:|\/|#|about:)[^"'>\s]+/gi
  );
  if (offSite && offSite.length > 0) {
    return {
      ok: false,
      reason: `external URL banned: ${offSite[0].slice(0, 60)}`,
    };
  }

  // Concatenate inline JS and analyze via AST.
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(
    (m) => m[1] ?? ""
  );
  const js = scripts.join("\n;\n");
  if (js.length > MAX_JS) return { ok: false, reason: `JS too large (${js.length} bytes)` };

  if (!js.trim()) return { ok: true, stats: { jsBytes: 0 } };

  let ast: Node;
  try {
    ast = parse(js, {
      sourceType: "script",
      allowReturnOutsideFunction: true,
      errorRecovery: false,
    });
  } catch (err) {
    return {
      ok: false,
      reason: `parse error: ${err instanceof Error ? err.message : "unknown"}`,
    };
  }

  let violation: string | null = null;

  traverse(ast, {
    Identifier(path) {
      const name = path.node.name;
      if (!BANNED_IDENTIFIERS.has(name)) return;
      // Allow if it's a local binding (e.g., `function fetch(...)`).
      if (path.scope.hasBinding(name)) return;
      violation = `banned identifier: ${name}`;
      path.stop();
    },
    MemberExpression(path) {
      const prop = path.node.property;
      let key: string | null = null;
      if (prop.type === "Identifier") key = prop.name;
      else if (prop.type === "StringLiteral") key = prop.value;
      if (!key) return;
      if (BANNED_MEMBER_KEYS.has(key)) {
        violation = `banned member: .${key}`;
        path.stop();
      }
      // document.write/open — potential XSS vectors
      if (
        (key === "write" || key === "open" || key === "writeln") &&
        path.node.object.type === "Identifier" &&
        path.node.object.name === "document"
      ) {
        violation = `banned member: document.${key}`;
        path.stop();
      }
    },
    NewExpression(path) {
      const callee = path.node.callee;
      if (callee.type === "Identifier" && BANNED_IDENTIFIERS.has(callee.name)) {
        if (!path.scope.hasBinding(callee.name)) {
          violation = `banned constructor: ${callee.name}`;
          path.stop();
        }
      }
    },
    CallExpression(path) {
      const callee = path.node.callee;
      if (
        callee.type === "MemberExpression" &&
        callee.property.type === "Identifier" &&
        callee.property.name === "createElement" &&
        path.node.arguments[0]?.type === "StringLiteral"
      ) {
        const tag = path.node.arguments[0].value.toLowerCase();
        if (["script", "iframe", "object", "embed", "link"].includes(tag)) {
          violation = `dynamic createElement('${tag}') banned`;
          path.stop();
        }
      }
    },
  });

  if (violation) return { ok: false, reason: violation };

  return { ok: true, stats: { jsBytes: js.length } };
}

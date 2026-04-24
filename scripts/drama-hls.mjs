#!/usr/bin/env node
// One-off: pull the inline data:video/mp4 out of the drama HTML, decode it,
// transcode to HLS (4 rungs), and rewrite the HTML's <video> to point at the
// master playlist. Idempotent — re-running replaces everything.

import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";

const HTML = resolve("public/dramas/dqjtj-main.html");
const OUT_DIR = resolve("public/dramas/dqjtj");
const TMP_MP4 = join(OUT_DIR, "_source.mp4");
const BACKUP = HTML + ".orig";
const PUBLIC_HLS_BASE = "/dramas/dqjtj";

const log = (...a) => console.log("[drama-hls]", ...a);

log("reading", HTML);
const html = readFileSync(HTML, "utf8");

// If the HLS master already exists, skip transcoding — just re-patch
// the HTML. Saves ~1 minute on each iteration while we debug the regex.
const SKIP_TRANSCODE = existsSync(join(OUT_DIR, "master.m3u8"));
if (SKIP_TRANSCODE) {
  log("HLS output already present at " + OUT_DIR + " — skipping transcode.");
}

if (!SKIP_TRANSCODE) log("locating data:video/mp4;base64, block");
if (!SKIP_TRANSCODE) {
const tag = "data:video/mp4;base64,";
const start = html.indexOf(tag);
if (start < 0) {
  console.error("no data:video/mp4;base64 in HTML — nothing to do");
  process.exit(1);
}
const afterTag = start + tag.length;

// Base64 content runs until the first non-base64 character. In this HTML
// it's ended by a quote, angle bracket, or whitespace. Walk forward.
const b64Charset = /^[A-Za-z0-9+/=\s]+$/;
let end = afterTag;
while (end < html.length) {
  const c = html[end];
  if (!b64Charset.test(c)) break;
  end++;
}
const b64 = html.slice(afterTag, end).replace(/\s+/g, "");
log("base64 length:", b64.length, "→ roughly", Math.floor(b64.length * 0.75 / 1024 / 1024), "MiB decoded");

mkdirSync(OUT_DIR, { recursive: true });
rmSync(TMP_MP4, { force: true });
writeFileSync(TMP_MP4, Buffer.from(b64, "base64"));
log("decoded MP4 →", TMP_MP4);

log("transcoding to HLS (240p/480p/720p/1080p) — this takes a few minutes…");
// 4 rungs with synced segment boundaries so ABR switching is seamless.
const rungs = [
  { height: 240, bitrate: "400k" },
  { height: 480, bitrate: "900k" },
  { height: 720, bitrate: "2100k" },
  { height: 1080, bitrate: "4600k" },
];
for (const r of rungs) {
  log("  → " + r.height + "p @ " + r.bitrate);
  execSync(
    [
      "ffmpeg -y -i",
      JSON.stringify(TMP_MP4),
      `-vf "scale=-2:${r.height}"`,
      `-c:v libx264 -b:v ${r.bitrate} -preset veryfast -profile:v main -pix_fmt yuv420p`,
      "-c:a aac -b:a 128k -ac 2",
      "-hls_time 4 -hls_playlist_type vod -hls_flags independent_segments",
      `-hls_segment_filename "${join(OUT_DIR, `${r.height}p_%03d.ts`)}"`,
      JSON.stringify(join(OUT_DIR, `${r.height}p.m3u8`)),
    ].join(" "),
    { stdio: "inherit" },
  );
}

// Master playlist advertises all rungs.
const master =
  "#EXTM3U\n" +
  rungs
    .map((r) => {
      const width = Math.round((r.height * 16) / 9);
      const bw = parseInt(r.bitrate) * 1000;
      return `#EXT-X-STREAM-INF:BANDWIDTH=${bw},RESOLUTION=${width}x${r.height}\n${r.height}p.m3u8`;
    })
    .join("\n");
writeFileSync(join(OUT_DIR, "master.m3u8"), master + "\n");
log("master.m3u8 written");

// Drop a poster frame at 2s for the feed grid / thumbnail use later.
log("extracting poster.jpg");
execSync(
  `ffmpeg -y -i ${JSON.stringify(TMP_MP4)} -ss 00:00:02 -vframes 1 -q:v 3 ${JSON.stringify(join(OUT_DIR, "poster.jpg"))}`,
  { stdio: "ignore" },
);

rmSync(TMP_MP4);
} // end !SKIP_TRANSCODE

// Back up original HTML once, then rewrite the video source. The drama
// declares `var VID = "data:video/mp4;base64,..."` then later does
// `v.src = VID`. Replace VID with the HLS master URL; inject hls.js so
// non-Safari WebViews (Android) can decode it — Safari plays HLS natively.
writeFileSync(BACKUP, html);

const hlsUrl = `${PUBLIC_HLS_BASE}/master.m3u8`;
const vidRegex = /var\s+VID\s*=\s*["']data:video\/mp4;base64,[^"']+["']\s*;?/;
if (!vidRegex.test(html)) {
  console.warn(
    "WARN: couldn't find `var VID = \"data:...\"` — HTML may need manual edit.",
    "HLS output is still ready at",
    OUT_DIR,
  );
  process.exit(0);
}

// The drama assigns v.src = VID and relies on <video> native playback.
// We keep the variable's name + the assignment. Post-assign we detect
// non-native HLS support and hook Hls.js.
const VID_REPL = `var VID=${JSON.stringify(hlsUrl)};`;
const assignRegex = /(v\.src\s*=\s*VID\s*;?)/;
const hlsHook = `
$1
if (!document.getElementById('__hls_bootstrap__')) {
  var __s = document.createElement('script');
  __s.id = '__hls_bootstrap__';
  __s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5/dist/hls.min.js';
  __s.crossOrigin = 'anonymous';
  __s.onload = function(){
    if (v.canPlayType('application/vnd.apple.mpegurl')) return;
    if (window.Hls && window.Hls.isSupported()) {
      var h = new window.Hls();
      h.loadSource(VID);
      h.attachMedia(v);
    }
  };
  document.head.appendChild(__s);
}
`;

let patched = html.replace(vidRegex, VID_REPL);
if (assignRegex.test(patched)) {
  patched = patched.replace(assignRegex, hlsHook.trim());
} else {
  console.warn(
    "WARN: VID replaced, but `v.src = VID` line not found — native HLS only (Android will likely fail).",
  );
}
writeFileSync(HTML, patched);

log("patched", HTML);
log("backup kept at", BACKUP);
log("✓ done. VID now points at", hlsUrl);

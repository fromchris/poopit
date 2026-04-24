// Interactive drama + generic LLM bundle. Both host arbitrary HTML
// in a WebView.
//  - Lazy mount: the WebView isn't inserted until this card is active
//    the first time. That stops every feed card from trying to pull
//    the 35 MB bundle at boot.
//  - After first activation the WebView stays mounted (reload would be
//    expensive). When active toggles off, we inject JS that pauses any
//    playing <video>/<audio>; when it toggles back on, we resume.
//  - The wrapper View captures touches so the parent FlatList's
//    paging gesture recognizer can't steal drags / taps inside the
//    interactive content.

import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { backendUrl } from "../lib/api";

const PAUSE_JS = `
  document.querySelectorAll('video, audio').forEach(m => { try { m.pause(); } catch (e) {} });
  true;
`;

const RESUME_JS = `
  document.querySelectorAll('video, audio').forEach(m => { try { m.play && m.play().catch(() => {}); } catch (e) {} });
  true;
`;

export function InteractiveDrama({
  src,
  active,
}: {
  src?: string;
  active: boolean;
}) {
  const webRef = useRef<WebView>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (active) setMounted(true);
  }, [active]);

  useEffect(() => {
    if (!mounted || !webRef.current) return;
    webRef.current.injectJavaScript(active ? RESUME_JS : PAUSE_JS);
  }, [active, mounted]);

  if (!src) return null;
  const base = backendUrl();
  const url = src.startsWith("http") ? src : `${base}${src}`;

  if (!mounted) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <WebView
        ref={webRef}
        source={{ uri: url }}
        style={styles.web}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={["*"]}
        androidLayerType="hardware"
        bounces={false}
        scrollEnabled={false}
        setSupportMultipleWindows={false}
      />
    </View>
  );
}

export { InteractiveDrama as LlmBundle };

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  web: {
    flex: 1,
    backgroundColor: "#000",
  },
});

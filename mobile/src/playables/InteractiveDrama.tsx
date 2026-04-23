// Interactive drama + generic LLM bundle — both host arbitrary HTML
// in a sandboxed WebView. The backend serves the bundle at an absolute
// URL (for drama) or relative path (for generated bundles); we resolve
// both against the backend base.

import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { backendUrl } from "../lib/api";

export function InteractiveDrama({
  src,
  active,
}: {
  src?: string;
  active: boolean;
}) {
  if (!src) return null;
  const base = backendUrl();
  const url = src.startsWith("http") ? src : `${base}${src}`;
  return (
    <View style={styles.root}>
      <WebView
        source={{ uri: url }}
        style={styles.web}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={["*"]}
        // Pause media when the card scrolls out of view.
        mediaCapturePermissionGrantType="prompt"
        androidLayerType={active ? "hardware" : "none"}
        bounces={false}
        scrollEnabled={false}
      />
    </View>
  );
}

export { InteractiveDrama as LlmBundle };

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  web: {
    flex: 1,
    backgroundColor: "#000",
  },
});

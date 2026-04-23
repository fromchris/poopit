import { StatusBar } from "expo-status-bar";
import { useRef } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewNavigation } from "react-native-webview";

// Set EXPO_PUBLIC_BACKEND_URL to your deployed Loopit backend before
// building — e.g. `EXPO_PUBLIC_BACKEND_URL=https://loopit.example.com`.
// Unset values fall through to a visible "not configured" screen so a
// stray build doesn't silently ship pointing at localhost.
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function App() {
  if (!BACKEND_URL) {
    return <NotConfigured />;
  }
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <StatusBar style="light" />
        <Shell url={BACKEND_URL} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Shell({ url }: { url: string }) {
  const webRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);

  // Android hardware back button: step through WebView history first,
  // then let the OS handle the exit when there's nothing left.
  if (Platform.OS === "android") {
    BackHandler.addEventListener?.("hardwareBackPress", () => {
      if (canGoBackRef.current && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      return false;
    });
  }

  return (
    <WebView
      ref={webRef}
      source={{ uri: url }}
      style={styles.webview}
      javaScriptEnabled
      domStorageEnabled
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      originWhitelist={["*"]}
      bounces={false}
      overScrollMode="never"
      pullToRefreshEnabled={false}
      setSupportMultipleWindows={false}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#f472b6" />
        </View>
      )}
      onNavigationStateChange={(nav: WebViewNavigation) => {
        canGoBackRef.current = nav.canGoBack;
      }}
    />
  );
}

function NotConfigured() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.root, styles.centered]}>
        <StatusBar style="light" />
        <Text style={styles.logo}>Loopit</Text>
        <Text style={styles.msg}>
          This build has no backend URL configured. Set
          {"\n"}
          <Text style={styles.code}>EXPO_PUBLIC_BACKEND_URL</Text>
          {"\n"}
          before running{" "}
          <Text style={styles.code}>npm run ios</Text> /{" "}
          <Text style={styles.code}>android</Text>.
        </Text>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  webview: {
    flex: 1,
    backgroundColor: "#000",
  },
  loading: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    fontSize: 48,
    fontWeight: "900",
    color: "#f472b6",
    letterSpacing: -1,
  },
  msg: {
    marginTop: 16,
    color: "#ffffffaa",
    textAlign: "center",
    lineHeight: 22,
  },
  code: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    color: "#fff",
    backgroundColor: "#ffffff14",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

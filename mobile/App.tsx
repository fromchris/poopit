import "react-native-gesture-handler";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { BottomTabs, type Tab } from "./src/components/BottomTabs";
import { FeedScreen } from "./src/screens/FeedScreen";
import { PlaceholderScreen } from "./src/screens/PlaceholderScreen";
import { useStore } from "./src/lib/store";

export default function App() {
  const boot = useStore((s) => s.boot);
  useEffect(() => {
    boot().catch(() => {});
  }, [boot]);

  const [tab, setTab] = useState<Tab>("feed");

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar style="light" />
      <View style={styles.root}>
        {tab === "feed" && <FeedScreen />}
        {tab === "search" && (
          <PlaceholderScreen
            title="Search"
            hint="Ported next. Feed + one playable are live."
          />
        )}
        {tab === "create" && (
          <PlaceholderScreen
            title="Create"
            hint="Prompt + media picker go here."
          />
        )}
        {tab === "inbox" && (
          <PlaceholderScreen
            title="Inbox"
            hint="Notifications list + SSE stream go here."
          />
        )}
        {tab === "profile" && (
          <PlaceholderScreen title="Me" hint="Profile tabs go here." />
        )}
        <BottomTabs tab={tab} onChange={setTab} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
});

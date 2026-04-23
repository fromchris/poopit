import "react-native-gesture-handler";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { BottomTabs, type Tab } from "./src/components/BottomTabs";
import { Toast } from "./src/components/Toast";
import { useStore } from "./src/lib/store";
import { useLocale } from "./src/lib/i18n";
import { usePrefs } from "./src/lib/prefs";
import { subscribeNotifications } from "./src/lib/notifications";
import { FeedScreen } from "./src/screens/FeedScreen";
import { SearchScreen } from "./src/screens/SearchScreen";
import { CreateScreen } from "./src/screens/CreateScreen";
import { InboxScreen } from "./src/screens/InboxScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import type { Playable } from "./src/lib/types";

export default function App() {
  const boot = useStore((s) => s.boot);
  const me = useStore((s) => s.me);
  const booted = useStore((s) => s.booted);
  const jumpToPlayable = useStore((s) => s.jumpToPlayable);
  const hydrateLocale = useLocale((s) => s.hydrate);
  const hydratePrefs = usePrefs((s) => s.hydrate);

  const [tab, setTab] = useState<Tab>("feed");
  const [authOpen, setAuthOpen] = useState(false);

  const openPlayable = (p: Playable) => {
    jumpToPlayable(p);
    setTab("feed");
  };

  useEffect(() => {
    hydrateLocale();
    hydratePrefs();
    boot().catch(() => {});
  }, [boot, hydrateLocale, hydratePrefs]);

  // Open auth sheet once per session for signed-out users.
  useEffect(() => {
    if (booted && !me) setAuthOpen(true);
  }, [booted, me]);

  // Subscribe to server-sent notifications when signed in.
  useEffect(() => {
    if (!me) return;
    return subscribeNotifications();
  }, [me]);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar style="light" />
      <View style={styles.root}>
        {tab === "feed" && <FeedScreen />}
        {tab === "search" && <SearchScreen onOpenPlayable={openPlayable} />}
        {tab === "create" && (
          <CreateScreen onOpenAuth={() => setAuthOpen(true)} />
        )}
        {tab === "inbox" && <InboxScreen />}
        {tab === "profile" && (
          <ProfileScreen
            onOpenAuth={() => setAuthOpen(true)}
            onOpenPlayable={openPlayable}
          />
        )}
        <BottomTabs tab={tab} onChange={setTab} />
      </View>
      <Toast />
      <Modal
        visible={authOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setAuthOpen(false)}
      >
        <AuthScreen onClose={() => setAuthOpen(false)} />
      </Modal>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
});

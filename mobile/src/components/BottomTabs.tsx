import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeIcon, InboxIcon, PlusIcon, SearchIcon, UserIcon } from "./Icons";

export type Tab = "feed" | "search" | "create" | "inbox" | "profile";

export function BottomTabs({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(8, insets.bottom) }]}>
      <TabButton
        label="Feed"
        active={tab === "feed"}
        onPress={() => onChange("feed")}
        icon={<HomeIcon size={24} filled={tab === "feed"} />}
      />
      <TabButton
        label="Search"
        active={tab === "search"}
        onPress={() => onChange("search")}
        icon={<SearchIcon size={24} />}
      />
      <Pressable onPress={() => onChange("create")} style={styles.createBtn}>
        <PlusIcon size={28} />
      </Pressable>
      <TabButton
        label="Inbox"
        active={tab === "inbox"}
        onPress={() => onChange("inbox")}
        icon={<InboxIcon size={24} filled={tab === "inbox"} />}
      />
      <TabButton
        label="Me"
        active={tab === "profile"}
        onPress={() => onChange("profile")}
        icon={<UserIcon size={24} filled={tab === "profile"} />}
      />
    </View>
  );
}

function TabButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tab}>
      {icon}
      <Text
        style={[
          styles.tabLabel,
          { color: active ? "#fff" : "rgba(255,255,255,0.5)" },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: "#000000cc",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ffffff18",
  },
  tab: {
    minWidth: 48,
    alignItems: "center",
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  createBtn: {
    marginTop: -12,
    width: 64,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#ec4899",
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});

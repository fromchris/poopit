// i18n for the mobile app. Dicts are copied verbatim from
// app/lib/i18n.ts (EN + ZH); locale is persisted via AsyncStorage.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { NativeModules, Platform } from "react-native";

export type Locale = "en" | "zh";

type Dict = Record<string, string>;

const EN: Dict = {
  // top
  "top.following": "Following",
  "top.forYou": "For You",
  // bottom tabs
  "tab.feed": "Feed",
  "tab.search": "Search",
  "tab.create": "Create",
  "tab.inbox": "Inbox",
  "tab.me": "Me",
  // empty / errors
  "feed.loading": "LOADING FEED…",
  "feed.emptyFollowing": "Follow some creators to fill this feed.",
  "feed.emptyForYou": "Be the first to publish a playable.",
  "feed.error.title": "Couldn't load feed",
  "feed.retry": "Try again",
  // sheet labels
  "sheet.close": "Close",
  "sheet.cancel": "Cancel",
  "sheet.save": "Save",
  // comments
  "comments.empty": "Be the first to comment.",
  "comments.placeholder": "Comment as {handle}",
  "comments.signInToComment": "Sign in to comment",
  "comments.post": "Post",
  "comments.delete": "delete",
  "comments.count": "{n} comments",
  // share
  "share.title": "Share",
  "share.copyLink": "Copy link",
  "share.shareTo": "Share to…",
  "share.copied": "Link copied",
  // remix
  "remix.title": "Remix \"{title}\"",
  "remix.sub": "Describe what you'd change. The agent writes the new playable.",
  "remix.submit": "Remix",
  // overflow
  "overflow.notInterested": "Not interested",
  "overflow.report": "Report",
  "overflow.delete": "Delete",
  "overflow.hidden": "Hidden from your feed",
  // report
  "report.title": "Report",
  "report.spam": "Spam or misleading",
  "report.hate": "Hate or harassment",
  "report.violence": "Violence / graphic content",
  "report.adult": "Adult content",
  "report.other": "Something else",
  "report.submitted": "Report submitted",
  // create
  "create.title": "Make a playable",
  "create.sub":
    "Describe an idea. The AI writes the whole thing — logic, art, and all.",
  "create.prompt.placeholder": "a cat that purrs louder the more you pet it…",
  "create.generate": "Generate",
  "create.photo": "Photo",
  "create.video": "Video",
  "create.jobs": "Your latest generations",
  "create.job.queued": "Queued…",
  "create.job.running": "Generating…",
  "create.job.failed": "Failed",
  "create.job.succeeded": "Published",
  // generator
  "gen.loading.title": "Generating playable",
  "gen.failed": "Generation failed",
  "gen.pingInInbox": "Generating · ping in Inbox when ready",
  // auth
  "auth.welcomeBack": "Welcome back",
  "auth.makeAccount": "Make an account",
  "auth.makeAccountHint":
    "Claim a handle so your playables + likes stick around.",
  "auth.welcomeHint": "Sign in to like, comment, and publish.",
  "auth.handle": "@handle",
  "auth.password": "password",
  "auth.signIn": "Sign in",
  "auth.createAccount": "Create account",
  "auth.haveAccount": "Have an account? Sign in",
  "auth.new": "New? Make one",
  "auth.or": "or",
  "auth.tryGuest": "Try as guest",
  "auth.demoHint": "Demo accounts: @you.loop / looploop",
  "auth.recoveryTitle": "Recovery code",
  "auth.recoveryBody":
    "Save this somewhere safe — it's the only way back in if you lose your session:\n\n{code}",
  "auth.gotIt": "Got it",
  // inbox
  "inbox.title": "Inbox",
  "inbox.empty": "Nothing new here.",
  "inbox.signIn": "Sign in to see your Inbox",
  "inbox.notifications": "Notifications",
  "inbox.messages": "Messages",
  "inbox.tab.all": "All",
  "inbox.tab.likes": "Likes",
  "inbox.tab.comments": "Comments",
  "inbox.tab.follows": "Follows",
  "inbox.action.like": "liked your playable",
  "inbox.action.comment": "commented on",
  "inbox.action.follow": "started following you",
  "inbox.action.remix": "remixed",
  "inbox.action.generation_ready": "your playable is ready",
  "inbox.action.generation_failed": "generation failed",
  // DMs
  "dm.empty": "No messages yet. Tap \"Message\" on anyone's profile to start.",
  "dm.sayHi": "Say hi to {handle} 👋",
  "dm.placeholder": "Message",
  "dm.send": "Send",
  // search
  "search.placeholder": "Search playables, creators, tags",
  "search.trending": "Trending",
  "search.noMatches": "No matches.",
  "search.searching": "Searching…",
  // profile
  "profile.stat.playables": "playables",
  "profile.stat.followers": "followers",
  "profile.stat.following": "following",
  "profile.stat.likes": "likes",
  "profile.edit": "Edit profile",
  "profile.sub.created": "Created",
  "profile.sub.liked": "Liked",
  "profile.sub.remixed": "Remixed",
  "profile.signInPrompt": "Sign in to see your profile",
  "profile.signInCta": "Sign in or create account",
  "profile.empty.liked": "Tap ❤️ on a playable to save it here.",
  "profile.empty.remixed": "Your remixes will appear here.",
  "profile.empty.created": "Make your first playable from the Create tab.",
  "profile.followers": "Followers",
  "profile.followingList": "Following",
  "profile.noFollowers": "No followers yet.",
  "profile.noFollowing": "Not following anyone yet.",
  "profile.follow": "Follow",
  "profile.unfollow": "Following",
  // edit profile
  "edit.avatar": "Avatar",
  "edit.handle": "Handle",
  "edit.bio": "Bio",
  "edit.bioPlaceholder": "Tell the world about your playables",
  "edit.saved": "Profile updated",
  // settings
  "settings.title": "Settings",
  "settings.account": "Account",
  "settings.signedInAs": "Signed in as {handle}",
  "settings.playback": "Playback",
  "settings.reducedMotion": "Reduced motion",
  "settings.dataSaver": "Data saver (lower-bitrate video)",
  "settings.privacy": "Privacy & support",
  "settings.privacyPolicy": "Privacy policy",
  "settings.terms": "Terms of service",
  "settings.help": "Help & feedback",
  "settings.export": "Export my data",
  "settings.signOut": "Sign out",
  "settings.signOutConfirm.title": "Sign out?",
  "settings.signOutConfirm.body": "You can always sign back in.",
  "settings.language": "Language",
  "settings.version": "Loopit mobile · v0.1",
  // misc
  "common.cancel": "Cancel",
};

const ZH: Dict = {
  "top.following": "关注",
  "top.forYou": "推荐",
  "tab.feed": "首页",
  "tab.search": "搜索",
  "tab.create": "创作",
  "tab.inbox": "消息",
  "tab.me": "我的",
  "feed.loading": "正在加载…",
  "feed.emptyFollowing": "关注一些创作者来填满这个 feed。",
  "feed.emptyForYou": "成为第一个发布 playable 的人。",
  "feed.error.title": "Feed 加载失败",
  "feed.retry": "重试",
  "sheet.close": "关闭",
  "sheet.cancel": "取消",
  "sheet.save": "保存",
  "comments.empty": "还没有评论，来第一个。",
  "comments.placeholder": "以 {handle} 评论",
  "comments.signInToComment": "登录后评论",
  "comments.post": "发送",
  "comments.delete": "删除",
  "comments.count": "{n} 条评论",
  "share.title": "分享",
  "share.copyLink": "复制链接",
  "share.shareTo": "分享到…",
  "share.copied": "链接已复制",
  "remix.title": "Remix《{title}》",
  "remix.sub": "描述你想怎么改，agent 会写一个新的 playable。",
  "remix.submit": "Remix",
  "overflow.notInterested": "不感兴趣",
  "overflow.report": "举报",
  "overflow.delete": "删除",
  "overflow.hidden": "已从你的 feed 隐藏",
  "report.title": "举报",
  "report.spam": "垃圾内容 / 误导",
  "report.hate": "仇恨 / 骚扰",
  "report.violence": "暴力 / 血腥内容",
  "report.adult": "成人内容",
  "report.other": "其他原因",
  "report.submitted": "举报已提交",
  "create.title": "创作 playable",
  "create.sub": "描述一个想法，AI 会把玩法和画面都写好。",
  "create.prompt.placeholder": "一只摸得越久叫得越响的猫…",
  "create.generate": "生成",
  "create.photo": "照片",
  "create.video": "视频",
  "create.jobs": "最近生成",
  "create.job.queued": "排队中…",
  "create.job.running": "生成中…",
  "create.job.failed": "失败",
  "create.job.succeeded": "已发布",
  "gen.loading.title": "正在生成 playable",
  "gen.failed": "生成失败",
  "gen.pingInInbox": "生成中 · 完成后会在消息里通知你",
  "auth.welcomeBack": "欢迎回来",
  "auth.makeAccount": "创建账号",
  "auth.makeAccountHint": "取个 handle，作品和点赞都会保存下来。",
  "auth.welcomeHint": "登录后可以点赞、评论、发布。",
  "auth.handle": "@用户名",
  "auth.password": "密码",
  "auth.signIn": "登录",
  "auth.createAccount": "创建账号",
  "auth.haveAccount": "已有账号？去登录",
  "auth.new": "新用户？注册",
  "auth.or": "或者",
  "auth.tryGuest": "以访客身份试用",
  "auth.demoHint": "演示账号：@you.loop / looploop",
  "auth.recoveryTitle": "恢复码",
  "auth.recoveryBody":
    "请妥善保存——这是你丢失 session 后找回账号的唯一方式：\n\n{code}",
  "auth.gotIt": "明白了",
  "inbox.title": "消息",
  "inbox.empty": "暂无新消息。",
  "inbox.signIn": "登录后查看消息",
  "inbox.notifications": "通知",
  "inbox.messages": "私信",
  "inbox.tab.all": "全部",
  "inbox.tab.likes": "点赞",
  "inbox.tab.comments": "评论",
  "inbox.tab.follows": "关注",
  "inbox.action.like": "点赞了你的 playable",
  "inbox.action.comment": "评论了",
  "inbox.action.follow": "开始关注你",
  "inbox.action.remix": "remix 了",
  "inbox.action.generation_ready": "你的 playable 已完成",
  "inbox.action.generation_failed": "生成失败",
  "dm.empty": "还没有私信。在对方主页点「发消息」开始聊天。",
  "dm.sayHi": "跟 {handle} 打个招呼 👋",
  "dm.placeholder": "说点什么",
  "dm.send": "发送",
  "search.placeholder": "搜索 playable、创作者、标签",
  "search.trending": "热门",
  "search.noMatches": "没有结果。",
  "search.searching": "搜索中…",
  "profile.stat.playables": "作品",
  "profile.stat.followers": "粉丝",
  "profile.stat.following": "关注",
  "profile.stat.likes": "获赞",
  "profile.edit": "编辑资料",
  "profile.sub.created": "已创建",
  "profile.sub.liked": "点赞过",
  "profile.sub.remixed": "Remix 过",
  "profile.signInPrompt": "登录后查看个人主页",
  "profile.signInCta": "登录 / 注册",
  "profile.empty.liked": "给 playable 点 ❤️，会保存在这里。",
  "profile.empty.remixed": "你 remix 的作品会出现在这里。",
  "profile.empty.created": "从「创作」tab 发布你的第一个 playable。",
  "profile.followers": "粉丝",
  "profile.followingList": "关注",
  "profile.noFollowers": "还没有粉丝。",
  "profile.noFollowing": "还没关注任何人。",
  "profile.follow": "关注",
  "profile.unfollow": "已关注",
  "edit.avatar": "头像",
  "edit.handle": "Handle",
  "edit.bio": "简介",
  "edit.bioPlaceholder": "介绍一下你的 playables",
  "edit.saved": "资料已更新",
  "settings.title": "设置",
  "settings.account": "账号",
  "settings.signedInAs": "已登录为 {handle}",
  "settings.playback": "播放",
  "settings.reducedMotion": "减少动效",
  "settings.dataSaver": "省流量（低码率视频）",
  "settings.privacy": "隐私与支持",
  "settings.privacyPolicy": "隐私政策",
  "settings.terms": "服务条款",
  "settings.help": "帮助与反馈",
  "settings.export": "导出我的数据",
  "settings.signOut": "退出登录",
  "settings.signOutConfirm.title": "退出登录？",
  "settings.signOutConfirm.body": "随时可以再登录回来。",
  "settings.language": "语言",
  "settings.version": "Loopit mobile · v0.1",
  "common.cancel": "取消",
};

const DICTS: Record<Locale, Dict> = { en: EN, zh: ZH };

const STORAGE_KEY = "loopit-locale";

function systemLocale(): Locale {
  // Best-effort device-locale sniff. Falls back to "en".
  try {
    const raw =
      Platform.OS === "ios"
        ? NativeModules.SettingsManager?.settings?.AppleLocale ||
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;
    if (typeof raw === "string" && raw.toLowerCase().startsWith("zh")) {
      return "zh";
    }
  } catch {}
  return "en";
}

type State = {
  locale: Locale;
  hydrated: boolean;
  setLocale: (l: Locale) => void;
  hydrate: () => Promise<void>;
};

export const useLocale = create<State>((set) => ({
  locale: "en",
  hydrated: false,
  setLocale: (l) => {
    set({ locale: l });
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
  },
  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "zh") {
        set({ locale: saved, hydrated: true });
        return;
      }
    } catch {}
    set({ locale: systemLocale(), hydrated: true });
  },
}));

function interpolate(
  s: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) =>
    String(vars[k] ?? `{${k}}`),
  );
}

export function useT() {
  const locale = useLocale((s) => s.locale);
  return (key: string, vars?: Record<string, string | number>) => {
    const d = DICTS[locale] ?? EN;
    return interpolate(d[key] ?? EN[key] ?? key, vars);
  };
}

"use client";

import { create } from "zustand";

export type Locale = "en" | "zh";

type Dict = Record<string, string>;

const EN: Dict = {
  // top
  "top.following": "Following",
  "top.forYou": "For You",
  // bottom tabs
  "tab.feed": "Feed",
  "tab.search": "Search",
  "tab.inbox": "Inbox",
  "tab.me": "Me",
  // empty / errors
  "feed.loading": "LOADING FEED…",
  "feed.emptyFollowing": "Follow some creators to fill this feed.",
  "feed.emptyForYou": "Be the first to publish a playable.",
  "feed.error.title": "Couldn't load feed",
  "feed.retry": "Try again",
  "feed.swipeHint": "SWIPE UP FOR MORE",
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
  // share
  "share.copied": "Link copied",
  "share.copyFailed": "Couldn't copy",
  "share.sharedTo": "Shared to {name}",
  // create
  "create.title": "Make a playable",
  "create.prompt.placeholder": "a cat that purrs louder the more you pet it…",
  "create.generate": "Generate",
  "create.templates": "Start from a template",
  "create.tapOpenEditor": "Tap to open editor",
  // generator
  "gen.loading.title": "Generating playable",
  "gen.failed": "Generation failed",
  // editor
  "editor.title": "Editor",
  "editor.publish": "Publish",
  "editor.mechanic": "Mechanic",
  "editor.theme": "Theme",
  "editor.titleField": "Title",
  "editor.caption": "Caption",
  "editor.tags": "Tags",
  "editor.addTag": "Add",
  "editor.hint": "Draft",
  "editor.hintBody":
    "The agent picked a mechanic, theme, and caption based on your prompt. Tweak anything before publishing — you own the final result.",
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
  "auth.guest.title": "You're in.",
  "auth.guest.body":
    "This is a guest account. Save this recovery code somewhere safe — it's the only way to get back in if you lose your cookie.",
  "auth.guest.done": "Got it, start looping",
  // inbox
  "inbox.title": "Inbox",
  "inbox.empty": "Nothing new here.",
  "inbox.signIn": "Sign in to see your Inbox",
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
  "inbox.followBack": "Follow back",
  // search
  "search.placeholder": "Search playables, creators, tags",
  "search.trending": "Trending",
  "search.noMatches": "No matches.",
  "search.searching": "Searching…",
  "search.resultsFor": 'Results for "{q}"',
  // profile
  "profile.playables": "Playables",
  "profile.followers": "Followers",
  "profile.following": "Following",
  "profile.likes": "Likes",
  "profile.edit": "Edit profile",
  "profile.settings": "Settings",
  "profile.sub.created": "Created",
  "profile.sub.liked": "Liked",
  "profile.sub.remixed": "Remixed",
  "profile.signInPrompt": "Sign in to see your profile",
  "profile.signInCta": "Sign in or create account",
  "profile.empty.liked": "Tap ❤️ on a playable to save it here.",
  "profile.empty.remixed": "Your remixes will appear here.",
  "profile.empty.created": "Make your first playable from the Create tab.",
  // settings
  "settings.title": "Settings",
  "settings.account": "Account",
  "settings.notifications": "Notifications",
  "settings.playback": "Playback",
  "settings.reducedMotion": "Reduced motion",
  "settings.dataSaver": "Data saver (lower-bitrate video)",
  "settings.privacy": "Privacy & support",
  "settings.privacyPolicy": "Privacy policy",
  "settings.terms": "Terms of service",
  "settings.help": "Help & feedback",
  "settings.export": "Export my data",
  "settings.delete": "Delete my account",
  "settings.signOut": "Sign out",
  "settings.language": "Language",
  "settings.version": "Loopit prototype · v0.9",
};

const ZH: Dict = {
  "top.following": "关注",
  "top.forYou": "推荐",
  "tab.feed": "首页",
  "tab.search": "搜索",
  "tab.inbox": "消息",
  "tab.me": "我的",
  "feed.loading": "正在加载…",
  "feed.emptyFollowing": "关注一些创作者来填满这个 feed。",
  "feed.emptyForYou": "成为第一个发布 playable 的人。",
  "feed.error.title": "Feed 加载失败",
  "feed.retry": "重试",
  "feed.swipeHint": "上滑查看更多",
  "sheet.close": "关闭",
  "sheet.cancel": "取消",
  "sheet.save": "保存",
  "comments.empty": "还没有评论，来第一个。",
  "comments.placeholder": "以 {handle} 评论",
  "comments.signInToComment": "登录后评论",
  "comments.post": "发送",
  "comments.delete": "删除",
  "share.copied": "链接已复制",
  "share.copyFailed": "复制失败",
  "share.sharedTo": "已分享到 {name}",
  "create.title": "创作 playable",
  "create.prompt.placeholder": "一只摸得越久叫得越响的猫…",
  "create.generate": "生成",
  "create.templates": "从模板开始",
  "create.tapOpenEditor": "点击打开编辑器",
  "gen.loading.title": "正在生成 playable",
  "gen.failed": "生成失败",
  "editor.title": "编辑器",
  "editor.publish": "发布",
  "editor.mechanic": "玩法",
  "editor.theme": "主题",
  "editor.titleField": "标题",
  "editor.caption": "说明",
  "editor.tags": "标签",
  "editor.addTag": "添加",
  "editor.hint": "AI 生成草稿",
  "editor.hintBody":
    "Agent 根据你的 prompt 选了玩法、主题和文案。发布前可以随意改——最终结果归你。",
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
  "auth.guest.title": "欢迎进入。",
  "auth.guest.body":
    "这是访客账号，请妥善保存下方的恢复码——一旦丢失 cookie，这是你唯一的找回方式。",
  "auth.guest.done": "明白了，开始刷",
  "inbox.title": "消息",
  "inbox.empty": "暂无新消息。",
  "inbox.signIn": "登录后查看消息",
  "inbox.tab.all": "全部",
  "inbox.tab.likes": "点赞",
  "inbox.tab.comments": "评论",
  "inbox.tab.follows": "关注",
  "inbox.action.like": "点赞了你的 playable",
  "inbox.action.comment": "评论了",
  "inbox.action.follow": "开始关注你",
  "inbox.action.remix": "remix 了",
  "inbox.followBack": "回关",
  "search.placeholder": "搜索 playable、创作者、标签",
  "search.trending": "热门",
  "search.noMatches": "没有结果。",
  "search.searching": "搜索中…",
  "search.resultsFor": '搜索 "{q}"',
  "profile.playables": "作品",
  "profile.followers": "粉丝",
  "profile.following": "关注",
  "profile.likes": "获赞",
  "profile.edit": "编辑资料",
  "profile.settings": "设置",
  "profile.sub.created": "已创建",
  "profile.sub.liked": "点赞过",
  "profile.sub.remixed": "Remix 过",
  "profile.signInPrompt": "登录后查看个人主页",
  "profile.signInCta": "登录 / 注册",
  "profile.empty.liked": "给 playable 点 ❤️，会保存在这里。",
  "profile.empty.remixed": "你 remix 的作品会出现在这里。",
  "profile.empty.created": "从「创作」tab 发布你的第一个 playable。",
  "settings.title": "设置",
  "settings.account": "账号",
  "settings.notifications": "通知",
  "settings.playback": "播放",
  "settings.reducedMotion": "减少动效",
  "settings.dataSaver": "省流量（低码率视频）",
  "settings.privacy": "隐私与支持",
  "settings.privacyPolicy": "隐私政策",
  "settings.terms": "服务条款",
  "settings.help": "帮助与反馈",
  "settings.export": "导出我的数据",
  "settings.delete": "注销账号",
  "settings.signOut": "退出登录",
  "settings.language": "语言",
  "settings.version": "Loopit 原型 · v0.9",
};

const DICTS: Record<Locale, Dict> = { en: EN, zh: ZH };

type State = {
  locale: Locale;
  setLocale: (l: Locale) => void;
};

function defaultLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem("loopit-locale");
  if (saved === "en" || saved === "zh") return saved;
  return navigator.language?.startsWith("zh") ? "zh" : "en";
}

export const useLocale = create<State>((set) => ({
  locale: typeof window === "undefined" ? "en" : defaultLocale(),
  setLocale: (l) => {
    if (typeof window !== "undefined") localStorage.setItem("loopit-locale", l);
    set({ locale: l });
    try {
      document.documentElement.lang = l;
    } catch {}
  },
}));

function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

/** Hook variant — subscribes to locale changes so components re-render. */
export function useT() {
  const locale = useLocale((s) => s.locale);
  return (key: string, vars?: Record<string, string | number>) => {
    const d = DICTS[locale] ?? EN;
    return interpolate(d[key] ?? EN[key] ?? key, vars);
  };
}

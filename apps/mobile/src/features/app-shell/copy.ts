import type { LocalePreference, ResolvedLocale, ThemePreference } from "./types";

export interface AppCopy {
  common: {
    appName: string;
    dark: string;
    english: string;
    guest: string;
    language: string;
    light: string;
    loading: string;
    me: string;
    signOut: string;
    system: string;
    theme: string;
    zhCN: string;
  };
  discover: {
    cards: Array<{ summary: string; title: string }>;
    eyebrow: string;
    summary: string;
    title: string;
  };
  home: {
    cashTitle: string;
    cashValue: string;
    collectionsLabel: string;
    collectionsTitle: string;
    focusCards: Array<{ summary: string; title: string }>;
    focusTitle: string;
    moduleFooter: string;
    moduleTitle: string;
    sessionApple: string;
    sessionGuest: string;
    sessionSignedOut: string;
    storageLabel: string;
    storageTitle: string;
    workflowFooter: string;
    workflowTitle: string;
  };
  ledger: {
    cards: Array<{ summary: string; title: string }>;
    eyebrow: string;
    summary: string;
    title: string;
  };
  login: {
    appleButton: string;
    appleCancelled: string;
    appleHint: string;
    appleUnavailable: string;
    body: string;
    caption: string;
    eyebrow: string;
    skip: string;
    title: string;
  };
  meScreen: {
    localeDescription: string;
    logoutDescription: string;
    sessionDescription: string;
    sessionTitle: string;
    themeDescription: string;
    title: string;
  };
  tabs: {
    discover: string;
    home: string;
    ledger: string;
    profile: string;
  };
}

export const appCopy: Record<ResolvedLocale, AppCopy> = {
  en: {
    common: {
      appName: "Creator CFO",
      dark: "Dark",
      english: "English",
      guest: "Guest",
      language: "Language",
      light: "Light",
      loading: "Preparing your local workspace...",
      me: "Me",
      signOut: "Sign out",
      system: "System",
      theme: "Theme",
      zhCN: "Chinese",
    },
    discover: {
      cards: [
        {
          title: "Creator benchmarks",
          summary: "Preview runway, take-rate, and tax reserve signals before deeper sync arrives.",
        },
        {
          title: "Template vault",
          summary: "Keep future invoice drafts, receipts, and filing kits in one device-local command center.",
        },
      ],
      eyebrow: "Discover",
      summary:
        "This tab stays intentionally lightweight in the local-first phase while still giving the product room to grow.",
      title: "A calm radar for creator finance decisions.",
    },
    home: {
      cashTitle: "Cash confidence",
      cashValue: "14 days",
      collectionsLabel: "Vault collections",
      collectionsTitle: "Document vault",
      focusCards: [
        {
          title: "Revenue handoff",
          summary: "Track which platforms are paid out, delayed, or waiting for reconciliation.",
        },
        {
          title: "Tax reserve",
          summary: "Keep the next filing window visible without leaving the dashboard shell.",
        },
        {
          title: "Guest-safe setup",
          summary: "Try the product before connecting any identity or remote service.",
        },
      ],
      focusTitle: "Today at a glance",
      moduleFooter: "Shared via @creator-cfo/schemas.",
      moduleTitle: "Operating modules",
      sessionApple: "Signed in with Apple ID",
      sessionGuest: "Exploring in guest mode",
      sessionSignedOut: "Waiting for a local session",
      storageLabel: "Structured tables + local preference keys",
      storageTitle: "Storage contract pulse",
      workflowFooter: "No backend until a later PRD says so.",
      workflowTitle: "Guardrails for the next slice",
    },
    ledger: {
      cards: [
        {
          title: "Expense intake",
          summary: "Start from mobile receipts, then attach local notes, tags, and vault documents.",
        },
        {
          title: "Invoice watchlist",
          summary: "Keep due dates, currency, and collection status visible even before full CRUD lands.",
        },
      ],
      eyebrow: "Ledger",
      summary:
        "Use this skeleton to prove navigation, visual rhythm, and future module boundaries before wiring deeper forms.",
      title: "The accounting shell is ready for the first local-first workflows.",
    },
    login: {
      appleButton: "Continue with Apple",
      appleCancelled: "Apple sign-in was cancelled. You can retry or continue as a guest.",
      appleHint: "Apple sign-in is available on supported iOS devices. Guest mode stays available everywhere.",
      appleUnavailable:
        "Apple sign-in is not available in this environment yet. Use guest mode for preview flows.",
      body:
        "Own your creator finance cockpit on device first: theme, language, dashboard context, and local storage stay with you.",
      caption: "No backend in this phase. Apple credentials are treated as a device-local session summary.",
      eyebrow: "Local-first launch",
      skip: "Skip for now",
      title: "A finance control room that starts before sync exists.",
    },
    meScreen: {
      localeDescription: "Switch shell copy instantly and keep the choice on device.",
      logoutDescription: "Clear the local session summary and return to the login gate.",
      sessionDescription: "Session state is stored locally for guest mode or Apple sign-in preview.",
      sessionTitle: "Session",
      themeDescription: "Move between light, dark, or system appearance without leaving the app.",
      title: "Preferences and session controls",
    },
    tabs: {
      discover: "Discover",
      home: "Home",
      ledger: "Ledger",
      profile: "Me",
    },
  },
  "zh-CN": {
    common: {
      appName: "Creator CFO",
      dark: "黑夜",
      english: "英文",
      guest: "游客",
      language: "语言",
      light: "白天",
      loading: "正在准备你的本地工作台...",
      me: "我的",
      signOut: "退出登录",
      system: "跟随系统",
      theme: "主题",
      zhCN: "中文",
    },
    discover: {
      cards: [
        {
          title: "创作者经营雷达",
          summary: "在更深的数据同步上线前，先预览 runway、抽成和税金预留信号。",
        },
        {
          title: "模板资料库",
          summary: "把后续发票草稿、报销凭证和报税材料收拢到同一个本地工作台。",
        },
      ],
      eyebrow: "发现",
      summary: "本阶段先保持轻量，但会为后续的增长功能预留清晰的产品位置。",
      title: "给创作者财务决策一个更冷静的观察层。",
    },
    home: {
      cashTitle: "现金把控",
      cashValue: "14 天",
      collectionsLabel: "文件仓集合",
      collectionsTitle: "本地资料库",
      focusCards: [
        {
          title: "收入交接",
          summary: "快速判断哪些平台已回款、延迟到账，或仍待核对。",
        },
        {
          title: "税金预留",
          summary: "不离开首页也能保持下一个申报窗口的可见性。",
        },
        {
          title: "游客安全体验",
          summary: "先试用产品，再决定是否接入身份信息或未来同步能力。",
        },
      ],
      focusTitle: "今日概览",
      moduleFooter: "共享自 @creator-cfo/schemas。",
      moduleTitle: "核心模块",
      sessionApple: "已通过 Apple ID 进入",
      sessionGuest: "当前为游客模式",
      sessionSignedOut: "尚未建立本地会话",
      storageLabel: "结构化表 + 本地偏好键位",
      storageTitle: "本地契约状态",
      workflowFooter: "后续 PRD 未明确前，不引入后端。",
      workflowTitle: "下一阶段守则",
    },
    ledger: {
      cards: [
        {
          title: "支出录入",
          summary: "从移动端票据出发，后续补上备注、标签和文件仓附件。",
        },
        {
          title: "发票追踪",
          summary: "在完整 CRUD 上线前，也能先看到到期日、币种和回款状态。",
        },
      ],
      eyebrow: "记账",
      summary: "这个页面先验证导航、视觉节奏和模块边界，后续再接入更深的表单与数据流。",
      title: "记账壳层已经为首批本地流程预留好位置。",
    },
    login: {
      appleButton: "使用 Apple 登录",
      appleCancelled: "Apple 登录已取消，你可以重试或先以游客进入。",
      appleHint: "Apple 登录仅在支持的 iOS 设备上可用，游客模式始终可用。",
      appleUnavailable: "当前环境暂不支持 Apple 登录，请先使用游客模式体验。",
      body: "先把创作者财务驾驶舱落在设备本地，主题、语言、首页上下文和本地存储都由你掌控。",
      caption: "本阶段没有后端。Apple 凭证只作为设备本地会话摘要使用。",
      eyebrow: "本地优先启动",
      skip: "暂不登录",
      title: "在同步到来之前，先拥有一个能工作的财务控制台。",
    },
    meScreen: {
      localeDescription: "立即切换界面语言，并把选择保存在设备本地。",
      logoutDescription: "清除本地会话摘要，并返回登录入口。",
      sessionDescription: "游客态和 Apple 登录态都只保存在本机，方便本地优先阶段验证体验。",
      sessionTitle: "当前会话",
      themeDescription: "在应用内切换白天、黑夜或跟随系统，不打断当前流程。",
      title: "偏好设置与会话控制",
    },
    tabs: {
      discover: "发现",
      home: "首页",
      ledger: "记账",
      profile: "我的",
    },
  },
};

export function getAppCopy(locale: ResolvedLocale): AppCopy {
  return appCopy[locale];
}

export const themePreferenceOptions: ThemePreference[] = ["system", "light", "dark"];
export const localePreferenceOptions: LocalePreference[] = ["system", "en", "zh-CN"];

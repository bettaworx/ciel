export type PostCardVariant = "timeline" | "detail" | "compact" | "embedded";
export type PostCardIdentityLayout = "inline" | "vertical";
export type PostCardTimestampFormat = "relative" | "full";
export type PostCardTimestampPlacement = "header" | "afterContent";

export type PostCardDisplayConfig = {
  linkToDetail: boolean;
  identityLayout: PostCardIdentityLayout;
  collapseContent: boolean;
  timestampFormat: PostCardTimestampFormat;
  timestampPlacement: PostCardTimestampPlacement;
  showReactions: boolean;
  showMoreMenu: boolean;
};

export const POST_CARD_DISPLAY_CONFIGS = {
  timeline: {
    linkToDetail: true,
    identityLayout: "inline",
    collapseContent: true,
    timestampFormat: "relative",
    timestampPlacement: "header",
    showReactions: true,
    showMoreMenu: true,
  },
  detail: {
    linkToDetail: false,
    identityLayout: "vertical",
    collapseContent: false,
    timestampFormat: "full",
    timestampPlacement: "afterContent",
    showReactions: true,
    showMoreMenu: true,
  },
  compact: {
    linkToDetail: true,
    identityLayout: "inline",
    collapseContent: false,
    timestampFormat: "relative",
    timestampPlacement: "header",
    showReactions: false,
    showMoreMenu: true,
  },
  embedded: {
    linkToDetail: false,
    identityLayout: "inline",
    collapseContent: true,
    timestampFormat: "relative",
    timestampPlacement: "header",
    showReactions: false,
    showMoreMenu: false,
  },
} as const satisfies Record<PostCardVariant, PostCardDisplayConfig>;

export function getPostCardDisplayConfig(
  variant: PostCardVariant,
): PostCardDisplayConfig {
  return POST_CARD_DISPLAY_CONFIGS[variant];
}

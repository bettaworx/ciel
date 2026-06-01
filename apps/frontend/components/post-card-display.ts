export type PostCardVariant = "timeline" | "detail" | "compact";
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
};

export const POST_CARD_DISPLAY_CONFIGS = {
  timeline: {
    linkToDetail: true,
    identityLayout: "inline",
    collapseContent: true,
    timestampFormat: "relative",
    timestampPlacement: "header",
    showReactions: true,
  },
  detail: {
    linkToDetail: false,
    identityLayout: "vertical",
    collapseContent: false,
    timestampFormat: "full",
    timestampPlacement: "afterContent",
    showReactions: true,
  },
  compact: {
    linkToDetail: true,
    identityLayout: "inline",
    collapseContent: false,
    timestampFormat: "relative",
    timestampPlacement: "header",
    showReactions: false,
  },
} as const satisfies Record<PostCardVariant, PostCardDisplayConfig>;

export function getPostCardDisplayConfig(
  variant: PostCardVariant,
): PostCardDisplayConfig {
  return POST_CARD_DISPLAY_CONFIGS[variant];
}

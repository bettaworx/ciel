export type PostCardVariant = "timeline" | "detail";
export type PostCardIdentityLayout = "inline" | "vertical";
export type PostCardTimestampFormat = "relative" | "full";
export type PostCardTimestampPlacement = "header" | "afterContent";

export type PostCardDisplayConfig = {
  linkToDetail: boolean;
  identityLayout: PostCardIdentityLayout;
  collapseContent: boolean;
  timestampFormat: PostCardTimestampFormat;
  timestampPlacement: PostCardTimestampPlacement;
};

export const POST_CARD_DISPLAY_CONFIGS = {
  timeline: {
    linkToDetail: true,
    identityLayout: "inline",
    collapseContent: true,
    timestampFormat: "relative",
    timestampPlacement: "header",
  },
  detail: {
    linkToDetail: false,
    identityLayout: "vertical",
    collapseContent: false,
    timestampFormat: "full",
    timestampPlacement: "afterContent",
  },
} as const satisfies Record<PostCardVariant, PostCardDisplayConfig>;

export function getPostCardDisplayConfig(
  variant: PostCardVariant,
): PostCardDisplayConfig {
  return POST_CARD_DISPLAY_CONFIGS[variant];
}

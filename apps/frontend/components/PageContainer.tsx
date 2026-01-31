import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  /**
   * 最大幅の設定
   * @default "6xl" (max-w-6xl, 72rem / 1152px)
   */
  maxWidth?: "2xl" | "3xl" | "4xl" | "6xl" | "full";
  /**
   * パディングのサイズ
   * @default "default" (px-4 py-8)
   */
  padding?: "default" | "compact" | "none";
  /**
   * 追加のクラス名
   */
  className?: string;
  /**
   * HTML要素のタグ
   * @default "main"
   */
  as?: "main" | "div" | "section";
}

const maxWidthClasses = {
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
  full: "max-w-full",
};

const paddingClasses = {
  default: "px-3 py-3",
  compact: "px-3 py-3",
  none: "",
};

/**
 * ページコンテンツ用の共通コンテナコンポーネント
 *
 * 統一されたマージン、パディング、最大幅を提供します。
 * サイドバーのマージン（sm:ml-20）は親のlayout.tsxで既に適用されているため、
 * このコンポーネントでは設定しません。
 *
 * @example
 * ```tsx
 * // デフォルト設定（max-w-6xl, px-4 py-8）
 * <PageContainer>
 *   <h1>Content</h1>
 * </PageContainer>
 *
 * // コンパクトなパディング（設定画面用）
 * <PageContainer padding="compact">
 *   <h1>Settings</h1>
 * </PageContainer>
 *
 * // 狭い幅（記事など）
 * <PageContainer maxWidth="2xl">
 *   <article>...</article>
 * </PageContainer>
 * ```
 */
export function PageContainer({
  children,
  maxWidth = "6xl",
  padding = "default",
  className,
  as: Component = "main",
}: PageContainerProps) {
  return (
    <Component
      className={cn(
        "container mx-auto",
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className,
      )}
    >
      {children}
    </Component>
  );
}

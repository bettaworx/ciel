/**
 * 集中モード: ヘッダーを非表示にする特定のページパス
 * Concentrated mode: Specific page paths where the header should be hidden
 */
const CONCENTRATED_MODE_PATHS = [
  "/login",
  "/signup",
  "/setup",
  "/server-setup",
  "/offline",
  "/agreements",
] as const;

/**
 * 指定されたパスが集中モードかどうかを判定
 * Checks if the given pathname is in concentrated mode
 *
 * @param pathname - 現在のパス / Current pathname
 * @returns 集中モードの場合 true / true if in concentrated mode
 */
export function isConcentratedMode(pathname: string): boolean {
  return CONCENTRATED_MODE_PATHS.some((path) => pathname.startsWith(path));
}

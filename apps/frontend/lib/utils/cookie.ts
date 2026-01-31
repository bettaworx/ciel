/**
 * Cookie utility with automatic Secure flag in production
 * 本番環境で自動的にSecureフラグを追加するCookieユーティリティ
 */

/**
 * Set a cookie with secure defaults
 * セキュアなデフォルト設定でCookieを設定
 * 
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Optional settings
 */
export function setSecureCookie(
  name: string,
  value: string,
  options?: {
    maxAge?: number;
    path?: string;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }
): void {
  if (typeof document === 'undefined') return;
  
  const isProduction = process.env.NODE_ENV === 'production';
  const secureFlag = isProduction ? '; Secure' : '';
  const maxAge = options?.maxAge ?? 31536000; // 1 year default
  const path = options?.path ?? '/';
  const sameSite = options?.sameSite ?? 'Lax';
  
  document.cookie = `${name}=${value}; path=${path}; max-age=${maxAge}; SameSite=${sameSite}${secureFlag}`;
}

/**
 * Delete a cookie
 * Cookieを削除
 * 
 * @param name - Cookie name to delete
 */
export function deleteSecureCookie(name: string): void {
  if (typeof document === 'undefined') return;
  
  const isProduction = process.env.NODE_ENV === 'production';
  const secureFlag = isProduction ? '; Secure' : '';
  
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
}

/**
 * Get a cookie value
 * Cookie値を取得
 * 
 * @param name - Cookie name
 * @returns Cookie value or null
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

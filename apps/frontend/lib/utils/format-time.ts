/**
 * 投稿時刻を相対時刻または絶対時刻でフォーマット
 * 
 * @param date - ISO 8601形式の日時文字列 または Date オブジェクト
 * @param locale - ロケール ('ja' | 'en')
 * @returns フォーマットされた時刻文字列
 * 
 * @example
 * formatTimeAgo('2024-01-21T10:00:00Z', 'ja') // '3時間前' または '2024/01/21'
 */
export function formatTimeAgo(date: Date | string, locale: string): string {
  const now = new Date()
  const past = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - past.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  
  // 1分未満: "たった今" / "just now"
  if (diffSec < 60) {
    return locale === 'ja' ? 'たった今' : 'just now'
  }
  
  // 1分～59分: "n分前" / "nm ago"
  if (diffMin < 60) {
    return locale === 'ja' ? `${diffMin}分前` : `${diffMin}m ago`
  }
  
  // 1時間～23時間: "n時間前" / "nh ago"
  if (diffHour < 24) {
    return locale === 'ja' ? `${diffHour}時間前` : `${diffHour}h ago`
  }
  
  // 1日～6日: "n日前" / "nd ago"
  if (diffDay < 7) {
    return locale === 'ja' ? `${diffDay}日前` : `${diffDay}d ago`
  }
  
  // 7日以上: 絶対日付表示
  const year = past.getFullYear()
  const month = String(past.getMonth() + 1).padStart(2, '0')
  const day = String(past.getDate()).padStart(2, '0')
  
  return locale === 'ja' ? `${year}/${month}/${day}` : `${month}/${day}/${year}`
}

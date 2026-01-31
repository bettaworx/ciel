# PageContainer Component

## 概要

`PageContainer`は、アプリケーション全体で統一されたページレイアウトを提供する共通コンポーネントです。

## 特徴

- ✅ 統一されたマージンとパディング
- ✅ レスポンシブ対応の最大幅設定
- ✅ カスタマイズ可能な設定
- ✅ サイドバーとの統合（親のlayout.tsxで`sm:ml-20`が既に適用済み）

## 基本的な使い方

```tsx
import { PageContainer } from '@/components/PageContainer';

export default function MyPage() {
  return (
    <PageContainer>
      <h1>ページタイトル</h1>
      <p>コンテンツ...</p>
    </PageContainer>
  );
}
```

## Props

| プロパティ | 型 | デフォルト | 説明 |
|-----------|------|----------|------|
| `children` | `React.ReactNode` | - | ページのコンテンツ（必須） |
| `maxWidth` | `"2xl"` \| `"4xl"` \| `"6xl"` \| `"full"` | `"6xl"` | 最大幅の設定 |
| `padding` | `"default"` \| `"compact"` \| `"none"` | `"default"` | パディングのサイズ |
| `className` | `string` | - | 追加のクラス名 |
| `as` | `"main"` \| `"div"` \| `"section"` | `"main"` | HTML要素のタグ |

## 最大幅の設定

| 値 | Tailwind クラス | ピクセル値 | 用途 |
|----|----------------|-----------|------|
| `"2xl"` | `max-w-2xl` | 672px | 記事、ブログ投稿など |
| `"4xl"` | `max-w-4xl` | 896px | 中程度の幅のコンテンツ |
| `"6xl"` | `max-w-6xl` | 1152px | デフォルト、汎用ページ |
| `"full"` | `max-w-full` | 制限なし | 全幅コンテンツ |

## パディングの設定

| 値 | Tailwind クラス | 説明 |
|----|----------------|------|
| `"default"` | `px-4 py-8` | デフォルトのパディング |
| `"compact"` | `px-3 py-6` | 狭いパディング（設定画面など） |
| `"none"` | なし | パディングなし |

## 使用例

### デフォルト設定（タイムラインページ）

```tsx
<PageContainer>
  <h1 className="text-4xl font-bold mb-8">タイムライン</h1>
  {/* コンテンツ */}
</PageContainer>
```

生成されるクラス: `container mx-auto max-w-6xl px-4 py-8`

### コンパクトなパディング（設定画面）

```tsx
<PageContainer padding="compact" as="div">
  <div className="flex flex-col md:flex-row gap-6">
    {/* サイドバーとコンテンツ */}
  </div>
</PageContainer>
```

生成されるクラス: `container mx-auto max-w-6xl px-3 py-6`

### 狭い幅（記事ページ）

```tsx
<PageContainer maxWidth="2xl">
  <article>
    <h1>記事タイトル</h1>
    <p>本文...</p>
  </article>
</PageContainer>
```

生成されるクラス: `container mx-auto max-w-2xl px-4 py-8`

### 全幅コンテンツ

```tsx
<PageContainer maxWidth="full" padding="none">
  <div className="w-full">
    {/* 全幅コンテンツ */}
  </div>
</PageContainer>
```

生成されるクラス: `container mx-auto max-w-full`

### カスタムクラスの追加

```tsx
<PageContainer className="bg-muted">
  <h1>背景色付きのページ</h1>
</PageContainer>
```

## 既存ページでの使用状況

| ページ | 設定 |
|--------|------|
| `/` (タイムライン) | デフォルト (`maxWidth="6xl"`, `padding="default"`) |
| `/users/[username]` | デフォルト |
| `/settings/*` | `padding="compact"`, `as="div"` |

## 注意事項

- **サイドバーのマージン**: 親の`app/layout.tsx`で既に`sm:ml-20`が適用されているため、`PageContainer`内では設定しません。
- **集中モード**: ログイン、サインアップ、セットアップページは独自のレイアウトを使用するため、`PageContainer`を使用しません。
- **レスポンシブ対応**: `container`クラスにより、ブレークポイントに応じて自動的に最大幅が調整されます。

## 実装の背景

以前は各ページで以下のようなクラスが乱立していました：

- `container mx-auto px-4 py-8`
- `container mx-auto px-3 py-6 max-w-6xl`
- 独自のマージン・パディング設定

`PageContainer`コンポーネントを導入することで、統一されたレイアウトを保ち、変更が容易になりました。

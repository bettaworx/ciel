# kotodoki

日時や季節、行事を入力値に、文脈に合う文章を選ぶ小さなエンジンである。

`kotodoki` は「言葉」と「時」を合わせた名前である。投稿欄、通知、空状態、オンボーディングなどの短い文言を、固定文として置くだけではなく、時刻や季節、地域の行事に少し寄せて選ぶための補助ライブラリである。

## コンセプト

kotodoki はデータセットを内蔵しない。利用側のアプリ、外部パッケージ、外部リポジトリ由来のデータセットを `KotodokiDatasetCatalog` として渡し、カテゴリ単位で選択対象を切り替える。

```ts
import { createDatasetCatalog, createKotodoki } from "@ciel/kotodoki";
import type { KotodokiDatasetCollection } from "@ciel/kotodoki";

const greetCollection = {
  id: "frontend-greet",
  category: "greet",
  source: {
    type: "app",
    owner: "frontend",
    path: "apps/frontend/lib/kotodoki/greet",
  },
  datasets: [
    {
      id: "greet-ja-JP",
      locale: "ja-JP",
      region: "JP",
      holidays: [],
      phrases: [
        {
          id: "default",
          locales: ["ja-JP"],
          regions: ["JP"],
          phrase: "いまの気分は？",
        },
      ],
    },
  ],
} satisfies KotodokiDatasetCollection;

const kotodoki = createKotodoki({
  catalog: createDatasetCatalog([greetCollection]),
  categories: ["greet"],
});

const result = kotodoki.selectPhrase({
  locale: "ja-JP",
  region: "JP",
  timezone: "Asia/Tokyo",
  datetime: new Date(),
});

console.log(result.selected?.phrase);
```

## インストールと参照

monorepo内の他パッケージから使う場合は、利用側の `package.json` に workspace 依存を追加する。

```json
{
  "dependencies": {
    "@ciel/kotodoki": "workspace:*"
  }
}
```

`@ciel/kotodoki` は `dist/` を公開エントリにするため、参照前にビルドする。

```bash
pnpm -C packages/kotodoki build
```

## API

主な公開API:

- `createKotodoki({ catalog, categories })`: 指定カテゴリのデータセットを使う選択器を作る。
- `createDatasetCatalog(collections)`: アプリや外部由来のデータセット collection を束ねる。
- `getDatasetCollections(catalog, categories?)`: collection をカテゴリで取得する。
- `getDatasetsByCategory(catalog, category)`: 1カテゴリのデータセットを展開する。
- `getAllDatasets(catalog, categories?)`: 複数カテゴリのデータセットを展開する。
- `resolveKotodokiContext(input, options?)`: 日付、曜日、時間帯、季節、行事を解決する。

主な公開型:

- `KotodokiInput`: `locale`, `region`, `timezone`, `datetime` を受け取る入力。
- `ResolvedKotodokiContext`: 入力日時から解決された日付、曜日、時間帯、季節、行事。
- `PhraseEntry`: 表示候補の文言と条件。
- `HolidayEntry`: 地域別行事の定義。
- `KotodokiDataset`: 行事と文言を束ねる地域別データセット。
- `KotodokiDatasetCollection`: カテゴリ、参照元、複数データセットを束ねる単位。
- `KotodokiDatasetCatalog`: collection を登録・展開するためのカタログ。

## データセットの所有

データセットは利用場所に近いパッケージで管理する。たとえばフロントエンドでしか使わないプレースホルダー文言は `apps/frontend` に置き、frontend が `@ciel/kotodoki` に catalog として渡す。

外部リポジトリや外部パッケージ由来のデータセットも、実データを import したうえで collection の `source` に参照元メタデータを残す。kotodoki 自体は URL fetch や動的ロードを行わない。

```ts
const externalCollection = {
  id: "community-greet",
  category: "greet",
  source: {
    type: "repository",
    owner: "example",
    repository: "kotodoki-datasets",
    ref: "main",
    path: "greet/ja-JP.ts",
  },
  datasets: [externalDataset],
} satisfies KotodokiDatasetCollection;
```

## 開発

```bash
pnpm -C packages/kotodoki test
pnpm -C packages/kotodoki typecheck
pnpm -C packages/kotodoki build
```

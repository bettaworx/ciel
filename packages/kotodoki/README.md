# kotodoki

日時や季節、行事を入力値に、いまの空気に合う文章を選ぶ小さなライブラリである。

`kotodoki` は「言葉」と「時」を合わせた名前である。投稿欄、通知、空状態、オンボーディングなどの短い文言を、固定文として置くだけではなく、時刻や季節、地域の行事に少し寄せて選ぶための補助ライブラリである。

## コンセプト

```ts
import { selectPhrase } from "@ciel/kotodoki";

const result = selectPhrase({
  locale: "ja-JP",
  region: "JP",
  timezone: "Asia/Tokyo",
  datetime: new Date(),
});

console.log(result.selected?.phrase);
```

通常時は「いまどうしてる？」「何かありましたか？」のような汎用的な文を返す。昼なら「一旦休憩しましょう」、夜なら「今日も一日おつかれさまです」、正月なら「あけましておめでとうございます！」または「今年の抱負は？」のように、日時コンテキストに合う候補を優先する。行事、時間帯、曜日、季節の順に文脈を強く扱う。

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

```ts
import { createKotodoki, jaJPDataset } from "@ciel/kotodoki";

const kotodoki = createKotodoki({
  datasets: [jaJPDataset],
  rng: Math.random,
});

const result = kotodoki.selectPhrase({
  locale: "ja-JP",
  region: "JP",
  timezone: "Asia/Tokyo",
  datetime: "2026-01-01T09:00:00+09:00",
});

if (result.selected) {
  console.log(result.reason); // "matched" | "fallback" | "none"
  console.log(result.selected.phrase);
}
```

主な公開型:

- `KotodokiInput`: `locale`, `region`, `timezone`, `datetime` を受け取る入力。
- `ResolvedKotodokiContext`: 入力日時から解決された日付、曜日、時間帯、季節、行事。
- `PhraseEntry`: 表示候補の文言と条件。
- `HolidayEntry`: 地域別行事の定義。
- `KotodokiDataset`: 行事と文言を束ねる地域別データセット。

## データセット

初期データセットは `ja-JP` / `JP` と `en-US` / `US` である。`ja-JP` は日本の季節、時間帯、曜日、正月、節分、ひな祭り、花見期、ゴールデンウィーク、七夕、お盆、月見期、ハロウィン、クリスマス、大晦日を含む。`en-US` はまず時間帯だけを扱い、行事や季節は扱わない。

独自データセットを渡すと、サービスや地域に合わせた文言に差し替えられる。

### 文言ガイドライン

`PhraseEntry.phrase` は一言で完結する短文にする。読点・句点に頼らず、単調で扱いやすい文言を優先する。疑問符・感嘆符、問いかけ、挨拶は使用できる。詳細は `src/datasets/GUIDELINES.md` に従う。

```ts
import { createKotodoki, type KotodokiDataset } from "@ciel/kotodoki";

const dataset = {
  id: "custom-ja-JP",
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
} satisfies KotodokiDataset;

const kotodoki = createKotodoki({ datasets: [dataset] });
```

## 開発

```bash
pnpm -C packages/kotodoki test
pnpm -C packages/kotodoki typecheck
pnpm -C packages/kotodoki build
```

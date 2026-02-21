# PWA Testing Guide - localhost環境

このガイドでは、localhost環境でCielのPWA機能をテストする方法を説明します。

## ⚠️ 重要な注意事項

**Service Workerは開発モード（`pnpm dev`）では動作しません！**

- ❌ 開発モード: `pnpm dev` - Service Worker無効
- ✅ プロダクションモード: `pnpm build && pnpm start` - Service Worker有効

PWA機能をテストする場合は、必ずプロダクションビルドで実行してください。

## 前提条件

- PostgreSQLとRedisが起動していること
- Node.js、pnpm、Goがインストールされていること

## 1. バックエンドの起動

```bash
cd apps/backend
go run main.go
```

バックエンドは http://localhost:6137 で起動します。

## 2. フロントエンドのビルドと起動

**重要**: Service Workerはプロダクションモードでのみ動作します。

```bash
# プロダクションビルド
pnpm -C apps/frontend build

# プロダクションサーバー起動
pnpm -C apps/frontend start
```

フロントエンドは http://localhost:3000 で起動します。

## 3. Chrome DevToolsでの確認手順

### 3.1 Manifestの確認

1. Chrome で http://localhost:3000 を開く
2. DevTools を開く（F12またはCtrl+Shift+I）
3. **Application** タブを選択
4. 左側メニューから **Manifest** を選択
5. 以下を確認：
   - **Name**: "Ciel"（またはサーバー設定の名前）
   - **Short Name**: "Ciel"
   - **Start URL**: "/"
   - **Display**: "standalone"
   - **Theme Color**: "#f7f7f7"（ライトモード）
   - **Background Color**: "#f7f7f7"
   - **Icons**: 192x192と512x512のアイコンが2つ表示される

### 3.2 Service Workerの確認

1. **Application** タブ → 左側メニューから **Service Workers** を選択
2. 以下を確認：
   - **Status**: 🟢 "activated and is running"
   - **Source**: `http://localhost:3000/sw.js`
   - **Update on reload**: チェックなし（デフォルト）

3. **Service Workerの手動更新テスト**：
   - "Update" ボタンをクリック
   - ステータスが "activated" のまま維持されることを確認

### 3.3 キャッシュの確認

1. **Application** タブ → **Cache Storage** を展開
2. 以下のキャッシュが存在することを確認：
   - `ciel-static-v1`: 静的アセット用
   - `ciel-dynamic-v1`: 動的コンテンツ用

3. `ciel-static-v1` を選択し、以下がキャッシュされていることを確認：
   - `/` (ホームページ)
   - `/offline` (オフラインページ)
   - `/api/manifest.json`

### 3.4 オフライン動作のテスト

1. **Network** タブを開く
2. 上部の **Throttling** ドロップダウンを選択
3. **Offline** を選択
4. ページをリロード（Ctrl+R）
5. 以下を確認：
   - キャッシュされたページが表示される
   - ナビゲーションが機能する
   - API呼び出しはキャッシュから返される（5分以内）
   - 新しいページに移動すると `/offline` ページが表示される

6. **オフラインページの確認**：
   - オフライン状態で未訪問のページ（例: `/admin`）にアクセス
   - オフラインページが日本語/英語で正しく表示される
   - "再読み込み" ボタンが機能する

### 3.5 テーマカラーの動態更新

1. ページのダークモード切り替えを実行
2. DevTools → **Elements** タブ
3. `<head>` 内の `<meta name="theme-color">` を確認：
   - ライトモード: `content="#f7f7f7"`
   - ダークモード: `content="#252525"`
4. ブラウザのタブバーの色が変わることを確認（モバイルで顕著）

## 4. Lighthouseでのスコア確認

1. DevTools → **Lighthouse** タブ
2. 設定：
   - Mode: Navigation
   - Device: Desktop または Mobile
   - Categories: **Progressive Web App** のみチェック
3. **Analyze page load** をクリック
4. **目標スコア**: 90以上

### 期待される結果

- ✅ Installable (インストール可能)
- ✅ PWA optimized (最適化済み)
- ✅ Works offline (オフライン動作)
- ✅ Configured for a custom splash screen
- ✅ Sets a theme color
- ✅ Has a valid web app manifest
- ✅ Registers a service worker

## 5. アプリインストールのテスト

### Chromeでのインストール

1. http://localhost:3000 を開く
2. アドレスバー右側の **インストール** アイコン（⊕）をクリック
   - アイコンが表示されない場合：
     - ページをリロード
     - 数秒待つ（Service Worker登録後に表示）
3. インストールダイアログで **インストール** をクリック
4. 新しいウィンドウでアプリが起動することを確認：
   - ブラウザのUIが非表示（standalone mode）
   - アプリ名 "Ciel" がタイトルバーに表示

### インストール後の確認

1. **スタンドアロンモードの確認**：
   - アドレスバーが非表示
   - ブラウザのタブが非表示
   - アプリ独自のウィンドウで動作

2. **オフライン動作の確認**：
   - ネットワークを切断
   - アプリを閉じて再起動
   - キャッシュされたコンテンツが表示される

## 6. トラブルシューティング

### Service Workerが登録されない

```bash
# キャッシュをクリア
DevTools → Application → Storage → Clear site data

# ハードリロード
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### "Update on reload" が有効になっている

- このチェックボックスはオフにしてください
- オンの場合、Service Workerが毎回再登録されます

### アイコンが表示されない

1. `/api/pwa-icon-192` を直接開いて画像が表示されるか確認
2. バックエンドが起動しているか確認（`/api/v1/server/info` にアクセス）
3. フォールバックのグラデーションアイコン（グレー）が表示されるはず

### オフラインページが表示されない

1. Service Workerが "activated" 状態か確認
2. キャッシュに `/offline` が存在するか確認
3. 一度オンラインでページを訪問してからオフラインにする

## 7. コマンド例

### すべてを一度に起動

```bash
# ターミナル1: バックエンド
cd apps/backend && go run main.go

# ターミナル2: フロントエンド（プロダクション）
pnpm -C apps/frontend build && pnpm -C apps/frontend start
```

### キャッシュクリアとテスト再実行

```bash
# ビルドディレクトリをクリア
rm -rf apps/frontend/.next

# 再ビルド
pnpm -C apps/frontend build && pnpm -C apps/frontend start
```

## 8. 期待される動作

✅ **オンライン時**:
- すべてのページがネットワークから読み込まれる
- 静的アセット（JS/CSS/画像）がキャッシュされる
- API呼び出しが成功し、結果がキャッシュされる

✅ **オフライン時**:
- キャッシュされたページが即座に表示される
- 静的アセットがキャッシュから提供される
- API呼び出しが5分以内のキャッシュから返される
- 未訪問のページは `/offline` にフォールバック

✅ **インストール後**:
- スタンドアロンモードで起動
- オフラインでも動作
- アプリアイコンがOSのランチャーに表示（デスクトップ/モバイル）

## まとめ

このガイドに従って、Ciel PWAのすべての機能がlocalhost環境で正しく動作することを確認できます。問題が発生した場合は、DevToolsのConsoleタブでエラーメッセージを確認してください。

# GitHub Pages デプロイ手順

## セットアップ手順

### 1. GitHubリポジトリの作成

1. GitHubで新しいリポジトリを作成
2. リポジトリ名は任意（例: `etf-recovery-analyzer`）

### 2. コードのプッシュ

```bash
git init
git add .
git commit -m "Initial commit: ETF Recovery Analyzer"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 3. GitHub Pages の有効化

1. リポジトリの Settings タブを開く
2. 左サイドバーの "Pages" をクリック
3. Source セクションで以下を設定:
   - Source: "GitHub Actions" を選択

### 4. デプロイの確認

1. Actions タブでワークフローの実行状況を確認
2. デプロイ完了後、以下のURLでアクセス可能:
   ```
   https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
   ```

## ファイル構成

- `index.html` - メインのHTMLファイル
- `app.js` - JavaScriptアプリケーションロジック
- `.nojekyll` - GitHub PagesでJekyll処理を無効化
- `.github/workflows/deploy.yml` - 自動デプロイ用GitHub Actions

## 注意事項

### CORS制限について

GitHub PagesからYahoo Finance APIへの直接アクセスはCORS制限により制限されています。
現在の実装では以下の対策を行っています:

1. **CORS Proxyの使用**: `cors-anywhere.herokuapp.com` を使用
   - 注意: このプロキシには利用制限があります
   - 本番環境では独自のプロキシサーバーの構築を推奨

2. **モックデータ**: APIアクセスが失敗した場合、デモ用のモックデータを表示

### 本番環境での推奨事項

1. **独自のバックエンドAPI構築**:
   - Node.js/Express等でAPIサーバーを構築
   - Vercel、Netlify、Heroku等にデプロイ
   - APIサーバーからYahoo Finance APIにアクセス

2. **代替データソース**:
   - Alpha Vantage API（無料枠あり）
   - IEX Cloud API
   - Twelve Data API

3. **キャッシュの実装**:
   - APIレート制限を回避するためのキャッシュ機能
   - LocalStorageまたはIndexedDBの活用

## カスタマイズ

### ETFリストの変更

`app.js`の`TOP_ETFS`配列を編集:

```javascript
const TOP_ETFS = [
    'SPY', 'IVV', 'VOO', // 追加したいETFティッカー
    // ...
];
```

### 分析パラメータの調整

`app.js`の各関数のデフォルト値を変更:

```javascript
// 下落閾値（デフォルト: -10%）
function findPriceDrops(priceData, threshold = -0.10)

// 回復閾値（デフォルト: +15%）
function findRecoveries(priceData, drops, recoveryThreshold = 0.15)
```

## トラブルシューティング

### ページが表示されない場合

1. リポジトリのSettings > Pages でGitHub Pagesが有効になっているか確認
2. Actions タブでビルドが成功しているか確認
3. ブラウザのキャッシュをクリア

### データが取得できない場合

1. ブラウザの開発者ツールでコンソールエラーを確認
2. CORS Proxyの状態を確認
3. モックデータモードで動作確認

## ライセンス

MIT License
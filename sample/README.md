# サンプル: 別GASプロジェクトから本APIを呼び出す

`fetchJobcanApi.ts` は、本プロジェクトがデプロイしたWebアプリ（`doGet` / `handleJobcanProxy`）を、
**別のGASプロジェクト**から認証付きで呼び出すサンプルです。

このフォルダはビルド・型チェック・テスト・デプロイの対象には含めていません（`tsconfig.json` の `include` にも `esbuild.js` のエントリポイントにも含まれません）。参考コードとしてそのままGASエディタにコピーして使ってください。

## なぜ認証が必要か

本プロジェクトの `appsscript.json` は次の設定です。

```json
"webapp": {
  "executeAs": "USER_DEPLOYING",
  "access": "DOMAIN"
}
```

`access: DOMAIN` のため、同じGoogle Workspaceドメイン内のログイン済みユーザーしか呼び出せません。
別のGASプロジェクトから `UrlFetchApp.fetch()` で叩く場合、何もしないと未ログイン扱いになり弾かれます。

そこで呼び出し側スクリプトで `ScriptApp.getIdentityToken()` を使ってIDトークンを取得し、
`Authorization: Bearer <token>` ヘッダーに載せて送ることで、doGet側にログインユーザーとして認証させます。

## 使い方

1. 呼び出し側のGASプロジェクトを用意する（新規でも既存でもOK）
2. `fetchJobcanApi.ts` の中身をそのプロジェクトにコピーする
3. `appsscript.json` の `oauthScopes` を、呼び出し側プロジェクトのマニフェストにマージする
   - `openid` スコープが無いと `ScriptApp.getIdentityToken()` が失敗します
4. `JOBCAN_PROXY_URL` を、本プロジェクトをデプロイしたWebアプリURL（`.../exec`）に置き換える
5. `sampleFetchRequests()` などをGASエディタから実行して動作確認する

## 関数

| 関数 | 内容 |
|---|---|
| `sampleFetchRequests()` | `action=requests&status=in_progress` を叩き、進行中の申請一覧を取得 |
| `sampleFetchDetail(requestId)` | `action=detail&id=...` を叩き、申請1件の詳細を取得 |
| `callJobcanProxy(url)` | IDトークンをAuthorizationヘッダーに載せて`fetch`する共通処理 |

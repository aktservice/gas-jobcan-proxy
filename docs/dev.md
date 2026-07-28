# 開発者向けドキュメント

Google Apps Script (GAS) 上で動作する、Jobcan REST API 中継ツールの開発ガイドです。

## 概要

- **実行環境**: Google Apps Script（Spreadsheet コンテナバインド + Web App）
- **言語/ビルド**: TypeScript → esbuild でバンドル → `dist/main.js` を clasp で push
- **役割**:
  - スプレッドシートのメニューから Jobcan APIトークンを登録（`init`）
  - Web アプリ（`doGet`）として Jobcan API へのプロキシを提供（`handleJobcanProxy`）
  - デバッグ用にシートへ一括ダンプする関数（`debugFetchAndDump`）

エンドユーザー向けの使い方は [docs/user-manual.md](./user-manual.md) を参照してください。

## セットアップ

```bash
npm install
npx clasp login   # 未ログインの場合のみ
```

`.clasp.json` に対象スクリプトの `scriptId` が設定済みです（`rootDir` は `dist`）。別のスクリプトに向ける場合はここを変更してください。

Jobcan API トークンはコードに埋め込みません。ローカル開発では `test/` 配下の純粋関数テストのみでロジックを検証し、実際の API 呼び出しの確認は GAS 上にデプロイしてスプレッドシートの「認証」メニューからトークンを登録して行います。

## ディレクトリ構成

```
backend/
  main.ts                 # GASのグローバル関数登録（onOpen/doGet/showHtml/init/debugFetchAndDump/getScriptUrl）
  event.ts                # onOpen（メニュー追加）、showHtml（ダイアログ表示）
  restSample.ts            # debugFetchAndDump（デバッグ用シート書き出し）
  core/
    JobcanRestClass.ts     # RestJobcan クラス。Jobcan API 呼び出し本体
    requestSearch.ts       # URL構築・全ページ収集・フォーム名フィルタ（GAS非依存の純粋関数、テスト対象）
    setup.ts               # init()。トークンをPropertiesServiceへ保存
    constants.ts           # CONSTVALUES（プロパティキー名・メッセージ文言）
    config.ts              # CONFIG_DATA（未使用気味の設定シート名）
  features/
    jobcanProxy.ts          # handleJobcanProxy。doGetのルーティング先
  utils/
    helper.ts               # getScriptUrl（Webアプリの公開URL取得）
    SheetUtils.ts            # getExistingIdsSet / findSheetByCurrentYear
  @types/
    job2.d.ts                # Jobcan API のグローバル型定義（json-schema-to-typescriptで自動生成）
  static/
    index.html                # doGetのドキュメントページ兼スプレッドシートダイアログ
    appsscript.json            # GASマニフェスト（ビルド時にdist/へコピーされるもの）
test/
  requestSearch.test.ts        # requestSearch.ts のユニットテスト（Node標準test）
dist/                           # ビルド出力。cleanしても npm run build/deploy で再生成される
```

## アーキテクチャ

```
doGet(e)
  └─ handleJobcanProxy(e)          [features/jobcanProxy.ts]
       ├─ action未指定 → static/index.html を返す
       ├─ action=walk     → RestJobcan.walkAllRequests()
       ├─ action=detail   → RestJobcan.getCustomezedItemsByRequestId()
       └─ action=requests → パラメータ検証 → RestJobcan.listRequests()

RestJobcan                          [core/JobcanRestClass.ts]
  ├─ constructor: PropertiesServiceからtoken取得（未設定なら例外）
  ├─ getFetch<T>(): UrlFetchApp.fetch ラッパー。Authorization: token <token> を付与
  ├─ getRequests(): 1ページ分取得（requestSearch.buildRequestsUrlを利用）
  └─ listRequests(): 全ページ収集（requestSearch.collectAllPages）+ フォーム名フィルタ

requestSearch.ts                    [core/requestSearch.ts]
  ├─ buildRequestsUrl(): JobcanがサポートするクエリのみでURL構築（applied_after/before, status, form_id）
  ├─ collectAllPages(): next URLを辿って全件収集（純粋関数、fetchは注入）
  └─ filterByFormName(): form_idが未指定のときのみ、form_nameでローカルフィルタ
```

`requestSearch.ts` を `JobcanRestClass.ts` から分離しているのは、GAS API（`UrlFetchApp`など）に依存しない純粋関数にすることで、Node 上で `npm test` によるユニットテストを可能にするためです。新しい検索条件を追加する場合は、まずここにロジックを置き、`RestJobcan` は薄いラッパーとして呼び出すだけにしてください。

## npm スクリプト

| スクリプト | 内容 |
|---|---|
| `npm run build` | `dist/` を再生成し、`static/` をコピーしてから `backend/main.ts` を `dist/main.js` にバンドル |
| `npm run typecheck` | TypeScriptの型チェックを実行 |
| `npm test` | `test/*.test.ts` を `ts-node/esm` ローダーで実行（Node標準 `node:test`） |
| `npm run check` | `typecheck` → `test` |
| `npm run push` | `clasp push`（`dist/` の内容をGASへ反映） |
| `npm run deploy` | `check` → `build` → `push` |
| `npm run open` | `clasp open`（GASエディタをブラウザで開く） |

`build` は毎回 `static/index.html` と `static/appsscript.json` を含めて `dist/` を作り直すため、静的ファイルを変更した場合も同じ `npm run deploy` を利用します。

## テスト

`backend/core/requestSearch.ts` はGAS依存がないため、Node上で直接テストできます。

```bash
npm test
```

`RestJobcan`（`JobcanRestClass.ts`）や `handleJobcanProxy` は `UrlFetchApp` / `PropertiesService` / `ContentService` などGASグローバルに依存するため、ユニットテスト対象外です。ロジックを追加する際は可能な限り `requestSearch.ts` 側（GAS非依存）に切り出し、テストを書いてください。

## 型定義（job2.d.ts）について

`backend/@types/job2.d.ts` は `json-schema-to-typescript` による自動生成ファイルです（ファイル冒頭にも明記あり）。**直接編集しない**でください。Jobcan APIのレスポンス構造が変わった場合は、元のJSON Schemaを更新して再生成する運用を想定しています（現状リポジトリ内に生成元のスキーマファイルは含まれていないため、生成コマンドの再現には別途スキーマの用意が必要です）。

## 認証・設定値

- APIトークンは `PropertiesService.getScriptProperties()` の `token` キー（`core/constants.ts` の `CONSTVALUES.TOKEN`）に保存
- スプレッドシートメニュー「認証」→ `init()`（`core/setup.ts`）でUIプロンプトから入力・保存
- `dist/appsscript.json`（GASマニフェスト）:
  - `webapp.executeAs: USER_DEPLOYING`（デプロイしたユーザー権限で実行）
  - `webapp.access: DOMAIN`（組織内公開）
  - `timeZone: Asia/Tokyo`
  - OAuthスコープは明示指定なし（暗黙スコープに依存）

## 新しいAPIアクションを追加する場合

1. 必要な検索・整形ロジックは `core/requestSearch.ts`（GAS非依存）に関数として追加し、`test/`にユニットテストを書く
2. `RestJobcan`（`core/JobcanRestClass.ts`）に、その関数を呼び出す薄いメソッドを追加
3. `features/jobcanProxy.ts` の `switch (action)` にケースを追加し、パラメータのバリデーションを行う
4. `static/index.html` にエンドポイントの説明カードを追加
5. [docs/user-manual.md](./user-manual.md) にパラメータ表とサンプルURLを追記
6. `npm run deploy` で型チェック・テスト・反映

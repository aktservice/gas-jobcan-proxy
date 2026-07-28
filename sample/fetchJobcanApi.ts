/**
 * 【サンプル】別のGASプロジェクトから、本プロジェクトがデプロイしたWebアプリ（doGet）を呼び出す例。
 *
 * 本プロジェクトのWebアプリは appsscript.json で `webapp.access: "DOMAIN"` に設定されているため、
 * 外部から叩く場合もGoogleアカウントでの認証が必要です。
 * ここでは呼び出し側スクリプトの ScriptApp.getIdentityToken() で取得したIDトークンを
 * Authorization ヘッダーに載せることで、doGet側にログイン中のユーザーとして認証させています。
 *
 * 事前準備:
 *  1. このファイルと同じフォルダの appsscript.json (oauthScopes) を、呼び出し側プロジェクトの
 *     appsscript.json にマージしてください（openid スコープが無いと getIdentityToken() は失敗します）。
 *  2. JOBCAN_PROXY_URL を、本プロジェクトをデプロイしたWebアプリのURL（.../exec）に置き換えてください。
 *  3. 呼び出し側スクリプトも、本プロジェクトと同じGoogle Workspaceドメインのアカウントで実行してください。
 *
 * ※ このサンプルはビルド・テスト対象外の参考コードです（tsconfig.json / esbuild.js には含めていません）。
 */

const JOBCAN_PROXY_URL = "https://script.google.com/macros/s/【デプロイ後のスクリプトID】/exec";

/**
 * action=requests で、進行中の申請一覧を取得するサンプル
 */
function sampleFetchRequests(): Jobcan.V2RequestResult[] {
  const url = `${JOBCAN_PROXY_URL}?action=requests&status=in_progress`;
  const json = callJobcanProxy(url);
  Logger.log(`取得件数: ${json.count}`);
  return json.data;
}

/**
 * action=detail で、申請1件の詳細を取得するサンプル
 */
function sampleFetchDetail(requestId: string): unknown {
  const url = `${JOBCAN_PROXY_URL}?action=detail&id=${encodeURIComponent(requestId)}`;
  const json = callJobcanProxy(url);
  return json.data;
}

/**
 * doGetへの認証付きリクエスト共通処理
 * ScriptApp.getIdentityToken() で取得したIDトークンをBearerトークンとして送信する
 */
function callJobcanProxy(url: string): {
  status: string;
  count?: number;
  data: any;
  message?: string;
} {
  const identityToken = ScriptApp.getIdentityToken();

  const response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: {
      Authorization: `Bearer ${identityToken}`,
    },
    muteHttpExceptions: true,
  });

  const statusCode = response.getResponseCode();
  const body = response.getContentText();

  if (statusCode !== 200) {
    throw new Error(`API呼び出しに失敗しました。status=${statusCode} body=${body}`);
  }

  const json = JSON.parse(body);
  if (json.status === "error") {
    throw new Error(`APIエラー: ${json.message}`);
  }

  return json;
}

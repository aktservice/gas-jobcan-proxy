import { RestJobcan } from "./core/JobcanRestClass";
import { CONSTVALUES } from "./core/constants";

/**
 * 【開発用サンプル】
 */
export function debugFetchAndDump() {
  const token = PropertiesService.getScriptProperties().getProperty(
    CONSTVALUES.TOKEN,
  );
  if (!token) {
    throw new Error(
      "プロパティにトークンが設定されていません。init()を実行してください。",
    );
  }

  const jobcan = new RestJobcan(token);
  const sheet = SpreadsheetApp.getActiveSheet();

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = Utilities.formatDate(yesterdayDate, "JST", "yyyy/MM/dd");

  try {
    Logger.log(`${yesterday} 以降の全件データを取得し、ダンプを開始します...`);

    // 1. 書き込むデータを格納する配列
    const dumpData: any[][] = [];

    // 2. walkAllRequests を使って全ページをループ
    // (引数1: クラス, 引数2: 日付, 引数3: 1件ごとの処理)
    jobcan.walkAllRequests(yesterday, (req: Jobcan.V2RequestResult) => {
      // 流れてきたデータを配列に追加
      dumpData.push([
        req.id,
        req.applied_date,
        req.form_name,
        req.title,
        req.status,
        `https://ssl.wf.jobcan.jp/#/requests/${req.id}`,
      ]);
    });

    if (dumpData.length === 0) {
      Logger.log("対象のデータが見つかりませんでした。");
      return;
    }

    // 3. まとめてシートの末尾に追加
    const lastRow = sheet.getLastRow();
    sheet
      .getRange(lastRow + 1, 1, dumpData.length, dumpData[0].length)
      .setValues(dumpData);

    Logger.log(`合計 ${dumpData.length} 件のデータを書き込みました。`);
  } catch (e) {
    Logger.log(`エラー発生: ${e}`);
  }
}

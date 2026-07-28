/**
 * @description オープンイベント（メニュー用）
 * @author yoshitaka <sato-yoshitaka@aktio.co.jp>
 * @date 30/07/2024
 */
export function onOpen(e: GoogleAppsScript.Events.SheetsOnOpen): void {
  const ui = SpreadsheetApp.getUi();
  const mn = ui.createMenu("menu");

  mn.addItem("認証", "init");
  mn.addToUi();
}

/**
 * @description メニュー用Indexを呼ぶ関数
 * @author yoshitaka <sato-yoshitaka@aktio.co.jp>
 * @date 17/02/2026
 * @export
 */
export function showHtml() {
  const htmlFileName = "index";
  const output = HtmlService.createTemplateFromFile(htmlFileName);
  const html = output.evaluate();
  SpreadsheetApp.getActiveSpreadsheet().show(html);
}

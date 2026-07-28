/**
 * シートの指定列から既存IDを読み込み、重複チェック用のSetを返す
 * @param colIndex 1ベースの列番号（デフォルトは1列目）
 */
export function getExistingIdsSet(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  colIndex: number = 1,
): Set<string> {
  const lastRow = sheet.getLastRow();
  if (lastRow < 1) return new Set();
  const ids = sheet.getRange(1, colIndex, lastRow, 1).getValues();
  return new Set(ids.map((row) => row[0].toString()));
}

/**
 * 今年の年度が含まれる名前のシートを検索する
 */
export function findSheetByCurrentYear(
  sp: GoogleAppsScript.Spreadsheet.Spreadsheet,
): GoogleAppsScript.Spreadsheet.Sheet {
  const currentYear = new Date().getFullYear().toString();
  const sheet = sp.getSheets().find((s) => s.getName().includes(currentYear));
  if (!sheet) throw new Error(`${currentYear}年度のシートが見つかりません`);
  return sheet;
}

import { CONSTVALUES } from "./constants";
/**!
 *  プロパティーをセットする為メニューの認証に追加
 */
export function init() {
  const ui = SpreadsheetApp.getUi();
  const ret = ui.prompt(CONSTVALUES.INIT_MESSAGE, ui.ButtonSet.OK_CANCEL);
  if (ret.getSelectedButton() === ui.Button.CANCEL) {
    return;
  }
  const prop = PropertiesService.getScriptProperties();
  prop.setProperty(CONSTVALUES.TOKEN, ret.getResponseText());
  ui.alert(CONSTVALUES.INIT_SUCCESS);
}

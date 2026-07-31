/** 現在公開しているWebアプリ（GAS）のURLを取得する */
export function getScriptUrl(): string {
  const scURL = ScriptApp.getService().getUrl();
  return scURL;
}

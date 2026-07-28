export function getScriptUrl(): string {
  const scURL = ScriptApp.getService().getUrl();
  return scURL;
}

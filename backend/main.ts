import { onOpen, showHtml } from "./event";
import { debugFetchAndDump } from "./restSample";
import { init } from "./core/setup";
import { handleJobcanProxy } from "./features/jobcanProxy";
import { getScriptUrl } from "./utils/helper";

// --- GAS標準イベント ---
global.onOpen = (e: GoogleAppsScript.Events.SheetsOnOpen) => onOpen(e);
global.doGet = (e: GoogleAppsScript.Events.DoGet) => handleJobcanProxy(e);

// --- カスタムメニュー・UI関連 ---
global.showHtml = () => showHtml();

// --- 管理・デバッグ用 ---
global.init = () => init();
global.debugFetchAndDump = () => debugFetchAndDump();

// --- WebApp用 ---//
global.getScriptUrl = () => getScriptUrl();

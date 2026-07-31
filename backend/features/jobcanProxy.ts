import { RestJobcan } from "../core/JobcanRestClass";
import {
  REQUEST_STATUSES,
  type RequestSearchOptions,
  type RequestStatus,
} from "../core/requestSearch";

/**
 * Jobcan Proxy のメインハンドラー
 */
export function handleJobcanProxy(e: GoogleAppsScript.Events.DoGet) {
  // 1. パラメータがない場合はドキュメントを表示
  if (!e.parameter.action) {
    return HtmlService.createHtmlOutputFromFile("index")
      .setTitle("Jobcan Proxy API Document")
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0");
  }

  // 2. パラメータがある場合は API として処理
  const action = e.parameter.action;

  try {
    const jobcan = new RestJobcan();

    switch (action) {
      case "walk": {
        const date = e.parameter.date || "";
        const allResults: any[] = [];
        jobcan.walkAllRequests(date, (req) => allResults.push(req));
        return createJsonResponse({
          status: "success",
          count: allResults.length,
          data: allResults,
        });
      }

      case "detail": {
        const id = e.parameter.id;
        if (!id)
          throw new Error("Parameter 'id' is required for action 'detail'");
        const detail = jobcan.getCustomezedItemsByRequestId(id, false);
        return createJsonResponse({ status: "success", data: detail });
      }

      case "requests": {
        const options = parseRequestSearchOptions(e.parameter);
        const results = jobcan.listRequests(options);
        return createJsonResponse({
          status: "success",
          count: results.length,
          data: results,
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * doGet のクエリパラメータ（start/end/status/form_id/form_name）を検証し、
 * RequestSearchOptions へ変換する。値が不正な場合は Error を投げる。
 */
function parseRequestSearchOptions(
  parameter: Record<string, string | undefined>,
): RequestSearchOptions {
  const start = optionalParameter(parameter.start);
  const end = optionalParameter(parameter.end);
  const status = optionalParameter(parameter.status);
  const formId = optionalParameter(parameter.form_id);
  const formName = optionalParameter(parameter.form_name);

  if (start && !isValidDate(start)) {
    throw new Error("Parameter 'start' must use YYYY/MM/DD format");
  }
  if (end && !isValidDate(end)) {
    throw new Error("Parameter 'end' must use YYYY/MM/DD format");
  }
  if (start && end && start > end) {
    throw new Error("Parameter 'start' must be on or before 'end'");
  }

  if (status && !REQUEST_STATUSES.includes(status as RequestStatus)) {
    throw new Error(`Parameter 'status' is invalid: ${status}`);
  }

  let parsedFormId: number | undefined;
  if (formId) {
    if (!/^\d+$/.test(formId) || !Number.isSafeInteger(Number(formId)) || Number(formId) < 1) {
      throw new Error("Parameter 'form_id' must be a positive integer");
    }
    parsedFormId = Number(formId);
  }

  return {
    appliedAfter: start,
    appliedBefore: end,
    status: status as RequestStatus | undefined,
    formId: parsedFormId,
    formName,
  };
}

/** 空文字・空白のみの値を undefined として扱う（未指定パラメータの正規化） */
function optionalParameter(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

/** "YYYY/MM/DD" 形式かつ実在する日付かどうかを検証する */
function isValidDate(value: string): boolean {
  const match = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;

  const [, year, month, day] = match;
  const parsedYear = Number(year);
  const parsedMonth = Number(month);
  const parsedDay = Number(day);
  return (
    parsedMonth >= 1 &&
    parsedMonth <= 12 &&
    parsedDay >= 1 &&
    parsedDay <= new Date(parsedYear, parsedMonth, 0).getDate()
  );
}

/**
 * JSONレスポンス生成用ヘルパー
 */
function createJsonResponse(data: object) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

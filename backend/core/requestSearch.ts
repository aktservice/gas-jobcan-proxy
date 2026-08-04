/** Parameters accepted by the Jobcan request-list API. */
export const REQUEST_STATUSES = [
  "in_progress",
  "completed",
  "rejected",
  "returned",
  "canceled",
  "canceled_after_completion",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/** ジョブカン申請一覧APIへ渡す検索条件 */
export interface RequestSearchOptions {
  /** 申請日の下限（YYYY/MM/DD） */
  appliedAfter?: string;
  /** 申請日の上限（YYYY/MM/DD） */
  appliedBefore?: string;
  /** 申請ステータス */
  status?: RequestStatus;
  /** フォームID（ジョブカン側でフィルタされる） */
  formId?: number;
  /** Applied locally because Jobcan's list API has no form-name parameter. */
  formName?: string;
}

/** ジョブカン申請一覧APIの1ページ分のレスポンス */
export interface RequestListPage<T> {
  results?: T[];
  /** 次ページの絶対URL。存在しない場合はnull/undefined */
  next?: string | null;
}

/** Build only the Jobcan-supported portion of the request-list URL. */
export function buildRequestsUrl(
  baseUrl: string,
  options: RequestSearchOptions,
): string {
  const parameters: string[] = [];
  // URLエンコードした「key=value」をクエリパラメータ配列へ追加する
  const add = (name: string, value: string) => {
    parameters.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
  };

  if (options.appliedAfter) add("applied_after", options.appliedAfter);
  if (options.appliedBefore) add("applied_before", options.appliedBefore);
  if (options.status) add("status", options.status);
  if (options.formId !== undefined) {
    add("form_id", String(options.formId));
  }

  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const query = parameters.length > 0 ? `?${parameters.join("&")}` : "";
  return `${normalizedBaseUrl}v2/requests/${query}`;
}

/** Follow Jobcan's absolute next URLs until the final page. */
export function collectAllPages<T>(
  initialUrl: string,
  fetchPage: (url: string) => RequestListPage<T>,
): T[] {
  const allResults: T[] = [];
  let url: string | null = initialUrl;

  while (url) {
    const page = fetchPage(url);
    allResults.push(...(page.results ?? []));
    url = page.next ?? null;
  }

  return allResults;
}

/**
 * options.formName に一致する申請だけへ絞り込む（プロキシ側のローカルフィルタ）。
 * formId 指定時はジョブカン側で既にフィルタ済みのため、このフィルタは適用しない。
 */
export function filterByFormName<T extends { form_name: string }>(
  requests: T[],
  options: RequestSearchOptions,
): T[] {
  // A form ID is filtered by Jobcan and deliberately takes precedence.
  if (options.formId !== undefined || !options.formName) return requests;
  return requests.filter((request) => request.form_name === options.formName);
}

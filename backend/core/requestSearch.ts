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

export interface RequestSearchOptions {
  appliedAfter?: string;
  appliedBefore?: string;
  status?: RequestStatus;
  formId?: number;
  /** Applied locally because Jobcan's list API has no form-name parameter. */
  formName?: string;
}

export interface RequestListPage<T> {
  results?: T[];
  next?: string | null;
}

/** Build only the Jobcan-supported portion of the request-list URL. */
export function buildRequestsUrl(
  baseUrl: string,
  options: RequestSearchOptions,
): string {
  const parameters: string[] = [];
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

export function filterByFormName<T extends { form_name: string }>(
  requests: T[],
  options: RequestSearchOptions,
): T[] {
  // A form ID is filtered by Jobcan and deliberately takes precedence.
  if (options.formId !== undefined || !options.formName) return requests;
  return requests.filter((request) => request.form_name === options.formName);
}

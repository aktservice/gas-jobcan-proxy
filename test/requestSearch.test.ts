import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRequestsUrl,
  collectAllPages,
  filterByFormName,
} from "../backend/core/requestSearch.js";

test("buildRequestsUrl omits optional conditions", () => {
  const url = new URL(buildRequestsUrl("https://ssl.wf.jobcan.jp/wf_api/", {}));

  assert.equal(url.pathname, "/wf_api/v2/requests/");
  assert.equal(url.search, "");
});

test("buildRequestsUrl includes date range, status, and form ID", () => {
  const url = new URL(
    buildRequestsUrl("https://ssl.wf.jobcan.jp/wf_api/", {
      appliedAfter: "2026/02/01",
      appliedBefore: "2026/02/28",
      status: "completed",
      formId: 12345,
    }),
  );

  assert.equal(url.searchParams.get("applied_after"), "2026/02/01");
  assert.equal(url.searchParams.get("applied_before"), "2026/02/28");
  assert.equal(url.searchParams.get("status"), "completed");
  assert.equal(url.searchParams.get("form_id"), "12345");
});

test("collectAllPages follows Jobcan next URLs without rebuilding them", () => {
  const requestedUrls: string[] = [];
  const results = collectAllPages("https://example.test/page-1", (url) => {
    requestedUrls.push(url);
    if (url.endsWith("page-1")) {
      return { results: ["first"], next: "https://example.test/page-2?form_id=1" };
    }
    return { results: ["second"], next: null };
  });

  assert.deepEqual(results, ["first", "second"]);
  assert.deepEqual(requestedUrls, [
    "https://example.test/page-1",
    "https://example.test/page-2?form_id=1",
  ]);
});

test("form ID takes precedence over an exact form-name filter", () => {
  const requests = [
    { form_name: "名刺申請", id: "1" },
    { form_name: "備品申請", id: "2" },
  ];

  assert.deepEqual(filterByFormName(requests, { formName: "名刺申請" }), [requests[0]]);
  assert.deepEqual(
    filterByFormName(requests, { formId: 10, formName: "名刺申請" }),
    requests,
  );
});

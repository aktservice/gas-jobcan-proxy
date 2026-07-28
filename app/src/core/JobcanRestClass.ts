import {
  buildRequestsUrl,
  collectAllPages,
  filterByFormName,
  type RequestSearchOptions,
  type RequestStatus,
} from "./requestSearch";

//ref job2.d.ts
/**
 * @description ジョブカンに接続するクラス
 * @author yoshitaka <sato-yoshitaka@aktio.co.jp>
 * @date 04/02/2026
 * @export
 * @class RestJobcan
 */
export class RestJobcan {
  private readonly BASEURL = "https://ssl.wf.jobcan.jp/wf_api/";
  private token = "";
  constructor(token?: string) {
    const finalToken =
      token || PropertiesService.getScriptProperties().getProperty("token");
    if (!finalToken) {
      throw new Error("API Token not found プロパティへtokenをいれて下さい");
    } else {
      this.token = finalToken;
    }
  }
  /**
   * @description ジョブカンからデータを取得してコールバックに渡す
   * @author yoshitaka <sato-yoshitaka@aktio.co.jp>
   * @date 04/02/2026
   * @param {string} startDate
   * @param {(request: Jobcan.V2RequestResult) => void} callback
   * @memberof RestJobcan
   */
  public walkAllRequests(
    startDate: string,
    callback: (request: Jobcan.V2RequestResult) => void,
  ) {
    this.listRequests({ appliedAfter: startDate, status: "in_progress" }).forEach(
      callback,
    );
  }

  /** Retrieve one Jobcan request-list page. */
  public getRequests(options: RequestSearchOptions = {}): Jobcan.V2result {
    const requestUrl = buildRequestsUrl(this.BASEURL, options);
    return this.getFetch<Jobcan.V2result>(requestUrl);
  }

  /** Retrieve every page, then apply proxy-only filters. */
  public listRequests(
    options: RequestSearchOptions = {},
  ): Jobcan.V2RequestResult[] {
    const initialUrl = buildRequestsUrl(this.BASEURL, options);
    const requests = collectAllPages<Jobcan.V2RequestResult>(initialUrl, (url) =>
      this.getFetch<Jobcan.V2result>(url),
    );
    return filterByFormName(requests, options);
  }
  /**
   * @description ジョブカンへ接続して情報を取得する
   * @author yoshitaka <sato-yoshitaka@aktio.co.jp>
   * @date 21/10/2024
   * @param {string} request_id
   * @param {boolean} [onlyPart=true]
   * @returns {*}
   */
  public getCustomezedItemsByRequestId(
    request_id: string,
    onlyPart: boolean = true,
    progress: string = "in_progress",
  ): string[] {
    const baseurl = this.BASEURL;
    const requestUrl = `${baseurl}v1/requests/${request_id}/`;

    let result: Jobcan.JobcanResult = this.getFetch(requestUrl);
    if (onlyPart) {
      const INPROGRESS = progress;
      if (result.status !== INPROGRESS) {
        return [];
      }
    }
    let ret = [result.id, result.form_name];
    result.detail.customized_items.forEach(
      (element: Jobcan.CustomizedItem, index) => {
        Logger.log(element.title);
        ret.push(element.content ?? "");
      },
    );
    return ret;
  }
  /**
   * @description fetch
   * @author yoshitaka <sato-yoshitaka@aktio.co.jp>
   * @date 31/10/2024
   * @private
   * @param {string} url
   * @param {GoogleAppsScript.URL_Fetch.HttpMethod} [method="get"]
   * @param {string} [payload=""]
   * @returns {*}  {JobcanResult}
   * @memberof RestJobcan
   */
  private getFetch<T>(
    url: string,
    method: GoogleAppsScript.URL_Fetch.HttpMethod = "get",
    payload: string = "",
  ): T {
    const pram: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: method,
      contentType: "application/json",
      muteHttpExceptions: false,
      payload: payload,
      headers: {
        Authorization: "token " + this.token,
      },
    };
    //レスポンスを受ける変数
    let res: GoogleAppsScript.URL_Fetch.HTTPResponse = UrlFetchApp.fetch(
      url,
      pram,
    );
    let resCode: number = res.getResponseCode();
    const content = res.getContentText();
    if (resCode === 200) {
      return JSON.parse(content) as T;
      // rescode is not 200 then error
    }
    throw new Error(
      `API Error: Status ${resCode}. Content: ${res.getContentText()}`,
    );
  }
}

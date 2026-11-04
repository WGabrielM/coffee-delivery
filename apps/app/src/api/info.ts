import { apiGet, type RequestOptions } from "./client";

export interface ApiInfo {
  name: string;
  version: string;
}

/** GET /api/v1: the API's name and version. */
export function getApiInfo(options?: RequestOptions): Promise<ApiInfo> {
  return apiGet<ApiInfo>("", options);
}

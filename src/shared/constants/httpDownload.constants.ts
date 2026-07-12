/** Axios options for large file downloads (no timeout, no size cap). */
export const UNLIMITED_AXIOS_DOWNLOAD_CONFIG = {
  timeout: 0,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
} as const;

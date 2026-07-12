export interface IArchiveExportEntry {
  /** Path inside the ZIP archive */
  path: string;
  /** Public CDN/HTTP URL — used when no S3 key is available */
  url?: string;
  /** S3 object key — preferred over url when present */
  key?: string;
  /** Original extension from the source URL/key — preserved in the ZIP filename */
  extension?: string;
}

export interface IArchiveExportOptions {
  /** Skip entries whose source cannot be fetched instead of failing the whole archive */
  skipOnError?: boolean;
}

export interface IArchiveZipStreamResult {
  stream: NodeJS.ReadableStream;
  finalize: () => Promise<{ added: number; skipped: number; failed: number }>;
}

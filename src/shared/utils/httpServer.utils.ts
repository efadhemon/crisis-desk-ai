import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Disables HTTP timeouts for a single long-running streamed response
 * (e.g. worker profile asset ZIP exports) without affecting other routes.
 */
export function disableHttpRequestTimeouts(req: IncomingMessage, res: ServerResponse): void {
  req.setTimeout(0);
  res.setTimeout(0);
  req.socket?.setTimeout(0);
}

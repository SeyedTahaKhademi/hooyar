/**
 * Unified HTTP client for provider APIs.
 *
 * Inside the Hooyar desktop app every request is proxied through the
 * Electron main process (ai:request IPC) so that:
 *   - API calls are not subject to browser CORS (webSecurity stays ON)
 *   - timeouts are enforced centrally
 *
 * When the native bridge is unavailable (e.g. `npm run dev` in a plain
 * browser) it gracefully falls back to a direct fetch.
 */

export interface ApiFetchResult {
  ok: boolean;
  status: number;
  bodyText: string;
}

export interface ApiFetchInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export async function apiFetch(
  url: string,
  init: ApiFetchInit = {},
  timeoutMs?: number
): Promise<ApiFetchResult> {
  const native = window.hooyarNative;

  if (native?.aiRequest) {
    const res = await native.aiRequest({
      url,
      method: init.method || 'GET',
      headers: init.headers,
      body: init.body,
      timeoutMs
    });
    return { ok: res.ok, status: res.status, bodyText: res.text };
  }

  const controller = timeoutMs ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const response = await fetch(url, { ...init, signal: controller?.signal });
    const bodyText = await response.text();
    return { ok: response.ok, status: response.status, bodyText };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

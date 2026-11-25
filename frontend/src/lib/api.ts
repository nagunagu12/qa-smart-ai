export const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '');

export async function responseError(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null && 'detail' in body) {
      const { detail } = body;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        const messages = detail
          .map((item) =>
            typeof item === 'object'
            && item !== null
            && 'msg' in item
            && typeof item.msg === 'string'
              ? item.msg
              : '',
          )
          .filter(Boolean);
        if (messages.length) return messages.join(' ');
      }
    }
  } catch {
    return `Request failed with HTTP ${response.status}.`;
  }
  return `Request failed with HTTP ${response.status}.`;
}

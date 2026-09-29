export async function adminRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    cache: 'no-store',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    const error = new Error(result.error || 'request_failed');
    error.status = response.status;
    error.retryAfter = result.retryAfter;
    throw error;
  }
  return response;
}
export async function adminJson(path, options) {
  return (await adminRequest(path, options)).json();
}
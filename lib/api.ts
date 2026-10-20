// Browser-side client for the backend, through the authenticated /api/v1 proxy.

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    method: init.method ?? "GET",
    headers: init.body !== undefined ? { "content-type": "application/json" } : undefined,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    const detail = await res
      .json()
      .then((d: { detail?: unknown }) => (typeof d.detail === "string" ? d.detail : null))
      .catch(() => null);
    throw new ApiError(res.status, detail ?? "Something went wrong. Try again.");
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

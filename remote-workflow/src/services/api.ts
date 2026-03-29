export interface ApiError extends Error {
  status: number;
}

export interface Api {
  get: <T>(url: string) => Promise<T>;
  post: <T>(url: string, body?: unknown) => Promise<T>;
  del: <T>(url: string) => Promise<T>;
}

export function createApi(token: string): Api {
  async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const error = new Error(res.statusText) as ApiError;
      error.status = res.status;
      throw error;
    }

    return res.json() as Promise<T>;
  }

  return {
    get: <T>(url: string) => request<T>(url),
    post: <T>(url: string, body?: unknown) =>
      request<T>(url, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      }),
    del: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
  };
}

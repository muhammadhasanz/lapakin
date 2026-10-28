export interface PageMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: PageMeta;
}

export interface ApiErrorPayload {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  public status: number;
  public errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

function onRefreshed(success: boolean) {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      return false;
    }

    const json = await res.json();
    return Boolean(json.success);
  } catch {
    return false;
  }
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  let res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  // Handle 401 token expired (kecuali endpoint login / refresh)
  if (
    res.status === 401 &&
    !endpoint.includes('/api/auth/login') &&
    !endpoint.includes('/api/auth/refresh')
  ) {
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshed = await tryRefreshToken();
      isRefreshing = false;
      onRefreshed(refreshed);

      if (refreshed) {
        // Retry request dengan cookie yang sudah di-refresh
        res = await fetch(url, {
          ...options,
          credentials: 'include',
          headers,
        });
      } else {
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/login')
        ) {
          window.location.href = '/login';
        }
      }
    } else {
      // Tunggu refresh token selesai
      const refreshed = await new Promise<boolean>((resolve) => {
        refreshSubscribers.push(resolve);
      });

      if (refreshed) {
        res = await fetch(url, {
          ...options,
          credentials: 'include',
          headers,
        });
      }
    }
  }

  // 204 No Content
  if (res.status === 204) {
    return { success: true, message: 'OK', data: null as any };
  }

  const json = await res.json();

  if (!res.ok) {
    throw new ApiError(
      res.status,
      json.message || 'An error occurred while processing the request',
      json.errors,
    );
  }

  return json as ApiResponse<T>;
}

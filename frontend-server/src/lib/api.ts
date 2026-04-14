// All API calls go through the Next.js rewrite proxy (same origin)
// No need for cross-origin credentials

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (res.status === 401) {
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.location.href = "/";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Request failed: ${res.status}`);
  }

  return res.json();
}

export function getLoginUrl(): string {
  return "/auth/login";
}

export function getLogoutUrl(): string {
  return "/auth/logout";
}

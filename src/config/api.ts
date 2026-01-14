export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_PHONE

export function getAuthToken(): string | null {
  return localStorage.getItem("mikeco_token")
}

function normalizeBaseUrl(base: string) {
  if (!base) throw new Error("VITE_API_BASE_URL no está configurado")

  // Si no tiene protocolo, asumimos https (Vercel)
  if (!base.startsWith("http")) {
    return `https://${base}`
  }

  return base
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const base = normalizeBaseUrl(API_BASE_URL)
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`

  const headers = new Headers(options.headers)

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  if (options.auth) {
    const token = getAuthToken()
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "omit",
    cache: "no-store",
  })

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`

    try {
      const data = await res.json()
      message = data?.error || data?.message || message
    } catch {
      // Puede ser HTML (404 de Vercel) o texto plano
    }

    throw new Error(message)
  }

  if (res.status === 204) {
    return undefined as T
  }

  const text = await res.text()
  if (!text) {
    return undefined as T
  }

  return JSON.parse(text) as T
}

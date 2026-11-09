/** Erro da API no formato ProblemDetail (RFC 9457), com erros por campo quando houver. */
export class ApiError extends Error {
  readonly status: number
  readonly title: string
  readonly fieldErrors: Record<string, string>

  constructor(status: number, title: string, detail: string, fieldErrors: Record<string, string> = {}) {
    super(detail)
    this.status = status
    this.title = title
    this.fieldErrors = fieldErrors
  }
}

export type Page<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

type Options = { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown; form?: FormData }

function csrfToken(): string | undefined {
  const raw = document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='))
  return raw ? decodeURIComponent(raw.slice('XSRF-TOKEN='.length)) : undefined
}

async function refreshCsrf() {
  await fetch('/api/auth/csrf', { credentials: 'include' })
}

async function toError(res: Response): Promise<ApiError> {
  try {
    const p = await res.json()
    const fields: Record<string, string> = {}
    for (const e of p.errors ?? []) fields[e.field] = e.message
    return new ApiError(res.status, p.title ?? 'Erro', p.detail ?? 'Não foi possível concluir a operação.', fields)
  } catch {
    return new ApiError(res.status, 'Erro', 'Não foi possível falar com o servidor.')
  }
}

/**
 * IDs vêm da URL do navegador. Um link como /app/properties/..%2Fusers%2Fx%2Fdeactivate faria
 * uma ação (com CSRF) bater em outra rota da API. Barra aqui, para todos os chamadores.
 */
export function assertSafePath(path: string) {
  const segments = path.split(/[?#]/)[0].split('/')
  const unsafe = segments.some((s) => {
    let decoded: string
    try {
      decoded = decodeURIComponent(s)
    } catch {
      return true
    }
    return decoded === '.' || decoded === '..' || /[/\\]/.test(decoded)
  })
  if (unsafe) throw new ApiError(400, 'Endereço inválido', 'O endereço solicitado é inválido.')
}

/** fetch com cookie de sessão, CSRF automático e erros tipados. */
export async function api<T>(path: string, { method = 'GET', body, form }: Options = {}): Promise<T> {
  assertSafePath(path)
  const unsafe = method !== 'GET'
  const send = async () => {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (unsafe) headers['X-XSRF-TOKEN'] = csrfToken() ?? ''
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    return fetch(`/api${path}`, {
      method,
      headers,
      credentials: 'include',
      body: form ?? (body === undefined ? undefined : JSON.stringify(body)),
    })
  }

  if (unsafe && !csrfToken()) await refreshCsrf()
  let res = await send()
  if (res.status === 403 && unsafe) {
    // token CSRF pode ter mudado (ex.: sessão nova): renova e tenta uma vez
    await refreshCsrf()
    res = await send()
  }
  if (!res.ok) throw await toError(res)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

/** Monta a query string ignorando filtros vazios. */
export function qs(params: Record<string, string | number | undefined | null>): string {
  const s = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') s.set(k, String(v))
  }
  const out = s.toString()
  return out ? `?${out}` : ''
}

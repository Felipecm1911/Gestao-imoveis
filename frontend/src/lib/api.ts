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

const invalidPath = () => new ApiError(400, 'Endereço inválido', 'O endereço solicitado é inválido.')

/**
 * Monta caminhos com IDs vindos da URL do navegador: path`/properties/${id}/status`.
 * Cada valor é codificado (/, ?, #, \, %, tabs) e "." / ".." são recusados. Sem isso, um link forjado
 * levaria uma ação (com CSRF) para outra rota da API.
 */
export function path(strings: TemplateStringsArray, ...values: (string | undefined)[]): string {
  return strings.reduce((out, s, i) => {
    if (i === values.length) return out + s
    const v = values[i]
    if (v === undefined || v === '' || v === '.' || v === '..') throw invalidPath()
    return out + s + encodeURIComponent(v)
  }, '')
}

/**
 * Segunda barreira, no mesmo parser que o fetch usa: o caminho não pode ser reescrito pelo
 * navegador (pontos, tabs) nem ter fragmento. A query, se houver, vem de qs().
 */
export function assertSafePath(p: string) {
  const raw = `/api${p}`
  if (/[\u0000-\u001f\u007f#\\]/.test(raw)) throw invalidPath()
  const url = new URL(raw, 'http://x')
  if (url.pathname !== raw.split('?')[0]) throw invalidPath()
}

/** fetch com cookie de sessão, CSRF automático e erros tipados. */
export async function api<T>(url: string, { method = 'GET', body, form }: Options = {}): Promise<T> {
  assertSafePath(url)
  const unsafe = method !== 'GET'
  const send = async () => {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (unsafe) headers['X-XSRF-TOKEN'] = csrfToken() ?? ''
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    return fetch(`/api${url}`, {
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

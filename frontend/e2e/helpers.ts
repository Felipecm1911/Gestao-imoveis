import { expect, type Page } from '@playwright/test'

export async function signup(page: Page) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@teste.com`
  await page.goto('/signup')
  await page.getByLabel('Nome da imobiliária').fill('Imobiliária E2E')
  await page.getByLabel('Seu nome').fill('Ana Teste')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill('senha-forte-123')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  return email
}

export async function openMenuIfMobile(page: Page) {
  const menu = page.getByRole('button', { name: 'Abrir menu' })
  if (await menu.isVisible()) await menu.click()
}

/** POST direto na API com a sessão da página (para montar cenário sem repetir telas já testadas). */
export async function apiPost<T = { id: string }>(page: Page, url: string, data: unknown): Promise<T> {
  await page.request.get('/api/auth/csrf')
  const token = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN')?.value ?? ''
  const res = await page.request.post(url, { data, headers: { 'X-XSRF-TOKEN': decodeURIComponent(token) } })
  expect(res.ok(), `${url} → ${res.status()}`).toBeTruthy()
  return res.json()
}

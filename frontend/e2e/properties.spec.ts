import { expect, test, type Page } from '@playwright/test'

// PNG 1x1 válido: o backend confere os bytes, não a extensão
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

// CPF válido diferente por execução não é necessário: cada teste cria a própria organização
const CPF = '529.982.247-25'

async function signup(page: Page) {
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

async function openMenuIfMobile(page: Page) {
  const menu = page.getByRole('button', { name: 'Abrir menu' })
  if (await menu.isVisible()) await menu.click()
}

test('cadastro → proprietário → imóvel com foto → filtros → logout → login', async ({ page }) => {
  const email = await signup(page)
  await expect(page.getByText('Nenhum imóvel cadastrado')).toBeVisible()

  // proprietário, com erro de validação antes
  await openMenuIfMobile(page)
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Proprietários' }).click()
  await page.getByRole('link', { name: 'Novo proprietário' }).click()
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText('Informe o nome')).toBeVisible()
  await page.getByLabel('Nome completo ou razão social').fill('Maria Proprietária')
  await page.getByLabel('CPF ou CNPJ').fill(CPF)
  await page.getByLabel('Telefone').fill('(11) 98765-4321')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('cell', { name: 'Maria Proprietária', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: CPF, exact: true })).toBeVisible()

  // imóvel
  await openMenuIfMobile(page)
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Imóveis' }).click()
  await page.getByRole('link', { name: 'Novo imóvel' }).first().click()
  await page.getByLabel('Proprietário').click()
  await page.getByRole('option', { name: 'Maria Proprietária' }).click()
  await page.getByLabel('Código').fill('ap-0012')
  await page.getByLabel('Título').fill('Apartamento Centro')
  await page.getByLabel('CEP').fill('01310-100')
  await page.getByLabel('Rua').fill('Av. Paulista')
  await page.getByLabel('Número', { exact: true }).fill('1000')
  await page.getByLabel('Bairro').fill('Bela Vista')
  await page.getByLabel('Cidade').fill('São Paulo')
  await page.getByLabel('UF').fill('SP')
  await page.getByLabel('Área (m²)').fill('65,5')
  await page.getByLabel('Quartos').fill('2')
  await page.getByLabel('Aluguel sugerido (R$)').fill('2.300,00')
  await page.getByRole('button', { name: 'Salvar' }).click()

  // detalhe + foto
  await expect(page.getByRole('heading', { name: 'Apartamento Centro' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Imóvel: AP-0012' })).toBeVisible()
  await expect(page.getByText('R$ 2.300,00')).toBeVisible()
  await page.locator('input[type=file]').setInputFiles({ name: 'sala.png', mimeType: 'image/png', buffer: PNG })
  await expect(page.getByText('Fotos (1/20)')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Capa', exact: true })).toBeVisible()

  // situação
  await page.getByLabel('Alterar situação').click()
  await page.getByRole('option', { name: 'Manutenção' }).click()
  await expect(page.getByText('Manutenção').first()).toBeVisible()

  // lista com capa e filtros
  await openMenuIfMobile(page)
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Imóveis' }).click()
  await expect(page.getByText('1 imóvel')).toBeVisible()
  await expect(page.locator('img[src^="/api/files/"]')).toBeVisible()
  // no celular os filtros ficam numa folha
  const mobile = (page.viewportSize()?.width ?? 1280) < 768
  if (mobile) await page.getByRole('button', { name: 'Filtros' }).click()
  await page.getByLabel('Aluguel mínimo').fill('3000')
  if (mobile) await page.keyboard.press('Escape')
  await expect(page.getByText('Nenhum imóvel com esses filtros')).toBeVisible()
  await page.getByRole('button', { name: 'Limpar filtros' }).click()
  await expect(page.getByText('1 imóvel')).toBeVisible()

  // logout e login
  await page.getByRole('button', { name: /Ana Teste/ }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(page.getByRole('heading', { name: 'Acesse sua conta' })).toBeVisible()
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill('senha-errada')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
  await page.getByLabel('Senha').fill('senha-forte-123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByText('0 de 1 ativos alugados')).toBeVisible()
})

test('rotas internas exigem login', async ({ page }) => {
  await page.goto('/app/owners')
  await expect(page).toHaveURL(/\/login$/)
})

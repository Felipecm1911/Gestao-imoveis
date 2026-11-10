import { expect, test } from '@playwright/test'
import { apiPost, openMenuIfMobile, signup } from './helpers'

test('inquilino → contrato → ativar → reajustar → encerrar', async ({ page }) => {
  await signup(page)
  const owner = await apiPost(page, '/api/owners', { name: 'Maria Proprietária', document: '52998224725', email: null, phone: null, address: null, bankInfo: null })
  await apiPost(page, '/api/properties', {
    ownerId: owner.id, code: 'AP-0001', title: 'Apartamento Centro', description: null, type: 'APARTAMENTO', zip: '01310100',
    street: 'Av. Paulista', number: '1000', complement: null, district: 'Bela Vista', city: 'São Paulo', state: 'SP',
    areaM2: null, bedrooms: 2, bathrooms: 1, parking: 0, suggestedRent: '2300.00',
  })

  // inquilino, com erro de validação antes
  await openMenuIfMobile(page)
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Inquilinos' }).click()
  await expect(page.getByText('Nenhum inquilino cadastrado')).toBeVisible()
  await page.getByRole('link', { name: 'Novo inquilino' }).click()
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText('Informe o nome')).toBeVisible()
  await page.getByLabel('Nome completo ou razão social').fill('João Inquilino')
  await page.getByLabel('CPF ou CNPJ').fill('111.444.777-35')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('row', { name: /João Inquilino/ }).getByRole('cell', { name: '0', exact: true })).toBeVisible()

  // contrato nasce rascunho, sem parcelas
  await page.goto('/app/contracts')
  await expect(page.getByText('Nenhum contrato cadastrado')).toBeVisible()
  await page.getByRole('link', { name: 'Novo contrato' }).click()
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText('Escolha o imóvel')).toBeVisible()
  await page.getByLabel('Imóvel').click()
  await page.getByRole('option', { name: /Apartamento Centro/ }).click()
  await page.getByLabel('Inquilino').click()
  await page.getByRole('option', { name: 'João Inquilino' }).click()
  await page.getByLabel('Início').fill('2030-01-01')
  await page.getByLabel('Término').fill('2030-12-31')
  await page.getByLabel('Aluguel mensal (R$)').fill('2.300,00')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('heading', { name: 'Contrato CT-0001' })).toBeVisible()
  await expect(page.getByText('Rascunho', { exact: true })).toBeVisible()
  await expect(page.getByText('Nenhuma parcela ainda')).toBeVisible()

  // ativar gera as 12 parcelas e o resumo vem do backend
  await page.getByRole('button', { name: 'Ativar contrato' }).click()
  await expect(page.getByText('Ativo', { exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: '10/02/2030' })).toBeVisible()
  await expect(page.getByRole('tabpanel').getByRole('row')).toHaveCount(13)
  await expect(page.getByText('R$ 27.600,00').first()).toBeVisible()

  // reajuste de 10% a partir de julho
  await page.getByRole('button', { name: 'Reajustar' }).click()
  await page.getByLabel('Percentual (%)').fill('10')
  await page.getByLabel('Vigência a partir de').fill('2030-07-01')
  await page.getByRole('button', { name: 'Aplicar reajuste' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  await page.getByRole('tab', { name: 'Reajustes' }).click()
  await expect(page.getByRole('cell', { name: '10%' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'R$ 2.530,00' })).toBeVisible()

  // histórico registra quem fez
  await page.getByRole('tab', { name: 'Histórico' }).click()
  await expect(page.getByText('Aluguel reajustado')).toBeVisible()
  await expect(page.getByRole('tabpanel').getByText(/Ana Teste/).first()).toBeVisible()

  // encerrar libera o imóvel e fecha o contrato
  await page.getByRole('button', { name: 'Encerrar' }).click()
  await page.getByLabel('Data de encerramento').fill('2030-06-30')
  await page.getByLabel('Motivo').fill('Inquilino mudou de cidade.')
  await page.getByRole('button', { name: 'Encerrar contrato' }).click()
  await expect(page.getByText('Encerrado', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reajustar' })).toBeHidden()

  // lista: contagem e filtro por situação
  await page.goto('/app/contracts')
  await expect(page.getByText('Exibindo 1 a 1 de 1 contrato')).toBeVisible()
  await page.getByRole('button', { name: /Ativos/ }).click()
  await expect(page.getByText('Nenhum contrato com esses filtros')).toBeVisible()
})

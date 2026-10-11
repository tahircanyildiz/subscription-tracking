import { expect, type Page } from '@playwright/test'

let counter = 0

export function uniqueEmail(prefix: string): string {
  counter += 1
  return `${prefix}-${Date.now()}-${counter}@test.dev`
}

export const PASSWORD = 'parola-1234'

/** Yeni kullanıcı kaydeder; doğrulama kapalı olduğundan doğrudan /app'e düşer. */
export async function signUp(page: Page, fullName: string, email: string): Promise<void> {
  await page.goto('/kayit')
  await page.getByLabel('Ad Soyad').fill(fullName)
  await page.getByLabel('E-posta').fill(email)
  await page.getByLabel('Şifre', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Kayıt Ol' }).click()
  await expect(page).toHaveURL(/\/app$/)
}

export async function signIn(page: Page, email: string, password = PASSWORD): Promise<void> {
  await page.goto('/giris')
  await page.getByLabel('E-posta').fill(email)
  await page.getByLabel('Şifre', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Giriş Yap' }).click()
}

export async function signOut(page: Page, fullName: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(fullName) }).click()
  await page.getByRole('menuitem', { name: 'Çıkış yap' }).click()
  await expect(page).toHaveURL(/\/giris/)
}

export interface NewSubscription {
  name: string
  amount: string
  provider?: string
}

/** Abonelik ekleme formunu doldurup kaydeder. */
export async function addSubscription(page: Page, sub: NewSubscription): Promise<void> {
  await page.goto('/app/abonelikler/yeni')
  await page.getByLabel('Abonelik adı *').fill(sub.name)
  if (sub.provider) await page.getByLabel('Sağlayıcı').fill(sub.provider)
  await page.getByLabel('Tutar *').fill(sub.amount)
  await page.getByRole('button', { name: 'Abonelik Ekle' }).click()
  await expect(page).toHaveURL(/\/app\/abonelikler/)
  await expect(page.getByRole('status').filter({ hasText: 'Abonelik eklendi' })).toBeVisible()
}

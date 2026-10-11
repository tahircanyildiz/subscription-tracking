import { expect, test } from '@playwright/test'

import { PASSWORD, signIn, signOut, signUp, uniqueEmail } from './helpers'

test('yetkisiz kullanıcı /app altına erişemez', async ({ page }) => {
  await page.goto('/app')
  await expect(page).toHaveURL(/\/giris/)
  await page.goto('/app/abonelikler')
  await expect(page).toHaveURL(/\/giris/)
  await page.goto('/app/profil')
  await expect(page).toHaveURL(/\/giris/)
})

test('kayıt → çıkış → giriş akışı çalışır', async ({ page }) => {
  const email = uniqueEmail('auth')
  await signUp(page, 'Deneme Kullanıcı', email)

  // Dashboard'a düştü, boş durum görünüyor
  await expect(page.getByText('Henüz abonelik eklemediniz')).toBeVisible()

  // Çıkış
  await signOut(page, 'Deneme Kullanıcı')

  // Çıkıştan sonra korumalı alan tekrar kapalı
  await page.goto('/app')
  await expect(page).toHaveURL(/\/giris/)

  // Tekrar giriş
  await signIn(page, email)
  await expect(page).toHaveURL(/\/app$/)
})

test('yanlış şifreyle giriş hata gösterir', async ({ page }) => {
  const email = uniqueEmail('wrongpass')
  await signUp(page, 'Hatalı Giriş', email)
  await signOut(page, 'Hatalı Giriş')

  await signIn(page, email, 'yanlis-sifre-999')
  await expect(page.getByText('E-posta veya şifre hatalı.')).toBeVisible()
  await expect(page).toHaveURL(/\/giris/)
})

test('girişli kullanıcı auth sayfalarından uygulamaya yönlenir', async ({ page }) => {
  const email = uniqueEmail('redirect')
  await signUp(page, 'Yönlendirme Testi', email)
  await page.goto('/giris')
  await expect(page).toHaveURL(/\/app$/)
  await page.goto('/kayit')
  await expect(page).toHaveURL(/\/app$/)
})

test('şifre sıfırlama isteği her durumda aynı mesajı verir', async ({ page }) => {
  await page.goto('/sifre-sifirla')
  await page.getByLabel('E-posta').fill(uniqueEmail('reset'))
  await page.getByRole('button', { name: 'Sıfırlama Bağlantısı Gönder' }).click()
  await expect(page.getByRole('status')).toContainText('şifre sıfırlama bağlantısı gönderildi')
})

test('kullanıcılar birbirinin verisini göremez (RLS izolasyonu)', async ({ browser }) => {
  // Kullanıcı A abonelik ekler
  const ctxA = await browser.newContext()
  const pageA = await ctxA.newPage()
  const emailA = uniqueEmail('rls-a')
  await signUp(pageA, 'Kullanıcı A', emailA)
  await pageA.goto('/app/abonelikler/yeni')
  await pageA.getByLabel('Abonelik adı *').fill('Gizli Abonelik A')
  await pageA.getByLabel('Tutar *').fill('100')
  await pageA.getByRole('button', { name: 'Abonelik Ekle' }).click()
  await expect(pageA).toHaveURL(/\/app\/abonelikler/)
  await expect(pageA.getByText('Gizli Abonelik A')).toBeVisible()

  // Kullanıcı B listesinde A'nın kaydı yok
  const ctxB = await browser.newContext()
  const pageB = await ctxB.newPage()
  await signUp(pageB, 'Kullanıcı B', uniqueEmail('rls-b'))
  await pageB.goto('/app/abonelikler')
  await expect(pageB.getByText('Henüz abonelik yok')).toBeVisible()
  await expect(pageB.getByText('Gizli Abonelik A')).toHaveCount(0)

  await ctxA.close()
  await ctxB.close()
})

test('şifre yenileme sayfası oturumsuz erişimde girişe yönlendirir', async ({ page }) => {
  await page.goto('/sifre-yenile')
  await expect(page).toHaveURL(/\/giris/)
})

// Şifre en az 8 karakter: istemci doğrulaması değil, sunucu şeması da reddetmeli
test('kısa şifreyle kayıt reddedilir', async ({ page }) => {
  await page.goto('/kayit')
  await page.getByLabel('Ad Soyad').fill('Kısa Şifre')
  await page.getByLabel('E-posta').fill(uniqueEmail('short'))
  const pw = page.getByLabel('Şifre', { exact: true })
  await pw.fill('1234567')
  // minLength istemci engelini aşmak için doğrudan submit tetikle
  await page.evaluate(() => {
    const form = document.querySelector('form')!
    form.noValidate = true
    form.requestSubmit()
  })
  await expect(page.getByText('Şifre en az 8 karakter olmalı')).toBeVisible()
  void PASSWORD
})

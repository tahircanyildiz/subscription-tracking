import { expect, test, type Page } from '@playwright/test'

import { addSubscription, signUp, uniqueEmail } from './helpers'

test.describe('abonelik yaşam döngüsü', () => {
  test.describe.configure({ mode: 'serial' })

  let page: Page

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
    await signUp(page, 'Abonelik Testçisi', uniqueEmail('subs'))
    await addSubscription(page, { name: 'Netflix', amount: '229.99', provider: 'Netflix Inc.' })
    await addSubscription(page, { name: 'Spotify Premium', amount: '59.99' })
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('eklenen abonelikler listede ve dashboardda görünür', async () => {
    await page.goto('/app/abonelikler')
    await expect(page.getByText('Netflix', { exact: true })).toBeVisible()
    await expect(page.getByText('Spotify Premium')).toBeVisible()
    await expect(page.getByText('2 abonelik görüntüleniyor')).toBeVisible()

    await page.goto('/app')
    // Aylık toplam: 229,99 + 59,99 = 289,98 TL
    await expect(page.getByText('Aylık Toplam Gider')).toBeVisible()
    await expect(page.getByText(/289,98/)).toBeVisible()
    // Aktif abonelik sayısı
    await expect(
      page
        .locator('section', { has: page.getByText('Aktif Abonelikler') })
        .getByText('2', { exact: true }),
    ).toBeVisible()
  })

  test('arama yalnızca eşleşen aboneliği gösterir', async () => {
    await page.goto('/app/abonelikler')
    await page.getByLabel('Abonelik ara').fill('Netf')
    await expect(page.getByText('Spotify Premium')).toHaveCount(0)
    await expect(page.getByText('Netflix', { exact: true })).toBeVisible()
    await page.getByLabel('Abonelik ara').fill('')
    await expect(page.getByText('Spotify Premium')).toBeVisible()
  })

  test('durum filtresi çalışır', async () => {
    await page.goto('/app/abonelikler')
    await page.getByLabel('Durum filtresi').selectOption('cancelled')
    await expect(page.getByText('Sonuç bulunamadı')).toBeVisible()
    await page.getByLabel('Durum filtresi').selectOption('active')
    await expect(page.getByText('Netflix', { exact: true })).toBeVisible()
    await page.getByLabel('Durum filtresi').selectOption('')
  })

  test('fiyat değişikliği geçmişe kaydedilir ve yüzdesi gösterilir', async () => {
    await page.goto('/app/abonelikler')
    await page.getByText('Netflix', { exact: true }).click()
    await expect(page).toHaveURL(/\/app\/abonelikler\/[0-9a-f-]+$/)
    await page.getByRole('link', { name: 'Düzenle' }).click()

    const amount = page.getByLabel('Tutar *')
    await amount.fill('287.49') // +%25
    await expect(page.getByText('Tutar değişikliği fiyat geçmişine kaydedilecek.')).toBeVisible()
    await page.getByLabel('Değişiklik notu (isteğe bağlı)').fill('Yıllık zam')
    await page.getByRole('button', { name: 'Değişiklikleri Kaydet' }).click()

    await expect(page).toHaveURL(/\/app\/abonelikler\/[0-9a-f-]+\?mesaj=guncellendi|\/app\/abonelikler\/[0-9a-f-]+$/)
    await expect(page.getByRole('heading', { name: 'Netflix' })).toBeVisible()
    // Fiyat geçmişi: eski fiyat, yeni fiyat, +%25 ve not
    const history = page.locator('section', { has: page.getByText('Fiyat geçmişi') })
    await expect(history.getByText(/229,99/)).toBeVisible()
    await expect(history.getByText(/287,49/)).toBeVisible()
    await expect(history.getByText('+25%')).toBeVisible()
    await expect(history.getByText(/Yıllık zam/)).toBeVisible()
  })

  test('takvim bu ayın ödemelerini gösterir', async () => {
    await page.goto('/app/takvim')
    // Bugün başlayan abonelikler bu ayın takviminde görünür
    const monthList = page.locator('section', { has: page.getByText('Bu aydaki ödemeler') })
    await expect(monthList.getByText('Netflix', { exact: true }).first()).toBeVisible()
    await expect(monthList.getByText('Spotify Premium').first()).toBeVisible()
    // Ay toplamı TRY satırı
    await expect(page.getByText('Ay toplamı')).toBeVisible()
  })

  test('fiyat değişikliği analiz sayfasında listelenir', async () => {
    await page.goto('/app/analizler')
    const changes = page.locator('section', { has: page.getByText('Fiyat değişiklikleri') })
    await expect(changes.getByText('Netflix', { exact: true })).toBeVisible()
    await expect(changes.getByText('+25%')).toBeVisible()
  })

  test('abonelik iptal edilir ve toplamlardan düşer', async () => {
    await page.goto('/app/abonelikler')
    await page.getByText('Spotify Premium').click()
    await page.getByRole('button', { name: 'İptal et' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'İptal Et' }).click()
    await expect(
      page.getByRole('status').filter({ hasText: 'Abonelik iptal edildi' }),
    ).toBeVisible()
    await expect(page.getByText('İptal edildi', { exact: true })).toBeVisible()

    // Dashboard toplamı artık yalnızca Netflix (287,49)
    await page.goto('/app')
    await expect(page.getByText(/287,49/).first()).toBeVisible()
  })

  test('abonelik kalıcı olarak silinir', async () => {
    await page.goto('/app/abonelikler')
    await page.getByText('Spotify Premium').click()
    await page.getByRole('button', { name: 'Sil' }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Kalıcı Olarak Sil' })
      .click()
    await expect(page).toHaveURL(/\/app\/abonelikler$/)
    await expect(page.getByText('Spotify Premium')).toHaveCount(0)
  })

  test('bildirimler sayfası fiyat değişikliği bildirimini gösterir', async () => {
    await page.goto('/app/bildirimler')
    await expect(page.getByText('Netflix fiyatı arttı')).toBeVisible()
    // Okundu işaretle
    await page.getByRole('button', { name: 'Tümünü okundu işaretle' }).click()
    await expect(page.getByText('Tüm bildirimler okundu', { exact: true })).toBeVisible()
  })

  test('kategori eklenip abonelikte kullanılabilir', async () => {
    await page.goto('/app/kategoriler')
    await page.getByLabel('Kategori adı').fill('E2E Test Kategorisi')
    await page.getByRole('button', { name: 'Kategori Ekle' }).click()
    await expect(page.getByText('E2E Test Kategorisi')).toBeVisible()

    await page.goto('/app/abonelikler/yeni')
    await expect(
      page.getByLabel('Kategori').locator('option', { hasText: 'E2E Test Kategorisi' }),
    ).toHaveCount(1)
  })
})

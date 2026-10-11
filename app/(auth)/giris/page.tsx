import type { Metadata } from 'next'
import { Suspense } from 'react'

import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = { title: 'Giriş Yap — Abonelik Dedektifi' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; hata?: string }>
}) {
  const params = await searchParams
  return (
    <Suspense>
      <LoginForm
        next={params.next}
        initialError={
          params.hata === 'baglanti-gecersiz'
            ? 'Bağlantı geçersiz veya süresi dolmuş. Lütfen tekrar deneyin.'
            : undefined
        }
      />
    </Suspense>
  )
}

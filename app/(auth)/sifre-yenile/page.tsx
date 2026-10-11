import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { UpdatePasswordForm } from '@/components/auth/update-password-form'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Yeni Şifre — Abonelik Dedektifi' }

// Şifre sıfırlama bağlantısından gelinir; geçerli bir recovery oturumu gerekir.
export default async function UpdatePasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/giris?hata=baglanti-gecersiz')

  return <UpdatePasswordForm />
}

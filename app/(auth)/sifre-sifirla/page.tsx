import type { Metadata } from 'next'

import { ResetRequestForm } from '@/components/auth/reset-request-form'

export const metadata: Metadata = { title: 'Şifre Sıfırla — Abonelik Dedektifi' }

export default function ResetPasswordPage() {
  return <ResetRequestForm />
}

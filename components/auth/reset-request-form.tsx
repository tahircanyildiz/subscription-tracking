'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { resetPasswordAction, type ActionState } from '@/app/actions/auth'
import { SubmitButton } from '@/components/auth/submit-button'
import { FieldError, FormMessage, Input, Label } from '@/components/ui/field'

export function ResetRequestForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(resetPasswordAction, {})

  return (
    <div>
      <h1 className="text-[18px] font-semibold tracking-[-0.02em] text-[#102a43]">
        Şifrenizi mi unuttunuz?
      </h1>
      <p className="mt-1 text-[12px] text-[#718096]">
        E-posta adresinizi girin, size sıfırlama bağlantısı gönderelim.
      </p>
      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <FormMessage error={state.error} success={state.success} />
        <div>
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="ornek@eposta.com"
            className="mt-1.5"
            required
          />
          <FieldError message={state.fieldErrors?.email} />
        </div>
        <SubmitButton>Sıfırlama Bağlantısı Gönder</SubmitButton>
      </form>
      <p className="mt-5 text-center text-[12px] text-[#718096]">
        <Link href="/giris" className="font-semibold text-[#0e7c66] hover:underline">
          Girişe geri dön
        </Link>
      </p>
    </div>
  )
}

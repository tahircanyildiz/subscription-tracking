'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { signUpAction, type ActionState } from '@/app/actions/auth'
import { SubmitButton } from '@/components/auth/submit-button'
import { FieldError, FormMessage, Input, Label } from '@/components/ui/field'

export function RegisterForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(signUpAction, {})

  return (
    <div>
      <h1 className="text-[18px] font-semibold tracking-[-0.02em] text-[#102a43]">
        Hesap oluşturun
      </h1>
      <p className="mt-1 text-[12px] text-[#718096]">
        Tüm aboneliklerinizi tek yerden yönetmeye başlayın.
      </p>
      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <FormMessage error={state.error} success={state.success} />
        <div>
          <Label htmlFor="full_name">Ad Soyad</Label>
          <Input
            id="full_name"
            name="full_name"
            autoComplete="name"
            placeholder="Adınız Soyadınız"
            className="mt-1.5"
            required
          />
          <FieldError message={state.fieldErrors?.full_name} />
        </div>
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
        <div>
          <Label htmlFor="password">Şifre</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="En az 8 karakter"
            className="mt-1.5"
            required
            minLength={8}
          />
          <FieldError message={state.fieldErrors?.password} />
        </div>
        <SubmitButton>Kayıt Ol</SubmitButton>
      </form>
      <p className="mt-5 text-center text-[12px] text-[#718096]">
        Zaten hesabınız var mı?{' '}
        <Link href="/giris" className="font-semibold text-[#0e7c66] hover:underline">
          Giriş yapın
        </Link>
      </p>
    </div>
  )
}

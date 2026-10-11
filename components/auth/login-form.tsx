'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { signInAction, type ActionState } from '@/app/actions/auth'
import { SubmitButton } from '@/components/auth/submit-button'
import { FieldError, FormMessage, Input, Label } from '@/components/ui/field'

export function LoginForm({
  next,
  initialError,
}: {
  next?: string
  initialError?: string
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(signInAction, {})

  return (
    <div>
      <h1 className="text-[18px] font-semibold tracking-[-0.02em] text-[#102a43]">
        Tekrar hoş geldiniz
      </h1>
      <p className="mt-1 text-[12px] text-[#718096]">
        Aboneliklerinizi takip etmek için giriş yapın.
      </p>
      <form action={formAction} className="mt-6 space-y-4" noValidate>
        {next && <input type="hidden" name="next" value={next} />}
        <FormMessage error={state.error ?? initialError} />
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Şifre</Label>
            <Link
              href="/sifre-sifirla"
              className="text-[11px] font-medium text-[#0e7c66] hover:underline"
            >
              Şifremi unuttum
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="mt-1.5"
            required
          />
          <FieldError message={state.fieldErrors?.password} />
        </div>
        <SubmitButton>Giriş Yap</SubmitButton>
      </form>
      <p className="mt-5 text-center text-[12px] text-[#718096]">
        Hesabınız yok mu?{' '}
        <Link href="/kayit" className="font-semibold text-[#0e7c66] hover:underline">
          Kayıt olun
        </Link>
      </p>
    </div>
  )
}

'use client'

import { useActionState } from 'react'

import { updatePasswordAction, type ActionState } from '@/app/actions/auth'
import { SubmitButton } from '@/components/auth/submit-button'
import { FieldError, FormMessage, Input, Label } from '@/components/ui/field'

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(updatePasswordAction, {})

  return (
    <div>
      <h1 className="text-[18px] font-semibold tracking-[-0.02em] text-[#102a43]">
        Yeni şifre belirleyin
      </h1>
      <p className="mt-1 text-[12px] text-[#718096]">
        Hesabınız için yeni bir şifre oluşturun.
      </p>
      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <FormMessage error={state.error} />
        <div>
          <Label htmlFor="password">Yeni şifre</Label>
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
        <div>
          <Label htmlFor="password_confirm">Yeni şifre (tekrar)</Label>
          <Input
            id="password_confirm"
            name="password_confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="mt-1.5"
            required
          />
          <FieldError message={state.fieldErrors?.password_confirm} />
        </div>
        <SubmitButton>Şifreyi Güncelle</SubmitButton>
      </form>
    </div>
  )
}

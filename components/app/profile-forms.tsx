'use client'

import { TriangleAlert } from 'lucide-react'
import { useActionState } from 'react'

import {
  deleteAccountAction,
  updatePasswordAction,
  updateProfileAction,
  type ActionState,
} from '@/app/actions/auth'
import { SubmitButton } from '@/components/auth/submit-button'
import { Card } from '@/components/ui/card'
import {
  Checkbox,
  FieldError,
  FormMessage,
  Input,
  Label,
  Select,
} from '@/components/ui/field'
import { CURRENCIES } from '@/lib/schemas'
import type { Profile } from '@/lib/supabase/types'

export function ProfileSettingsForm({
  profile,
  email,
}: {
  profile: Profile
  email: string
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateProfileAction, {})

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-[14px] font-semibold">Profil bilgileri</h2>
      <form action={formAction} className="mt-4 space-y-4" noValidate>
        <FormMessage error={state.error} success={state.success} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="full_name">Ad Soyad</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={profile.full_name ?? ''}
              className="mt-1.5"
              required
            />
            <FieldError message={state.fieldErrors?.full_name} />
          </div>
          <div>
            <Label htmlFor="profile-email">E-posta</Label>
            <Input id="profile-email" value={email} disabled className="mt-1.5" />
            <p className="mt-1 text-[11px] text-[#94a3b8]">E-posta adresi değiştirilemez.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="default_currency">Varsayılan para birimi</Label>
            <Select
              id="default_currency"
              name="default_currency"
              defaultValue={profile.default_currency}
              className="mt-1.5"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <FieldError message={state.fieldErrors?.default_currency} />
            <p className="mt-1 text-[11px] text-[#94a3b8]">
              Dashboard özetleri bu para birimine göre gösterilir.
            </p>
          </div>
          <div className="flex items-end pb-6">
            <label className="flex items-center gap-2 text-[12px] font-medium text-[#4a5568]">
              <Checkbox
                name="email_notifications"
                defaultChecked={profile.email_notifications}
              />
              E-posta bildirimleri almak istiyorum
            </label>
          </div>
        </div>
        <SubmitButton className="w-auto px-5">Kaydet</SubmitButton>
      </form>
    </Card>
  )
}

export function PasswordForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(updatePasswordAction, {})

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-[14px] font-semibold">Şifre değiştir</h2>
      <form action={formAction} className="mt-4 space-y-4" noValidate>
        <FormMessage error={state.error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="new-password">Yeni şifre</Label>
            <Input
              id="new-password"
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
            <Label htmlFor="new-password-confirm">Yeni şifre (tekrar)</Label>
            <Input
              id="new-password-confirm"
              name="password_confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className="mt-1.5"
              required
            />
            <FieldError message={state.fieldErrors?.password_confirm} />
          </div>
        </div>
        <SubmitButton className="w-auto px-5">Şifreyi Güncelle</SubmitButton>
      </form>
    </Card>
  )
}

export function DangerZone() {
  const [state, formAction] = useActionState<ActionState, FormData>(deleteAccountAction, {})

  return (
    <Card className="border-[#fecaca] p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <TriangleAlert size={15} className="text-[#dc2626]" />
        <h2 className="text-[14px] font-semibold text-[#dc2626]">Tehlikeli bölge</h2>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-[#718096]">
        Hesabınızı sildiğinizde tüm abonelikleriniz, kategorileriniz, fiyat geçmişiniz ve
        bildirimleriniz kalıcı olarak silinir. Bu işlem geri alınamaz.
      </p>
      <form action={formAction} className="mt-4 space-y-4" noValidate>
        <FormMessage error={state.error} />
        <div className="sm:max-w-xs">
          <Label htmlFor="confirm_text">
            Onaylamak için <strong className="text-[#dc2626]">HESABIMI SİL</strong> yazın
          </Label>
          <Input
            id="confirm_text"
            name="confirm_text"
            placeholder="HESABIMI SİL"
            className="mt-1.5"
            autoComplete="off"
            required
          />
        </div>
        <button
          type="submit"
          className="flex h-10 items-center rounded-lg bg-[#dc2626] px-4 text-[13px] font-semibold text-white transition hover:bg-[#b91c1c]"
        >
          Hesabımı Kalıcı Olarak Sil
        </button>
      </form>
    </Card>
  )
}

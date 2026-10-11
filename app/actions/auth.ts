'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import {
  fieldErrors,
  profileSchema,
  resetRequestSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from '@/lib/schemas'
import { createClient } from '@/lib/supabase/server'

export interface ActionState {
  error?: string
  fieldErrors?: Record<string, string>
  success?: string
}

async function siteOrigin(): Promise<string> {
  const h = await headers()
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    h.get('origin') ??
    `http://${h.get('host') ?? 'localhost:3000'}`
  )
}

function translateAuthError(message: string): string {
  const map: [RegExp, string][] = [
    [/invalid login credentials/i, 'E-posta veya şifre hatalı.'],
    [/email not confirmed/i, 'E-posta adresiniz henüz doğrulanmamış. Gelen kutunuzu kontrol edin.'],
    [/user already registered/i, 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin.'],
    [/password should be at least/i, 'Şifre en az 8 karakter olmalı.'],
    [/rate limit|too many requests/i, 'Çok fazla deneme yapıldı. Lütfen biraz bekleyip tekrar deneyin.'],
    [/same password|different from the old/i, 'Yeni şifre eski şifrenizle aynı olamaz.'],
    [/fetch failed|network/i, 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edin.'],
  ]
  for (const [re, tr] of map) if (re.test(message)) return tr
  return 'İşlem başarısız oldu. Lütfen tekrar deneyin.'
}

export async function signUpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  const supabase = await createClient()
  const origin = await siteOrigin()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: `${origin}/auth/callback?next=/app`,
    },
  })
  if (error) return { error: translateAuthError(error.message) }

  // E-posta doğrulaması kapalıysa oturum hemen açılır
  if (data.session) redirect('/app')

  // Supabase, kayıtlı e-posta için identities boş döner (bilgi sızdırmamak için)
  if (data.user && data.user.identities?.length === 0) {
    return { error: 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin.' }
  }
  return {
    success:
      'Doğrulama bağlantısı e-posta adresinize gönderildi. Gelen kutunuzu kontrol edin.',
  }
}

export async function signInAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: translateAuthError(error.message) }

  const nextRaw = formData.get('next')
  // Açık yönlendirme saldırılarını önle: yalnızca site içi yollar
  const next =
    typeof nextRaw === 'string' && nextRaw.startsWith('/') && !nextRaw.startsWith('//')
      ? nextRaw
      : '/app'
  redirect(next)
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/giris')
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  const supabase = await createClient()
  const origin = await siteOrigin()
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm?next=/sifre-yenile`,
  })
  // Hesabın varlığını sızdırmamak için her durumda aynı mesaj
  return {
    success:
      'Bu e-posta ile kayıtlı bir hesap varsa, şifre sıfırlama bağlantısı gönderildi.',
  }
}

export async function updatePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get('password'),
    password_confirm: formData.get('password_confirm'),
  })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { error: translateAuthError(error.message) }
  redirect('/app?mesaj=sifre-guncellendi')
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = profileSchema.safeParse({
    full_name: formData.get('full_name'),
    default_currency: formData.get('default_currency'),
    email_notifications: formData.get('email_notifications') === 'on',
  })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      default_currency: parsed.data.default_currency,
      email_notifications: parsed.data.email_notifications,
    })
    .eq('id', user.id)
  if (error) return { error: 'Profil güncellenemedi. Lütfen tekrar deneyin.' }

  // Auth metadata'daki adı da senkron tut
  await supabase.auth.updateUser({ data: { full_name: parsed.data.full_name } })

  revalidatePath('/app', 'layout')
  return { success: 'Profiliniz güncellendi.' }
}

export async function deleteAccountAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (formData.get('confirm_text') !== 'HESABIMI SİL') {
    return { error: 'Onay metnini tam olarak "HESABIMI SİL" şeklinde yazın.' }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı.' }

  const { error } = await supabase.rpc('delete_own_account')
  if (error) {
    return { error: 'Hesap silinemedi. Lütfen tekrar deneyin veya destek ile iletişime geçin.' }
  }
  await supabase.auth.signOut()
  redirect('/?mesaj=hesap-silindi')
}

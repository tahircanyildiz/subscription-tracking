import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import {
  DangerZone,
  PasswordForm,
  ProfileSettingsForm,
} from '@/components/app/profile-forms'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Profil ve Ayarlar — Abonelik Dedektifi' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile) redirect('/giris')

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[22px] font-semibold tracking-[-0.04em] text-[#102a43]">
        Profil ve Ayarlar
      </h1>
      <p className="mt-1 text-[13px] text-[#718096]">
        Hesap bilgilerinizi ve tercihlerinizi yönetin.
      </p>
      <div className="mt-6 space-y-4">
        <ProfileSettingsForm profile={profile} email={user.email ?? ''} />
        <PasswordForm />
        <DangerZone />
      </div>
    </div>
  )
}

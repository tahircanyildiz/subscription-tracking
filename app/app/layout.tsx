import { redirect } from 'next/navigation'

import { AppShell } from '@/components/app/shell'
import { ToastProvider } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const [{ data: profile }, { count: unreadCount }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null),
  ])

  const fullName =
    profile?.full_name ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email ||
    ''

  return (
    <ToastProvider>
      <AppShell fullName={fullName} unreadCount={unreadCount ?? 0}>
        {children}
      </AppShell>
    </ToastProvider>
  )
}

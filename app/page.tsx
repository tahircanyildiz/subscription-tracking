import { redirect } from 'next/navigation'

import Dashboard from '@/components/dashboard'
import { hasSupabaseEnv } from '@/lib/supabase/middleware'
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  // Girişli kullanıcı doğrudan uygulamaya gider; ana sayfa tanıtım önizlemesidir.
  if (hasSupabaseEnv()) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) redirect('/app')
  }
  return <Dashboard />
}

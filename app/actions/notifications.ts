'use server'

import { revalidatePath } from 'next/cache'

import type { ActionState } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/server'

const GENERIC_ERROR = 'İşlem başarısız oldu. Lütfen tekrar deneyin.'

export async function markNotificationRead(id: string): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı.' }

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .is('read_at', null)
  if (error) return { error: GENERIC_ERROR }
  revalidatePath('/app', 'layout')
  return {}
}

export async function markAllNotificationsRead(): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı.' }

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)
  if (error) return { error: GENERIC_ERROR }
  revalidatePath('/app', 'layout')
  return { success: 'Tüm bildirimler okundu olarak işaretlendi.' }
}

export async function deleteNotification(id: string): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı.' }

  const { error } = await supabase.from('notifications').delete().eq('id', id)
  if (error) return { error: GENERIC_ERROR }
  revalidatePath('/app', 'layout')
  return {}
}

'use server'

import { revalidatePath } from 'next/cache'

import type { ActionState } from '@/app/actions/auth'
import { categorySchema, fieldErrors } from '@/lib/schemas'
import { createClient } from '@/lib/supabase/server'

const GENERIC_ERROR = 'İşlem başarısız oldu. Lütfen tekrar deneyin.'

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı.' }

  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    color: formData.get('color') || undefined,
  })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  const { error } = await supabase.from('categories').insert({
    user_id: user.id,
    name: parsed.data.name,
    color: parsed.data.color,
  })
  if (error) {
    if (error.code === '23505') {
      return { fieldErrors: { name: 'Bu adla bir kategori zaten var.' } }
    }
    return { error: GENERIC_ERROR }
  }
  revalidatePath('/app', 'layout')
  return { success: 'Kategori eklendi.' }
}

export async function updateCategoryAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı.' }

  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    color: formData.get('color') || undefined,
  })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  const { error } = await supabase
    .from('categories')
    .update({ name: parsed.data.name, color: parsed.data.color })
    .eq('id', id)
  if (error) {
    if (error.code === '23505') {
      return { fieldErrors: { name: 'Bu adla bir kategori zaten var.' } }
    }
    return { error: GENERIC_ERROR }
  }
  revalidatePath('/app', 'layout')
  return { success: 'Kategori güncellendi.' }
}

export async function deleteCategory(id: string): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı.' }

  // Bağlı abonelikler FK (on delete set null) ile kategorisiz kalır
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return { error: GENERIC_ERROR }
  revalidatePath('/app', 'layout')
  return { success: 'Kategori silindi.' }
}

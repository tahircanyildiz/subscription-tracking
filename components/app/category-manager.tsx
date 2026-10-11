'use client'

import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useActionState, useEffect, useRef, useState, useTransition } from 'react'

import type { ActionState } from '@/app/actions/auth'
import {
  createCategoryAction,
  deleteCategory,
  updateCategoryAction,
} from '@/app/actions/categories'
import { CategoryIcon } from '@/components/app/category-icon'
import { SubmitButton } from '@/components/auth/submit-button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FieldError, FormMessage, Input, Label } from '@/components/ui/field'
import { useToast } from '@/components/ui/toast'
import type { CategoryWithCount } from '@/lib/data'

const DEFAULT_COLOR = '#0e7c66'

function EditRow({
  category,
  onDone,
}: {
  category: CategoryWithCount
  onDone: () => void
}) {
  const action = updateCategoryAction.bind(null, category.id)
  const [state, formAction] = useActionState<ActionState, FormData>(action, {})
  const doneRef = useRef(onDone)

  useEffect(() => {
    doneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    if (state.success) doneRef.current()
  }, [state.success])

  return (
    <form action={formAction} className="flex flex-1 flex-wrap items-center gap-2">
      <input
        type="color"
        name="color"
        defaultValue={category.color ?? DEFAULT_COLOR}
        aria-label="Kategori rengi"
        className="size-9 cursor-pointer rounded-lg border border-[#dbe4e1] bg-white p-1"
      />
      <div className="min-w-[160px] flex-1">
        <Input name="name" defaultValue={category.name} aria-label="Kategori adı" />
        <FieldError message={state.fieldErrors?.name} />
      </div>
      <button
        type="submit"
        aria-label="Kaydet"
        className="flex size-9 items-center justify-center rounded-lg bg-[#0e7c66] text-white transition hover:bg-[#096b57]"
      >
        <Check size={15} />
      </button>
      <button
        type="button"
        onClick={onDone}
        aria-label="Vazgeç"
        className="flex size-9 items-center justify-center rounded-lg border border-[#e6ecea] text-[#718096] transition hover:bg-[#f5f8f7]"
      >
        <X size={15} />
      </button>
      {state.error && <FormMessage error={state.error} />}
    </form>
  )
}

export function CategoryManager({ categories }: { categories: CategoryWithCount[] }) {
  const { toast } = useToast()
  const [createState, createAction] = useActionState<ActionState, FormData>(
    createCategoryAction,
    {},
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<CategoryWithCount | null>(null)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (createState.success) formRef.current?.reset()
  }, [createState.success])

  const handleDelete = () => {
    if (!deleting) return
    startTransition(async () => {
      const result = await deleteCategory(deleting.id)
      if (result.error) toast(result.error, 'error')
      else toast(result.success ?? 'Kategori silindi.')
      setDeleting(null)
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <ul className="divide-y divide-[#edf1f0]">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              {editingId === c.id ? (
                <EditRow category={c} onDone={() => setEditingId(null)} />
              ) : (
                <>
                  <CategoryIcon icon={c.icon} color={c.color} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[#102a43]">
                      {c.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#94a3b8]">
                      {c.subscription_count > 0
                        ? `${c.subscription_count} abonelik`
                        : 'Abonelik yok'}
                      {c.is_default ? ' · Varsayılan' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingId(c.id)}
                    aria-label={`${c.name} kategorisini düzenle`}
                    className="flex size-8 items-center justify-center rounded-lg text-[#718096] transition hover:bg-[#f5f8f7]"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleting(c)}
                    aria-label={`${c.name} kategorisini sil`}
                    className="flex size-8 items-center justify-center rounded-lg text-[#dc2626] transition hover:bg-[#fef2f2]"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="h-fit p-5">
        <div className="flex items-center gap-2">
          <Plus size={15} className="text-[#0e7c66]" />
          <h2 className="text-[14px] font-semibold">Yeni kategori</h2>
        </div>
        <form ref={formRef} action={createAction} className="mt-4 space-y-4" noValidate>
          <FormMessage error={createState.error} success={createState.success} />
          <div>
            <Label htmlFor="new-cat-name">Kategori adı</Label>
            <Input
              id="new-cat-name"
              name="name"
              placeholder="Örn. Eğitim"
              className="mt-1.5"
              required
            />
            <FieldError message={createState.fieldErrors?.name} />
          </div>
          <div>
            <Label htmlFor="new-cat-color">Renk</Label>
            <input
              id="new-cat-color"
              type="color"
              name="color"
              defaultValue={DEFAULT_COLOR}
              className="mt-1.5 h-10 w-full cursor-pointer rounded-lg border border-[#dbe4e1] bg-white p-1"
            />
            <FieldError message={createState.fieldErrors?.color} />
          </div>
          <SubmitButton>Kategori Ekle</SubmitButton>
        </form>
      </Card>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Kategoriyi sil"
        description={
          deleting
            ? `"${deleting.name}" kategorisi silinecek.${
                deleting.subscription_count > 0
                  ? ` Bu kategorideki ${deleting.subscription_count} abonelik "Kategorisiz" olarak kalır, silinmez.`
                  : ''
              }`
            : ''
        }
        confirmLabel="Sil"
        destructive
        pending={pending}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

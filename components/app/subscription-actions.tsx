'use client'

import {
  Archive,
  ArchiveRestore,
  Ban,
  Pause,
  Pencil,
  Play,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import type { ActionState } from '@/app/actions/auth'
import {
  archiveSubscription,
  cancelSubscription,
  deleteSubscription,
  pauseSubscription,
  resumeSubscription,
  unarchiveSubscription,
} from '@/app/actions/subscriptions'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import type { Subscription } from '@/lib/supabase/types'

type Confirm = 'cancel' | 'delete' | null

const btn =
  'flex h-9 items-center gap-1.5 rounded-lg border border-[#e6ecea] px-3 text-[12px] font-semibold text-[#4a5568] transition hover:bg-[#f5f8f7]'

export function SubscriptionActions({ subscription }: { subscription: Subscription }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState<Confirm>(null)

  const run = (fn: () => Promise<ActionState>, after?: () => void) => {
    startTransition(async () => {
      const result = await fn()
      if (result.error) toast(result.error, 'error')
      else {
        if (result.success) toast(result.success)
        after?.()
      }
      setConfirm(null)
    })
  }

  const s = subscription

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/app/abonelikler/${s.id}/duzenle`} className={btn}>
        <Pencil size={13} /> Düzenle
      </Link>

      {(s.status === 'active' || s.status === 'trial') && (
        <button
          className={btn}
          disabled={pending}
          onClick={() => run(() => pauseSubscription(s.id))}
        >
          <Pause size={13} /> Duraklat
        </button>
      )}

      {(s.status === 'paused' || s.status === 'cancelled' || s.status === 'expired') && (
        <button
          className={btn}
          disabled={pending}
          onClick={() => run(() => resumeSubscription(s.id))}
        >
          <Play size={13} /> Etkinleştir
        </button>
      )}

      {s.status !== 'cancelled' && s.status !== 'expired' && (
        <button
          className={`${btn} text-[#d97706]`}
          disabled={pending}
          onClick={() => setConfirm('cancel')}
        >
          <Ban size={13} /> İptal et
        </button>
      )}

      {s.archived_at ? (
        <button
          className={btn}
          disabled={pending}
          onClick={() => run(() => unarchiveSubscription(s.id))}
        >
          <ArchiveRestore size={13} /> Arşivden çıkar
        </button>
      ) : (
        <button
          className={btn}
          disabled={pending}
          onClick={() => run(() => archiveSubscription(s.id))}
        >
          <Archive size={13} /> Arşivle
        </button>
      )}

      <button
        className={`${btn} border-[#fecaca] text-[#dc2626] hover:bg-[#fef2f2]`}
        disabled={pending}
        onClick={() => setConfirm('delete')}
      >
        <Trash2 size={13} /> Sil
      </button>

      <ConfirmDialog
        open={confirm === 'cancel'}
        title="Aboneliği iptal et"
        description={`"${s.name}" aboneliği iptal edildi olarak işaretlenecek ve toplam giderlerden çıkarılacak. Kayıt ve geçmişi silinmez.`}
        confirmLabel="İptal Et"
        destructive
        pending={pending}
        onConfirm={() => run(() => cancelSubscription(s.id))}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title="Aboneliği kalıcı olarak sil"
        description={`"${s.name}" aboneliği, fiyat geçmişi ve bildirimleriyle birlikte kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Kalıcı Olarak Sil"
        destructive
        pending={pending}
        onConfirm={() =>
          run(
            () => deleteSubscription(s.id),
            () => router.push('/app/abonelikler'),
          )
        }
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}

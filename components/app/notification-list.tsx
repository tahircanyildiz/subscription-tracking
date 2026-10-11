'use client'

import {
  AlarmClock,
  Bell,
  CheckCheck,
  Info,
  TrendingUp,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useTransition } from 'react'

import {
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/app/actions/notifications'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { formatDateTime } from '@/lib/format'
import type { Notification, NotificationType } from '@/lib/supabase/types'

const TYPE_META: Record<NotificationType, { icon: LucideIcon; classes: string; label: string }> = {
  payment_due: { icon: AlarmClock, classes: 'bg-[#fff7e8] text-[#c27808]', label: 'Ödeme' },
  trial_ending: { icon: AlarmClock, classes: 'bg-[#eff6ff] text-[#2563eb]', label: 'Deneme' },
  price_change: { icon: TrendingUp, classes: 'bg-[#fef2f2] text-[#dc2626]', label: 'Fiyat' },
  system: { icon: Info, classes: 'bg-[#f1f5f9] text-[#64748b]', label: 'Sistem' },
}

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  const unread = notifications.filter((n) => !n.read_at).length

  const run = (fn: () => Promise<{ error?: string; success?: string }>) => {
    startTransition(async () => {
      const result = await fn()
      if (result.error) toast(result.error, 'error')
      else if (result.success) toast(result.success)
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[#718096]">
          {unread > 0 ? `${unread} okunmamış bildirim` : 'Tüm bildirimler okundu'}
        </p>
        {unread > 0 && (
          <button
            onClick={() => run(markAllNotificationsRead)}
            disabled={pending}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0e7c66] hover:underline disabled:opacity-60"
          >
            <CheckCheck size={14} /> Tümünü okundu işaretle
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-[#c9ded7] bg-[#f4fbf8] px-6 py-14 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-[#dff2ec] text-[#0e7c66]">
            <Bell size={20} />
          </div>
          <h3 className="mt-4 text-[14px] font-semibold text-[#102a43]">Bildirim yok</h3>
          <p className="mt-1.5 max-w-sm text-[12px] leading-relaxed text-[#718096]">
            Yaklaşan ödemeleriniz ve fiyat değişiklikleri burada görünecek.
          </p>
        </div>
      ) : (
        <Card className="mt-4">
          <ul className="divide-y divide-[#edf1f0]">
            {notifications.map((n) => {
              const meta = TYPE_META[n.type]
              const Icon = meta.icon
              return (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3.5 sm:px-5 ${
                    n.read_at ? 'opacity-70' : ''
                  }`}
                >
                  <div
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${meta.classes}`}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!n.read_at && (
                        <span className="size-1.5 shrink-0 rounded-full bg-[#0e9871]" />
                      )}
                      <p className="truncate text-[13px] font-semibold text-[#102a43]">
                        {n.title}
                      </p>
                    </div>
                    {n.body && (
                      <p className="mt-0.5 text-[12px] leading-relaxed text-[#718096]">
                        {n.body}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-[#94a3b8]">
                      {formatDateTime(n.created_at)}
                      {n.subscription_id && (
                        <>
                          {' · '}
                          <Link
                            href={`/app/abonelikler/${n.subscription_id}`}
                            className="font-medium text-[#0e7c66] hover:underline"
                          >
                            Aboneliğe git
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!n.read_at && (
                      <button
                        onClick={() => run(() => markNotificationRead(n.id))}
                        disabled={pending}
                        aria-label="Okundu işaretle"
                        title="Okundu işaretle"
                        className="flex size-8 items-center justify-center rounded-lg text-[#718096] transition hover:bg-[#f5f8f7]"
                      >
                        <CheckCheck size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => run(() => deleteNotification(n.id))}
                      disabled={pending}
                      aria-label="Bildirimi sil"
                      title="Sil"
                      className="flex size-8 items-center justify-center rounded-lg text-[#94a3b8] transition hover:bg-[#fef2f2] hover:text-[#dc2626]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}

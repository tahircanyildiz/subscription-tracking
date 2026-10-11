import type { Metadata } from 'next'

import { NotificationList } from '@/components/app/notification-list'
import { getNotifications } from '@/lib/data'

export const metadata: Metadata = { title: 'Bildirimler — Abonelik Dedektifi' }

export default async function NotificationsPage() {
  const notifications = await getNotifications()
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[22px] font-semibold tracking-[-0.04em] text-[#102a43]">
        Bildirimler
      </h1>
      <p className="mt-1 text-[13px] text-[#718096]">
        Ödeme hatırlatmaları ve fiyat değişikliği bildirimleri.
      </p>
      <div className="mt-6">
        <NotificationList notifications={notifications} />
      </div>
    </div>
  )
}

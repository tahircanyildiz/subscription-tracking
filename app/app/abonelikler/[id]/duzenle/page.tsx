import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { updateSubscriptionAction } from '@/app/actions/subscriptions'
import { SubscriptionForm } from '@/components/app/subscription-form'
import { Card } from '@/components/ui/card'
import { getCategories, getSubscription } from '@/lib/data'

export const metadata: Metadata = { title: 'Aboneliği Düzenle — Abonelik Dedektifi' }

export default async function EditSubscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [subscription, categories] = await Promise.all([
    getSubscription(id),
    getCategories(),
  ])
  if (!subscription) notFound()

  const action = updateSubscriptionAction.bind(null, subscription.id)

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-[22px] font-semibold tracking-[-0.04em] text-[#102a43]">
        {subscription.name} — Düzenle
      </h1>
      <p className="mt-1 text-[13px] text-[#718096]">
        Tutarı değiştirirseniz eski fiyat, fiyat geçmişine kaydedilir.
      </p>
      <Card className="mt-6 p-5 sm:p-7">
        <SubscriptionForm
          categories={categories}
          subscription={subscription}
          action={action}
          cancelHref={`/app/abonelikler/${subscription.id}`}
        />
      </Card>
    </div>
  )
}

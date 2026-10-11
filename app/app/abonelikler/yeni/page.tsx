import type { Metadata } from 'next'

import { createSubscriptionAction } from '@/app/actions/subscriptions'
import { SubscriptionForm } from '@/components/app/subscription-form'
import { Card } from '@/components/ui/card'
import { getCategories } from '@/lib/data'

export const metadata: Metadata = { title: 'Abonelik Ekle — Abonelik Dedektifi' }

export default async function NewSubscriptionPage() {
  const categories = await getCategories()
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-[22px] font-semibold tracking-[-0.04em] text-[#102a43]">
        Yeni abonelik
      </h1>
      <p className="mt-1 text-[13px] text-[#718096]">
        Abonelik bilgilerini girin; ödeme tarihlerini sizin için takip edelim.
      </p>
      <Card className="mt-6 p-5 sm:p-7">
        <SubscriptionForm
          categories={categories}
          action={createSubscriptionAction}
          cancelHref="/app/abonelikler"
        />
      </Card>
    </div>
  )
}

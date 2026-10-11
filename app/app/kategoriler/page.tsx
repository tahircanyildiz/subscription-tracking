import type { Metadata } from 'next'

import { CategoryManager } from '@/components/app/category-manager'
import { getCategoriesWithCounts } from '@/lib/data'

export const metadata: Metadata = { title: 'Kategoriler — Abonelik Dedektifi' }

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts()
  return (
    <div>
      <h1 className="text-[22px] font-semibold tracking-[-0.04em] text-[#102a43]">
        Kategoriler
      </h1>
      <p className="mt-1 text-[13px] text-[#718096]">
        Aboneliklerinizi gruplamak için kategorileri düzenleyin.
      </p>
      <div className="mt-6">
        <CategoryManager categories={categories} />
      </div>
    </div>
  )
}

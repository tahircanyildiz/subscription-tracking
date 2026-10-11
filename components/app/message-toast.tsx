'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { useToast } from '@/components/ui/toast'

const MESSAGES: Record<string, string> = {
  eklendi: 'Abonelik eklendi.',
  guncellendi: 'Abonelik güncellendi.',
  'sifre-guncellendi': 'Şifreniz güncellendi.',
}

/** URL'deki ?mesaj= parametresini bir kez toast olarak gösterir ve temizler. */
export function MessageToast() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const shown = useRef(false)

  const mesaj = searchParams.get('mesaj')

  useEffect(() => {
    if (!mesaj || shown.current) return
    const text = MESSAGES[mesaj]
    if (text) {
      shown.current = true
      toast(text)
      const params = new URLSearchParams(searchParams.toString())
      params.delete('mesaj')
      router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false })
    }
  }, [mesaj, pathname, router, searchParams, toast])

  return null
}

import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

// PKCE code akışı (e-posta doğrulama / OAuth dönüşü).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const nextRaw = searchParams.get('next') ?? '/app'
  const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/app'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }
  return NextResponse.redirect(
    new URL('/giris?hata=baglanti-gecersiz', request.url),
  )
}

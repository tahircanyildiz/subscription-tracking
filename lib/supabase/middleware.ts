import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import type { Database } from '@/lib/supabase/types'

// Supabase yapılandırılmadan uygulamanın (örn. pazarlama sayfası) çalışmaya
// devam edebilmesi için env eksikse oturum kontrolü atlanır.
export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  if (!hasSupabaseEnv()) {
    // Korumalı alana env yokken erişim de engellenir.
    if (request.nextUrl.pathname.startsWith('/app')) {
      const url = request.nextUrl.clone()
      url.pathname = '/giris'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // ÖNEMLİ: createServerClient ile getUser arasına kod eklemeyin;
  // oturum token'ının tazelenmesi bu çağrıya bağlıdır.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isProtected = pathname.startsWith('/app')
  const isAuthPage =
    pathname.startsWith('/giris') ||
    pathname.startsWith('/kayit') ||
    pathname.startsWith('/sifre-sifirla')

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/giris'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/app'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

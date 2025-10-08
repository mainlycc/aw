import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Ścieżki publiczne (dostępne bez logowania)
  const publicPaths = ['/login', '/register', '/calendar']
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // Przekieruj niezalogowanych użytkowników na stronę logowania
  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Jeśli użytkownik jest zalogowany, pobierz jego profil i rolę
  if (user) {
    // Pobierz profil użytkownika z rolą
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role

    // Blokuj użytkowników z rolą 'pending' - mogą tylko wylogować się
    if (userRole === 'pending') {
      // Wyloguj użytkownika i przekieruj na stronę logowania z komunikatem
      await supabase.auth.signOut()
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('message', 'pending')
      return NextResponse.redirect(loginUrl)
    }

    // Przekierowania dla zalogowanych użytkowników
    const pathname = request.nextUrl.pathname

    // Przekieruj z /login lub / na odpowiednią stronę w zależności od roli
    if (pathname === '/login' || pathname === '/') {
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      } else if (userRole === 'tutor') {
        return NextResponse.redirect(new URL('/tutor', request.url))
      }
      // Fallback jeśli rola nie jest zdefiniowana
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Ochrona ścieżek - admin nie może wejść na /tutor i odwrotnie
    if (userRole === 'admin' && pathname.startsWith('/tutor')) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    
    if (userRole === 'tutor' && pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/tutor', request.url))
    }

    // Przekieruj z /dashboard na odpowiednią stronę
    if (pathname.startsWith('/dashboard')) {
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      } else if (userRole === 'tutor') {
        return NextResponse.redirect(new URL('/tutor', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}


import { NextResponse } from 'next/server'
import { getSafeInternalPath } from '@/lib/first-visit/navigation'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = getSafeInternalPath(requestUrl.searchParams.get('next'), '/home')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  const loginUrl = new URL('/login', requestUrl.origin)
  loginUrl.searchParams.set('error', 'auth')
  loginUrl.searchParams.set('next', next)
  return NextResponse.redirect(loginUrl)
}

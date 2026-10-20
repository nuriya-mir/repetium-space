'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'
import { getSafeInternalPath } from '@/lib/first-visit/navigation'
import { updateFirstVisitState, useFirstVisitState } from '@/lib/first-visit/state'
import { useT } from '@/lib/i18n'
import styles from './page.module.css'

function LoginForm() {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state } = useFirstVisitState()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(searchParams.get('error') === 'auth' ? t.firstVisit.auth.callbackError : '')
  const next = getSafeInternalPath(searchParams.get('next'), '/home')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(next)
    })
  }, [next, router])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const callback = new URL('/auth/callback', window.location.origin)
    callback.searchParams.set('next', next)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callback.toString(),
      },
    })

    if (authError) {
      setError(t.firstVisit.auth.error)
      setLoading(false)
      return
    }

    if (state?.test.status === 'completed') {
      updateFirstVisitState((current) => ({ ...current, stage: 'auth_pending' }))
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className={styles.card}>
      <div className={styles.logo}>
        <Logo markHeight={52} wordmarkSize={22} layout="stack" />
      </div>

      {state?.test.status === 'completed' ? (
        <p className={styles.savedResult}>{t.firstVisit.auth.savedResult}</p>
      ) : null}

      {sent ? (
        <div className={styles.sentState}>
          <p className={styles.sentTitle}>{t.login.sentTitle}</p>
          <p className={styles.sentDesc}>
            {t.login.sentDesc} <strong>{email}</strong>
          </p>
        </div>
      ) : (
        <>
          <p className={styles.intro}>{t.login.intro}</p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.label} htmlFor="login-email">{t.login.emailLabel}</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t.login.placeholder}
              required
              className={styles.input}
              autoComplete="email"
            />
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            <button
              type="submit"
              disabled={loading || !email}
              className={styles.submitBtn}
            >
              {loading ? t.login.loading : t.login.submit}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <Suspense fallback={<div className={styles.card} aria-busy="true" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}

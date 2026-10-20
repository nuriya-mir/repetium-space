'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FirstVisitShell } from '@/components/first-visit/FirstVisitShell'
import { createClient } from '@/lib/supabase/client'
import { updateFirstVisitState, useFirstVisitState } from '@/lib/first-visit/state'
import { useT } from '@/lib/i18n'
import styles from '../test.module.css'

const LOGIN_DESTINATION = '/login?next=%2Fonboarding%2Ftour%3Fsource%3Dtest&source=test'

export default function TestResultPage() {
  const router = useRouter()
  const t = useT()
  const { state, ready } = useFirstVisitState()
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setAuthenticated(Boolean(data.user)))
  }, [])

  useEffect(() => {
    if (ready && (!state || state.test.status !== 'completed' || !state.test.result)) {
      router.replace('/test')
    }
  }, [ready, router, state])

  if (!ready || !state?.test.result) {
    return <FirstVisitShell><div className={styles.result} aria-busy="true" /></FirstVisitShell>
  }

  const result = state.test.result
  const recommendation = t.firstVisit.result.recommendations[result.recommendation]

  function prepareRegistration() {
    updateFirstVisitState((current) => ({ ...current, stage: 'auth_pending' }))
  }

  function continueToTour() {
    updateFirstVisitState((current) => ({ ...current, stage: 'tour' }))
    router.push('/onboarding/tour?source=test')
  }

  return (
    <FirstVisitShell exitHref="/">
      <section className={styles.result}>
        <h1 className={styles.title}>{t.firstVisit.result.title}</h1>
        <p className={styles.lead}>{t.firstVisit.result.intro}</p>

        <h2 className={styles.sectionTitle}>{t.firstVisit.result.observationsTitle}</h2>
        <ul className={styles.observationList}>
          {result.observations.map((code) => (
            <li key={code} className={styles.observation}>
              {t.firstVisit.result.observations[code]}
            </li>
          ))}
        </ul>

        <div className={styles.recommendation}>
          <h2 className={styles.sectionTitle}>{t.firstVisit.result.recommendationTitle}</h2>
          <p className={styles.recommendationText}>{recommendation}</p>
        </div>

        <div className={styles.lettersBlock}>
          <h2 className={styles.sectionTitle}>{t.firstVisit.result.lettersTitle}</h2>
          <p className={styles.lettersText}>{t.firstVisit.result.lettersText}</p>
          <div className={styles.letterRow} lang="fr">
            {result.recommendedLetters.map((letter) => (
              <span key={letter} className={styles.letterChip}>{letter}</span>
            ))}
          </div>
        </div>

        <p className={styles.savedNotice}>{t.firstVisit.result.saved}</p>

        <div className={styles.actions}>
          {authenticated ? (
            <button type="button" className={styles.primary} onClick={continueToTour}>
              {t.firstVisit.result.continue}
            </button>
          ) : (
            <Link href={LOGIN_DESTINATION} className={styles.primary} onClick={prepareRegistration}>
              {t.firstVisit.result.register}
            </Link>
          )}
          <Link href="/" className={styles.textAction}>{t.firstVisit.result.later}</Link>
        </div>
      </section>
    </FirstVisitShell>
  )
}

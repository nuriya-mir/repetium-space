'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FirstVisitShell } from '@/components/first-visit/FirstVisitShell'
import { updateFirstVisitState, useFirstVisitState } from '@/lib/first-visit/state'
import { useT } from '@/lib/i18n'
import styles from './page.module.css'

const TOUR_LENGTH = 4

export default function OnboardingTourPage() {
  const router = useRouter()
  const t = useT()
  const { state, ready } = useFirstVisitState()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (ready && state) setIndex(Math.min(state.onboarding.tourIndex, TOUR_LENGTH - 1))
  }, [ready, state])

  useEffect(() => {
    updateFirstVisitState((current) => ({
      ...current,
      stage: 'tour',
      onboarding: {
        ...current.onboarding,
        tourStatus: 'in_progress',
      },
    }))
  }, [])

  function saveIndex(nextIndex: number) {
    setIndex(nextIndex)
    updateFirstVisitState((current) => ({
      ...current,
      stage: 'tour',
      onboarding: {
        ...current.onboarding,
        tourStatus: 'in_progress',
        tourIndex: nextIndex,
      },
    }))
  }

  function completeTour(status: 'completed' | 'skipped') {
    updateFirstVisitState((current) => ({
      ...current,
      stage: 'first_letters',
      onboarding: {
        ...current.onboarding,
        tourStatus: status,
        tourIndex: index,
      },
    }))
    router.push(status === 'completed' ? '/onboarding/first-letters' : '/home?first=1')
  }

  const slide = t.firstVisit.tour.slides[index]
  const step = t.firstVisit.tour.step
    .replace('{current}', String(index + 1))
    .replace('{total}', String(TOUR_LENGTH))

  return (
    <FirstVisitShell exitHref="/home">
      <section className={styles.tour}>
        <span className={styles.label}>{t.firstVisit.tour.label}</span>
        <div className={styles.visual} aria-hidden="true">
          <span>{index + 1}</span>
        </div>
        <p className={styles.step}>{step}</p>
        <h1 className={styles.title}>{slide.title}</h1>
        <p className={styles.text}>{slide.text}</p>

        <div className={styles.dots} aria-hidden="true">
          {Array.from({ length: TOUR_LENGTH }, (_, dotIndex) => (
            <span key={dotIndex} className={`${styles.dot} ${dotIndex === index ? styles.dotActive : ''}`} />
          ))}
        </div>

        <div className={styles.actions}>
          {index < TOUR_LENGTH - 1 ? (
            <button type="button" className={styles.primary} onClick={() => saveIndex(index + 1)}>
              {t.firstVisit.tour.next}
            </button>
          ) : (
            <button type="button" className={styles.primary} onClick={() => completeTour('completed')}>
              {t.firstVisit.tour.finish}
            </button>
          )}
          <button type="button" className={styles.skip} onClick={() => completeTour('skipped')}>
            {t.firstVisit.tour.skip}
          </button>
        </div>
      </section>
    </FirstVisitShell>
  )
}

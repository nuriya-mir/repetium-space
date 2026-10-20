'use client'

import { useRouter } from 'next/navigation'
import { FirstVisitShell } from '@/components/first-visit/FirstVisitShell'
import { createFirstVisitState, saveFirstVisitState, useFirstVisitState } from '@/lib/first-visit/state'
import { useT } from '@/lib/i18n'
import styles from './test.module.css'

export default function TestIntroPage() {
  const router = useRouter()
  const t = useT()
  const { state, ready } = useFirstVisitState()

  function startNew() {
    saveFirstVisitState(createFirstVisitState('test_in_progress'))
    router.push('/test/session')
  }

  if (!ready) {
    return (
      <FirstVisitShell>
        <div className={styles.intro} aria-busy="true" />
      </FirstVisitShell>
    )
  }

  const inProgress = state?.test.status === 'in_progress'
  const completed = state?.test.status === 'completed'

  return (
    <FirstVisitShell>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t.firstVisit.test.title}</h1>
        <p className={styles.lead}>{t.firstVisit.test.intro}</p>
        <p className={styles.meta}>{t.firstVisit.test.meta}</p>

        {inProgress ? (
          <div className={styles.resumeCard}>
            <h2 className={styles.resumeTitle}>{t.firstVisit.test.resumeTitle}</h2>
            <p className={styles.resumeText}>{t.firstVisit.test.resumeText}</p>
            <div className={styles.actions}>
              <button className={styles.primary} type="button" onClick={() => router.push('/test/session')}>
                {t.firstVisit.test.resume}
              </button>
              <button className={styles.secondary} type="button" onClick={startNew}>
                {t.firstVisit.test.restart}
              </button>
            </div>
          </div>
        ) : completed ? (
          <div className={styles.resumeCard}>
            <h2 className={styles.resumeTitle}>{t.firstVisit.test.resultReadyTitle}</h2>
            <p className={styles.resumeText}>{t.firstVisit.test.resultReadyText}</p>
            <div className={styles.actions}>
              <button className={styles.primary} type="button" onClick={() => router.push('/test/result')}>
                {t.firstVisit.test.viewResult}
              </button>
              <button className={styles.secondary} type="button" onClick={startNew}>
                {t.firstVisit.test.restart}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.actions}>
            <button className={styles.primary} type="button" onClick={startNew}>
              {t.firstVisit.test.start}
            </button>
          </div>
        )}
      </section>
    </FirstVisitShell>
  )
}

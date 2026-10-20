'use client'

import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DEFAULT_FIRST_LETTERS, useFirstVisitState } from '@/lib/first-visit/state'
import {
  DAILY_ACTIVITY_PATHS,
  DailyActivityId,
  DailyCheckResponse,
  DailyDuration,
  DailySessionState,
  createDailySessionState,
  deriveDailyRecommendation,
  saveDailySessionState,
  updateDailySessionState,
  useDailySessionState,
} from '@/lib/daily-session/state'
import { useT } from '@/lib/i18n'
import styles from './page.module.css'

const ACTIVITIES: DailyActivityId[] = ['reference', 'alphabet', 'exercise']
const DURATIONS: DailyDuration[] = ['short', 'regular', 'open']

function getStartingActivity(firstVisitRecommendation?: 'alphabet' | 'connections' | 'reading'): DailyActivityId {
  return firstVisitRecommendation === 'alphabet' ? 'alphabet' : 'exercise'
}

export default function DailySessionPage() {
  const router = useRouter()
  const t = useT()
  const { state, ready } = useDailySessionState()
  const { state: firstVisit } = useFirstVisitState()

  const seedLetters = useMemo(
    () => firstVisit?.test.result?.recommendedLetters ?? DEFAULT_FIRST_LETTERS,
    [firstVisit?.test.result?.recommendedLetters]
  )

  useEffect(() => {
    if (!ready || state) return
    saveDailySessionState(createDailySessionState(
      seedLetters,
      'idle',
      getStartingActivity(firstVisit?.test.result?.recommendation)
    ))
  }, [firstVisit?.test.result?.recommendation, ready, seedLetters, state])

  if (!ready || !state) {
    return <div className={styles.page} aria-busy="true" />
  }

  const activeState = state

  function replaceState(next: DailySessionState) {
    saveDailySessionState(next)
  }

  function startCheck() {
    replaceState({
      ...createDailySessionState(seedLetters, 'check_in_progress', activeState.plan.activity),
      entryMode: 'mini_check',
      startedAt: new Date().toISOString(),
    })
  }

  function chooseDirectly() {
    replaceState({
      ...createDailySessionState(seedLetters, 'planning', activeState.plan.activity),
      entryMode: 'direct',
      startedAt: new Date().toISOString(),
    })
  }

  function answerCheck(response: DailyCheckResponse) {
    const letter = activeState.check.letters[activeState.check.currentIndex]
    const responses = { ...activeState.check.responses, [letter]: response }
    const isLast = activeState.check.currentIndex >= activeState.check.letters.length - 1

    if (isLast) {
      const recommendation = deriveDailyRecommendation(responses)
      updateDailySessionState((current) => ({
        ...current,
        status: 'planning',
        check: { ...current.check, responses },
        plan: { ...current.plan, ...recommendation },
      }), seedLetters)
      return
    }

    updateDailySessionState((current) => ({
      ...current,
      check: {
        ...current.check,
        currentIndex: current.check.currentIndex + 1,
        responses,
      },
    }), seedLetters)
  }

  function skipCheck() {
    const recommendation = Object.keys(activeState.check.responses).length > 0
      ? deriveDailyRecommendation(activeState.check.responses)
      : {
          activity: activeState.plan.activity,
          reason: activeState.plan.reason,
          includeReinforcement: activeState.plan.includeReinforcement,
        }
    updateDailySessionState((current) => ({
      ...current,
      status: 'planning',
      plan: { ...current.plan, ...recommendation },
    }), seedLetters)
  }

  function updatePlan(update: Partial<DailySessionState['plan']>) {
    updateDailySessionState((current) => ({
      ...current,
      status: current.status === 'active' ? 'active' : 'planning',
      plan: { ...current.plan, ...update },
    }), seedLetters)
  }

  function openActivity(activity = activeState.plan.activity) {
    updateDailySessionState((current) => ({
      ...current,
      status: 'active',
      plan: { ...current.plan, activity, activityStarted: true },
    }), seedLetters)
    router.push(DAILY_ACTIVITY_PATHS[activity])
  }

  function finishSession() {
    updateDailySessionState((current) => ({
      ...current,
      status: 'completed',
      completedAt: new Date().toISOString(),
    }), seedLetters)
  }

  function startAnother() {
    replaceState({
      ...createDailySessionState(seedLetters, 'planning', activeState.plan.activity),
      entryMode: 'direct',
      startedAt: new Date().toISOString(),
    })
  }

  if (activeState.status === 'idle') {
    return (
      <div className={styles.page}>
        <header className={styles.introHeader}>
          <p className={styles.quiet}>{t.dailySession.intro.quiet}</p>
          <h1 className={styles.title}>{t.dailySession.intro.title}</h1>
          <p className={styles.lead}>{t.dailySession.intro.text}</p>
        </header>

        <div className={styles.entryChoices}>
          <button type="button" className={styles.entryPrimary} onClick={startCheck}>
            <span className={styles.entryTitle}>{t.dailySession.intro.checkTitle}</span>
            <span className={styles.entryText}>{t.dailySession.intro.checkText}</span>
          </button>
          <button type="button" className={styles.entrySecondary} onClick={chooseDirectly}>
            <span className={styles.entryTitle}>{t.dailySession.intro.directTitle}</span>
            <span className={styles.entryText}>{t.dailySession.intro.directText}</span>
          </button>
        </div>

        <Link href="/home" className={styles.textLink}>{t.dailySession.intro.notToday}</Link>
      </div>
    )
  }

  if (activeState.status === 'check_in_progress') {
    const letter = activeState.check.letters[activeState.check.currentIndex]
    const progress = t.dailySession.check.progress
      .replace('{current}', String(activeState.check.currentIndex + 1))
      .replace('{total}', String(activeState.check.letters.length))

    return (
      <div className={styles.page}>
        <header className={styles.checkHeader}>
          <span className={styles.quiet}>{progress}</span>
          <h1 className={styles.title}>{t.dailySession.check.title}</h1>
          <p className={styles.lead}>{t.dailySession.check.text}</p>
        </header>

        <div className={styles.letterSample} lang="fr" aria-label={letter}>{letter}</div>
        <p className={styles.question}>{t.dailySession.check.question}</p>

        <div className={styles.responseGrid}>
          <button type="button" className={styles.response} onClick={() => answerCheck('steady')}>
            {t.dailySession.check.steady}
          </button>
          <button type="button" className={styles.response} onClick={() => answerCheck('pause')}>
            {t.dailySession.check.pause}
          </button>
          <button type="button" className={styles.response} onClick={() => answerCheck('not_today')}>
            {t.dailySession.check.notToday}
          </button>
        </div>

        <div className={styles.footerActions}>
          <button type="button" className={styles.textButton} onClick={skipCheck}>
            {t.dailySession.check.skip}
          </button>
          <Link href="/home" className={styles.textLink}>{t.dailySession.check.exit}</Link>
        </div>
      </div>
    )
  }

  if (activeState.status === 'completed') {
    return (
      <div className={`${styles.page} ${styles.completePage}`}>
        <div className={styles.completionMark} aria-hidden="true" />
        <h1 className={styles.title}>{t.dailySession.complete.title}</h1>
        <p className={styles.lead}>{t.dailySession.complete.text}</p>
        <p className={styles.saved}>{t.dailySession.complete.saved}</p>
        <div className={styles.primaryActions}>
          <Link href="/home" className={styles.primaryButton}>{t.dailySession.complete.home}</Link>
          <button type="button" className={styles.secondaryButton} onClick={startAnother}>
            {t.dailySession.complete.another}
          </button>
        </div>
      </div>
    )
  }

  const recommendation = t.dailySession.plan.recommendations[activeState.plan.reason]
  const isActive = activeState.status === 'active'

  return (
    <div className={styles.page}>
      <header className={styles.planHeader}>
        <p className={styles.quiet}>
          {activeState.entryMode === 'mini_check'
            ? t.dailySession.plan.fromCheck
            : t.dailySession.plan.direct}
        </p>
        <h1 className={styles.title}>
          {isActive ? t.dailySession.plan.activeTitle : t.dailySession.plan.title}
        </h1>
        <p className={styles.lead}>{recommendation}</p>
      </header>

      <section className={styles.planSection}>
        <h2 className={styles.sectionTitle}>{t.dailySession.plan.activityTitle}</h2>
        <div className={styles.activityList}>
          {ACTIVITIES.map((activity) => {
            const copy = t.dailySession.activities[activity]
            const selected = activeState.plan.activity === activity
            return (
              <button
                key={activity}
                type="button"
                className={`${styles.activityOption} ${selected ? styles.selected : ''}`}
                onClick={() => updatePlan({ activity })}
                aria-pressed={selected}
              >
                <span className={styles.optionTitle}>{copy.title}</span>
                <span className={styles.optionText}>{copy.text}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className={styles.planSection}>
        <h2 className={styles.sectionTitle}>{t.dailySession.plan.durationTitle}</h2>
        <div className={styles.segmented}>
          {DURATIONS.map((duration) => (
            <button
              key={duration}
              type="button"
              className={`${styles.segment} ${activeState.plan.duration === duration ? styles.segmentSelected : ''}`}
              onClick={() => updatePlan({ duration })}
              aria-pressed={activeState.plan.duration === duration}
            >
              {t.dailySession.durations[duration]}
            </button>
          ))}
        </div>
        <p className={styles.hint}>{t.dailySession.plan.noTimer}</p>
      </section>

      <section className={styles.planSection}>
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={activeState.plan.includeReinforcement}
            onChange={(event) => updatePlan({ includeReinforcement: event.target.checked })}
          />
          <span>
            <strong>{t.dailySession.plan.reinforcementTitle}</strong>
            <small>{t.dailySession.plan.reinforcementText}</small>
          </span>
        </label>
      </section>

      <p className={styles.saved}>{t.dailySession.plan.saved}</p>

      <div className={styles.primaryActions}>
        <button type="button" className={styles.primaryButton} onClick={() => openActivity()}>
          {isActive ? t.dailySession.plan.continue : t.dailySession.plan.start}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={finishSession}>
          {t.dailySession.plan.finish}
        </button>
      </div>

      <div className={styles.directLinks}>
        <span>{t.dailySession.plan.chooseDirect}</span>
        <button type="button" onClick={() => openActivity('reference')}>{t.dailySession.plan.letters}</button>
        <button type="button" onClick={() => openActivity('exercise')}>{t.dailySession.plan.exercises}</button>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ExerciseText } from '@/components/exercises/ExerciseText'
import { ExerciseInput } from '@/components/exercises/ExerciseInput'
import { ExerciseComplete } from '@/components/exercises/ExerciseComplete'
import { useT } from '@/lib/i18n'
import styles from './page.module.css'

type ExercisePhase = 'select' | 'show' | 'fade' | 'recall' | 'input' | 'complete'

// Demo exercise data — in production this comes from the API
const DEMO_TEXT = "Le chat dort sur le canapé. Marie prépare le dîner dans la cuisine. Les enfants jouent dans le jardin."
const DEMO_HIGHLIGHTS = [
  { start: 3, end: 7, level: 1 as const },
  { start: 22, end: 28, level: 2 as const },
  { start: 57, end: 64, level: 1 as const },
]
const DEMO_EXPECTED = 'chat'

export default function ExercisesPage() {
  const router = useRouter()
  const t = useT()
  const [phase, setPhase] = useState<ExercisePhase>('select')

  function startExercise() {
    setPhase('show')
    setTimeout(() => setPhase('fade'), 3000)
    setTimeout(() => setPhase('recall'), 5000)
  }

  function handleInputPhase() {
    setPhase('input')
  }

  function handleCorrect() {
    setTimeout(() => setPhase('complete'), 600)
  }

  if (phase === 'complete') {
    return (
      <div className={styles.page}>
        <ExerciseComplete
          onContinue={() => setPhase('select')}
          onReturnHome={() => router.push('/home')}
        />
      </div>
    )
  }

  if (phase !== 'select') {
    return (
      <div className={styles.page}>
        <div className={styles.exerciseHeader}>
          <Button variant="ghost" size="sm" onClick={() => setPhase('select')}>
            {t.exercises.back}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setPhase('complete')}>
            {t.exercises.skip}
          </Button>
        </div>

        <ExerciseText
          text={DEMO_TEXT}
          highlights={DEMO_HIGHLIGHTS}
          phase={phase === 'input' ? 'recall' : phase as 'show' | 'fade' | 'recall'}
          onPlayAudio={() => {
            fetch('/api/tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: DEMO_TEXT }),
            })
              .then((r) => r.json())
              .then(({ url }) => { if (url) new Audio(url).play() })
              .catch(() => {})
          }}
        />

        {phase === 'recall' && (
          <div className={styles.recallPrompt}>
            <p className={styles.recallText}>
              {t.exercises.recallPrompt}
            </p>
            <Button variant="primary" onClick={handleInputPhase}>
              {t.exercises.readyBtn}
            </Button>
          </div>
        )}

        {phase === 'input' && (
          <div className={styles.inputArea}>
            <ExerciseInput
              expected={DEMO_EXPECTED}
              label={t.exercises.inputLabel}
              onCorrect={handleCorrect}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t.exercises.title}</h1>
        <p className={styles.desc}>{t.exercises.desc}</p>
      </div>

      <div className={styles.cards}>
        <Card variant="interactive" onClick={startExercise}>
          <div className={styles.cardContent}>
            <div className={styles.cardIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="var(--blue)" strokeWidth="1.5" />
                <path d="M8 10h8M8 14h5" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>{t.exercises.card1title}</h3>
            <p className={styles.cardDesc}>{t.exercises.card1desc}</p>
          </div>
        </Card>

        <Card variant="default" padding="md">
          <div className={styles.cardContent}>
            <div className={styles.cardIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="var(--ink-3)" strokeWidth="1.5" />
                <path d="M12 8v4l2 2" stroke="var(--ink-3)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className={`${styles.cardTitle} ${styles.muted}`}>{t.exercises.card2title}</h3>
            <p className={styles.cardDesc}>{t.exercises.card2desc}</p>
          </div>
        </Card>
      </div>

      <div className={styles.info}>
        <p>{t.exercises.info}</p>
      </div>
    </div>
  )
}

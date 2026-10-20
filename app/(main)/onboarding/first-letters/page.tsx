'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DEFAULT_FIRST_LETTERS, updateFirstVisitState, useFirstVisitState } from '@/lib/first-visit/state'
import { useT } from '@/lib/i18n'
import styles from './page.module.css'

export default function FirstLettersPage() {
  const router = useRouter()
  const t = useT()
  const { state, ready } = useFirstVisitState()
  const [audioError, setAudioError] = useState(false)

  useEffect(() => {
    if (!ready) return
    updateFirstVisitState((current) => ({
      ...current,
      stage: current.onboarding.firstLettersStatus === 'completed' ? 'complete' : 'first_letters',
      onboarding: {
        ...current.onboarding,
        firstLettersStatus: current.onboarding.firstLettersStatus === 'completed' ? 'completed' : 'in_progress',
      },
    }))
  }, [ready])

  const letters = useMemo(
    () => state?.test.result?.recommendedLetters ?? DEFAULT_FIRST_LETTERS,
    [state?.test.result?.recommendedLetters]
  )
  const seenLetters = state?.onboarding.seenLetters ?? []

  async function meetLetter(letter: string) {
    if (!seenLetters.includes(letter)) {
      updateFirstVisitState((current) => ({
        ...current,
        stage: 'first_letters',
        onboarding: {
          ...current.onboarding,
          firstLettersStatus: 'in_progress',
          seenLetters: [...new Set([...current.onboarding.seenLetters, letter])],
        },
      }))
    }

    setAudioError(false)
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: letter.toLowerCase() }),
      })
      if (!response.ok) throw new Error('tts unavailable')
      const data: { url?: string } = await response.json()
      if (!data.url) throw new Error('tts unavailable')
      await new Audio(data.url).play()
    } catch {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const utter = new SpeechSynthesisUtterance(letter.toLowerCase())
        utter.lang = 'fr-FR'
        const frVoice = window.speechSynthesis
          .getVoices()
          .find((v) => v.lang === 'fr-FR' || v.lang === 'fr_FR' || v.lang.startsWith('fr'))
        if (frVoice) utter.voice = frVoice
        utter.rate = 0.85
        window.speechSynthesis.speak(utter)
      } else {
        setAudioError(true)
      }
    }
  }

  function complete(destination: '/home' | '/letters/house-1') {
    updateFirstVisitState((current) => ({
      ...current,
      stage: 'complete',
      onboarding: {
        ...current.onboarding,
        firstLettersStatus: 'completed',
      },
    }))
    router.push(destination)
  }

  if (!ready) {
    return <p className={styles.loading} aria-live="polite">{t.firstVisit.firstLetters.loading}</p>
  }

  const count = t.firstVisit.firstLetters.selected
    .replace('{current}', String(seenLetters.length))
    .replace('{total}', String(letters.length))

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t.firstVisit.firstLetters.title}</h1>
        <p className={styles.intro}>{t.firstVisit.firstLetters.intro}</p>
        <p className={styles.count} aria-live="polite">{count}</p>
      </header>

      <div className={styles.letters} lang="fr">
        {letters.map((letter) => {
          const seen = seenLetters.includes(letter)
          const label = t.firstVisit.firstLetters.listen.replace('{letter}', letter)
          return (
            <button
              key={letter}
              type="button"
              className={`${styles.letter} ${seen ? styles.letterSeen : ''}`}
              onClick={() => meetLetter(letter)}
              aria-label={label}
              aria-pressed={seen}
              title={seen ? t.firstVisit.firstLetters.listened : label}
            >
              {letter}
            </button>
          )
        })}
      </div>

      {audioError ? (
        <p className={styles.audioNotice} role="status">{t.firstVisit.firstLetters.audioUnavailable}</p>
      ) : null}

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={() => complete('/letters/house-1')}>
          {t.firstVisit.firstLetters.continueHouse}
        </button>
        <button type="button" className={styles.secondary} onClick={() => complete('/home')}>
          {t.firstVisit.firstLetters.finish}
        </button>
        <Link href="/home" className={styles.textAction}>{t.firstVisit.firstLetters.later}</Link>
      </div>
    </div>
  )
}

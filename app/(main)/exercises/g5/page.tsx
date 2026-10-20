'use client'

import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '@/lib/i18n'
import { useTextFormat } from '@/lib/hooks/useTextFormat'
import { useTrackExercise } from '@/lib/hooks/useRecentExercises'
import { usePreferences } from '@/lib/hooks/usePreferences'
import styles from './page.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────
type Phase = 'select' | 'loading' | 'show' | 'fade' | 'recall' | 'complete'
type FadeStep = 0 | 1 | 2

type Segment =
  | { type: 'text'; content: string }
  | { type: 'target'; content: string; idx: number }

// ── Accent groups ─────────────────────────────────────────────────────────────
const GROUPS = [
  { key: 'aigu',    letters: ['é'],                      label: 'accent aigu',       example: 'é' },
  { key: 'grave',   letters: ['à', 'è', 'ù'],            label: 'accent grave',       example: 'à è ù' },
  { key: 'circ',    letters: ['â', 'ê', 'î', 'ô', 'û'], label: 'accent circonflexe', example: 'â ê î ô û' },
  { key: 'trema',   letters: ['ë', 'ï'],                 label: 'tréma',              example: 'ë ï' },
  { key: 'cedille', letters: ['ç'],                      label: 'cédille',            example: 'ç' },
  { key: 'liga',    letters: ['æ', 'œ'],                 label: 'ligatures',          example: 'æ œ' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseSegments(text: string, letters: string[]): Segment[] {
  const pattern = new RegExp(letters.map(escapeRegExp).join('|'), 'g')
  const segments: Segment[] = []
  let lastIdx = 0
  let targetIdx = 0

  for (const match of text.matchAll(pattern)) {
    if (match.index! > lastIdx) {
      segments.push({ type: 'text', content: text.slice(lastIdx, match.index!) })
    }
    segments.push({ type: 'target', content: match[0], idx: targetIdx++ })
    lastIdx = match.index! + match[0].length
  }
  if (lastIdx < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIdx) })
  }
  return segments
}

// ── Main component ────────────────────────────────────────────────────────────
export default function G5Page() {
  const router = useRouter()
  const t = useT()
  const { format, setFormat } = useTextFormat()
  const { prefs } = usePreferences()
  useTrackExercise('g5', 'Диакритика', '/exercises/g5')

  const [phase, setPhase] = useState<Phase>('select')
  const [groupKey, setGroupKey] = useState('')
  const [letters, setLetters] = useState<string[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [fadeStep, setFadeStep] = useState<FadeStep>(0)
  const [values, setValues] = useState<string[]>([])
  const [errors, setErrors] = useState<number[]>([])
  const [shaking, setShaking] = useState<Set<number>>(new Set())
  const [hints, setHints] = useState<Set<number>>(new Set())
  const [activeIdx, setActiveIdx] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const fadeTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  const targets = useMemo(
    () => segments.filter((s): s is Extract<Segment, { type: 'target' }> => s.type === 'target'),
    [segments]
  )
  const allFilled = values.length > 0 && values.every(Boolean)
  const currentGroup = GROUPS.find(g => g.key === groupKey)

  useEffect(() => {
    return () => { fadeTimers.current.forEach(clearTimeout) }
  }, [])

  useEffect(() => {
    if (phase === 'recall') {
      const firstEmpty = values.findIndex(v => !v)
      const idx = firstEmpty >= 0 ? firstEmpty : 0
      setActiveIdx(idx)
      setTimeout(() => inputRefs.current[idx]?.focus(), 50)
      if (prefs.hintThreshold === 0) {
        setHints(new Set(targets.map((_, i) => i)))
      }
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (allFilled && phase === 'recall') {
      setTimeout(() => setPhase('complete'), 600)
    }
  }, [allFilled, phase])

  // ── Group selection ────────────────────────────────────────────────────────
  async function handleSelectGroup(group: typeof GROUPS[0]) {
    setGroupKey(group.key)
    setLetters(group.letters)
    setPhase('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: 'g5', letter_targets: group.letters }),
      })
      const data = await res.json()
      const text: string = data.content ?? ''
      if (!text) throw new Error('empty')

      const segs = parseSegments(text, group.letters)
      const tgts = segs.filter(s => s.type === 'target')
      if (tgts.length === 0) throw new Error('no targets')

      inputRefs.current = new Array(tgts.length).fill(null)
      setSegments(segs)
      setValues(new Array(tgts.length).fill(''))
      setErrors(new Array(tgts.length).fill(0))
      setHints(new Set())
      setShaking(new Set())
      setFadeStep(0)
      setPhase('show')
    } catch {
      setErrorMsg(t.exercises.loadError)
      setPhase('select')
    }
  }

  // ── Fade sequence ─────────────────────────────────────────────────────────
  function startFade() {
    fadeTimers.current.forEach(clearTimeout)
    setPhase('fade')
    setFadeStep(0)
    fadeTimers.current = [
      setTimeout(() => setFadeStep(1), 1000),
      setTimeout(() => setFadeStep(2), 2200),
      setTimeout(() => setPhase('recall'), 3000),
    ]
  }

  // ── Input handling ────────────────────────────────────────────────────────
  const handleInput = useCallback((idx: number, typed: string) => {
    if (!typed || values[idx]) return
    const expected = targets[idx]?.content ?? ''
    const correct = typed === expected

    if (correct) {
      setValues(prev => { const n = [...prev]; n[idx] = expected; return n })
      const nextIdx = values.findIndex((v, i) => i > idx && !v)
      if (nextIdx !== -1) {
        setActiveIdx(nextIdx)
        setTimeout(() => inputRefs.current[nextIdx]?.focus(), 0)
      }
    } else {
      setShaking(prev => new Set([...prev, idx]))
      setTimeout(() => setShaking(prev => { const n = new Set(prev); n.delete(idx); return n }), 400)
      setErrors(prev => {
        const next = [...prev]
        next[idx]++
        const threshold = prefs.hintThreshold === 0 ? 1 : prefs.hintThreshold
        if (next[idx] >= threshold) setHints(h => new Set([...h, idx]))
        return next
      })
    }
  }, [values, targets, prefs.hintThreshold])

  // ── Restart ───────────────────────────────────────────────────────────────
  function restart() {
    setPhase('select')
    setGroupKey('')
    setLetters([])
    setSegments([])
    setValues([])
    setErrors([])
    setHints(new Set())
    setShaking(new Set())
    setErrorMsg('')
  }

  // ── Format toggle ─────────────────────────────────────────────────────────
  const formatToggle = (
    <div className={styles.formatToggle}>
      <button
        className={`${styles.formatBtn} ${format === 'normal' ? styles.formatBtnActive : ''}`}
        onClick={() => setFormat('normal')}
      >
        Аа
      </button>
      <button
        className={`${styles.formatBtn} ${styles.formatBtnLarge} ${format === 'adapted' ? styles.formatBtnActive : ''}`}
        onClick={() => setFormat('adapted')}
      >
        Аа
      </button>
    </div>
  )

  // ── Virtual keyboard (accent group letters) ────────────────────────────────
  const accentKeyboard = phase === 'recall' && currentGroup ? (
    <div className={styles.accentKeyboard}>
      {currentGroup.letters.map(letter => (
        <button
          key={letter}
          className={styles.accentKey}
          onPointerDown={e => {
            e.preventDefault() // prevent input blur
            handleInput(activeIdx, letter)
          }}
          aria-label={letter}
        >
          {letter}
        </button>
      ))}
    </div>
  ) : null

  // ── Render: select ────────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div className={styles.page}>
        <div className={styles.topbar}>
          <button className={styles.backBtn} onClick={() => router.push('/exercises')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className={styles.groupLabel}>{t.exercises.g5name}</span>
          {formatToggle}
        </div>

        <div className={styles.selectWrap}>
          <p className={styles.selectPrompt}>{t.exercises.g5selectPrompt}</p>
          {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}

          <div className={styles.groupGrid}>
            {GROUPS.map(g => (
              <button key={g.key} className={styles.groupCard} onClick={() => handleSelectGroup(g)}>
                <span className={styles.groupCardLetters}>{g.example}</span>
                <span className={styles.groupCardLabel}>{g.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Render: loading ───────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className={styles.page}>
        <div className={styles.topbar}>
          <button className={styles.backBtn} onClick={restart}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className={styles.groupLabel}>{t.exercises.g5name} · {currentGroup?.example}</span>
          {formatToggle}
        </div>
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>{t.exercises.loading}</p>
        </div>
      </div>
    )
  }

  // ── Render: complete ──────────────────────────────────────────────────────
  if (phase === 'complete') {
    return (
      <div className={styles.page}>
        <div className={styles.topbar}>
          <span className={styles.groupLabel}>{t.exercises.g5name} · {currentGroup?.example}</span>
          {formatToggle}
        </div>
        <div className={styles.completeWrap}>
          <p className={styles.completeTitle}>{t.exercises.done}</p>
          <div className={`${styles.exerciseText} ${format === 'adapted' ? styles.exerciseTextAdapted : ''}`}>
            {segments.map((seg, i) =>
              seg.type === 'text'
                ? <span key={i}>{seg.content}</span>
                : <span key={i} className={styles.targetDone}>{seg.content}</span>
            )}
          </div>
          <div className={styles.completeActions}>
            <button className={styles.actionBtn} onClick={() => currentGroup && handleSelectGroup(currentGroup)}>
              {t.exercises.again}
            </button>
            <button className={styles.actionBtn} onClick={restart}>
              {t.exercises.g5anotherEl}
            </button>
            <button className={`${styles.actionBtn} ${styles.actionBtnGhost}`} onClick={() => router.push('/exercises')}>
              {t.exercises.toExercises}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: show / fade / recall ──────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={restart}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.groupLabel}>{t.exercises.g5name} · {currentGroup?.example}</span>
        <div className={styles.topbarRight}>
          {formatToggle}
          <button className={styles.skipBtn} onClick={() => setPhase('complete')}>
            {t.exercises.skip}
          </button>
        </div>
      </div>

      <div className={styles.exerciseWrap}>
        <p className={`${styles.exerciseText} ${format === 'adapted' ? styles.exerciseTextAdapted : ''}`}>
          {segments.map((seg, i) => {
            if (seg.type === 'text') return <span key={i}>{seg.content}</span>

            const idx = seg.idx
            const filled = values[idx]
            const isShaking = shaking.has(idx)
            const isActive = idx === activeIdx
            const showHint = hints.has(idx) && !filled

            if (phase === 'show') {
              return <span key={i} className={styles.highlight}>{seg.content}</span>
            }

            if (phase === 'fade') {
              if (fadeStep === 0) return <span key={i} className={styles.highlight}>{seg.content}</span>
              if (fadeStep === 1) return <span key={i} className={styles.fadeDots}>•</span>
              return <span key={i} className={styles.fadeEmpty}>{'\u00A0'}</span>
            }

            if (filled) {
              return <span key={i} className={styles.filledLetter}>{filled}</span>
            }

            return (
              <span
                key={i}
                className={`${styles.gapWrap} ${isShaking ? styles.gapShake : ''} ${isActive ? styles.gapActive : ''}`}
                onClick={() => { setActiveIdx(idx); inputRefs.current[idx]?.focus() }}
              >
                {showHint && <span className={styles.hintChar}>{seg.content}</span>}
                <input
                  key={`input-${idx}`}
                  ref={el => { inputRefs.current[idx] = el }}
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className={styles.gapInput}
                  defaultValue=""
                  onFocus={() => setActiveIdx(idx)}
                  onKeyDown={e => {
                    if (e.key.length === 1) {
                      e.preventDefault()
                      handleInput(idx, e.key)
                    }
                  }}
                  onChange={e => {
                    const char = e.target.value.slice(-1)
                    if (char) { handleInput(idx, char); e.target.value = '' }
                  }}
                  aria-label={`Пропуск ${idx + 1}`}
                />
                <span className={styles.gap}>{'\u00A0'}</span>
              </span>
            )
          })}
        </p>

        {phase === 'show' && (
          <div className={styles.bottomBar}>
            <p className={styles.showHint}>{t.exercises.g5showHint}</p>
            <button className={styles.readyBtn} onClick={startFade}>
              {t.exercises.g5readyBtn}
            </button>
          </div>
        )}

        {phase === 'recall' && (
          <div className={styles.bottomBar}>
            <p className={styles.showHint}>{t.exercises.g5recallHint}</p>
          </div>
        )}
      </div>

      {accentKeyboard}
    </div>
  )
}

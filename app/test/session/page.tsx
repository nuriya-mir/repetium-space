'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FirstVisitShell } from '@/components/first-visit/FirstVisitShell'
import {
  TEST_BLOCK_COUNT,
  TestAnswerKey,
  createFirstVisitState,
  deriveFirstVisitResult,
  saveFirstVisitState,
  updateFirstVisitState,
  useFirstVisitState,
} from '@/lib/first-visit/state'
import { useT } from '@/lib/i18n'
import styles from '../test.module.css'

const BLOCK_KEYS: TestAnswerKey[] = [
  'letterRecognition',
  'soundLink',
  'readingComfort',
  'textComfort',
  'displayPreference',
  'experience',
]

const FRENCH_WORDS = ['bonjour', 'famille', "aujourd’hui"]
const FRENCH_TEXT = 'Le matin, Camille ouvre la fenêtre. Elle écoute la ville et lit quelques lignes en français.'
const DISPLAY_TEXT = 'Les lettres deviennent plus faciles à retrouver.'

export default function TestSessionPage() {
  const router = useRouter()
  const t = useT()
  const { state, ready, refresh } = useFirstVisitState()

  useEffect(() => {
    if (!ready) return
    if (!state) {
      saveFirstVisitState(createFirstVisitState('test_in_progress'))
      refresh()
      return
    }
    if (state.test.status === 'completed') router.replace('/test/result')
  }, [ready, refresh, router, state])

  if (!ready || !state || state.test.status === 'completed') {
    return <FirstVisitShell><div className={styles.session} aria-busy="true" /></FirstVisitShell>
  }

  const activeState = state
  const block = Math.min(activeState.test.currentBlock, TEST_BLOCK_COUNT - 1)
  const answerKey = BLOCK_KEYS[block]
  const selected = activeState.test.answers[answerKey]
  const blockLabel = t.firstVisit.test.blockLabel
    .replace('{current}', String(block + 1))
    .replace('{total}', String(TEST_BLOCK_COUNT))

  const blockCopy = [
    t.firstVisit.test.blocks.recognition,
    t.firstVisit.test.blocks.sound,
    t.firstVisit.test.blocks.reading,
    t.firstVisit.test.blocks.text,
    t.firstVisit.test.blocks.display,
    t.firstVisit.test.blocks.experience,
  ][block]

  function selectAnswer(value: string) {
    updateFirstVisitState((current) => ({
      ...current,
      stage: 'test_in_progress',
      test: {
        ...current.test,
        status: 'in_progress',
        answers: { ...current.test.answers, [answerKey]: value },
      },
    }))
  }

  function next() {
    const latestAnswer = selected ?? 'not_sure'
    const updatedAnswers = { ...activeState.test.answers, [answerKey]: latestAnswer }

    if (block === TEST_BLOCK_COUNT - 1) {
      updateFirstVisitState((current) => ({
        ...current,
        stage: 'test_result',
        test: {
          ...current.test,
          status: 'completed',
          currentBlock: TEST_BLOCK_COUNT,
          answers: updatedAnswers,
          result: deriveFirstVisitResult(updatedAnswers),
        },
      }))
      router.push('/test/result')
      return
    }

    updateFirstVisitState((current) => ({
      ...current,
      stage: 'test_in_progress',
      test: {
        ...current.test,
        currentBlock: block + 1,
        answers: updatedAnswers,
      },
    }))
  }

  function exitTest() {
    router.push('/test')
  }

  function option(value: string, label: string) {
    return (
      <button
        key={value}
        type="button"
        className={`${styles.option} ${selected === value ? styles.optionSelected : ''}`}
        onClick={() => selectAnswer(value)}
        aria-pressed={selected === value}
      >
        {label}
      </button>
    )
  }

  function renderBlock() {
    switch (block) {
      case 0:
        return (
          <>
            <div className={styles.sample} lang="fr">b</div>
            <p className={styles.prompt}>{blockCopy.prompt}</p>
            <div className={styles.options}>{['d', 'b', 'q', 'p'].map((letter) => option(letter, letter))}</div>
          </>
        )
      case 1:
        return (
          <>
            <div className={styles.sample} lang="fr">ou</div>
            <p className={styles.prompt}>{blockCopy.prompt}</p>
            <div className={styles.options}>
              {option('u', '[u]')}
              {option('o', '[o]')}
              {option('wa', '[wa]')}
              {option('not_sure', t.firstVisit.test.notSure)}
            </div>
          </>
        )
      case 2:
        return (
          <>
            <div className={styles.wordList} lang="fr">
              {FRENCH_WORDS.map((word) => <span key={word} className={styles.word}>{word}</span>)}
            </div>
            <p className={styles.prompt}>{blockCopy.prompt}</p>
            <div className={styles.options}>
              {option('comfortable', t.firstVisit.test.choices.comfortable)}
              {option('effort', t.firstVisit.test.choices.effort)}
              {option('difficult', t.firstVisit.test.choices.difficult)}
              {option('not_sure', t.firstVisit.test.notSure)}
            </div>
          </>
        )
      case 3:
        return (
          <>
            <p className={styles.readingText} lang="fr">{FRENCH_TEXT}</p>
            <p className={styles.prompt}>{blockCopy.prompt}</p>
            <div className={styles.options}>
              {option('comfortable', t.firstVisit.test.choices.comfortable)}
              {option('effort', t.firstVisit.test.choices.effort)}
              {option('difficult', t.firstVisit.test.choices.difficult)}
              {option('not_sure', t.firstVisit.test.notSure)}
            </div>
          </>
        )
      case 4:
        return (
          <>
            <div className={styles.displayGrid} lang="fr">
              <div className={styles.displaySample}>
                <span className={styles.displayLabel}>{t.firstVisit.test.blocks.display.standard}</span>
                <p className={styles.displayText}>{DISPLAY_TEXT}</p>
              </div>
              <div className={styles.displaySample}>
                <span className={styles.displayLabel}>{t.firstVisit.test.blocks.display.adapted}</span>
                <p className={styles.displayTextAdapted}>{DISPLAY_TEXT}</p>
              </div>
            </div>
            <p className={styles.prompt}>{blockCopy.prompt}</p>
            <div className={styles.options}>
              {option('standard', t.firstVisit.test.blocks.display.standard)}
              {option('adapted', t.firstVisit.test.blocks.display.adapted)}
              {option('same', t.firstVisit.test.blocks.display.same)}
              {option('not_sure', t.firstVisit.test.notSure)}
            </div>
          </>
        )
      default:
        return (
          <>
            <p className={styles.prompt}>{blockCopy.prompt}</p>
            <div className={styles.options}>
              {option('new', t.firstVisit.test.blocks.experience.new)}
              {option('returning', t.firstVisit.test.blocks.experience.returning)}
              {option('practising', t.firstVisit.test.blocks.experience.practising)}
              {option('not_sure', t.firstVisit.test.notSure)}
            </div>
          </>
        )
    }
  }

  return (
    <FirstVisitShell currentBlock={block} onExit={exitTest}>
      <section className={styles.session}>
        <header className={styles.sessionHeader}>
          <span className={styles.blockLabel}>{blockLabel}</span>
          <h1 className={styles.blockTitle}>{blockCopy.title}</h1>
          <p className={styles.instruction}>{blockCopy.instruction}</p>
        </header>

        {renderBlock()}

        <footer className={styles.sessionFooter}>
          <span className={styles.savedHint}>{t.firstVisit.test.savedHint}</span>
          <div className={styles.actions}>
            <button className={styles.textAction} type="button" onClick={() => selectAnswer('not_sure')}>
              {t.firstVisit.test.notSure}
            </button>
            <button className={styles.primary} type="button" disabled={!selected} onClick={next}>
              {block === TEST_BLOCK_COUNT - 1 ? t.firstVisit.test.finish : t.firstVisit.test.next}
            </button>
          </div>
        </footer>
      </section>
    </FirstVisitShell>
  )
}

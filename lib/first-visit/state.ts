'use client'

import { useCallback, useEffect, useState } from 'react'

export const FIRST_VISIT_STORAGE_KEY = 'repetium:first_visit:v1'
export const FIRST_VISIT_EVENT = 'repetium:first-visit-changed'
export const TEST_BLOCK_COUNT = 6

const SCHEMA_VERSION = 1
const STORAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000
export const DEFAULT_FIRST_LETTERS = ['A', 'E', 'I', 'O', 'U', 'C', 'R']

export type FirstVisitStage =
  | 'test_intro'
  | 'test_in_progress'
  | 'test_result'
  | 'auth_pending'
  | 'tour'
  | 'dashboard'
  | 'first_letters'
  | 'complete'

export type TestAnswerKey =
  | 'letterRecognition'
  | 'soundLink'
  | 'readingComfort'
  | 'textComfort'
  | 'displayPreference'
  | 'experience'

export type TestAnswers = Partial<Record<TestAnswerKey, string>>

export type ObservationCode =
  | 'lettersFamiliar'
  | 'lettersCompare'
  | 'soundLinked'
  | 'soundExplore'
  | 'readingComfortable'
  | 'readingWithSupport'
  | 'textComfortable'
  | 'textWithSupport'
  | 'displayStandard'
  | 'displayAdapted'
  | 'experienceNew'
  | 'experienceReturning'

export interface FirstVisitResult {
  generatedAt: string
  recommendation: 'alphabet' | 'connections' | 'reading'
  recommendedLetters: string[]
  observations: ObservationCode[]
}

export interface FirstVisitState {
  schemaVersion: 1
  visitId: string
  stage: FirstVisitStage
  createdAt: string
  updatedAt: string
  expiresAt: string
  attachedUserId?: string
  test: {
    status: 'not_started' | 'in_progress' | 'completed'
    currentBlock: number
    answers: TestAnswers
    result?: FirstVisitResult
  }
  onboarding: {
    tourStatus: 'not_started' | 'in_progress' | 'skipped' | 'completed'
    tourIndex: number
    firstLettersStatus: 'not_started' | 'in_progress' | 'completed'
    seenLetters: string[]
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `visit-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function createFirstVisitState(stage: FirstVisitStage = 'test_intro'): FirstVisitState {
  const now = new Date()
  return {
    schemaVersion: SCHEMA_VERSION,
    visitId: createId(),
    stage,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + STORAGE_TTL_MS).toISOString(),
    test: {
      status: 'not_started',
      currentBlock: 0,
      answers: {},
    },
    onboarding: {
      tourStatus: 'not_started',
      tourIndex: 0,
      firstLettersStatus: 'not_started',
      seenLetters: [],
    },
  }
}

function isFirstVisitState(value: unknown): value is FirstVisitState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<FirstVisitState>
  return (
    candidate.schemaVersion === SCHEMA_VERSION &&
    typeof candidate.visitId === 'string' &&
    typeof candidate.stage === 'string' &&
    typeof candidate.expiresAt === 'string' &&
    Boolean(candidate.test && typeof candidate.test === 'object') &&
    Boolean(candidate.onboarding && typeof candidate.onboarding === 'object')
  )
}

export function loadFirstVisitState(): FirstVisitState | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(FIRST_VISIT_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)

    if (!isFirstVisitState(parsed)) {
      window.localStorage.removeItem(FIRST_VISIT_STORAGE_KEY)
      return null
    }

    if (Date.parse(parsed.expiresAt) <= Date.now()) {
      window.localStorage.removeItem(FIRST_VISIT_STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function saveFirstVisitState(state: FirstVisitState): FirstVisitState {
  if (typeof window === 'undefined') return state

  const saved: FirstVisitState = {
    ...state,
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(FIRST_VISIT_STORAGE_KEY, JSON.stringify(saved))
  window.dispatchEvent(new CustomEvent(FIRST_VISIT_EVENT))
  return saved
}

export function updateFirstVisitState(
  update: (current: FirstVisitState) => FirstVisitState
): FirstVisitState {
  const current = loadFirstVisitState() ?? createFirstVisitState()
  return saveFirstVisitState(update(current))
}

export function resetFirstVisitTest(): FirstVisitState {
  return saveFirstVisitState(createFirstVisitState('test_in_progress'))
}

function answerOrNotSure(answers: TestAnswers, key: TestAnswerKey): string {
  return answers[key] ?? 'not_sure'
}

export function deriveFirstVisitResult(answers: TestAnswers): FirstVisitResult {
  const letterRecognition = answerOrNotSure(answers, 'letterRecognition')
  const soundLink = answerOrNotSure(answers, 'soundLink')
  const readingComfort = answerOrNotSure(answers, 'readingComfort')
  const textComfort = answerOrNotSure(answers, 'textComfort')
  const displayPreference = answerOrNotSure(answers, 'displayPreference')
  const experience = answerOrNotSure(answers, 'experience')

  const observations: ObservationCode[] = [
    letterRecognition === 'b' ? 'lettersFamiliar' : 'lettersCompare',
    soundLink === 'u' ? 'soundLinked' : 'soundExplore',
    readingComfort === 'comfortable' ? 'readingComfortable' : 'readingWithSupport',
    textComfort === 'comfortable' ? 'textComfortable' : 'textWithSupport',
    displayPreference === 'adapted' ? 'displayAdapted' : 'displayStandard',
    experience === 'new' ? 'experienceNew' : 'experienceReturning',
  ]

  let recommendation: FirstVisitResult['recommendation'] = 'reading'
  if (letterRecognition !== 'b') recommendation = 'alphabet'
  else if (soundLink !== 'u' || readingComfort !== 'comfortable') recommendation = 'connections'

  const recommendedLetters = letterRecognition === 'b'
    ? DEFAULT_FIRST_LETTERS
    : ['B', 'D', 'P', 'Q', 'A', 'E', 'I', 'O', 'U']

  return {
    generatedAt: new Date().toISOString(),
    recommendation,
    recommendedLetters,
    observations,
  }
}

export function useFirstVisitState() {
  const [state, setState] = useState<FirstVisitState | null>(null)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(() => {
    setState(loadFirstVisitState())
    setReady(true)
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener('storage', refresh)
    window.addEventListener(FIRST_VISIT_EVENT, refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener(FIRST_VISIT_EVENT, refresh)
    }
  }, [refresh])

  return { state, ready, refresh }
}

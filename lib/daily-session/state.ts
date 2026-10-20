'use client'

import { useCallback, useEffect, useState } from 'react'

export const DAILY_SESSION_STORAGE_KEY = 'repetium:daily_session:v1'
export const DAILY_SESSION_EVENT = 'repetium:daily-session-changed'

const SCHEMA_VERSION = 1
const DAILY_SESSION_STATUSES: DailySessionStatus[] = ['idle', 'check_in_progress', 'planning', 'active', 'completed']
const DAILY_SESSION_ENTRY_MODES: DailySessionEntryMode[] = ['mini_check', 'direct']
const DAILY_CHECK_RESPONSES: DailyCheckResponse[] = ['steady', 'pause', 'not_today']
const DAILY_ACTIVITY_IDS: DailyActivityId[] = ['reference', 'alphabet', 'exercise']
const DAILY_DURATIONS: DailyDuration[] = ['short', 'regular', 'open']
const DAILY_REASONS: DailyRecommendationReason[] = ['continue', 'refresh', 'return_to_foundation']
const DAILY_FALLBACK_LETTERS = ['A', 'E', 'I', 'O', 'U', 'Y']

export type DailySessionStatus = 'idle' | 'check_in_progress' | 'planning' | 'active' | 'completed'
export type DailySessionEntryMode = 'mini_check' | 'direct'
export type DailyCheckResponse = 'steady' | 'pause' | 'not_today'
export type DailyActivityId = 'reference' | 'alphabet' | 'exercise'
export type DailyDuration = 'short' | 'regular' | 'open'
export type DailyRecommendationReason = 'continue' | 'refresh' | 'return_to_foundation'

export const DAILY_ACTIVITY_PATHS: Record<DailyActivityId, string> = {
  reference: '/letters/house-1',
  alphabet: '/letters/house-2',
  exercise: '/exercises/g1',
}

export interface DailySessionState {
  schemaVersion: 1
  sessionId: string
  dateKey: string
  status: DailySessionStatus
  entryMode?: DailySessionEntryMode
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
  check: {
    letters: string[]
    currentIndex: number
    responses: Record<string, DailyCheckResponse>
  }
  plan: {
    activity: DailyActivityId
    duration: DailyDuration
    includeReinforcement: boolean
    reason: DailyRecommendationReason
    activityStarted: boolean
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `daily-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function getDailyDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function createDailySessionState(
  letters: string[],
  status: DailySessionStatus = 'idle',
  activity: DailyActivityId = 'alphabet'
): DailySessionState {
  const now = new Date().toISOString()
  const uniqueLetters = [...new Set(letters.filter((letter) => typeof letter === 'string' && letter.length > 0))]
  const checkLetters = (uniqueLetters.length > 0 ? uniqueLetters : DAILY_FALLBACK_LETTERS).slice(0, 6)

  return {
    schemaVersion: SCHEMA_VERSION,
    sessionId: createId(),
    dateKey: getDailyDateKey(),
    status,
    createdAt: now,
    updatedAt: now,
    check: {
      letters: checkLetters,
      currentIndex: 0,
      responses: {},
    },
    plan: {
      activity,
      duration: 'regular',
      includeReinforcement: true,
      reason: 'continue',
      activityStarted: false,
    },
  }
}

function isDailySessionState(value: unknown): value is DailySessionState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<DailySessionState>
  const check = candidate.check
  const plan = candidate.plan
  const responses = check?.responses

  return (
    candidate.schemaVersion === SCHEMA_VERSION &&
    typeof candidate.sessionId === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(candidate.dateKey ?? '') &&
    DAILY_SESSION_STATUSES.includes(candidate.status as DailySessionStatus) &&
    (candidate.entryMode === undefined || DAILY_SESSION_ENTRY_MODES.includes(candidate.entryMode)) &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string' &&
    Boolean(
      check &&
      Array.isArray(check.letters) &&
      check.letters.length > 0 &&
      check.letters.length <= 6 &&
      check.letters.every((letter) => typeof letter === 'string' && letter.length > 0) &&
      Number.isInteger(check.currentIndex) &&
      check.currentIndex >= 0 &&
      check.currentIndex < check.letters.length &&
      responses &&
      typeof responses === 'object' &&
      Object.values(responses).every((response) => DAILY_CHECK_RESPONSES.includes(response))
    ) &&
    Boolean(
      plan &&
      DAILY_ACTIVITY_IDS.includes(plan.activity) &&
      DAILY_DURATIONS.includes(plan.duration) &&
      typeof plan.includeReinforcement === 'boolean' &&
      DAILY_REASONS.includes(plan.reason) &&
      typeof plan.activityStarted === 'boolean'
    )
  )
}

export function loadDailySessionState(): DailySessionState | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(DAILY_SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)

    if (!isDailySessionState(parsed)) {
      window.localStorage.removeItem(DAILY_SESSION_STORAGE_KEY)
      return null
    }

    if (parsed.status === 'completed' && parsed.dateKey !== getDailyDateKey()) {
      window.localStorage.removeItem(DAILY_SESSION_STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function saveDailySessionState(state: DailySessionState): DailySessionState {
  if (typeof window === 'undefined') return state
  const saved = { ...state, updatedAt: new Date().toISOString() }
  window.localStorage.setItem(DAILY_SESSION_STORAGE_KEY, JSON.stringify(saved))
  window.dispatchEvent(new CustomEvent(DAILY_SESSION_EVENT))
  return saved
}

export function updateDailySessionState(
  update: (current: DailySessionState) => DailySessionState,
  fallbackLetters: string[] = []
): DailySessionState {
  const current = loadDailySessionState() ?? createDailySessionState(fallbackLetters)
  return saveDailySessionState(update(current))
}

export function deriveDailyRecommendation(
  responses: Record<string, DailyCheckResponse>
): Pick<DailySessionState['plan'], 'activity' | 'reason' | 'includeReinforcement'> {
  const values = Object.values(responses)
  const needsSupport = values.filter((value) => value !== 'steady').length

  if (needsSupport >= 3) {
    return { activity: 'reference', reason: 'return_to_foundation', includeReinforcement: false }
  }

  if (needsSupport > 0) {
    return { activity: 'alphabet', reason: 'refresh', includeReinforcement: true }
  }

  return { activity: 'exercise', reason: 'continue', includeReinforcement: true }
}

export function useDailySessionState() {
  const [state, setState] = useState<DailySessionState | null>(null)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(() => {
    setState(loadDailySessionState())
    setReady(true)
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener('storage', refresh)
    window.addEventListener(DAILY_SESSION_EVENT, refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener(DAILY_SESSION_EVENT, refresh)
    }
  }, [refresh])

  return { state, ready, refresh }
}

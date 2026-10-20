'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDailySessionState } from '@/lib/daily-session/state'
import { useT } from '@/lib/i18n'
import styles from './DailySessionResume.module.css'

export function DailySessionResume() {
  const pathname = usePathname()
  const t = useT()
  const { state, ready } = useDailySessionState()

  if (
    !ready ||
    !state ||
    ['idle', 'completed'].includes(state.status) ||
    pathname === '/home' ||
    pathname === '/session'
  ) {
    return null
  }

  return (
    <aside className={styles.bar} aria-label={t.dailySession.resumeBar.label}>
      <span className={styles.text}>{t.dailySession.resumeBar.text}</span>
      <Link href="/session" className={styles.link}>{t.dailySession.resumeBar.action}</Link>
    </aside>
  )
}

'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from '@/components/ui/Logo'
import { LOCALES, LOCALE_LABELS, useI18n } from '@/lib/i18n'
import styles from './FirstVisitShell.module.css'

interface FirstVisitShellProps {
  children: ReactNode
  currentBlock?: number
  blockCount?: number
  exitHref?: string
  onExit?: () => void
}

export function FirstVisitShell({
  children,
  currentBlock,
  blockCount = 6,
  exitHref = '/',
  onExit,
}: FirstVisitShellProps) {
  const { locale, setLocale, t } = useI18n()
  const showProgress = typeof currentBlock === 'number'

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logoLink} aria-label={t.firstVisit.backToLanding}>
          <Logo markHeight={28} wordmarkSize={17} layout="horizontal" />
        </Link>

        {showProgress ? (
          <div className={styles.progress} aria-label={t.firstVisit.test.blockProgress}>
            {Array.from({ length: blockCount }, (_, index) => (
              <span
                key={index}
                className={`${styles.dot} ${index < currentBlock ? styles.dotDone : ''} ${index === currentBlock ? styles.dotCurrent : ''}`}
                aria-current={index === currentBlock ? 'step' : undefined}
              />
            ))}
          </div>
        ) : null}

        <div className={styles.actions}>
          <div className={styles.locale} role="group" aria-label={t.firstVisit.interfaceLanguage}>
            {LOCALES.map((item) => (
              <button
                key={item}
                type="button"
                className={`${styles.localeButton} ${locale === item ? styles.localeButtonActive : ''}`}
                onClick={() => setLocale(item)}
                aria-pressed={locale === item}
              >
                {LOCALE_LABELS[item]}
              </button>
            ))}
          </div>

          {onExit ? (
            <button type="button" className={styles.exit} onClick={onExit}>
              {t.firstVisit.exit}
            </button>
          ) : (
            <Link href={exitHref} className={styles.exit}>
              {t.firstVisit.exit}
            </Link>
          )}
        </div>
      </header>

      <main className={styles.main}>{children}</main>
    </div>
  )
}

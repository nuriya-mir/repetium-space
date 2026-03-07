'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useT } from '@/lib/i18n'
import styles from './page.module.css'

function getGreeting(t: ReturnType<typeof useT>): string {
  const h = new Date().getHours()
  if (h < 6) return t.home.greetings.night
  if (h < 12) return t.home.greetings.morning
  if (h < 18) return t.home.greetings.day
  return t.home.greetings.evening
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const MINI_WIDE = new Set(['M', 'W'])

function MiniHouseGrid({ letters, variant = 'default', isSilhouette = false }: { letters: string[]; variant?: 'default' | 'gold' | 'ipa', isSilhouette?: boolean }) {
  return (
    <div className={styles.miniHouse}>
      <svg className={styles.miniRoof} viewBox="0 0 280 28" preserveAspectRatio="none" aria-hidden="true">
        <polygon
          points="0,28 140,0 280,28"
          fill={
            variant === 'gold' ? 'rgba(200, 148, 42, 0.15)' :
            variant === 'ipa' ? 'rgba(58, 158, 152, 0.12)' :
            'var(--paper-e)'
          }
        />
      </svg>
      <div className={styles.miniHouseBody}>
        <div className={`${styles.miniHouseGrid} ${variant === 'ipa' ? styles.miniIpa : ''}`}>
          {letters.map((l, i) => (
            <span
              key={i}
              className={`${styles.miniCell} ${isSilhouette ? styles.silhouette : ''}`}
              style={MINI_WIDE.has(l) ? { gridColumn: 'span 2', aspectRatio: 'auto' } : undefined}
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

const IPA_SOUNDS = [
  '[a]','[e]','[ɛ]','[i]','[o]','[ɔ]','[u]',
  '[y]','[ø]','[œ]','[ə]','[ã]','[ɔ̃]','[ɛ̃]',
  '[œ̃]','[j]','[w]','[ɥ]','[b]','[d]','[f]',
  '[g]','[k]','[l]','[m]','[n]','[p]','[ʁ]',
  '[s]','[t]','[v]','[z]','[ʃ]','[ʒ]','[ɲ]',
]

export default function HomePage() {
  const t = useT()

  return (
    <div className={styles.page}>
      {/* Greeting */}
      <div className={styles.greeting}>
        <span className={styles.greetingTime}>{getGreeting(t)}</span>
        <h1 className={styles.greetingText}>{t.home.continueQ}</h1>
      </div>

      {/* Recommendation card */}
      <Link href="/exercises" className={styles.recLink}>
        <div className={styles.rec}>
          <div className={styles.recContent}>
            <span className={styles.recEyebrow}>{t.home.rec.eyebrow}</span>
            <span className={styles.recTitle}>{t.home.rec.title}</span>
            <span className={styles.recSub}>{t.home.rec.sub}</span>
          </div>
          <div className={styles.recArrow}>
            <Icon name="arrow_right" size={20} />
          </div>
        </div>
      </Link>

      {/* Houses grid */}
      <section>
        <div className={styles.housesGrid}>
          <Link href="/letters/house-1" className={styles.houseCard}>
            <span className={styles.houseName}>{t.home.letters.house1}</span>
            <MiniHouseGrid letters={ALPHABET} />
            <div className={styles.houseProgress}>
              <div className={styles.houseBar}>
                <div className={styles.houseBarFill} style={{ width: '0%' }} />
              </div>
              <span className={styles.houseCount}>0/26</span>
            </div>
          </Link>

          <Link href="/letters/house-2" className={styles.houseCard}>
            <span className={styles.houseName}>{t.home.letters.house2}</span>
            <MiniHouseGrid letters={ALPHABET} variant="gold" isSilhouette />
            <div className={styles.houseProgress}>
              <div className={styles.houseBar}>
                <div className={`${styles.houseBarFill} ${styles.gold}`} style={{ width: '0%' }} />
              </div>
              <span className={styles.houseCount}>0/26</span>
            </div>
          </Link>

          <Link href="/letters/house-3" className={styles.houseCard}>
            <span className={styles.houseName}>{t.home.letters.house3}</span>
            <MiniHouseGrid letters={IPA_SOUNDS} variant="ipa" />
            <div className={styles.houseProgress}>
              <div className={styles.houseBar}>
                <div className={`${styles.houseBarFill} ${styles.teal}`} style={{ width: '0%' }} />
              </div>
              <span className={styles.houseCount}>0/35</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Exercises */}
      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t.home.exercises.section}</h2>
          <Link href="/exercises" className={styles.sectionLink}>{t.home.exercises.all}</Link>
        </div>
        <div className={styles.chipRow}>
          <Link href="/exercises" className={styles.chip}>
            <span className={styles.chipGroup}>Г1</span>
            <span className={styles.chipLabel}>{t.home.exercises.g1label}</span>
            <span className={styles.chipStatus}>{t.home.exercises.start}</span>
          </Link>
          <span className={`${styles.chip} ${styles.chipDim}`}>
            <span className={styles.chipGroup}>Г3</span>
            <span className={styles.chipLabel}>{t.home.exercises.g3label}</span>
            <span className={styles.chipStatus}>{t.home.exercises.soon}</span>
          </span>
          <span className={`${styles.chip} ${styles.chipDim}`}>
            <span className={styles.chipGroup}>Г4</span>
            <span className={styles.chipLabel}>{t.home.exercises.g4label}</span>
            <span className={styles.chipStatus}>{t.home.exercises.soon}</span>
          </span>
        </div>
      </section>

      {/* Statistics */}
      <section>
        <h2 className={styles.sectionTitle}>{t.home.stats.section}</h2>
        <div className={styles.statsGrid}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>0</span>
            <span className={styles.statLabel}>{t.home.stats.days}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>0</span>
            <span className={styles.statLabel}>{t.home.stats.letters}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>0</span>
            <span className={styles.statLabel}>{t.home.stats.groups}</span>
          </div>
        </div>
      </section>

      {/* Continue CTA */}
      <Link href="/letters/house-1" style={{ textDecoration: 'none' }}>
        <Button variant="primary" fullWidth>
          {t.home.startBtn}
          <Icon name="arrow_right" size={18} />
        </Button>
      </Link>
    </div>
  )
}

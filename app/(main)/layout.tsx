import { Navbar } from '@/components/layout/Navbar'
import { DailySessionResume } from '@/components/daily-session/DailySessionResume'
import styles from './layout.module.css'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <DailySessionResume />
        {children}
      </main>
    </>
  )
}

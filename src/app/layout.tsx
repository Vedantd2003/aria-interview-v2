import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ARIA — AI Interview Platform',
  description: "Voice-first AI mock interviews with real-time feedback. Practice like it's real.",
  keywords: ['AI interview', 'mock interview', 'voice AI', 'interview prep'],
  openGraph: {
    title: 'ARIA — AI Interview Platform',
    description: 'Practice interviews that feel real.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body>
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            },
          }}
        />
      </body>
    </html>
  )
}

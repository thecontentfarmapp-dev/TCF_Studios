import type { Metadata } from 'next'
import { Inter, Bebas_Neue } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

const bebasNeue = Bebas_Neue({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400'],
})

export const metadata: Metadata = {
  title: 'TCF Studios',
  description: 'The Content Farm Studios — Production Management System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${bebasNeue.variable} h-full`}>
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}

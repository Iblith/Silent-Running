import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Star Wars FFG: Campaign 2',
  description: 'Campaign management system for the Star Wars FFG: Campaign 2 tabletop RPG.',
  openGraph: {
    title: 'Star Wars FFG: Campaign 2',
    description: 'Campaign management system for the Star Wars FFG: Campaign 2 tabletop RPG.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Star Wars FFG: Campaign 2',
    description: 'Campaign management system for the Star Wars FFG: Campaign 2 tabletop RPG.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&family=Exo+2:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}

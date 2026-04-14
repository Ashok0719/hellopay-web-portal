import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'HelloPay | Advanced UPI Claims & Stock Registry',
  description: 'The futuristic fintech ecosystem for secure stock listings, UPI-verified claims, and real-time payment reconciliation.',
  keywords: ['fintech', 'upi', 'stock registry', 'hellopay', 'secure payments', 'india', 'neural core'],
  authors: [{ name: 'HelloPay Neural' }],
  openGraph: {
    title: 'HelloPay | Secure UPI Claims Ecosystem',
    description: 'Transforming stock claims with UPI-ready security and real-time verification.',
    url: 'https://hellopayapp.com',
    siteName: 'HelloPay',
    locale: 'en_IN',
    type: 'website',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

import FirebaseManager from './FirebaseManager'
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${outfit.variable}`}>
      <body className="font-outfit antialiased transition-colors duration-700">
        <FirebaseManager />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}


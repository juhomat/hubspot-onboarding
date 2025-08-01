import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HubSpot Onboarding - Valve',
  description: 'HubSpot onboarding project management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <header className="bg-valve-dark text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold">Valve</h1>
                <span className="ml-4 text-valve-accent">HubSpot Onboarding</span>
              </div>
              <nav className="hidden md:flex space-x-8">
                <a href="#" className="hover:text-valve-accent transition-colors">Projects</a>
                <a href="#" className="hover:text-valve-accent transition-colors">Settings</a>
              </nav>
            </div>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
} 
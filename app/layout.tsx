import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Casey Financial OS - Dashboard',
  description: 'Personal Chief Financial Officer Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-executive-darker text-slate-100">
        {children}
      </body>
    </html>
  )
}

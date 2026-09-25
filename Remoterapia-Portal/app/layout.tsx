import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
const nunito = Nunito({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900']
})
export const metadata: Metadata = {
  title: 'Remoterapia · Agendamento Oficial',
  description: 'Portal do Aluno e Reservas Remoterapia',
}
export const viewport: Viewport = {
  themeColor: '#1D70B8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${nunito.className} antialiased text-slate-900 dark:text-slate-100 bg-[#e0f2fe] dark:bg-[#070d1e] min-h-screen transition-colors duration-300`}>
        {children}
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/components/LanguageProvider'
import { AuthProvider } from '@/components/AuthProvider'
import { Toaster } from 'react-hot-toast'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'HR Tizimi — ADA Lazzatli Sifat',
  description: 'ADA Lazzatli Sifat HR va Davomat tizimi',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className="h-full">
      <body className={`${jakarta.className} h-full`}>
        <LanguageProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  fontWeight: '500',
                  borderRadius: '12px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                },
              }}
            />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}

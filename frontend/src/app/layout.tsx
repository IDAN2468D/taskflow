import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'TaskFlow Pro | ניהול משימות ובינה מלאכותית',
  description: 'פלטפורמת ניהול משימות מבוזרת מבוססת AI, Kafka ו-Next.js',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased min-h-screen font-sans bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

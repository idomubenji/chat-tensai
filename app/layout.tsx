import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Slack-like Messaging App',
  description: 'A simple Slack-like messaging application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <SupabaseProvider>
          <main className="h-full">
            {children}
          </main>
        </SupabaseProvider>
      </body>
    </html>
  );
}

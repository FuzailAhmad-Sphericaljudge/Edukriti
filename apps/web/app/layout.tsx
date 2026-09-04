import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://edukriti-ai-teacher.fuzailahmad2006.chatgpt.site'),
  title: 'Edukriti — Your adaptive AI teacher',
  description:
    'Personalized, multilingual, video-led lessons that explain, question, and adapt to every learner.',
  openGraph: {
    title: 'Edukriti',
    description: 'Your adaptive AI teacher',
    images: [{ url: '/og.png', width: 1536, height: 1024, alt: 'Edukriti — Your adaptive AI teacher' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Edukriti',
    description: 'Your adaptive AI teacher',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

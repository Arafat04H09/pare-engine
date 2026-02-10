import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Pare | AI Visibility Consulting',
    template: '%s | Pare',
  },
  description:
    'Pare audits how AI engines see your business and gives you a clear roadmap to get found, recommended, and chosen by ChatGPT, Perplexity, and Gemini.',
  keywords: [
    'GEO', 'generative engine optimization', 'AI visibility', 'AI audit',
    'ChatGPT optimization', 'Perplexity optimization', 'local SEO AI',
  ],
  openGraph: {
    title: 'Pare | AI Visibility Consulting',
    description: 'Find out how AI engines see your business. Get a free AI Readiness Score.',
    url: 'https://getpare.com',
    siteName: 'Pare',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pare | AI Visibility Consulting',
    description: 'Find out how AI engines see your business. Get a free AI Readiness Score.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white antialiased">{children}</body>
    </html>
  );
}

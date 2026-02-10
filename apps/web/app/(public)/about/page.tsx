import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Generative Engine Optimization (GEO) and how Pare helps businesses get found by AI.',
};

export default function AboutPage() {
  const pillars = [
    { name: 'AI Visibility', weight: 30, desc: 'How often AI engines mention, cite, and recommend your business.' },
    { name: 'Content Quality', weight: 30, desc: 'Whether your content is structured for AI consumption: answer-first format, FAQs, statistics, authority signals.' },
    { name: 'Schema / Structured Data', weight: 15, desc: 'JSON-LD markup that helps AI engines understand your business entity, services, and reviews.' },
    { name: 'Technical Readiness', weight: 10, desc: 'robots.txt AI crawler rules, llms.txt, sitemap, mobile-friendliness, and SSL.' },
    { name: 'Local/GBP + Third-Party', weight: 15, desc: 'Google Business Profile completeness, NAP consistency, reviews, and directory presence.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-2xl font-bold text-navy mb-8 inline-block">pare</Link>
          <h1 className="text-4xl md:text-5xl font-bold text-navy mb-6">About Pare</h1>
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-navy-400 mb-8">
              Pare is a Generative Engine Optimization (GEO) consulting agency. We help local businesses
              get found, recommended, and chosen by AI-powered search engines like ChatGPT, Perplexity, and Gemini.
            </p>
            <h2 className="text-2xl font-bold text-navy mb-4">What is GEO?</h2>
            <p className="text-navy-400 mb-8">
              Traditional SEO optimizes for Google&apos;s 10 blue links. GEO optimizes for AI-generated responses,
              where only 2-7 businesses get mentioned. AI engines weigh different signals than traditional search:
              structured data, answer-first content, authoritative citations, and verified business information.
            </p>
            <h2 className="text-2xl font-bold text-navy mb-6">The 5 Pillars of AI Readiness</h2>
            <div className="space-y-4 mb-12">
              {pillars.map((pillar) => (
                <div key={pillar.name} className="flex gap-4 p-4 rounded-xl border border-navy-100">
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-navy flex items-center justify-center">
                    <span className="text-teal font-bold font-mono text-lg">{pillar.weight}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-navy">{pillar.name}</h3>
                    <p className="text-navy-400 text-sm">{pillar.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link href="/contact" className="inline-block bg-teal text-navy font-bold px-8 py-4 rounded-lg text-lg hover:bg-teal-400 transition-colors">
                Get Your Free AI Readiness Score
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

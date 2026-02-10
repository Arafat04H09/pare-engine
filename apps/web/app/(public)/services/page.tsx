import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Services',
  description: 'AI Visibility Audit, Implementation Sprint, and Monthly Retainer services from Pare.',
};

export default function ServicesPage() {
  const services = [
    {
      name: 'AI Visibility Audit',
      price: 'Free / $497',
      desc: 'Comprehensive analysis of how AI engines see your business.',
      features: [
        'Query 3 AI engines (ChatGPT, Perplexity, Gemini)',
        '0-100 AI Readiness Score across 5 pillars',
        'Free: 1-page mini report with top 3 findings',
        'Paid: 9-page full report with detailed action plan',
        'Schema markup gap analysis',
        'Competitor mention tracking',
      ],
      cta: 'Get Your Free Audit',
      href: '/contact',
      highlighted: false,
    },
    {
      name: '4-Week Sprint',
      price: '$2,500',
      desc: 'Hands-on implementation of your AI readiness action plan.',
      features: [
        'Full audit included',
        'Schema markup implementation',
        'Content optimization for AI engines',
        'Technical fixes (robots.txt, llms.txt, sitemap)',
        'GBP optimization',
        'Weekly progress reports',
        'Post-sprint verification audit',
      ],
      cta: 'Start Your Sprint',
      href: '/contact',
      highlighted: true,
    },
    {
      name: 'Monthly Retainer',
      price: '$1,500/mo',
      desc: 'Ongoing monitoring and optimization as AI engines evolve.',
      features: [
        'Monthly re-audits with trend tracking',
        'Continuous content optimization',
        'New schema types as AI engines evolve',
        'Competitor monitoring',
        'Monthly strategy call',
        'Priority support',
      ],
      cta: 'Learn More',
      href: '/contact',
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Link href="/" className="text-2xl font-bold text-navy mb-8 inline-block">pare</Link>
            <h1 className="text-4xl md:text-5xl font-bold text-navy mb-4">Our Services</h1>
            <p className="text-xl text-navy-400 max-w-2xl mx-auto">
              From a free audit to full implementation and ongoing optimization.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service) => (
              <div
                key={service.name}
                className={`rounded-2xl p-8 border ${
                  service.highlighted
                    ? 'border-teal bg-navy text-white shadow-xl scale-105'
                    : 'border-navy-100 bg-white'
                }`}
              >
                <h2 className={`text-2xl font-bold mb-2 ${service.highlighted ? 'text-white' : 'text-navy'}`}>
                  {service.name}
                </h2>
                <p className={`text-3xl font-bold font-mono mb-4 ${service.highlighted ? 'text-teal' : 'text-teal'}`}>
                  {service.price}
                </p>
                <p className={`mb-6 ${service.highlighted ? 'text-navy-200' : 'text-navy-400'}`}>
                  {service.desc}
                </p>
                <ul className="space-y-3 mb-8">
                  {service.features.map((feature) => (
                    <li key={feature} className={`flex items-start gap-2 ${service.highlighted ? 'text-navy-100' : 'text-navy-400'}`}>
                      <span className="text-teal mt-1">&#10003;</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={service.href}
                  className={`block text-center font-semibold py-3 px-6 rounded-lg transition-colors ${
                    service.highlighted
                      ? 'bg-teal text-navy hover:bg-teal-400'
                      : 'bg-navy text-white hover:bg-navy-600'
                  }`}
                >
                  {service.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

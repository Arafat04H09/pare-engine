import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pare | Is Your Business Invisible to AI?',
};

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-navy-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-navy">pare</Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/services" className="text-navy-400 hover:text-navy transition-colors">Services</Link>
          <Link href="/about" className="text-navy-400 hover:text-navy transition-colors">About</Link>
          <Link href="/contact" className="text-navy-400 hover:text-navy transition-colors">Contact</Link>
          <Link href="/contact" className="bg-teal text-navy font-semibold px-5 py-2 rounded-lg hover:bg-teal-400 transition-colors">Free Audit</Link>
        </nav>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-navy leading-tight mb-6">
          Is Your Business{' '}<span className="text-gradient">Invisible to AI?</span>
        </h1>
        <p className="text-xl text-navy-400 mb-8 max-w-2xl mx-auto">
          527% more consumers use AI engines to find local businesses. If ChatGPT,
          Perplexity, or Gemini can&apos;t find you, you&apos;re losing customers right now.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact" className="bg-teal text-navy font-bold px-8 py-4 rounded-lg text-lg hover:bg-teal-400 transition-colors">Get Your Free AI Score</Link>
          <Link href="/services" className="border-2 border-navy text-navy font-bold px-8 py-4 rounded-lg text-lg hover:bg-navy-50 transition-colors">See How It Works</Link>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const items = [
    { stat: '60%', text: 'of AI-generated answers never link to a source. If you are not mentioned by name, you do not exist.' },
    { stat: '527%', text: 'increase in consumers using AI to find local businesses in the past year.' },
    { stat: '2-7', text: 'businesses get mentioned per AI response. Traditional SEO ranked 10. The bar is higher now.' },
  ];
  return (
    <section className="py-20 px-6 bg-navy-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-12">The Problem: AI Is Replacing Search</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {items.map((item) => (
            <div key={item.stat} className="bg-white rounded-xl p-8 shadow-sm border border-navy-100">
              <p className="text-4xl font-bold text-teal mb-3 font-mono">{item.stat}</p>
              <p className="text-navy-400">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-4">The Solution: Generative Engine Optimization</h2>
        <p className="text-center text-navy-400 mb-12 max-w-2xl mx-auto">GEO is the practice of optimizing your online presence so AI engines recommend your business. We audit, score, and fix.</p>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <h3 className="text-xl font-bold text-navy mb-2">Audit</h3>
            <p className="text-navy-400">We query ChatGPT, Perplexity, and Gemini about your business and score your AI readiness on a 0-100 scale.</p>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-navy mb-2">Implement</h3>
            <p className="text-navy-400">We execute a 4-week sprint of structured data, content, and technical fixes tailored to your business.</p>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-navy mb-2">Verify</h3>
            <p className="text-navy-400">We re-audit monthly to prove the impact and keep you ahead as AI engines evolve.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { step: '01', title: 'Submit Your URL', desc: 'Enter your website and business name.' },
    { step: '02', title: 'We Query AI Engines', desc: 'ChatGPT, Perplexity, and Gemini are asked about your business.' },
    { step: '03', title: 'Get Your Score', desc: 'Receive a 0-100 AI Readiness Score across 5 pillars.' },
    { step: '04', title: 'Action Plan', desc: 'Get a prioritized list of fixes ranked by impact.' },
  ];
  return (
    <section className="py-20 px-6 bg-navy">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((item) => (
            <div key={item.step} className="text-center">
              <p className="text-5xl font-bold text-teal font-mono mb-3">{item.step}</p>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-navy-200">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyNowSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-navy mb-8">Why Now?</h2>
        <p className="text-lg text-navy-400 mb-12 max-w-2xl mx-auto">AI engines are rewriting how consumers discover businesses. The companies that optimize first will own the AI recommendations for their category.</p>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl border border-navy-100"><p className="text-3xl font-bold text-teal font-mono mb-2">527%</p><p className="text-navy-400">increase in AI search usage</p></div>
          <div className="p-6 rounded-xl border border-navy-100"><p className="text-3xl font-bold text-teal font-mono mb-2">60%</p><p className="text-navy-400">of AI answers cite no sources</p></div>
          <div className="p-6 rounded-xl border border-navy-100"><p className="text-3xl font-bold text-teal font-mono mb-2">2-7</p><p className="text-navy-400">businesses per AI response</p></div>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    { q: 'What is GEO?', a: 'Generative Engine Optimization (GEO) is the practice of optimizing your online presence so AI-powered search engines like ChatGPT, Perplexity, and Gemini recommend your business when consumers ask questions about your industry.' },
    { q: 'How is this different from SEO?', a: 'SEO optimizes for Google search rankings (10 blue links). GEO optimizes for AI-generated responses, which often cite only 2-7 businesses. AI engines weigh different signals: structured data, answer-first content, authoritative citations, and verified business information.' },
    { q: 'How do you calculate the AI Readiness Score?', a: 'We evaluate 5 pillars: AI Visibility (30 pts), Content Quality (30 pts), Schema/Structured Data (15 pts), Technical Readiness (10 pts), and Local/GBP + Third-Party Signals (15 pts). The total is a 0-100 score with a letter grade.' },
    { q: 'What does the free audit include?', a: 'A 1-page mini report with your overall AI Readiness Score, a breakdown across all 5 pillars, your top 3 findings, and a clear next step. The full 9-page audit with a detailed action plan is available as a paid service.' },
    { q: 'How long does implementation take?', a: 'Our standard implementation sprint is 4 weeks. We handle structured data markup, content optimization, technical fixes, and GBP enhancements. Most clients see measurable improvements within 6-8 weeks of starting.' },
  ];
  return (
    <section className="py-20 px-6 bg-navy-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {faqs.map((faq) => (
            <details key={faq.q} className="bg-white rounded-xl p-6 shadow-sm border border-navy-100 group">
              <summary className="text-lg font-semibold text-navy cursor-pointer list-none flex justify-between items-center">
                {faq.q}
                <span className="text-teal group-open:rotate-45 transition-transform text-2xl">+</span>
              </summary>
              <p className="mt-4 text-navy-400">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 px-6 bg-navy">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Be Found by AI?</h2>
        <p className="text-navy-200 mb-8 text-lg">Get your free AI Readiness Score in under 2 minutes. No credit card required.</p>
        <Link href="/contact" className="inline-block bg-teal text-navy font-bold px-8 py-4 rounded-lg text-lg hover:bg-teal-400 transition-colors">Start Your Free Audit</Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-navy-100">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <p className="text-2xl font-bold text-navy">pare</p>
          <p className="text-sm text-navy-300 mt-1">AI Visibility Consulting</p>
        </div>
        <nav className="flex gap-6">
          <Link href="/services" className="text-navy-400 hover:text-navy transition-colors">Services</Link>
          <Link href="/about" className="text-navy-400 hover:text-navy transition-colors">About</Link>
          <Link href="/contact" className="text-navy-400 hover:text-navy transition-colors">Contact</Link>
        </nav>
        <p className="text-sm text-navy-300">This website scores 94/100 on our own AI Readiness audit.</p>
      </div>
    </footer>
  );
}

export function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <WhyNowSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}

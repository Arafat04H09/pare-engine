import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Pare for a free AI Visibility Audit or to discuss your GEO strategy.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="text-2xl font-bold text-navy mb-8 inline-block">pare</Link>
          <h1 className="text-4xl md:text-5xl font-bold text-navy mb-4">Get In Touch</h1>
          <p className="text-xl text-navy-400 mb-12 max-w-2xl">
            Ready to find out how AI engines see your business? Start with a free audit
            or schedule a strategy call.
          </p>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-navy mb-6">Request an Audit</h2>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-navy mb-1">Name</label>
                  <input type="text" id="name" name="name" required className="w-full px-4 py-3 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-teal" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-navy mb-1">Email</label>
                  <input type="email" id="email" name="email" required className="w-full px-4 py-3 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-teal" />
                </div>
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-navy mb-1">Website URL</label>
                  <input type="url" id="website" name="website" placeholder="https://" className="w-full px-4 py-3 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-teal" />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-navy mb-1">What are you interested in?</label>
                  <select id="subject" name="subject" className="w-full px-4 py-3 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-teal">
                    <option value="free-audit">Free AI Visibility Audit</option>
                    <option value="full-audit">Full Audit ($497)</option>
                    <option value="sprint">4-Week Sprint ($2,500)</option>
                    <option value="retainer">Monthly Retainer ($1,500/mo)</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-navy mb-1">Message (optional)</label>
                  <textarea id="message" name="message" rows={4} className="w-full px-4 py-3 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-teal" />
                </div>
                <button type="submit" className="w-full bg-teal text-navy font-bold py-3 px-6 rounded-lg hover:bg-teal-400 transition-colors">
                  Submit
                </button>
              </form>
            </div>
            <div className="space-y-8">
              <div className="p-6 rounded-xl bg-navy-50 border border-navy-100">
                <h3 className="font-bold text-navy mb-2">Email Us</h3>
                <p className="text-navy-400">hello@getpare.com</p>
              </div>
              <div className="p-6 rounded-xl bg-navy-50 border border-navy-100">
                <h3 className="font-bold text-navy mb-2">Book a Strategy Call</h3>
                <p className="text-navy-400 mb-3">30 minutes to discuss your AI visibility strategy. No commitment.</p>
                <a href="#" className="text-teal font-semibold hover:text-teal-600 transition-colors">Schedule a Call &rarr;</a>
              </div>
              <div className="p-6 rounded-xl bg-navy-50 border border-navy-100">
                <h3 className="font-bold text-navy mb-2">Free Audit</h3>
                <p className="text-navy-400 mb-3">Get your AI Readiness Score and a 1-page mini report. Takes under 2 minutes.</p>
                <Link href="/contact" className="text-teal font-semibold hover:text-teal-600 transition-colors">Start Now &rarr;</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

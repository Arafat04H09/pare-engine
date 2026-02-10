// Owner: S15 (Audit Form + Stripe)
// /audit -- Business audit request form with Stripe Checkout integration.
// Validates with AuditRequestSchema (minus clientId) via zodResolver + react-hook-form.

'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'next/navigation';

const AuditFormSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  domain: z
    .string()
    .min(1, 'Domain is required')
    .refine(
      (val) => {
        const cleaned = val.replace(/^https?:\/\//, '').replace(/\/+$/, '');
        return cleaned.length > 0 && cleaned.includes('.');
      },
      { message: 'Enter a valid domain (e.g., example.com)' }
    ),
  vertical: z.string().min(1, 'Industry vertical is required'),
  city: z.string().optional(),
  state: z.string().optional(),
  contactEmail: z.string().email('Valid email address is required'),
  competitors: z.array(z.string()).default([]),
});

type AuditFormValues = z.infer<typeof AuditFormSchema>;

const VERTICALS = [
  'Dental', 'Legal', 'Medical', 'Real Estate', 'Home Services',
  'Financial Services', 'Hospitality', 'Restaurants', 'Fitness & Wellness',
  'Automotive', 'Veterinary', 'Education', 'E-commerce', 'SaaS', 'Other',
] as const;

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
] as const;

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function FormField({ label, error, required, children }: FormFieldProps): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>
        {label}
        {required && <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: '12px', color: '#EF4444', margin: 0 }}>{error}</p>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #CBD5E1',
  borderRadius: '8px',
  fontSize: '14px',
  color: '#1E293B',
  backgroundColor: '#FFFFFF',
  outline: 'none',
  boxSizing: 'border-box',
};

export function AuditPage(): React.ReactElement {
  const searchParams = useSearchParams();
  const cancelled = searchParams.get('cancelled') === 'true';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [competitorInput, setCompetitorInput] = useState('');
  const [competitors, setCompetitors] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<AuditFormValues>({
    resolver: zodResolver(AuditFormSchema),
    defaultValues: {
      businessName: '',
      domain: '',
      vertical: '',
      city: '',
      state: '',
      contactEmail: '',
      competitors: [],
    },
  });

  function addCompetitor(): void {
    const trimmed = competitorInput.trim();
    if (trimmed && competitors.length < 5 && !competitors.includes(trimmed)) {
      const updated = [...competitors, trimmed];
      setCompetitors(updated);
      setValue('competitors', updated);
      setCompetitorInput('');
    }
  }

  function removeCompetitor(index: number): void {
    const updated = competitors.filter((_, i) => i !== index);
    setCompetitors(updated);
    setValue('competitors', updated);
  }

  async function onSubmit(data: AuditFormValues): Promise<void> {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/audit/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, competitors }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSubmitError(result.error || 'Something went wrong. Please try again.');
        return;
      }

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('[S15] Form submission error:', error);
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1B2A4A', marginBottom: '12px' }}>
          AI Readiness Audit
        </h1>
        <p style={{ fontSize: '18px', color: '#64748B', lineHeight: 1.6 }}>
          Find out how AI engines see your business. Get a comprehensive 5-pillar score (0-100) with actionable recommendations.
        </p>
        <p style={{ fontSize: '24px', fontWeight: 600, color: '#1B2A4A', marginTop: '16px' }}>
          $750 <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 400 }}>one-time</span>
        </p>
      </div>

      {cancelled && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', marginBottom: '24px', color: '#DC2626', fontSize: '14px' }}>
          Payment was cancelled. You can try again when ready.
        </div>
      )}

      {submitError && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', marginBottom: '24px', color: '#DC2626', fontSize: '14px' }}>
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <FormField label="Business Name" error={errors.businessName?.message} required>
          <input {...register('businessName')} type="text" placeholder="Acme Dental Group" style={inputStyle} />
        </FormField>

        <FormField label="Website Domain" error={errors.domain?.message} required>
          <input {...register('domain')} type="text" placeholder="acmedental.com" style={inputStyle} />
        </FormField>

        <FormField label="Industry Vertical" error={errors.vertical?.message} required>
          <select {...register('vertical')} style={inputStyle}>
            <option value="">Select your industry...</option>
            {VERTICALS.map((v) => (
              <option key={v} value={v.toLowerCase()}>{v}</option>
            ))}
          </select>
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="City" error={errors.city?.message}>
            <input {...register('city')} type="text" placeholder="Austin" style={inputStyle} />
          </FormField>
          <FormField label="State" error={errors.state?.message}>
            <select {...register('state')} style={inputStyle}>
              <option value="">Select...</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Email Address" error={errors.contactEmail?.message} required>
          <input {...register('contactEmail')} type="email" placeholder="owner@acmedental.com" style={inputStyle} />
          <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Your audit report will be delivered here.</p>
        </FormField>

        <FormField label="Competitors (optional, up to 5)">
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={competitorInput}
              onChange={(e) => setCompetitorInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCompetitor(); } }}
              placeholder="competitor-domain.com"
              style={{ ...inputStyle, flex: 1 }}
              disabled={competitors.length >= 5}
            />
            <button
              type="button"
              onClick={addCompetitor}
              disabled={competitors.length >= 5 || !competitorInput.trim()}
              style={{
                padding: '8px 16px',
                backgroundColor: competitors.length >= 5 ? '#E2E8F0' : '#1B2A4A',
                color: competitors.length >= 5 ? '#94A3B8' : '#FFFFFF',
                border: 'none', borderRadius: '8px',
                cursor: competitors.length >= 5 ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontWeight: 500,
              }}
            >Add</button>
          </div>
          {competitors.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {competitors.map((comp, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', backgroundColor: '#F1F5F9', borderRadius: '999px', fontSize: '13px', color: '#334155' }}>
                  {comp}
                  <button type="button" onClick={() => removeCompetitor(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '16px', lineHeight: 1, padding: 0 }} aria-label={`Remove ${comp}`}>x</button>
                </span>
              ))}
            </div>
          )}
        </FormField>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%', padding: '14px 24px',
            backgroundColor: isSubmitting ? '#94A3B8' : '#00D4AA',
            color: '#1B2A4A', border: 'none', borderRadius: '8px',
            fontSize: '16px', fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            marginTop: '8px', transition: 'background-color 200ms',
          }}
        >
          {isSubmitting ? 'Redirecting to payment...' : 'Continue to Payment ($750)'}
        </button>

        <p style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center', lineHeight: 1.5 }}>
          Secure payment via Stripe. You will be redirected to complete your purchase.
          Your audit report will be delivered within 24 hours.
        </p>
      </form>
    </div>
  );
}

function AuditPageWrapper(): React.ReactElement {
  return (
    <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>}>
      <AuditPage />
    </Suspense>
  );
}

export { AuditPageWrapper as default };

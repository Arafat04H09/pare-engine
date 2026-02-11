// Review Analysis & Campaign Management page.
// Task 4.1: Semantic Review Orchestration — admin UI.
export const dynamic = 'force-dynamic';

import { db } from '../../../../../lib/db';
import { auditResults, clients } from '@pare-engine/core';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReviewsClient } from './reviews-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewsPage({ params }: PageProps): Promise<JSX.Element> {
  const { id } = await params;

  // Fetch audit result
  const auditRows = await db
    .select()
    .from(auditResults)
    .where(eq(auditResults.id, id))
    .limit(1);

  const audit = auditRows[0];
  if (!audit) {
    notFound();
  }

  // Fetch client info
  let clientName = '--';
  let clientDomain = '';
  let clientVertical = 'general';
  let clientGooglePlaceId: string | undefined;

  if (audit.clientId) {
    const clientRows = await db
      .select({
        businessName: clients.businessName,
        domain: clients.domain,
        vertical: clients.vertical,
        googlePlaceId: clients.googlePlaceId,
      })
      .from(clients)
      .where(eq(clients.id, audit.clientId))
      .limit(1);

    if (clientRows[0]) {
      clientName = clientRows[0].businessName;
      clientDomain = clientRows[0].domain;
      clientVertical = clientRows[0].vertical;
      clientGooglePlaceId = clientRows[0].googlePlaceId ?? undefined;
    }
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb + Title */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/admin/audits" className="hover:text-gray-700">
            Audits
          </Link>
          <span>/</span>
          <Link href={`/admin/audits/${id}`} className="hover:text-gray-700">
            Detail
          </Link>
          <span>/</span>
          <span className="text-gray-900">Reviews</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-[#1B2A4A]">
          Review Analysis &amp; Campaign
        </h1>
        <p className="text-sm text-gray-500">
          {clientName} ({clientDomain}) &mdash; {clientVertical}
        </p>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Overall Score
          </p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {audit.overallScore}
            <span className="ml-1 text-lg text-gray-500">
              {audit.letterGrade}
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Local/GBP Score
          </p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {audit.gbpScore ?? '--'}
            <span className="ml-1 text-sm font-normal text-gray-500">
              / 15
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Vertical
          </p>
          <p className="mt-1 text-lg font-semibold capitalize text-gray-900">
            {clientVertical}
          </p>
        </div>
      </div>

      {/* Client Component for Interactive Analysis + Campaign */}
      <ReviewsClient
        auditId={id}
        businessName={clientName}
        vertical={clientVertical}
        clientGooglePlaceId={clientGooglePlaceId}
      />
    </div>
  );
}

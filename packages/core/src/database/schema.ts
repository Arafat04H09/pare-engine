import { pgTable, uuid, text, integer, timestamp, date, boolean, numeric, jsonb, index, unique } from 'drizzle-orm/pg-core';

export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessName: text('business_name').notNull(),
  domain: text('domain').notNull(),
  vertical: text('vertical').notNull(), // 'dental', 'legal', etc.
  cmsType: text('cms_type'),
  locationCity: text('location_city'),
  locationState: text('location_state'),
  googlePlaceId: text('google_place_id'),
  primaryContactName: text('primary_contact_name'),
  primaryContactEmail: text('primary_contact_email'),
  primaryContactPhone: text('primary_contact_phone'),
  engagementType: text('engagement_type').default('prospect'),
  sprintStatus: text('sprint_status'),
  retainerTier: text('retainer_tier'),
  retainerStartDate: date('retainer_start_date'),
  monthlyRetainerAmount: numeric('monthly_retainer_amount', { precision: 8, scale: 2 }),
  initialAuditScore: integer('initial_audit_score'),
  currentScore: integer('current_score'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const auditResults = pgTable('audit_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  auditDate: timestamp('audit_date').notNull().defaultNow(),
  auditType: text('audit_type').notNull(),
  overallScore: integer('overall_score').notNull(),
  letterGrade: text('letter_grade').notNull(),
  aiVisibilityScore: integer('ai_visibility_score'),
  schemaScore: integer('schema_score'),
  contentScore: integer('content_score'),
  technicalScore: integer('technical_score'),
  gbpScore: integer('gbp_score'),
  detailedResults: jsonb('detailed_results').notNull(),
  reportPdfUrl: text('report_pdf_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const monitoringResults = pgTable('monitoring_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  executionDate: timestamp('execution_date').notNull().defaultNow(),
  platform: text('platform').notNull(),
  queryText: text('query_text').notNull(),
  queryCategory: text('query_category'),
  responseHash: text('response_hash'),
  brandMentioned: boolean('brand_mentioned').default(false),
  brandPosition: integer('brand_position'),
  brandSentiment: text('brand_sentiment'),
  brandUrlCited: boolean('brand_url_cited').default(false),
  citedUrls: jsonb('cited_urls').default([]),
  competitorMentions: jsonb('competitor_mentions').default({}),
  fullResponse: text('full_response'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    clientDateIdx: index('idx_monitoring_client_date').on(table.clientId, table.executionDate),
    platformIdx: index('idx_monitoring_platform').on(table.platform),
  };
});

export const deliverables = pgTable('deliverables', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  sprintWeek: integer('sprint_week'),
  deliverableType: text('deliverable_type').notNull(),
  deliverableName: text('deliverable_name').notNull(),
  status: text('status').default('pending'),
  targetUrl: text('target_url'),
  implementationNotes: text('implementation_notes'),
  generatedCode: text('generated_code'),
  cmsInstructions: text('cms_instructions'),
  dueDate: date('due_date'),
  completedDate: date('completed_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const promptLibrary = pgTable('prompt_library', {
    id: uuid('id').defaultRandom().primaryKey(),
    vertical: text('vertical').notNull(),
    promptText: text('prompt_text').notNull(),
    promptCategory: text('prompt_category'),
    queryType: text('query_type'),
    locationTemplate: boolean('location_template').default(true),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
});

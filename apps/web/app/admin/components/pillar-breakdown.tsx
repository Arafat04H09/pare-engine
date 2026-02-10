// Pillar breakdown: horizontal bar chart. Canonical weights: 30/30/15/10/15.
interface PillarData { name: string; score: number | null; maxScore: number; color: string; }
export function buildPillarData(a: { aiVisibilityScore: number | null; contentScore: number | null; schemaScore: number | null; technicalScore: number | null; gbpScore: number | null; }): PillarData[] {
  return [{ name: 'AI Visibility', score: a.aiVisibilityScore, maxScore: 30, color: '#3B82F6' },{ name: 'Content Quality', score: a.contentScore, maxScore: 30, color: '#8B5CF6' },{ name: 'Schema / Structured Data', score: a.schemaScore, maxScore: 15, color: '#F59E0B' },{ name: 'Technical Readiness', score: a.technicalScore, maxScore: 10, color: '#10B981' },{ name: 'Local/GBP + Third-Party', score: a.gbpScore, maxScore: 15, color: '#EF4444' }];
}
export function PillarBreakdown({ pillars }: { pillars: PillarData[] }) {
  return (<div className="space-y-4">{pillars.map((p) => { const pct = p.score != null ? Math.round((p.score / p.maxScore) * 100) : 0; return (<div key={p.name}><div className="mb-1 flex items-center justify-between text-sm"><span className="font-medium text-gray-700">{p.name}</span><span className="text-gray-500">{p.score ?? '--'} / {p.maxScore}</span></div><div className="h-3 w-full overflow-hidden rounded-full bg-gray-200"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: p.color }} /></div></div>); })}</div>);
}

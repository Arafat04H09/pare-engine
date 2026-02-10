// Score badge and circle components.
function gradeColor(g: string | null): string { const m: Record<string,string> = { A:'bg-green-100 text-green-800 border-green-200', B:'bg-blue-100 text-blue-800 border-blue-200', C:'bg-yellow-100 text-yellow-800 border-yellow-200', D:'bg-orange-100 text-orange-800 border-orange-200', F:'bg-red-100 text-red-800 border-red-200' }; return m[g ?? ''] ?? 'bg-gray-100 text-gray-800 border-gray-200'; }
function gradeRingColor(g: string | null): string { const m: Record<string,string> = { A:'#22C55E', B:'#3B82F6', C:'#F59E0B', D:'#F97316', F:'#EF4444' }; return m[g ?? ''] ?? '#9CA3AF'; }
interface ScoreBadgeProps { score: number | null; letterGrade: string | null; size?: 'sm' | 'md'; }
export function ScoreBadge({ score, letterGrade, size = 'md' }: ScoreBadgeProps) {
  const sc = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (<span className={`inline-flex items-center gap-1 rounded-full border font-medium ${gradeColor(letterGrade)} ${sc}`}><span>{score ?? '--'}</span>{letterGrade && <span className="font-bold">{letterGrade}</span>}</span>);
}
interface ScoreCircleProps { score: number | null; letterGrade: string | null; size?: number; }
export function ScoreCircle({ score, letterGrade, size = 120 }: ScoreCircleProps) {
  const r = (size - 12) / 2; const c = 2 * Math.PI * r; const p = score != null ? score / 100 : 0; const o = c * (1 - p); const color = gradeRingColor(letterGrade);
  return (<div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}><svg width={size} height={size} className="-rotate-90"><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={6} /><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round" /></svg><div className="absolute flex flex-col items-center"><span className="text-2xl font-bold text-gray-900">{score ?? '--'}</span>{letterGrade && <span className="text-sm font-semibold" style={{ color }}>{letterGrade}</span>}</div></div>);
}

// Empty state component.
import Link from 'next/link';
interface EmptyStateProps { title: string; description: string; actionLabel?: string; actionHref?: string; }
export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (<div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center"><h3 className="text-lg font-semibold text-gray-900">{title}</h3><p className="mt-2 text-sm text-gray-500">{description}</p>{actionLabel && actionHref && (<Link href={actionHref} className="mt-4 inline-block rounded-md bg-[#1B2A4A] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a3d66] transition-colors">{actionLabel}</Link>)}</div>);
}

// Stat card component for the admin dashboard.
interface StatCardProps { label: string; value: string | number; description?: string; trend?: { value: number; isPositive: boolean }; }
export function StatCard({ label, value, description, trend }: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {trend && <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>{trend.isPositive ? '+' : ''}{trend.value}%</span>}
      </div>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
  );
}

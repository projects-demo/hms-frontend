import { useEffect, useState } from 'react'
import { CalendarCheck, IndianRupee, BedDouble, PackageX, CalendarClock, Users2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { PageSpinner } from '@/components/ui/Spinner'
import { analyticsApi } from '@/lib/services/analytics'
import type { DashboardSummary, RevenueReport } from '@/types/domain'
import { formatCurrency, formatDate } from '@/lib/utils'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAuth } from '@/features/auth/AuthContext'

const todayIso = new Date().toISOString().slice(0, 10)

export default function DashboardPage() {
  const { session } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [revenue, setRevenue] = useState<RevenueReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 13)
    const fmt = (d: Date) => d.toISOString().slice(0, 10)

    Promise.all([
      analyticsApi.dashboardSummary(),
      analyticsApi.revenueReport(fmt(from), fmt(to)),
    ])
      .then(([s, r]) => { setSummary(s); setRevenue(r) })
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSpinner />

  const chartData = (revenue?.dailyBreakdown ?? []).map(d => ({
    date: formatDate(d.date).replace(/, \d{4}$/, ''),
    revenue: Number(d.revenue),
  }))

  return (
    <div>
      <PageHeader
        title={`Good day, ${session?.fullName?.split(' ')[0] ?? ''}`}
        description="Here's what's happening across the hospital today."
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard
          label="Today's appointments" value={summary?.todaysAppointments ?? 0}
          icon={<CalendarClock className="h-5 w-5" />} tone="primary"
          to={`/appointments?date=${todayIso}`}
        />
        <StatCard
          label="Completed today" value={summary?.todaysCompletedAppointments ?? 0}
          icon={<CalendarCheck className="h-5 w-5" />} tone="success"
          to={`/appointments?date=${todayIso}&status=COMPLETED`}
        />
        <StatCard
          label="Today's revenue" value={formatCurrency(summary?.todaysRevenue)}
          icon={<IndianRupee className="h-5 w-5" />} tone="accent"
          to="/reports"
        />
        <StatCard
          label="Active admissions" value={summary?.activeAdmissions ?? 0}
          icon={<Users2 className="h-5 w-5" />} tone="primary"
          to="/ipd?tab=admissions&status=ADMITTED"
        />
        <StatCard
          label="Bed occupancy"
          value={`${summary?.bedOccupancyPercent ?? 0}%`}
          hint={`${summary?.occupiedBeds ?? 0} / ${summary?.totalBeds ?? 0} beds`}
          icon={<BedDouble className="h-5 w-5" />} tone="warning"
          to="/ipd?tab=wards"
        />
        <StatCard
          label="Low stock / expiring"
          value={`${(summary?.lowStockDrugBatches ?? 0) + (summary?.expiringDrugBatches30Days ?? 0)}`}
          hint="drug batches need attention"
          icon={<PackageX className="h-5 w-5" />} tone="warning"
          to="/pharmacy?tab=alerts"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue — last 14 days</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-ink-400 py-10 text-center">No finalized bills in this period yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e2da" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#7c7568' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#7c7568' }} axisLine={false} tickLine={false} width={70}
                  tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v))}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e6e2da', fontSize: 13 }}
                />
                <Bar dataKey="revenue" fill="#227d74" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

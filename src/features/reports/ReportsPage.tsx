import { useEffect, useState } from 'react'
import { CalendarDays, TrendingUp, Users, Stethoscope, Building2, IndianRupee } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { analyticsApi } from '@/lib/services/analytics'
import type { OpdTrend, DoctorPerformance, DepartmentPerformance, RevenueBreakdown, Demographics } from '@/types/domain'
import { formatCurrency, formatDate, toTitleCase } from '@/lib/utils'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

function last30Days() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { from: fmt(from), to: fmt(to) }
}

export default function ReportsPage() {
  const defaults = last30Days()
  const [from, setFrom] = useState(defaults.from)
  const [to, setTo] = useState(defaults.to)
  const [appliedFrom, setAppliedFrom] = useState(defaults.from)
  const [appliedTo, setAppliedTo] = useState(defaults.to)
  const [tab, setTab] = useState('overview')

  const [opdTrend, setOpdTrend] = useState<OpdTrend | null>(null)
  const [doctors, setDoctors] = useState<DoctorPerformance[]>([])
  const [departments, setDepartments] = useState<DepartmentPerformance[]>([])
  const [revenue, setRevenue] = useState<RevenueBreakdown | null>(null)
  const [demographics, setDemographics] = useState<Demographics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      analyticsApi.opdTrend(appliedFrom, appliedTo),
      analyticsApi.doctorPerformance(appliedFrom, appliedTo),
      analyticsApi.departmentPerformance(appliedFrom, appliedTo),
      analyticsApi.revenueBreakdown(appliedFrom, appliedTo),
      analyticsApi.demographics(),
    ])
      .then(([t, d, dept, rev, demo]) => {
        setOpdTrend(t); setDoctors(d); setDepartments(dept); setRevenue(rev); setDemographics(demo)
      })
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [appliedFrom, appliedTo])

  function applyRange() {
    if (from > to) { toast.error('Start date must be before end date'); return }
    setAppliedFrom(from); setAppliedTo(to)
  }

  const topDoctor = doctors[0]
  const topDepartment = departments[0]

  return (
    <div>
      <PageHeader title="Reports & Analytics" description="OPD trends, doctor/department performance, revenue, and demographics." />

      <Card className="mb-5">
        <div className="p-4 flex flex-wrap items-end gap-3">
          <div>
            <p className="text-xs font-medium text-ink-500 mb-1.5">From</p>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div>
            <p className="text-xs font-medium text-ink-500 mb-1.5">To</p>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
          <Button onClick={applyRange}><CalendarDays className="h-4 w-4" /> Apply</Button>
          <p className="text-xs text-ink-400 ml-auto">Demographics reflect the current patient registry (not date-filtered).</p>
        </div>
      </Card>

      {loading ? <PageSpinner /> : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="opd">OPD Trend</TabsTrigger>
            <TabsTrigger value="doctors">Doctor-wise</TabsTrigger>
            <TabsTrigger value="departments">Department-wise</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              <StatCard label="Total visits" value={opdTrend?.totalVisits ?? 0} icon={<Users className="h-5 w-5" />} tone="primary" />
              <StatCard label="New vs follow-up" value={`${opdTrend?.newPercent ?? 0}% / ${opdTrend?.followupPercent ?? 0}%`} icon={<TrendingUp className="h-5 w-5" />} tone="accent" />
              <StatCard label="Total revenue" value={formatCurrency(revenue?.totalRevenue)} icon={<IndianRupee className="h-5 w-5" />} tone="success" />
              <StatCard label="Net revenue" value={formatCurrency(revenue?.netRevenue)} hint={`after ${formatCurrency(revenue?.discountTotal)} discounts`} icon={<IndianRupee className="h-5 w-5" />} tone="warning" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card>
                <CardHeader><CardTitle>Top doctor</CardTitle></CardHeader>
                <CardContent>
                  {topDoctor ? (
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-primary-700"><Stethoscope className="h-5 w-5" /></div>
                      <div>
                        <p className="font-semibold text-ink-900">{topDoctor.doctorName}</p>
                        <p className="text-xs text-ink-500">{topDoctor.departmentName} · {topDoctor.visitCount} visits · {formatCurrency(topDoctor.revenue)}</p>
                      </div>
                    </div>
                  ) : <p className="text-sm text-ink-400">No visits in this period.</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Top department</CardTitle></CardHeader>
                <CardContent>
                  {topDepartment ? (
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-100 text-accent-700"><Building2 className="h-5 w-5" /></div>
                      <div>
                        <p className="font-semibold text-ink-900">{topDepartment.departmentName}</p>
                        <p className="text-xs text-ink-500">{topDepartment.visitCount} visits · {formatCurrency(topDepartment.revenue)}</p>
                      </div>
                    </div>
                  ) : <p className="text-sm text-ink-400">No visits in this period.</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="opd">
            <Card>
              <CardHeader><CardTitle>Visit trend - new vs follow-up</CardTitle></CardHeader>
              <CardContent>
                {!opdTrend || opdTrend.dailyBreakdown.length === 0 ? (
                  <EmptyState title="No visits in this period" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={opdTrend.dailyBreakdown.map(d => ({ date: formatDate(d.date).replace(/, \d{4}$/, ''), New: d.newCount, 'Follow-up': d.followupCount }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e2da" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#7c7568' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#7c7568' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e6e2da', fontSize: 13 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="New" stackId="v" fill="#227d74" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Follow-up" stackId="v" fill="#fb6f45" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="doctors">
            <Card>
              {doctors.length === 0 ? <EmptyState title="No visits in this period" /> : (
                <Table>
                  <THead><TR><TH>Doctor</TH><TH>Department</TH><TH>Visits</TH><TH>Revenue collected</TH></TR></THead>
                  <TBody>
                    {doctors.map((d, i) => (
                      <TR key={d.doctorId}>
                        <TD className="font-medium text-ink-900">{d.doctorName} {i === 0 && <Badge variant="success" className="ml-1">Top</Badge>}</TD>
                        <TD>{d.departmentName}</TD>
                        <TD>{d.visitCount}</TD>
                        <TD>{formatCurrency(d.revenue)}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="departments">
            <Card>
              {departments.length === 0 ? <EmptyState title="No visits in this period" /> : (
                <Table>
                  <THead><TR><TH>Department</TH><TH>Visits</TH><TH>Revenue collected</TH></TR></THead>
                  <TBody>
                    {departments.map((d, i) => (
                      <TR key={d.departmentId}>
                        <TD className="font-medium text-ink-900">{d.departmentName} {i === 0 && <Badge variant="success" className="ml-1">Top</Badge>}</TD>
                        <TD>{d.visitCount}</TD>
                        <TD>{formatCurrency(d.revenue)}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="revenue">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              <StatCard label="OPD revenue" value={formatCurrency(revenue?.opdRevenue)} icon={<IndianRupee className="h-5 w-5" />} tone="primary" />
              <StatCard label="IPD revenue" value={formatCurrency(revenue?.ipdRevenue)} icon={<IndianRupee className="h-5 w-5" />} tone="accent" />
              <StatCard label="Pharmacy revenue" value={formatCurrency(revenue?.pharmacyRevenue)} icon={<IndianRupee className="h-5 w-5" />} tone="success" />
              <StatCard label="Bills finalized" value={revenue?.billCount ?? 0} hint={`${revenue?.transactionCount ?? 0} payment transactions`} icon={<IndianRupee className="h-5 w-5" />} tone="warning" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card>
                <CardHeader><CardTitle>Revenue summary</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-ink-500">Subtotal (billed)</span><span className="font-medium">{formatCurrency(revenue?.subtotalAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-ink-500">Discounts applied</span><span className="font-medium text-danger-600">-{formatCurrency(revenue?.discountTotal)}</span></div>
                  <div className="flex justify-between"><span className="text-ink-500">Tax</span><span className="font-medium">{formatCurrency(revenue?.taxTotal)}</span></div>
                  <div className="flex justify-between pt-2 border-t border-border"><span className="font-semibold text-ink-900">Net revenue</span><span className="font-semibold text-success-600">{formatCurrency(revenue?.netRevenue)}</span></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Payment method breakdown</CardTitle></CardHeader>
                <CardContent>
                  {!revenue || revenue.paymentModeBreakdown.length === 0 ? (
                    <p className="text-sm text-ink-400">No payments recorded in this period.</p>
                  ) : (
                    <div className="space-y-3">
                      {revenue.paymentModeBreakdown.map(p => (
                        <div key={p.mode}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-ink-700">{toTitleCase(p.mode)} <span className="text-ink-400">({p.count})</span></span>
                            <span className="font-medium">{formatCurrency(p.amount)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
                            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${revenue.totalRevenue > 0 ? (p.amount / revenue.totalRevenue) * 100 : 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="demographics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card>
                <CardHeader><CardTitle>By gender</CardTitle></CardHeader>
                <CardContent>
                  {!demographics || demographics.genderBreakdown.length === 0 ? <p className="text-sm text-ink-400">No patients registered yet.</p> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={demographics.genderBreakdown.map(g => ({ name: toTitleCase(g.gender), count: g.count }))} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e6e2da" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#7c7568' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12, fill: '#7c7568' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e6e2da', fontSize: 13 }} />
                        <Bar dataKey="count" fill="#227d74" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>By age group</CardTitle></CardHeader>
                <CardContent>
                  {!demographics || demographics.ageGroupBreakdown.length === 0 ? <p className="text-sm text-ink-400">No patients registered yet.</p> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={demographics.ageGroupBreakdown.map(a => ({ name: a.ageGroup, count: a.count }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e2da" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#7c7568' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#7c7568' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e6e2da', fontSize: 13 }} />
                        <Bar dataKey="count" fill="#fb6f45" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
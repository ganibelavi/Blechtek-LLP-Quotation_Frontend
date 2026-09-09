import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const cove = { blue: '#2a78d6', orange: '#eb6834', aqua: '#1baf7a', yellow: '#eda100', green: '#008300' };
const gridStroke = 'rgba(137,135,129,0.2)';
const axisTick = { fill: 'var(--text-muted)', fontSize: 11 };

function MetricCard({ label, value }) {
  return (
    <div className="dashboard-metric-card" style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', padding: '1rem' }}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 500, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function MetricGrid({ cards }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
      {cards.map((c, i) => <MetricCard key={i} label={c.label} value={c.value} />)}
    </div>
  );
}

function Legend({ items }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
      {items.map((it, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: it.color, display: 'inline-block' }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function ChartCard({ ariaLabel, legendItems, height = 240, children }) {
  return (
    <div className="dashboard-chart-card">
      <Legend items={legendItems} />
      <div style={{ position: 'relative', height }} role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChartGrid({ children }) {
  return (
    <div className="dashboard-chart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {children}
    </div>
  );
}

// ---- page data ----
const renewalStatus = [
  { name: 'Renewed', value: 55, color: cove.aqua },
  { name: 'Due soon', value: 28, color: cove.yellow },
  { name: 'Expired', value: 17, color: cove.orange },
];

const renewalsCompletedTrend = [
  { month: 'May', count: 1 },
  { month: 'Jun', count: 2 },
  { month: 'Jul', count: 2 },
  { month: 'Aug', count: 3 },
  { month: 'Sep', count: 4 },
];

const renewalsDueByMonth = [
  { month: 'May', due: 2 },
  { month: 'Jun', due: 3 },
  { month: 'Jul', due: 1 },
  { month: 'Aug', due: 4 },
  { month: 'Sep', due: 3 },
];

const valueByModule = [
  { name: 'ERP', value: 40, color: cove.blue },
  { name: 'CRM', value: 25, color: cove.orange },
  { name: 'HRMS', value: 20, color: cove.aqua },
  { name: 'Finance', value: 15, color: cove.yellow },
];

const activeVsExpiredByOrg = [
  { name: 'Org A', Active: 4, Expired: 1 },
  { name: 'Org B', Active: 3, Expired: 0 },
  { name: 'Org C', Active: 4, Expired: 1 },
  { name: 'Org D', Active: 3, Expired: 0 },
  { name: 'Org E', Active: 4, Expired: 0 },
];

export default function RenewalsPage() {
  return (
    <div className="dashboard-analytics-page">
      <MetricGrid
        cards={[
          { label: 'Active subscriptions', value: '18' },
          { label: 'Renewals due this month', value: '3' },
          { label: 'Expired subscriptions', value: '2' },
          { label: 'Subscription value', value: '₹4,80,000' },
        ]}
      />

      <ChartGrid>
        <ChartCard
          ariaLabel="Pie chart of renewal status"
          legendItems={[
            { color: cove.aqua, label: 'Renewed 55%' },
            { color: cove.yellow, label: 'Due soon 28%' },
            { color: cove.orange, label: 'Expired 17%' },
          ]}
        >
          <PieChart>
            <Tooltip />
            <Pie data={renewalStatus} dataKey="value" nameKey="name" outerRadius="80%">
              {renewalStatus.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Line chart of renewals completed per month"
          legendItems={[{ color: cove.blue, label: 'Renewals completed' }]}
        >
          <LineChart data={renewalsCompletedTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke={cove.blue} strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Bar chart of renewals due by month"
          legendItems={[{ color: cove.orange, label: 'Renewals due' }]}
        >
          <BarChart data={renewalsDueByMonth}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="due" fill={cove.orange} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Pie chart of subscription value by module"
          legendItems={[
            { color: cove.blue, label: 'ERP 40%' },
            { color: cove.orange, label: 'CRM 25%' },
            { color: cove.aqua, label: 'HRMS 20%' },
            { color: cove.yellow, label: 'Finance 15%' },
          ]}
        >
          <PieChart>
            <Tooltip />
            <Pie data={valueByModule} dataKey="value" nameKey="name" outerRadius="80%">
              {valueByModule.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Bar chart of active versus expired subscriptions by organization"
          legendItems={[
            { color: cove.aqua, label: 'Active' },
            { color: cove.orange, label: 'Expired' },
          ]}
        >
          <BarChart data={activeVsExpiredByOrg}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="name" tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="Active" stackId="a" fill={cove.aqua} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="Expired" stackId="a" fill={cove.orange} maxBarSize={28} />
          </BarChart>
        </ChartCard>
      </ChartGrid>
    </div>
  );
}

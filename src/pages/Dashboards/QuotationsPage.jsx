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
const quotationsByMonth = [
  { month: 'Jun', count: 1 },
  { month: 'Jul', count: 1 },
  { month: 'Aug', count: 2 },
  { month: 'Sep', count: 2 },
];

const statusData = [
  { name: 'Sent', value: 67, color: cove.blue },
  { name: 'Accepted', value: 33, color: cove.aqua },
];

const valueTrend = [
  { month: 'May', value: 120 },
  { month: 'Jun', value: 150 },
  { month: 'Jul', value: 180 },
  { month: 'Aug', value: 240 },
  { month: 'Sep', value: 272 },
];

const byOrg = [
  { name: 'Org A', count: 2 },
  { name: 'Org B', count: 1 },
  { name: 'Org C', count: 1 },
  { name: 'Org D', count: 1 },
  { name: 'Org E', count: 1 },
];

const byModule = [
  { name: 'ERP', value: 40, color: cove.blue },
  { name: 'CRM', value: 25, color: cove.orange },
  { name: 'HRMS', value: 20, color: cove.aqua },
  { name: 'Finance', value: 15, color: cove.yellow },
];

export default function QuotationsPage() {
  return (
    <div className="dashboard-analytics-page">
      <MetricGrid
        cards={[
          { label: 'Total quotations', value: '6' },
          { label: 'Organizations', value: '5' },
          { label: 'Modules', value: '4' },
          { label: 'Quotation value', value: '9,62,000' },
        ]}
      />

      <ChartGrid>
        <ChartCard
          ariaLabel="Bar chart of quotations by month"
          legendItems={[{ color: cove.blue, label: 'Quotations' }]}
        >
          <BarChart data={quotationsByMonth}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill={cove.blue} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Pie chart of quotation status"
          legendItems={[
            { color: cove.blue, label: 'Sent 67%' },
            { color: cove.aqua, label: 'Accepted 33%' },
          ]}
        >
          <PieChart>
            <Tooltip />
            <Pie data={statusData} dataKey="value" nameKey="name" outerRadius="80%">
              {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Line chart of quotation value trend"
          legendItems={[{ color: cove.orange, label: 'Value (₹ thousands)' }]}
        >
          <LineChart data={valueTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke={cove.orange} strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Bar chart of quotations by organization"
          legendItems={[{ color: cove.green, label: 'Quotations' }]}
        >
          <BarChart data={byOrg}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="name" tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill={cove.green} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Pie chart of quotations by module"
          legendItems={[
            { color: cove.blue, label: 'ERP 40%' },
            { color: cove.orange, label: 'CRM 25%' },
            { color: cove.aqua, label: 'HRMS 20%' },
            { color: cove.yellow, label: 'Finance 15%' },
          ]}
        >
          <PieChart>
            <Tooltip />
            <Pie data={byModule} dataKey="value" nameKey="name" outerRadius="80%">
              {byModule.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ChartCard>
      </ChartGrid>
    </div>
  );
}

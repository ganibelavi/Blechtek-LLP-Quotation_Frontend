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
const invoiceValueByMonth = [
  { month: 'May', value: 80 },
  { month: 'Jun', value: 120 },
  { month: 'Jul', value: 150 },
  { month: 'Aug', value: 90 },
  { month: 'Sep', value: 260 },
];

const paymentStatus = [
  { name: 'Pending', value: 80, color: cove.orange },
  { name: 'Advance received', value: 20, color: cove.aqua },
];

const invoiceCountTrend = [
  { month: 'May', count: 1 },
  { month: 'Jun', count: 1 },
  { month: 'Jul', count: 1 },
  { month: 'Aug', count: 1 },
  { month: 'Sep', count: 1 },
];

const byOrg = [
  { name: 'Org A', value: 200 },
  { name: 'Org B', value: 150 },
  { name: 'Org C', value: 120 },
  { name: 'Org D', value: 130 },
  { name: 'Org E', value: 100 },
];

const paymentMode = [
  { name: 'Bank transfer', value: 50, color: cove.blue },
  { name: 'UPI', value: 25, color: cove.aqua },
  { name: 'Cheque', value: 15, color: cove.yellow },
  { name: 'Cash', value: 10, color: cove.orange },
];

export default function InvoicesPage() {
  return (
    <div className="dashboard-analytics-page">
      <MetricGrid
        cards={[
          { label: 'Total invoices', value: '5' },
          { label: 'Invoice value', value: '₹7,00,000' },
          { label: 'Pending', value: '4' },
          { label: 'Advance received', value: '1' },
        ]}
      />

      <ChartGrid>
        <ChartCard
          ariaLabel="Bar chart of invoice value by month"
          legendItems={[{ color: cove.blue, label: 'Invoice value (₹ thousands)' }]}
        >
          <BarChart data={invoiceValueByMonth}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="value" fill={cove.blue} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Pie chart of invoice payment status"
          legendItems={[
            { color: cove.orange, label: 'Pending 80%' },
            { color: cove.aqua, label: 'Advance received 20%' },
          ]}
        >
          <PieChart>
            <Tooltip />
            <Pie data={paymentStatus} dataKey="value" nameKey="name" outerRadius="80%">
              {paymentStatus.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Line chart of invoice count trend"
          legendItems={[{ color: cove.green, label: 'Invoices raised' }]}
        >
          <LineChart data={invoiceCountTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke={cove.green} strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Bar chart of invoice value by organization"
          legendItems={[{ color: cove.orange, label: 'Invoice value (₹ thousands)' }]}
        >
          <BarChart data={byOrg}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="name" tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="value" fill={cove.orange} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Pie chart of invoice payment mode split"
          legendItems={[
            { color: cove.blue, label: 'Bank transfer 50%' },
            { color: cove.aqua, label: 'UPI 25%' },
            { color: cove.yellow, label: 'Cheque 15%' },
            { color: cove.orange, label: 'Cash 10%' },
          ]}
        >
          <PieChart>
            <Tooltip />
            <Pie data={paymentMode} dataKey="value" nameKey="name" outerRadius="80%">
              {paymentMode.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ChartCard>
      </ChartGrid>
    </div>
  );
}

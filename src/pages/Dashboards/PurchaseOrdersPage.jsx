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
const quotesRevenueTrend = [
  { month: 'May', Quotes: 3, Revenue: 2 },
  { month: 'Jun', Quotes: 4, Revenue: 3 },
  { month: 'Jul', Quotes: 6, Revenue: 5 },
  { month: 'Aug', Quotes: 5, Revenue: 4 },
  { month: 'Sep', Quotes: 8, Revenue: 10 },
];

const poValueByMonth = [
  { month: 'May', value: 100 },
  { month: 'Jun', value: 150 },
  { month: 'Jul', value: 200 },
  { month: 'Aug', value: 180 },
  { month: 'Sep', value: 270 },
];

const approvalStatus = [
  { name: 'Approved', value: 80, color: cove.blue },
  { name: 'Pending', value: 20, color: cove.yellow },
];

const byOrg = [
  { name: 'Org A', count: 2 },
  { name: 'Org B', count: 1 },
  { name: 'Org C', count: 1 },
  { name: 'Org D', count: 1 },
];

const byCategory = [
  { name: 'Raw materials', value: 45, color: cove.blue },
  { name: 'Equipment', value: 30, color: cove.orange },
  { name: 'Services', value: 25, color: cove.aqua },
];

export default function PurchaseOrdersPage() {
  return (
    <div className="dashboard-analytics-page">
      <MetricGrid
        cards={[
          { label: 'Total purchase orders', value: '5' },
          { label: 'Purchase order value', value: '₹9,00,000' },
          { label: 'Open orders', value: '5' },
          { label: 'Closed orders', value: '0' },
        ]}
      />

      <ChartGrid>
        <ChartCard
          ariaLabel="Line chart of purchase order quotes and revenue trend"
          legendItems={[
            { color: cove.blue, label: 'Quotes' },
            { color: cove.orange, label: 'Revenue (lakhs)' },
          ]}
        >
          <LineChart data={quotesRevenueTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="Quotes" stroke={cove.blue} strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="Revenue" stroke={cove.orange} strokeWidth={2} strokeDasharray="6 3" dot={{ r: 4 }} />
          </LineChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Bar chart of purchase order value by month"
          legendItems={[{ color: cove.green, label: 'PO value (₹ thousands)' }]}
        >
          <BarChart data={poValueByMonth}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="value" fill={cove.green} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Pie chart of purchase order approval status"
          legendItems={[
            { color: cove.blue, label: 'Approved 80%' },
            { color: cove.yellow, label: 'Pending 20%' },
          ]}
        >
          <PieChart>
            <Tooltip />
            <Pie data={approvalStatus} dataKey="value" nameKey="name" outerRadius="80%">
              {approvalStatus.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Bar chart of purchase orders by organization"
          legendItems={[{ color: cove.aqua, label: 'Purchase orders' }]}
        >
          <BarChart data={byOrg}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="name" tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill={cove.aqua} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Pie chart of purchase orders by category"
          legendItems={[
            { color: cove.blue, label: 'Raw materials 45%' },
            { color: cove.orange, label: 'Equipment 30%' },
            { color: cove.aqua, label: 'Services 25%' },
          ]}
        >
          <PieChart>
            <Tooltip />
            <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius="80%">
              {byCategory.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ChartCard>
      </ChartGrid>
    </div>
  );
}

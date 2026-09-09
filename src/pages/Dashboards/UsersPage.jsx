import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// ---- shared design tokens (kept local so this file can be dropped in on its own) ----
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
const recordsPerUser = [
  { name: 'Aarav', Quotations: 2, 'Purchase orders': 1, Invoices: 1, Renewals: 1 },
  { name: 'Diya', Quotations: 1, 'Purchase orders': 1, Invoices: 1, Renewals: 1 },
  { name: 'Rohan', Quotations: 1, 'Purchase orders': 1, Invoices: 1, Renewals: 1 },
  { name: 'Isha', Quotations: 1, 'Purchase orders': 1, Invoices: 1, Renewals: 1 },
  { name: 'Vikram', Quotations: 1, 'Purchase orders': 1, Invoices: 1, Renewals: 1 },
];

const roleData = [
  { name: 'Sales', value: 60, color: cove.blue },
  { name: 'Finance', value: 20, color: cove.aqua },
  { name: 'Admin', value: 20, color: cove.yellow },
];

const activeUsersTrend = [
  { month: 'May', active: 3 },
  { month: 'Jun', active: 4 },
  { month: 'Jul', active: 4 },
  { month: 'Aug', active: 5 },
  { month: 'Sep', active: 4 },
];

const moduleUsage = [
  { name: 'Quotations', value: 40, color: cove.blue },
  { name: 'Purchase orders', value: 25, color: cove.orange },
  { name: 'Invoices', value: 20, color: cove.green },
  { name: 'Renewals', value: 15, color: cove.yellow },
];

const weeklyActivity = [
  { name: 'Aarav', actions: 18 },
  { name: 'Diya', actions: 14 },
  { name: 'Rohan', actions: 12 },
  { name: 'Isha', actions: 15 },
  { name: 'Vikram', actions: 10 },
];

export default function UsersPage() {
  return (
    <div className="dashboard-analytics-page">
      <MetricGrid
        cards={[
          { label: 'Total users', value: '5' },
          { label: 'Active this month', value: '4' },
          { label: 'Records created (all users)', value: '21' },
          { label: 'Avg. records / user', value: '4.2' },
        ]}
      />

      <ChartGrid>
        <ChartCard
          ariaLabel="Bar chart of records created per user"
          legendItems={[
            { color: cove.blue, label: 'Quotations' },
            { color: cove.orange, label: 'Purchase orders' },
            { color: cove.green, label: 'Invoices' },
            { color: cove.yellow, label: 'Renewals' },
          ]}
        >
          <BarChart data={recordsPerUser}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="name" tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="Quotations" stackId="a" fill={cove.blue} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="Purchase orders" stackId="a" fill={cove.orange} maxBarSize={28} />
            <Bar dataKey="Invoices" stackId="a" fill={cove.green} maxBarSize={28} />
            <Bar dataKey="Renewals" stackId="a" fill={cove.yellow} maxBarSize={28} />
          </BarChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Pie chart of user role distribution"
          legendItems={[
            { color: cove.blue, label: 'Sales 60%' },
            { color: cove.aqua, label: 'Finance 20%' },
            { color: cove.yellow, label: 'Admin 20%' },
          ]}
        >
          <PieChart>
            <Tooltip />
            <Pie data={roleData} dataKey="value" nameKey="name" innerRadius={0} outerRadius="80%">
              {roleData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Line chart of active users per month"
          legendItems={[{ color: cove.blue, label: 'Active users' }]}
        >
          <LineChart data={activeUsersTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="active" stroke={cove.blue} strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Pie chart of module usage by users"
          legendItems={[
            { color: cove.blue, label: 'Quotations 40%' },
            { color: cove.orange, label: 'Purchase orders 25%' },
            { color: cove.green, label: 'Invoices 20%' },
            { color: cove.yellow, label: 'Renewals 15%' },
          ]}
        >
          <PieChart>
            <Tooltip />
            <Pie data={moduleUsage} dataKey="value" nameKey="name" innerRadius={0} outerRadius="80%">
              {moduleUsage.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Bar chart of weekly actions per user"
          legendItems={[{ color: cove.aqua, label: 'Actions this week' }]}
        >
          <BarChart data={weeklyActivity}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="name" tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="actions" fill={cove.aqua} radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ChartCard>
      </ChartGrid>
    </div>
  );
}

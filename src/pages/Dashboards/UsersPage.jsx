import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { fetchUsers } from '../../services/userApi';
import { fetchInvoices, fetchPurchaseOrders, fetchQuotations, fetchRenewals } from '../../services/quotationApi';
import DataCard from '../../components/DataCard';

// ---- shared design tokens (kept local so this file can be dropped in on its own) ----
const cove = { blue: '#2a78d6', orange: '#eb6834', aqua: '#1baf7a', yellow: '#eda100', green: '#008300' };
const gridStroke = 'rgba(137,135,129,0.2)';
const axisTick = { fill: 'var(--text-muted)', fontSize: 11 };

function MetricGrid({ cards }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 24,
        marginBottom: 32,
      }}
    >
      {cards.map((card, index) => (
        <DataCard key={index} {...card} borderRadius={2} />
      ))}
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

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [records, setRecords] = useState({ quotations: [], orders: [], invoices: [], renewals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchUsers(), fetchQuotations(1, 500), fetchPurchaseOrders(), fetchInvoices(), fetchRenewals()])
      .then(([userRows, quotations, orders, invoices, renewals]) => {
        if (!mounted) return;
        const rows = (value) => Array.isArray(value)
          ? value
          : value?.items || value?.data || value?.rows || [];
        setUsers(Array.isArray(userRows) ? userRows : []);
        setRecords({ quotations: rows(quotations), orders: rows(orders), invoices: rows(invoices), renewals: rows(renewals) });
      })
      .catch((requestError) => {
        console.error('Failed to load users dashboard data', requestError);
        if (mounted) setError('Unable to load users dashboard data.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="dashboard-analytics-page">Loading user analytics...</div>;
  if (error) return <div className="dashboard-analytics-page">{error}</div>;

  const displayName = (user) => `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  const recordsPerUser = users.map((user) => {
    const name = displayName(user);
    const matches = (rows, fields) => rows.filter((row) => fields.some((field) => String(row[field] || '').toLowerCase() === name.toLowerCase() || String(row[field] || '').toLowerCase() === String(user.email || '').toLowerCase())).length;
    return {
      name,
      Quotations: matches(records.quotations, ['createdByUser', 'referenceBy']),
      'Purchase orders': matches(records.orders, ['uploadedBy']),
      Invoices: 0,
      Renewals: 0,
    };
  });
  const roleGroups = new Map();
  users.forEach((user) => roleGroups.set(user.role || 'Unknown', (roleGroups.get(user.role || 'Unknown') || 0) + 1));
  const roleData = [...roleGroups.entries()].map(([name, value], index) => ({ name, value, color: [cove.blue, cove.aqua, cove.yellow, cove.orange][index % 4] }));
  const allRecords = Object.values(records).reduce((sum, rows) => sum + rows.length, 0);
  const activeUsers = users.filter((user) => user.isActive).length;
  const moduleUsage = [
    { name: 'Quotations', value: records.quotations.length, color: cove.blue },
    { name: 'Purchase orders', value: records.orders.length, color: cove.orange },
    { name: 'Invoices', value: records.invoices.length, color: cove.green },
    { name: 'Renewals', value: records.renewals.length, color: cove.yellow },
  ].filter((item) => item.value > 0);
  const weeklyActivity = recordsPerUser.map((row) => ({ name: row.name, actions: row.Quotations + row['Purchase orders'] + row.Invoices + row.Renewals }));
  const activeUsersTrend = [{ month: 'Current', active: activeUsers }];
  return (
    <div className="dashboard-analytics-page">
      <MetricGrid
        cards={[
          {
            label: 'Total users',
            value: users.length,
            icon: <img src="/logo/users.png" alt="Total users" style={{ width: 28, height: 28 }} />,
            color: 'primary',
          },
          {
            label: 'Active users',
            value: activeUsers,
            icon: <img src="/logo/verification.png" alt="Active users" style={{ width: 28, height: 28 }} />,
            color: 'primary',
          },
          {
            label: 'Records created (all users)',
            value: allRecords,
            icon: <img src="/logo/report.png" alt="Records created" style={{ width: 28, height: 28 }} />,
            color: 'primary',
          },
          {
            label: 'Avg. records / user',
            value: users.length ? (allRecords / users.length).toFixed(1) : '0.0',
            icon: <img src="/logo/speedometer.png" alt="Average records per user" style={{ width: 28, height: 28 }} />,
            color: 'primary',
          },
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
            ...roleData.map((item) => ({ color: item.color, label: item.name })),
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
            ...moduleUsage.map((item) => ({ color: item.color, label: item.name })),
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

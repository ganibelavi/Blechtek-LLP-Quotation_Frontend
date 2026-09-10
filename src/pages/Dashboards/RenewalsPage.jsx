import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  fetchCustomerSubscriptions,
  fetchRenewals,
} from "../../services/quotationApi";
import DataCard from "../../components/DataCard";

const cove = {
  blue: "#2a78d6",
  orange: "#eb6834",
  aqua: "#1baf7a",
  yellow: "#eda100",
  green: "#008300",
};
const gridStroke = "rgba(137,135,129,0.2)";
const axisTick = { fill: "var(--text-muted)", fontSize: 11 };

function MetricGrid({ cards }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 14,
        marginBottom: 6,
        fontSize: 12,
        color: "var(--text-secondary)",
      }}
    >
      {items.map((it, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 2,
              background: it.color,
              display: "inline-block",
            }}
          />
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
      <div
        style={{ position: "relative", height }}
        role="img"
        aria-label={ariaLabel}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChartGrid({ children }) {
  return (
    <div
      className="dashboard-chart-grid"
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
    >
      {children}
    </div>
  );
}

export default function RenewalsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [expired, setExpired] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchCustomerSubscriptions(),
      fetchRenewals(),
      fetchRenewals("expired"),
    ])
      .then(([subscriptionRows, renewalRows, expiredRows]) => {
        if (!mounted) return;
        setSubscriptions(subscriptionRows);
        setRenewals(renewalRows);
        setExpired(expiredRows);
      })
      .catch((requestError) => {
        console.error("Failed to load renewal dashboard data", requestError);
        if (mounted) setError("Unable to load renewal dashboard data.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading)
    return (
      <div className="dashboard-analytics-page">
        Loading renewal analytics...
      </div>
    );
  if (error) return <div className="dashboard-analytics-page">{error}</div>;

  const colors = [cove.aqua, cove.yellow, cove.orange, cove.blue, cove.green];
  const active = subscriptions.filter(
    (row) => String(row.status || "").toLowerCase() === "active",
  );
  const renewed = active.filter((row) => Number(row.currentYear || 1) > 1);
  const renewalStatus = [
    { name: "Renewed", value: renewed.length, color: cove.aqua },
    { name: "Due soon", value: renewals.length, color: cove.yellow },
    { name: "Expired", value: expired.length, color: cove.orange },
  ].filter((item) => item.value > 0);
  const monthOf = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Unknown"
      : date.toLocaleString("en-US", { month: "short", year: "numeric" });
  };
  const groupedMonths = (rows, field) => {
    const grouped = new Map();
    rows.forEach((row) => {
      const month = monthOf(row[field]);
      grouped.set(month, (grouped.get(month) || 0) + 1);
    });
    return [...grouped.entries()].map(([month, count]) => ({
      month,
      count,
      due: count,
    }));
  };
  const renewalsCompletedTrend = groupedMonths(
    subscriptions.filter((row) => Number(row.currentYear || 1) > 1),
    "createdAt",
  );
  const renewalsDueByMonth = groupedMonths(renewals, "nextRenewalDate");
  const moduleGroups = new Map();
  subscriptions.forEach((row) => {
    const name = row.moduleName || row.module?.moduleName || "Unknown";
    moduleGroups.set(
      name,
      (moduleGroups.get(name) || 0) + Number(row.initialPurchasePrice || 0),
    );
  });
  const valueByModule = [...moduleGroups.entries()].map(
    ([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }),
  );
  const orgGroups = new Map();
  subscriptions.forEach((row) => {
    const name = row.customerName || row.customer?.name || "Unknown";
    const current = orgGroups.get(name) || { name, Active: 0, Expired: 0 };
    if (String(row.status || "").toLowerCase() === "active")
      current.Active += 1;
    else current.Expired += 1;
    orgGroups.set(name, current);
  });
  const activeVsExpiredByOrg = [...orgGroups.values()];
  const subscriptionValue = subscriptions.reduce(
    (sum, row) => sum + Number(row.initialPurchasePrice || 0),
    0,
  );
  return (
    <div className="dashboard-analytics-page">
      <MetricGrid
        cards={[
          {
            label: "Active subscriptions",
            value: active.length,
            icon: (
              <img
                src="/logo/sync.png"
                alt="Active subscriptions"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
          {
            label: "Renewals due this month",
            value: renewals.length,
            icon: (
              <img
                src="/logo/calendar.png"
                alt="Renewals due this month"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
          {
            label: "Expired subscriptions",
            value: expired.length,
            icon: (
              <img
                src="/logo/warning.png"
                alt="Expired subscriptions"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
          {
            label: "Subscription value",
            value: `₹${subscriptionValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
            icon: (
              <img
                src="/logo/speedometer.png"
                alt="Subscription value"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
        ]}
      />

      <ChartGrid>
        <ChartCard
          ariaLabel="Pie chart of renewal status"
          legendItems={[
            ...renewalStatus.map((item) => ({
              color: item.color,
              label: item.name,
            })),
          ]}
        >
          <PieChart>
            <Tooltip />
            <Pie
              data={renewalStatus}
              dataKey="value"
              nameKey="name"
              outerRadius="80%"
            >
              {renewalStatus.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Line chart of renewals completed per month"
          legendItems={[{ color: cove.blue, label: "Renewals completed" }]}
        >
          <LineChart data={renewalsCompletedTrend}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStroke}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={axisTick}
              axisLine={{ stroke: gridStroke }}
              tickLine={false}
            />
            <YAxis
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke={cove.blue}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Bar chart of renewals due by month"
          legendItems={[{ color: cove.orange, label: "Renewals due" }]}
        >
          <BarChart data={renewalsDueByMonth}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStroke}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={axisTick}
              axisLine={{ stroke: gridStroke }}
              tickLine={false}
            />
            <YAxis
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip />
            <Bar
              dataKey="due"
              fill={cove.orange}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Pie chart of subscription value by module"
          legendItems={[
            { color: cove.blue, label: "ERP 40%" },
            { color: cove.orange, label: "CRM 25%" },
            { color: cove.aqua, label: "HRMS 20%" },
            { color: cove.yellow, label: "Finance 15%" },
          ]}
        >
          <PieChart>
            <Tooltip />
            <Pie
              data={valueByModule}
              dataKey="value"
              nameKey="name"
              outerRadius="80%"
            >
              {valueByModule.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Bar chart of active versus expired subscriptions by organization"
          legendItems={[
            { color: cove.aqua, label: "Active" },
            { color: cove.orange, label: "Expired" },
          ]}
        >
          <BarChart data={activeVsExpiredByOrg}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStroke}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={axisTick}
              axisLine={{ stroke: gridStroke }}
              tickLine={false}
            />
            <YAxis
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip />
            <Bar
              dataKey="Active"
              stackId="a"
              fill={cove.aqua}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="Expired"
              stackId="a"
              fill={cove.orange}
              maxBarSize={28}
            />
          </BarChart>
        </ChartCard>
      </ChartGrid>
    </div>
  );
}

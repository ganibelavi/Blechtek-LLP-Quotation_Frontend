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
  Label,
} from "recharts";
import { fetchPurchaseOrders } from "../../services/quotationApi";
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

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchPurchaseOrders()
      .then((data) => {
        if (mounted) setOrders(Array.isArray(data) ? data : []);
      })
      .catch((requestError) => {
        console.error(
          "Failed to load purchase order dashboard data",
          requestError,
        );
        if (mounted) setError("Unable to load purchase order dashboard data.");
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
        Loading purchase order analytics...
      </div>
    );
  if (error) return <div className="dashboard-analytics-page">{error}</div>;

  const amountOf = (order) =>
    Number(
      order.totalAmount ?? order.totals?.grandTotal ?? order.amount ?? 0,
    ) || 0;
  const monthOf = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Unknown"
      : date.toLocaleString("en-US", { month: "short", year: "numeric" });
  };
  const groupedByMonth = orders.reduce((groups, order) => {
    const month = monthOf(order.poDate || order.createdAt);
    const current = groups.get(month) || {
      month,
      Quotes: 0,
      Revenue: 0,
      value: 0,
    };
    current.Quotes += 1;
    current.Revenue += amountOf(order) / 100000;
    current.value += amountOf(order) / 1000;
    groups.set(month, current);
    return groups;
  }, new Map());
  const monthlyRows = [...groupedByMonth.values()];
  const colors = [cove.blue, cove.orange, cove.aqua, cove.yellow, cove.green];
  const groupCounts = (key, fallback = "Unknown") => {
    const groups = new Map();
    orders.forEach((order) => {
      const name = String(order[key] || fallback);
      groups.set(name, (groups.get(name) || 0) + 1);
    });
    return [...groups.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], index) => ({
        name,
        value,
        count: value,
        color: colors[index % colors.length],
      }));
  };
  const approvalStatus = groupCounts("verificationStatus").map((item) => ({
    ...item,
    name: item.name === "verified" ? "Verified" : item.name,
  }));
  const byOrg = groupCounts("companyName").map(({ name, count }) => ({
    name,
    count,
  }));
  const byCategory = groupCounts("poDirection").map(
    ({ name, value, color }) => ({ name, value, color }),
  );
  const totalValue = orders.reduce((sum, order) => sum + amountOf(order), 0);
  const openOrders = orders.filter(
    (order) => String(order.status || "").toLowerCase() !== "closed",
  ).length;
  const closedOrders = orders.length - openOrders;
  return (
    <div className="dashboard-analytics-page">
      <MetricGrid
        cards={[
          {
            label: "Total purchase orders",
            value: orders.length,
            icon: (
              <img
                src="/logo/boxes.png"
                alt="Total purchase orders"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
          {
            label: "Purchase order value",
            value: `₹${totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
            icon: (
              <img
                src="/logo/speedometer.png"
                alt="Purchase order value"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
          {
            label: "Open orders",
            value: openOrders,
            icon: (
              <img
                src="/logo/clipboard-list-check.png"
                alt="Open orders"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
          {
            label: "Closed orders",
            value: closedOrders,
            icon: (
              <img
                src="/logo/check-circle.png"
                alt="Closed orders"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
        ]}
      />

      <ChartGrid>
        <ChartCard
          ariaLabel="Line chart of purchase order quotes and revenue trend"
          legendItems={[
            { color: cove.blue, label: "Quotes" },
            { color: cove.orange, label: "Revenue (lakhs)" },
          ]}
        >
          <LineChart data={monthlyRows}>
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
            >
              <Label
                value="Month"
                offset={-5}
                position="insideBottom"
                style={axisTick}
              />
            </XAxis>
            <YAxis
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            >
              <Label
                value="Quotes and revenue"
                angle={-90}
                position="insideLeft"
                offset={0}
                dy={20}
                style={axisTick}
              />
            </YAxis>
            <Tooltip />
            <Line
              type="monotone"
              dataKey="Quotes"
              stroke={cove.blue}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Revenue"
              stroke={cove.orange}
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Bar chart of purchase order value by month"
          legendItems={[{ color: cove.green, label: "PO value (₹ thousands)" }]}
        >
          <BarChart data={monthlyRows}>
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
            >
              <Label
                value="Month"
                offset={-5}
                position="insideBottom"
                style={axisTick}
              />
            </XAxis>
            <YAxis tick={axisTick} axisLine={false} tickLine={false}>
              <Label
                value="Order value (₹ thousands)"
                angle={-90}
                position="insideLeft"
                offset={0}
                dy={50}
                style={axisTick}
              />
            </YAxis>
            <Tooltip />
            <Bar
              dataKey="value"
              fill={cove.green}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Pie chart of purchase order approval status"
          legendItems={[
            ...approvalStatus.map((item) => ({
              color: item.color,
              label: item.name,
            })),
          ]}
        >
          <PieChart>
            <Tooltip />
            <Pie
              data={approvalStatus}
              dataKey="value"
              nameKey="name"
              outerRadius="80%"
            >
              {approvalStatus.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Bar chart of purchase orders by organization"
          legendItems={[
            { color: cove.aqua, label: "Purchase orders by organization" },
          ]}
        >
          <BarChart data={byOrg}>
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
            >
              <Label
                value="Organization"
                offset={-5}
                position="insideBottom"
                style={axisTick}
              />
            </XAxis>
            <YAxis
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            >
              <Label
                value="Order count"
                angle={-90}
                position="insideLeft"
                offset={0}
                dy={12}
                style={axisTick}
              />
            </YAxis>
            <Tooltip />
            <Bar
              dataKey="count"
              fill={cove.aqua}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Pie chart of purchase orders by direction"
          legendItems={byCategory.map((item) => ({
            color: item.color,
            label: item.name,
          }))}
        >
          <PieChart>
            <Tooltip />
            <Pie
              data={byCategory}
              dataKey="value"
              nameKey="name"
              outerRadius="80%"
            >
              {byCategory.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>
      </ChartGrid>
    </div>
  );
}

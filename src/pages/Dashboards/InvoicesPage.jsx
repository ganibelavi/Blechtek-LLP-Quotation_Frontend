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
import { fetchInvoices } from "../../services/quotationApi";
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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchInvoices()
      .then((data) => {
        if (mounted) setInvoices(Array.isArray(data) ? data : []);
      })
      .catch((requestError) => {
        console.error("Failed to load invoice dashboard data", requestError);
        if (mounted) setError("Unable to load invoice dashboard data.");
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
        Loading invoice analytics...
      </div>
    );
  if (error) return <div className="dashboard-analytics-page">{error}</div>;

  const amountOf = (invoice) =>
    Number(
      invoice.totalAmount ?? invoice.totals?.grandTotal ?? invoice.amount ?? 0,
    ) || 0;
  const nameOf = (invoice) =>
    invoice.invoice?.companyName ||
    invoice.companyName ||
    invoice.invoice?.receiverName ||
    invoice.receiverName ||
    "Unknown";
  const statusOf = (invoice) =>
    invoice.invoice?.status || invoice.status || "Unknown";
  const monthOf = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Unknown"
      : date.toLocaleString("en-US", { month: "short", year: "numeric" });
  };
  const monthly = new Map();
  invoices.forEach((invoice) => {
    const month = monthOf(
      invoice.invoice?.dateOfIssue || invoice.dateOfIssue || invoice.createdAt,
    );
    const row = monthly.get(month) || { month, value: 0, count: 0 };
    row.value += amountOf(invoice) / 1000;
    row.count += 1;
    monthly.set(month, row);
  });
  const invoiceValueByMonth = [...monthly.values()];
  const invoiceCountTrend = invoiceValueByMonth;
  const colors = [cove.orange, cove.aqua, cove.blue, cove.yellow, cove.green];
  const grouped = (getName) => {
    const groups = new Map();
    invoices.forEach((invoice) => {
      const name = getName(invoice);
      const current = groups.get(name) || { name, value: 0, count: 0 };
      current.value += amountOf(invoice);
      current.count += 1;
      groups.set(name, current);
    });
    return [...groups.values()].sort((a, b) => b.value - a.value);
  };
  const paymentStatus = grouped(statusOf).map((item, index) => ({
    ...item,
    color: colors[index % colors.length],
  }));
  const byOrg = grouped(nameOf).map((item) => ({
    ...item,
    value: item.value / 1000,
  }));
  const paymentMode = paymentStatus;
  const totalValue = invoices.reduce(
    (sum, invoice) => sum + amountOf(invoice),
    0,
  );
  const pending = invoices.filter(
    (invoice) => !["paid"].includes(String(statusOf(invoice)).toLowerCase()),
  ).length;
  const advanceReceived = invoices.filter(
    (invoice) => String(statusOf(invoice)).toLowerCase() === "advance_received",
  ).length;
  return (
    <div className="dashboard-analytics-page">
      <MetricGrid
        cards={[
          {
            label: "Total invoices",
            value: invoices.length,
            icon: (
              <img
                src="/logo/calculator.png"
                alt="Total invoices"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
          {
            label: "Invoice value",
            value: `₹${totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
            icon: (
              <img
                src="/logo/balance.png"
                alt="Invoice value"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
          {
            label: "Pending",
            value: pending,
            icon: (
              <img
                src="/logo/clock.png"
                alt="Pending invoices"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
          {
            label: "Advance received",
            value: advanceReceived,
            icon: (
              <img
                src="/logo/check-circle.png"
                alt="Advance received"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
        ]}
      />

      <ChartGrid>
        <ChartCard
          ariaLabel="Bar chart of invoice value by month"
          legendItems={[
            { color: cove.blue, label: "Invoice value (₹ thousands)" },
          ]}
        >
          <BarChart data={invoiceValueByMonth}>
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
              <Label value="Month" offset={-5} position="insideBottom" style={axisTick} />
            </XAxis>
            <YAxis tick={axisTick} axisLine={false} tickLine={false}>
              <Label value="Invoice value (₹ thousands)" angle={-90} position="insideLeft" offset={0} dy={12} style={axisTick} />
            </YAxis>
            <Tooltip />
            <Bar
              dataKey="value"
              fill={cove.blue}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Pie chart of invoice payment status"
          legendItems={[
            ...paymentStatus.map((item) => ({
              color: item.color,
              label: item.name,
            })),
          ]}
        >
          <PieChart>
            <Tooltip />
            <Pie
              data={paymentStatus}
              dataKey="value"
              nameKey="name"
              outerRadius="80%"
            >
              {paymentStatus.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Line chart of invoice count trend"
          legendItems={[{ color: cove.green, label: "Invoices raised" }]}
        >
          <LineChart data={invoiceCountTrend}>
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
              <Label value="Month" offset={-5} position="insideBottom" style={axisTick} />
            </XAxis>
            <YAxis
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            >
              <Label value="Invoice count" angle={-90} position="insideLeft" offset={0} dy={12} style={axisTick} />
            </YAxis>
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke={cove.green}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Bar chart of invoice value by organization"
          legendItems={[
            {
              color: cove.orange,
              label: "Invoice value by customer (₹ thousands)",
            },
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
              <Label value="Organization" offset={-5} position="insideBottom" style={axisTick} />
            </XAxis>
            <YAxis tick={axisTick} axisLine={false} tickLine={false}>
              <Label value="Invoice value (₹ thousands)" angle={-90} position="insideLeft" offset={0} dy={12} style={axisTick} />
            </YAxis>
            <Tooltip />
            <Bar
              dataKey="value"
              fill={cove.orange}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Pie chart of invoice status split"
          legendItems={[
            ...paymentMode.map((item) => ({
              color: item.color,
              label: item.name,
            })),
          ]}
        >
          <PieChart>
            <Tooltip />
            <Pie
              data={paymentMode}
              dataKey="value"
              nameKey="name"
              outerRadius="80%"
            >
              {paymentMode.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>
      </ChartGrid>
    </div>
  );
}

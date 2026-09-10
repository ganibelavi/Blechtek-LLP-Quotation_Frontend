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
import { fetchDashboardData } from "../../services/quotationApi";
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

export default function QuotationsPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    fetchDashboardData()
      .then((data) => {
        if (isMounted) {
          setDashboard(data);
          setError("");
        }
      })
      .catch((requestError) => {
        console.error("Failed to load quotation dashboard data", requestError);
        if (isMounted) {
          setError("Unable to load quotation dashboard data.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="dashboard-analytics-page">
        Loading quotation analytics...
      </div>
    );
  }

  if (error) {
    return <div className="dashboard-analytics-page">{error}</div>;
  }

  const quotationsByMonth = (dashboard?.monthlyQuotes || []).map((item) => ({
    month: item.month || item.Month,
    count: Number(item.count ?? item.Count ?? 0),
  }));

  const statusColors = [
    cove.blue,
    cove.aqua,
    cove.orange,
    cove.yellow,
    cove.green,
  ];
  const statusData = (dashboard?.statusBreakdown || []).map((item, index) => ({
    name: item.status || item.Status,
    value: Number(item.count ?? item.Count ?? 0),
    color: statusColors[index % statusColors.length],
  }));

  const valueTrend = (dashboard?.monthlyQuotes || []).map((item) => ({
    month: item.month || item.Month,
    value: Number(item.revenue ?? item.Revenue ?? 0) / 1000,
  }));

  const byOrg = (dashboard?.topOrganizations || []).map((item) => ({
    name: item.organization || item.Organization,
    count: Number(item.quoteCount ?? item.QuoteCount ?? 0),
  }));

  const moduleRows = (dashboard?.moduleDistribution || []).map(
    (item, index) => ({
      name: item.module || item.Module,
      value: Number(item.count ?? item.Count ?? 0),
      color: statusColors[index % statusColors.length],
    }),
  );

  const totalModuleUsage = moduleRows.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const moduleLegendItems = moduleRows.map((item) => ({
    color: item.color,
    label: `${item.name} ${totalModuleUsage ? Math.round((item.value / totalModuleUsage) * 100) : 0}%`,
  }));

  return (
    <div className="dashboard-analytics-page">
      <MetricGrid
        cards={[
          {
            label: "Total quotations",
            value: dashboard?.totalQuotations ?? 0,
            icon: (
              <img
                src="/logo/report.png"
                alt="Total quotations"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
          {
            label: "Organizations",
            value: dashboard?.totalOrganizations ?? 0,
            icon: (
              <img
                src="/logo/industry.png"
                alt="Organizations"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
          {
            label: "Modules",
            value: dashboard?.totalModules ?? 0,
            icon: (
              <img
                src="/logo/layers.png"
                alt="Modules"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
          {
            label: "Quotation value",
            value: `₹${Number(dashboard?.totalQuotedAmount ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
            icon: (
              <img
                src="/logo/speedometer.png"
                alt="Quotation value"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
        ]}
      />

      <ChartGrid>
        <ChartCard
          ariaLabel="Bar chart of quotations by month"
          legendItems={[{ color: cove.blue, label: "Quotations" }]}
        >
          <BarChart data={quotationsByMonth}>
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
              dataKey="count"
              fill={cove.blue}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Pie chart of quotation status"
          legendItems={[
            ...statusData.map((item) => ({
              color: item.color,
              label: item.name,
            })),
          ]}
        >
          <PieChart>
            <Tooltip />
            <Pie
              data={statusData}
              dataKey="value"
              nameKey="name"
              outerRadius="80%"
            >
              {statusData.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Line chart of quotation value trend"
          legendItems={[{ color: cove.orange, label: "Value (₹ thousands)" }]}
        >
          <LineChart data={valueTrend}>
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
            <YAxis tick={axisTick} axisLine={false} tickLine={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke={cove.orange}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Bar chart of quotations by organization"
          legendItems={[{ color: cove.green, label: "Top organizations" }]}
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
            />
            <YAxis
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip />
            <Bar
              dataKey="count"
              fill={cove.green}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ChartCard>

        <ChartCard
          ariaLabel="Pie chart of quotations by module"
          legendItems={moduleLegendItems}
        >
          <PieChart>
            <Tooltip />
            <Pie
              data={moduleRows}
              dataKey="value"
              nameKey="name"
              outerRadius="80%"
            >
              {moduleRows.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>
      </ChartGrid>
    </div>
  );
}

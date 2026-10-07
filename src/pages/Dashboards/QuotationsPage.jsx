// src/pages/Dashboard/QuotationsPage.jsx
import React from "react";
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
  Label,
  LabelList,
} from "recharts";
import { fetchDashboardData } from "../../services/quotationApi";
import {
  cove,
  gridStroke,
  axisTick,
  num,
  finiteNumber,
  inr,
  inrShort,
  pct,
  plural,
  sortMonthRows,
  monthlyTrend,
  topWithOther,
  TruncatedAxisTick,
  withColors,
  statusColor,
  useDashboardData,
  DASHBOARD_TARGETS,
  LoadingState,
  ErrorState,
  PageIntro,
  MetricGrid,
  ChartGrid,
  ChartCard,
  TargetsCard,
  DefinitionsCard,
} from "./dashboardShared";

export default function QuotationsPage() {
  const { data, loading, error, updatedAt, reload } = useDashboardData(
    fetchDashboardData,
    "Unable to load quotation dashboard data.",
  );

  const d = data || {};
  const monthly = React.useMemo(
    () =>
      sortMonthRows(
        (d.monthlyQuotes || []).map((i) => ({
          month: i.month || i.Month,
          count: finiteNumber(i.count ?? i.Count),
          value: finiteNumber(i.revenue ?? i.Revenue) / 1000,
        })),
      ),
    [d.monthlyQuotes],
  );
  const quoteTrend = React.useMemo(
    () => monthlyTrend(monthly, "count"),
    [monthly],
  );

  const statusData = React.useMemo(
    () =>
      topWithOther(
        (d.statusBreakdown || [])
          .map((i, index) => {
            const name = i.status || i.Status;
            return {
              name,
              value: finiteNumber(i.count ?? i.Count),
              color: statusColor(name, index),
            };
          })
          .sort((a, b) => b.value - a.value),
      ),
    [d.statusBreakdown],
  );
  const byOrg = React.useMemo(
    () =>
      (d.topOrganizations || [])
        .map((i) => ({
          name: i.organization || i.Organization,
          count: finiteNumber(i.quoteCount ?? i.QuoteCount),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
    [d.topOrganizations],
  );
  const moduleRows = React.useMemo(
    () =>
      withColors(
        (d.moduleDistribution || [])
          .map((i) => ({
            name: i.module || i.Module,
            value: finiteNumber(i.count ?? i.Count),
          }))
          .sort((a, b) => b.value - a.value),
      ),
    [d.moduleDistribution],
  );

  if (loading && !data)
    return <LoadingState text="Loading quotation analytics..." />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const total = finiteNumber(d.totalQuotations);
  const totalAmount = finiteNumber(d.totalQuotedAmount);
  const latest = monthly[monthly.length - 1];
  const prev = monthly[monthly.length - 2];
  const change =
    latest && prev && prev.count > 0
      ? Math.round(((latest.count - prev.count) / prev.count) * 100)
      : null;
  const moduleTotal = moduleRows.reduce((s, r) => s + r.value, 0);
  const statusTotal = statusData.reduce((s, r) => s + r.value, 0);
  const tooltipStyle = {
    background: "var(--dash-surface)",
    border: "1px solid var(--dash-border)",
    borderRadius: 8,
    fontSize: 12,
  };

  const insight =
    [
      latest &&
        `${latest.month} had ${plural(latest.count, "quotation")}${
          change === null
            ? ""
            : `, ${change >= 0 ? "up" : "down"} ${Math.abs(change)}% on ${prev.month}`
        }.`,
      byOrg[0] &&
        `${byOrg[0].name} has the most quotations (${pct(byOrg[0].count, total)}% of all).`,
      moduleRows[0] && `${moduleRows[0].name} is the most quoted module.`,
    ]
      .filter(Boolean)
      .join(" ") || "No quotations have been created yet.";

  return (
    <div className="dashboard-analytics-page">
      <PageIntro
        description="How many quotations are being created, for whom, and for which modules."
        insight={insight}
        updatedAt={updatedAt}
        onRefresh={reload}
        refreshing={loading}
        error={error}
        onRetry={reload}
      />

      <MetricGrid
        cards={[
          {
            label: "Total quotations",
            value: total,
            ...quoteTrend,
            hint: latest
              ? `${latest.month}: ${latest.count}${change === null ? "" : ` (${change >= 0 ? "+" : ""}${change}%)`}`
              : "",
            tip: "All quotations created in the system",
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
            value: d.totalOrganizations ?? 0,
            hint: byOrg[0] ? `Top: ${byOrg[0].name}` : "",
            tip: "Distinct customers that have received a quotation",
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
            value: d.totalModules ?? 0,
            hint: moduleRows[0] ? `Most quoted: ${moduleRows[0].name}` : "",
            tip: "Distinct modules that appear in quotations",
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
            value: inrShort(totalAmount),
            hint: total
              ? `Average ${inrShort(totalAmount / total)} per quotation`
              : "",
            tip: `Total quoted amount: ${inr(totalAmount)}`,
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
          title="Quotations created per month"
          ariaLabel="Bar chart of quotations by month"
          legendItems={[{ color: cove.blue, label: "Quotations" }]}
          isEmpty={!monthly.length}
        >
          <BarChart data={monthly}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStroke}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={axisTick}
              axisLine={false}
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
              tickCount={3}
            >
              <Label
                value="Quotation count"
                angle={-90}
                position="insideLeft"
                offset={0}
                dy={12}
                style={axisTick}
              />
            </YAxis>
            <Tooltip contentStyle={tooltipStyle} />
            <Bar
              dataKey="count"
              name="Quotations"
              fill={cove.blue}
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            >
              {monthly.length <= 12 && (
                <LabelList
                  dataKey="count"
                  position="top"
                  formatter={num}
                  style={{ fill: "var(--dash-text)", fontSize: 10 }}
                />
              )}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Quotation status"
          ariaLabel="Donut chart of quotation status"
          legendLayout="vertical"
          height={150}
          legendItems={statusData.map((i) => ({
            color: i.color,
            label: i.name,
            value: i.value,
          }))}
          isEmpty={!statusData.length}
          donutCenter={{ total: statusTotal, caption: "quotations" }}
        >
          <PieChart margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
            <Tooltip contentStyle={tooltipStyle} />
            <Pie
              data={statusData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="76%"
              paddingAngle={2}
              stroke="none"
            >
              {statusData.map((r, i) => (
                <Cell key={i} fill={r.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>

        <ChartCard
          title="Quoted value per month"
          ariaLabel="Line chart of quotation value trend"
          legendItems={[{ color: cove.orange, label: "Value (₹ thousands)" }]}
          isEmpty={!monthly.length}
        >
          <LineChart data={monthly}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStroke}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={axisTick}
              axisLine={false}
              tickLine={false}
            >
              <Label
                value="Month"
                offset={-5}
                position="insideBottom"
                style={axisTick}
              />
            </XAxis>
            <YAxis tick={axisTick} axisLine={false} tickLine={false} tickCount={3}>
              <Label
                value="Value (₹ thousands)"
                angle={-90}
                position="insideLeft"
                offset={0}
                dy={20}
                style={axisTick}
              />
            </YAxis>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => [inr(v * 1000), "Quoted value"]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={cove.orange}
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ChartCard>

        <ChartCard
          title="Top organizations"
          ariaLabel="Bar chart of quotations by organization"
          legendItems={[
            { color: cove.green, label: "Quotations per organization (top 8)" },
          ]}
          isEmpty={!byOrg.length}
        >
          <BarChart data={byOrg} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStroke}
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={<TruncatedAxisTick maxLength={16} />}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar
              dataKey="count"
              name="Quotations"
              fill={cove.green}
              radius={[0, 4, 4, 0]}
              maxBarSize={12}
            >
              <LabelList
                dataKey="count"
                position="right"
                formatter={num}
                style={{ fill: "var(--dash-text)", fontSize: 10 }}
              />
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Quotations by module"
          ariaLabel="Donut chart of quotations by module"
          legendLayout="vertical"
          height={150}
          legendItems={moduleRows.map((i) => ({
            color: i.color,
            label: i.name,
            value: i.value,
          }))}
          isEmpty={!moduleRows.length}
          donutCenter={{ total: moduleTotal, caption: "quotations" }}
        >
          <PieChart margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => [num(value), name]}
            />
            <Pie
              data={moduleRows}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="76%"
              paddingAngle={2}
              stroke="none"
            >
              {moduleRows.map((r, i) => (
                <Cell key={i} fill={r.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>

        <DefinitionsCard
          items={[
            [
              "Total quotations",
              "Every quotation created, regardless of status.",
            ],
            ["Quotation value", "Sum of the quoted amounts of all quotations."],
            ["Organizations", "Distinct customers that have been quoted."],
            ["Per month", "Counted by the month the quotation was created."],
          ]}
        />

        <TargetsCard
          items={[
            {
              label: `Quotations in ${latest?.month || "latest month"}`,
              value: latest?.count || 0,
              target: DASHBOARD_TARGETS.quotationsPerMonth,
            },
          ]}
        />
      </ChartGrid>

    </div>
  );
}

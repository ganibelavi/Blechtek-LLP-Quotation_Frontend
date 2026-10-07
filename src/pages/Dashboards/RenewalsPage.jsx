// src/pages/Dashboard/RenewalsPage.jsx
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
import {
  fetchCustomerSubscriptions,
  fetchRenewals,
} from "../../services/quotationApi";
import {
  cove,
  gridStroke,
  axisTick,
  inr,
  inrShort,
  finiteNumber,
  pct,
  plural,
  lower,
  fmtDate,
  daysUntil,
  groupMonthly,
  monthlyTrend,
  groupBy,
  withColors,
  topWithOther,
  TruncatedAxisTick,
  statusColor,
  useDashboardData,
  DASHBOARD_TARGETS,
  LoadingState,
  ErrorState,
  PageIntro,
  MetricGrid,
  ChartGrid,
  ChartCard,
  TableCard,
  Chip,
  TargetsCard,
  DefinitionsCard,
} from "./dashboardShared";

const loadAll = async () => {
  const [subscriptions, renewals, expired] = await Promise.all([
    fetchCustomerSubscriptions(),
    fetchRenewals(),
    fetchRenewals("expired"),
  ]);
  return {
    subscriptions: subscriptions || [],
    renewals: renewals || [],
    expired: expired || [],
  };
};

const customerOf = (r) => r.customerName || r.customer?.name || "Unknown";
const moduleOf = (r) => r.moduleName || r.module?.moduleName || "Unknown";
const valueOf = (r) => finiteNumber(r.initialPurchasePrice);

export default function RenewalsPage() {
  const { data, loading, error, updatedAt, reload } = useDashboardData(
    loadAll,
    "Unable to load renewal dashboard data.",
  );

  const source = data || { subscriptions: [], renewals: [], expired: [] };
  const dueByMonth = React.useMemo(
    () =>
      groupMonthly(
        source.renewals,
        (r) => r.nextRenewalDate,
        () => ({ due: 0 }),
        (c) => {
          c.due += 1;
        },
      ),
    [source.renewals],
  );
  const dueTrend = React.useMemo(
    () => monthlyTrend(dueByMonth, "due"),
    [dueByMonth],
  );
  const active = React.useMemo(
    () => source.subscriptions.filter((r) => lower(r.status) === "active"),
    [source.subscriptions],
  );
  const renewed = React.useMemo(
    () => active.filter((r) => finiteNumber(r.currentYear || 1) > 1),
    [active],
  );
  const upcoming = React.useMemo(
    () =>
      source.renewals
        .map((r) => ({ ...r, left: daysUntil(r.nextRenewalDate) }))
        .sort((a, b) => (a.left ?? 9999) - (b.left ?? 9999)),
    [source.renewals],
  );
  const renewalStatus = React.useMemo(
    () =>
      [
        { name: "Renewed", value: renewed.length },
        { name: "Due soon", value: source.renewals.length },
        { name: "Expired", value: source.expired.length },
      ]
        .filter((item) => item.value > 0)
        .map((item, index) => ({
          ...item,
          color: statusColor(item.name, index),
        })),
    [renewed.length, source.renewals.length, source.expired.length],
  );
  const completedTrend = React.useMemo(
    () =>
      groupMonthly(
        renewed,
        (r) => r.createdAt,
        () => ({ count: 0 }),
        (c) => {
          c.count += 1;
        },
      ),
    [renewed],
  );
  const valueByModule = React.useMemo(
    () =>
      topWithOther(
        withColors(
          groupBy(
            source.subscriptions,
            moduleOf,
            () => ({ value: 0 }),
            (c, r) => {
              c.value += valueOf(r);
            },
          ).sort((a, b) => b.value - a.value),
        ),
      ),
    [source.subscriptions],
  );
  const byOrg = React.useMemo(
    () =>
      topWithOther(
        groupBy(
          source.subscriptions,
          customerOf,
          () => ({ Active: 0, Expired: 0 }),
          (c, r) => {
            if (lower(r.status) === "active") c.Active += 1;
            else c.Expired += 1;
          },
        ).sort((a, b) => b.Active + b.Expired - (a.Active + a.Expired)),
      ),
    [source.subscriptions],
  );

  if (loading && !data)
    return <LoadingState text="Loading renewal analytics..." />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const { subscriptions, renewals, expired } = source;
  const subscriptionValue = subscriptions.reduce((s, r) => s + valueOf(r), 0);
  const decided = renewed.length + expired.length;
  const renewalRate = pct(renewed.length, decided);

  const dueIn30 = upcoming.filter(
    (r) => r.left !== null && r.left <= 30,
  ).length;

  const moduleTotal = valueByModule.reduce((s, r) => s + r.value, 0);
  const renewalStatusTotal = renewalStatus.reduce((s, r) => s + r.value, 0);
  const activeExpiredColors = [
    { name: "Active", color: statusColor("Active") },
    { name: "Expired", color: statusColor("Expired") },
  ];
  const tooltipStyle = {
    background: "var(--dash-surface)",
    border: "1px solid var(--dash-border)",
    borderRadius: 8,
    fontSize: 12,
  };

  const next = upcoming[0];
  const insight =
    [
      next && next.left !== null
        ? `${plural(dueIn30, "renewal")} due in the next 30 days. Next is ${customerOf(next)} (${moduleOf(next)}) on ${fmtDate(next.nextRenewalDate)}.`
        : renewals.length
          ? `${plural(renewals.length, "renewal")} due soon.`
          : "",
      expired.length
        ? `${plural(expired.length, "subscription")} ${expired.length === 1 ? "has" : "have"} expired and need follow-up.`
        : "",
      valueByModule[0]
        ? `${valueByModule[0].name} carries the most subscription value (${pct(valueByModule[0].value, moduleTotal)}%).`
        : "",
    ]
      .filter(Boolean)
      .join(" ") || "No subscriptions or renewals found yet.";

  return (
    <div className="dashboard-analytics-page">
      <PageIntro
        description="Which subscriptions are renewing, at risk, or already lapsed, and what they are worth."
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
            label: "Active subscriptions",
            value: active.length,
            hint: `${renewed.length} already renewed at least once`,
            tip: "Subscriptions whose status is Active",
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
            ...dueTrend,
            badWhenUp: true,
            hint: `${dueIn30} within 30 days`,
            tip: "Subscriptions returned by the renewals list as due soon",
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
            hint: expired.length ? "Need follow-up" : "None expired",
            tip: "Subscriptions past their end date and not renewed",
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
            value: inrShort(subscriptionValue),
            hint: decided ? `Renewal rate ${renewalRate}%` : "",
            tip: `Total initial purchase price of all subscriptions: ${inr(subscriptionValue)}`,
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
        <TableCard
          title="Renewals due soon"
          empty="No renewals are due."
          rows={upcoming.slice(0, 8)}
          totalRows={upcoming.length}
          columns={[
            { key: "c", label: "Customer", render: (r) => customerOf(r) },
            { key: "m", label: "Module", render: (r) => moduleOf(r) },
            {
              key: "d",
              label: "Renewal date",
              render: (r) => fmtDate(r.nextRenewalDate),
            },
            {
              key: "left",
              label: "Days left",
              align: "right",
              render: (r) =>
                r.left === null ? (
                  "-"
                ) : (
                  <Chip tone={r.left < 0 ? "bad" : r.left <= 7 ? "warn" : "ok"}>
                    {r.left < 0 ? `${-r.left} d late` : `${r.left} d`}
                  </Chip>
                ),
            },
          ]}
        />

        <ChartCard
          title="Renewal status"
          ariaLabel="Donut chart of renewal status"
          legendLayout="vertical"
          height={150}
          legendItems={renewalStatus.map((i) => ({
            color: i.color,
            label: i.name,
            value: i.value,
          }))}
          isEmpty={!renewalStatus.length}
          donutCenter={{ total: renewalStatusTotal, caption: "subscriptions" }}
        >
          <PieChart margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
            <Tooltip contentStyle={tooltipStyle} />
            <Pie
              data={renewalStatus}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="76%"
              paddingAngle={2}
              stroke="none"
            >
              {renewalStatus.map((r, i) => (
                <Cell key={i} fill={r.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>

        <ChartCard
          title="Renewals due by month"
          ariaLabel="Bar chart of renewals due by month"
          legendItems={[{ color: cove.orange, label: "Renewals due" }]}
          isEmpty={!dueByMonth.length}
        >
          <BarChart data={dueByMonth}>
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
                value="Renewals due"
                angle={-90}
                position="insideLeft"
                offset={0}
                dy={12}
                style={axisTick}
              />
            </YAxis>
            <Tooltip contentStyle={tooltipStyle} />
            <Bar
              dataKey="due"
              name="Renewals due"
              fill={cove.orange}
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            >
              {dueByMonth.length <= 12 && (
                <LabelList
                  dataKey="due"
                  position="top"
                  formatter={(value) => value.toLocaleString("en-IN")}
                  style={{ fill: "var(--dash-text)", fontSize: 10 }}
                />
              )}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Renewals completed per month"
          ariaLabel="Line chart of renewals completed per month"
          legendItems={[{ color: cove.blue, label: "Renewals completed" }]}
          isEmpty={!completedTrend.length}
          emptyText="No subscription has been renewed yet."
        >
          <LineChart data={completedTrend}>
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
                value="Renewals completed"
                angle={-90}
                position="insideLeft"
                offset={0}
                dy={12}
                style={axisTick}
              />
            </YAxis>
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="count"
              name="Renewals"
              stroke={cove.blue}
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ChartCard>

        <ChartCard
          title="Subscription value by module"
          ariaLabel="Donut chart of subscription value by module"
          legendLayout="vertical"
          height={150}
          legendItems={valueByModule.map((i) => ({
            color: i.color,
            label: `${i.name} (${pct(i.value, moduleTotal)}%)`,
            value: i.value,
          }))}
          isEmpty={!valueByModule.length || moduleTotal === 0}
          donutCenter={{ total: moduleTotal, caption: "value" }}
        >
          <PieChart margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => inr(v)} />
            <Pie
              data={valueByModule}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="76%"
              paddingAngle={2}
              stroke="none"
            >
              {valueByModule.map((r, i) => (
                <Cell key={i} fill={r.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>

        <ChartCard
          title="Active vs expired by customer"
          ariaLabel="Bar chart of active versus expired subscriptions by organization"
          legendItems={[
            { color: activeExpiredColors[0].color, label: "Active" },
            { color: activeExpiredColors[1].color, label: "Expired" },
          ]}
          isEmpty={!byOrg.length}
        >
          <BarChart data={byOrg}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStroke}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={<TruncatedAxisTick maxLength={12} textAnchor="middle" dy={12} />}
              axisLine={false}
              tickLine={false}
            >
              <Label
                value="Customer"
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
                value="Subscription count"
                angle={-90}
                position="insideLeft"
                offset={0}
                dy={12}
                style={axisTick}
              />
            </YAxis>
            <Tooltip contentStyle={tooltipStyle} />
            <Bar
              dataKey="Active"
              stackId="a"
              fill={activeExpiredColors[0].color}
              maxBarSize={36}
            />
            <Bar
              dataKey="Expired"
              stackId="a"
              fill={activeExpiredColors[1].color}
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ChartCard>
      </ChartGrid>

      <ChartGrid>
        <TargetsCard
          items={[
            {
              label: "Renewal rate",
              value: renewalRate,
              target: DASHBOARD_TARGETS.renewalRatePercent,
              format: (v) => `${v}%`,
            },
          ]}
        />
        <DefinitionsCard
          items={[
            [
              "Renewed",
              "Active subscriptions that are in their second year or later.",
            ],
            [
              "Renewal rate",
              "Renewed ÷ (renewed + expired). An estimate until renewal outcomes are stored.",
            ],
            [
              "Due soon",
              "Subscriptions returned by the renewals list for the coming period.",
            ],
            [
              "Subscription value",
              "Sum of the initial purchase price of every subscription.",
            ],
          ]}
        />
      </ChartGrid>
    </div>
  );
}

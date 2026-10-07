// src/pages/Dashboard/PurchaseOrdersPage.jsx
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
import { fetchPurchaseOrders } from "../../services/quotationApi";
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
  lower,
  toRows,
  titleCase,
  fmtDate,
  daysSince,
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

const amountOf = (o) =>
  finiteNumber(o.totalAmount ?? o.totals?.grandTotal ?? o.amount ?? 0);
const dateOf = (o) => o.poDate || o.createdAt;
const poNoOf = (o) =>
  o.poNumber || o.poNo || o.purchaseOrderNumber || `#${o.id ?? ""}`;
const isVerifiedOrDecided = (o) =>
  ["verified", "approved", "rejected"].includes(lower(o.verificationStatus));
const isClosed = (o) => lower(o.status) === "closed";

export default function PurchaseOrdersPage() {
  const { data, loading, error, updatedAt, reload } = useDashboardData(
    fetchPurchaseOrders,
    "Unable to load purchase order dashboard data.",
  );

  const orders = React.useMemo(() => toRows(data), [data]);
  const monthly = React.useMemo(
    () =>
      groupMonthly(
        orders,
        dateOf,
        () => ({ count: 0, value: 0 }),
        (c, o) => {
          c.count += 1;
          c.value += amountOf(o) / 1000;
        },
      ),
    [orders],
  );
  const countTrend = React.useMemo(
    () => monthlyTrend(monthly, "count"),
    [monthly],
  );
  const valueTrend = React.useMemo(
    () => monthlyTrend(monthly, "value"),
    [monthly],
  );
  const verification = React.useMemo(
    () =>
      topWithOther(
        groupBy(
          orders,
          (o) => titleCase(o.verificationStatus) || "Pending",
          () => ({ value: 0 }),
          (c) => {
            c.value += 1;
          },
        )
          .sort((a, b) => b.value - a.value)
          .map((item, index) => ({
            ...item,
            color: statusColor(item.name, index),
          })),
      ),
    [orders],
  );
  const byOrg = React.useMemo(
    () =>
      groupBy(
        orders,
        (o) => o.companyName,
        () => ({ count: 0, value: 0 }),
        (c, o) => {
          c.count += 1;
          c.value += amountOf(o);
        },
      ).sort((a, b) => b.count - a.count),
    [orders],
  );
  const chartOrganizations = React.useMemo(() => topWithOther(byOrg), [byOrg]);
  const direction = React.useMemo(
    () =>
      topWithOther(
        withColors(
          groupBy(
            orders,
            (o) => titleCase(o.poDirection) || "Unknown",
            () => ({ value: 0 }),
            (c) => {
              c.value += 1;
            },
          ).sort((a, b) => b.value - a.value),
        ),
      ),
    [orders],
  );

  if (loading && !data)
    return <LoadingState text="Loading purchase order analytics..." />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const totalValue = orders.reduce((s, o) => s + amountOf(o), 0);
  const awaiting = orders
    .filter((o) => !isVerifiedOrDecided(o))
    .map((o) => ({ ...o, age: daysSince(dateOf(o)) ?? 0 }))
    .sort((a, b) => b.age - a.age);
  const openOrders = orders.filter((o) => !isClosed(o)).length;

  const latest = monthly[monthly.length - 1];

  const verificationTotal = verification.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const directionTotal = direction.reduce((sum, item) => sum + item.value, 0);
  const tooltipStyle = {
    background: "var(--dash-surface)",
    border: "1px solid var(--dash-border)",
    borderRadius: 8,
    fontSize: 12,
  };

  const insight =
    [
      awaiting.length
        ? `${plural(awaiting.length, "PO")} ${awaiting.length === 1 ? "is" : "are"} awaiting verification; the oldest has waited ${awaiting[0].age} day${awaiting[0].age === 1 ? "" : "s"}.`
        : orders.length
          ? "Every purchase order has been verified."
          : "",
      orders.length
        ? `${plural(openOrders, "order")} ${openOrders === 1 ? "is" : "are"} still open.`
        : "",
      chartOrganizations[0]
        ? `${chartOrganizations[0].name} has the most POs (${pct(chartOrganizations[0].count, orders.length)}%).`
        : "",
    ]
      .filter(Boolean)
      .join(" ") || "No purchase orders have been received yet.";

  return (
    <div className="dashboard-analytics-page">
      <PageIntro
        description="Which customer POs have arrived, which still need verification, and how much they are worth."
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
            label: "Total purchase orders",
            value: orders.length,
            ...countTrend,
            hint: latest ? `${latest.month}: ${latest.count}` : "",
            tip: "All customer purchase orders received",
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
            value: inrShort(totalValue),
            ...valueTrend,
            hint: orders.length
              ? `Average ${inrShort(totalValue / orders.length)} per PO`
              : "",
            tip: `Total value of all purchase orders: ${inr(totalValue)}`,
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
            label: "Awaiting verification",
            value: awaiting.length,
            hint: awaiting.length
              ? `Oldest: ${awaiting[0].age} days`
              : "All verified",
            tip: "POs that are not yet verified, approved or rejected",
            icon: (
              <img
                src="/logo/clock.png"
                alt="Awaiting verification"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
          {
            label: "Open orders",
            value: openOrders,
            hint: `${orders.length - openOrders} closed`,
            tip: "Orders whose status is not Closed",
            icon: (
              <img
                src="/logo/clipboard-list-check.png"
                alt="Open orders"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
        ]}
      />

      <ChartGrid>
        <TableCard
          title="Awaiting verification"
          empty="Every PO has been verified."
          rows={awaiting.slice(0, 8)}
          highlightHeader
          columns={[
            { key: "po", label: "PO No.", render: (o) => poNoOf(o) },
            {
              key: "customer",
              label: "Customer",
              render: (o) => o.companyName || "-",
            },
            {
              key: "date",
              label: "Received",
              render: (o) => fmtDate(dateOf(o)),
            },
            {
              key: "age",
              label: "Waiting",
              align: "right",
              render: (o) => (
                <Chip tone={o.age > 7 ? "bad" : o.age > 3 ? "warn" : "ok"}>
                  {o.age} d
                </Chip>
              ),
            },
            {
              key: "value",
              label: "Value",
              align: "right",
              render: (o) => inr(amountOf(o)),
            },
          ]}
          totalRows={awaiting.length}
        />

        <ChartCard
          title="Verification status"
          ariaLabel="Donut chart of purchase order approval status"
          legendLayout="vertical"
          height={150}
          legendItems={verification.map((i) => ({
            color: i.color,
            label: i.name,
            value: i.value,
          }))}
          isEmpty={!verification.length}
          donutCenter={{ total: verificationTotal, caption: "orders" }}
        >
          <PieChart margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
            <Tooltip contentStyle={tooltipStyle} />
            <Pie
              data={verification}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="76%"
              paddingAngle={2}
              stroke="none"
            >
              {verification.map((r, i) => (
                <Cell key={i} fill={r.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>

        <ChartCard
          title="POs received per month"
          ariaLabel="Bar chart of purchase orders per month"
          legendItems={[{ color: cove.blue, label: "Purchase orders" }]}
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
                value="Order count"
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
              name="Purchase orders"
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
          title="PO value per month"
          ariaLabel="Line chart of purchase order value per month"
          legendItems={[
            { color: cove.orange, label: "PO value (₹ thousands)" },
          ]}
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
            <YAxis
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              tickCount={3}
            >
              <Label
                value="Order value (₹ thousands)"
                angle={-90}
                position="insideLeft"
                offset={0}
                dy={50}
                style={axisTick}
              />
            </YAxis>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => [inr(v * 1000), "PO value"]}
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
          title="Top customers by number of POs"
          ariaLabel="Bar chart of purchase orders by organization"
          legendItems={[{ color: cove.aqua, label: "Purchase orders (top 8)" }]}
          isEmpty={!byOrg.length}
        >
          <BarChart
            data={chartOrganizations}
            layout="vertical"
            margin={{ left: 10 }}
          >
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
              name="Purchase orders"
              fill={cove.aqua}
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
          title="Purchase orders by direction"
          ariaLabel="Donut chart of purchase orders by direction"
          legendLayout="vertical"
          height={150}
          legendItems={direction.map((i) => ({
            color: i.color,
            label: i.name,
            value: i.value,
          }))}
          isEmpty={!direction.length}
          donutCenter={{ total: directionTotal, caption: "orders" }}
        >
          <PieChart margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
            <Tooltip contentStyle={tooltipStyle} />
            <Pie
              data={direction}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="76%"
              paddingAngle={2}
              stroke="none"
            >
              {direction.map((r, i) => (
                <Cell key={i} fill={r.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>
      </ChartGrid>

      <ChartGrid>
        <TargetsCard
          items={[
            {
              label: `PO value in ${latest?.month || "latest month"}`,
              value: (latest?.value || 0) * 1000,
              target: DASHBOARD_TARGETS.poValuePerMonth,
              format: inrShort,
            },
          ]}
        />
        <DefinitionsCard
          items={[
            [
              "Awaiting verification",
              "PO whose verification status is not Verified, Approved or Rejected.",
            ],
            [
              "Waiting (days)",
              "Days since the PO date. Over 3 days is amber, over 7 days is red.",
            ],
            [
              "Open orders",
              "Orders whose status is anything other than Closed.",
            ],
            [
              "Direction",
              "Whether the PO is incoming or outgoing, as recorded on the PO.",
            ],
          ]}
        />
      </ChartGrid>
    </div>
  );
}

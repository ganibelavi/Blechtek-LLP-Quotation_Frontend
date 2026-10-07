// src/pages/Dashboard/InvoicesPage.jsx
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
import { fetchInvoices } from "../../services/quotationApi";
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
  statusColor,
  topWithOther,
  TruncatedAxisTick,
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

const amountOf = (i) =>
  finiteNumber(i.totalAmount ?? i.totals?.grandTotal ?? i.amount ?? 0);
const nameOf = (i) =>
  i.invoice?.companyName ||
  i.companyName ||
  i.invoice?.receiverName ||
  i.receiverName ||
  "Unknown";
const statusOf = (i) => i.invoice?.status || i.status || "Unknown";
const issueDateOf = (i) =>
  i.invoice?.dateOfIssue || i.dateOfIssue || i.createdAt;
const dueDateOf = (i) => i.invoice?.dueDate || i.dueDate || null;
const invoiceNoOf = (i) =>
  i.invoice?.invoiceNumber ||
  i.invoiceNumber ||
  i.invoiceNo ||
  `#${i.id ?? ""}`;
const isPaid = (i) => lower(statusOf(i)) === "paid";
const isCancelled = (i) =>
  ["cancelled", "canceled"].includes(lower(statusOf(i)));

/* Bucket by days past the due date (or past the issue date when no due date is stored). */
const BUCKETS = [
  { name: "Not due", color: cove.ok },
  { name: "0-30 days", color: cove.warn },
  { name: "31-60 days", color: cove.bad },
  { name: "61-90 days", color: cove.bad },
  { name: "90+ days", color: cove.bad },
];
const bucketIndex = (days) =>
  days <= 0 ? 0 : days <= 30 ? 1 : days <= 60 ? 2 : days <= 90 ? 3 : 4;

export default function InvoicesPage() {
  const { data, loading, error, updatedAt, reload } = useDashboardData(
    fetchInvoices,
    "Unable to load invoice dashboard data.",
  );

  const invoices = React.useMemo(
    () => toRows(data).filter((i) => !isCancelled(i)),
    [data],
  );
  const monthly = React.useMemo(
    () =>
      groupMonthly(
        invoices,
        issueDateOf,
        () => ({ count: 0, value: 0 }),
        (c, i) => {
          c.count += 1;
          c.value += amountOf(i) / 1000;
        },
      ),
    [invoices],
  );
  const valueTrend = React.useMemo(
    () => monthlyTrend(monthly, "value"),
    [monthly],
  );
  const unpaid = React.useMemo(
    () =>
      invoices
        .filter((i) => !isPaid(i))
        .map((i) => {
          const base = dueDateOf(i) || issueDateOf(i);
          const days = daysSince(base) ?? 0;
          return {
            ...i,
            days,
            overdue: dueDateOf(i) ? days > 0 : false,
            amount: amountOf(i),
          };
        })
        .sort((a, b) => b.days - a.days),
    [invoices],
  );
  const status = React.useMemo(
    () =>
      topWithOther(
        groupBy(
          invoices,
          (i) => titleCase(statusOf(i)),
          () => ({ value: 0, count: 0 }),
          (c, i) => {
            c.value += amountOf(i);
            c.count += 1;
          },
        )
          .sort((a, b) => b.value - a.value)
          .map((item, index) => ({
            ...item,
            color: statusColor(item.name, index),
          })),
      ),
    [invoices],
  );
  const ageing = React.useMemo(() => {
    const buckets = BUCKETS.map((bucket) => ({ ...bucket, value: 0, count: 0 }));
    unpaid.forEach((invoice) => {
      const bucket = buckets[bucketIndex(invoice.days)];
      bucket.value += invoice.amount / 1000;
      bucket.count += 1;
    });
    return buckets;
  }, [unpaid]);
  const byCustomer = React.useMemo(
    () =>
      topWithOther(
        groupBy(
          invoices,
          nameOf,
          () => ({ value: 0 }),
          (c, i) => {
            c.value += amountOf(i) / 1000;
          },
        ).sort((a, b) => b.value - a.value),
      ),
    [invoices],
  );
  const pendingByCustomer = React.useMemo(
    () =>
      topWithOther(
        groupBy(
          unpaid,
          nameOf,
          () => ({ value: 0 }),
          (c, i) => {
            c.value += i.amount / 1000;
          },
        ).sort((a, b) => b.value - a.value),
      ),
    [unpaid],
  );

  if (loading && !data)
    return <LoadingState text="Loading invoice analytics..." />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const totalValue = invoices.reduce((s, i) => s + amountOf(i), 0);
  const paidInvoices = invoices.filter(isPaid);
  const paidValue = paidInvoices.reduce((s, i) => s + amountOf(i), 0);
  const unpaidValue = unpaid.reduce((s, i) => s + i.amount, 0);
  const advanceCount = invoices.filter(
    (i) => lower(statusOf(i)) === "advance_received",
  ).length;
  const overdueRows = unpaid.filter((i) => i.overdue);
  const overdueValue = overdueRows.reduce((s, i) => s + i.amount, 0);

  const insight =
    [
      invoices.length
        ? `${inrShort(unpaidValue)} across ${plural(unpaid.length, "invoice")} is not yet marked paid (${pct(unpaidValue, totalValue)}% of billing).`
        : "",
      overdueRows.length
        ? `${inrShort(overdueValue)} is past its due date, the oldest by ${overdueRows[0].days} days.`
        : "",
      pendingByCustomer[0]
        ? `${pendingByCustomer[0].name} owes the most (${inrShort(pendingByCustomer[0].value * 1000)}).`
        : "",
    ]
      .filter(Boolean)
      .join(" ") || "No invoices have been raised yet.";

  const toneForAge = (r) =>
    r.overdue ? (r.days > 30 ? "bad" : "warn") : "neutral";
  const tooltipStyle = {
    background: "var(--dash-surface)",
    border: "1px solid var(--dash-border)",
    borderRadius: 8,
    fontSize: 12,
  };

  return (
    <div className="dashboard-analytics-page">
      <PageIntro
        description="How much has been billed, how much is still unpaid, and which customers owe it."
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
            label: "Total invoices",
            value: invoices.length,
            hint: `${paidInvoices.length} paid · ${unpaid.length} unpaid`,
            tip: "All invoices excluding cancelled ones",
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
            value: inrShort(totalValue),
            ...valueTrend,
            hint: `${inrShort(paidValue)} paid · ${inrShort(unpaidValue)} unpaid`,
            tip: `Total billed: ${inr(totalValue)}`,
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
            value: unpaid.length,
            hint: overdueRows.length
              ? `${overdueRows.length} past due date`
              : "None past due date",
            tip: "Invoices whose status is not Paid",
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
            value: advanceCount,
            hint: "Invoices with an advance recorded",
            tip: "Invoices whose status is Advance received",
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
        <TableCard
          title="Oldest unpaid invoices"
          empty="No unpaid invoices."
          rows={unpaid.slice(0, 8)}
          totalRows={unpaid.length}
          highlightHeader
          columns={[
            { key: "no", label: "Invoice", render: (r) => invoiceNoOf(r) },
            { key: "customer", label: "Customer", render: (r) => nameOf(r) },
            {
              key: "date",
              label: dueDateOf(unpaid[0] || {}) ? "Due" : "Issued",
              render: (r) => fmtDate(dueDateOf(r) || issueDateOf(r)),
            },
            {
              key: "age",
              label: "Age",
              align: "right",
              render: (r) => (
                <Chip tone={toneForAge(r)}>
                  {r.days > 0 ? `${r.days} d` : "Not due"}
                </Chip>
              ),
            },
            {
              key: "amt",
              label: "Amount",
              align: "right",
              render: (r) => inr(r.amount),
            },
          ]}
        />

        <ChartCard
          title="Unpaid invoices by age"
          ariaLabel="Bar chart of unpaid invoice value by age"
          legendItems={[
            {
              color: cove.orange,
              label:
                "Unpaid value (₹ thousands), days past due date or issue date",
            },
          ]}
          isEmpty={!unpaid.length}
          emptyText="Nothing unpaid."
        >
          <BarChart data={ageing}>
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
            />
            <YAxis tick={axisTick} axisLine={false} tickLine={false}>
              <Label
                value="Unpaid (₹ thousands)"
                angle={-90}
                position="insideLeft"
                offset={0}
                dy={30}
                style={axisTick}
              />
            </YAxis>
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [inr(v * 1000), "Unpaid"]} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={36}>
              {ageing.map((b, i) => (
                <Cell key={i} fill={b.color} />
              ))}
              {ageing.length <= 12 && (
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(value) => num(value * 1000)}
                  style={{ fill: "var(--dash-text)", fontSize: 10 }}
                />
              )}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Invoice value per month"
          ariaLabel="Bar chart of invoice value by month"
          legendItems={[
            { color: cove.blue, label: "Invoice value (₹ thousands)" },
          ]}
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
            <YAxis tick={axisTick} axisLine={false} tickLine={false} tickCount={3}>
              <Label
                value="Invoice value (₹ thousands)"
                angle={-90}
                position="insideLeft"
                offset={0}
                dy={12}
                style={axisTick}
              />
            </YAxis>
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [inr(v * 1000), "Invoiced"]} />
            <Bar
              dataKey="value"
              fill={cove.blue}
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            >
              {monthly.length <= 12 && (
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(value) => num(value * 1000)}
                  style={{ fill: "var(--dash-text)", fontSize: 10 }}
                />
              )}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Invoice status by value"
          ariaLabel="Donut chart of invoice status by value"
          legendLayout="vertical"
          height={150}
          legendItems={status.map((i) => ({
            color: i.color,
            label: `${i.name} (${pct(i.value, totalValue)}%)`,
            value: i.value,
          }))}
          isEmpty={!status.length}
          donutCenter={{ total: totalValue, caption: "invoices" }}
        >
          <PieChart margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => inr(v)} />
            <Pie
              data={status}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="76%"
              paddingAngle={2}
              stroke="none"
            >
              {status.map((r, i) => (
                <Cell key={i} fill={r.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>

        <ChartCard
          title="Invoices raised per month"
          ariaLabel="Line chart of invoice count trend"
          legendItems={[{ color: cove.green, label: "Invoices raised" }]}
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
              allowDecimals={false}
            >
              <Label
                value="Invoice count"
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
              name="Invoices"
              stroke={cove.green}
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ChartCard>

        <ChartCard
          title="Top customers by invoice value"
          ariaLabel="Bar chart of invoice value by customer"
          legendItems={[
            { color: cove.orange, label: "Invoice value (₹ thousands, top 8)" },
          ]}
          isEmpty={!byCustomer.length}
        >
          <BarChart data={byCustomer} layout="vertical" margin={{ left: 10 }}>
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
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={<TruncatedAxisTick maxLength={16} />}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [inr(v * 1000), "Invoiced"]} />
            <Bar
              dataKey="value"
              fill={cove.orange}
              radius={[0, 4, 4, 0]}
              maxBarSize={12}
            >
              <LabelList
                dataKey="value"
                position="right"
                formatter={(value) => num(value * 1000)}
                style={{ fill: "var(--dash-text)", fontSize: 10 }}
              />
            </Bar>
          </BarChart>
        </ChartCard>

        <DefinitionsCard
          items={[
            [
              "Pending / unpaid",
              "Invoices whose status is not Paid. Cancelled invoices are excluded everywhere.",
            ],
            [
              "Past due date",
              "Only shown when invoices store a due date; otherwise age counts from the issue date.",
            ],
            [
              "Unpaid by age",
              "Unpaid invoice value grouped by days past the due date (or issue date).",
            ],
            [
              "Paid share",
              "Value of invoices marked Paid divided by total invoice value.",
            ],
          ]}
        />

        <ChartCard
          title="Unpaid value by customer"
          ariaLabel="Bar chart of unpaid invoice value by customer"
          legendItems={[
            { color: cove.red, label: "Unpaid (₹ thousands, top 8)" },
          ]}
          isEmpty={!pendingByCustomer.length}
          emptyText="Nothing unpaid."
        >
          <BarChart
            data={pendingByCustomer}
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
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={<TruncatedAxisTick maxLength={16} />}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [inr(v * 1000), "Unpaid"]} />
            <Bar
              dataKey="value"
              fill={cove.red}
              radius={[0, 4, 4, 0]}
              maxBarSize={12}
            >
              <LabelList
                dataKey="value"
                position="right"
                formatter={(value) => num(value * 1000)}
                style={{ fill: "var(--dash-text)", fontSize: 10 }}
              />
            </Bar>
          </BarChart>
        </ChartCard>

        <TargetsCard
          items={[
            {
              label: "Invoice value paid",
              value: pct(paidValue, totalValue),
              target: DASHBOARD_TARGETS.invoiceCollectionPercent,
              format: (v) => `${v}%`,
            },
          ]}
        />
      </ChartGrid>
    </div>
  );
}

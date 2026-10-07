// src/pages/Dashboard/UsersPage.jsx
import React from "react";
import {
  BarChart,
  Bar,
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
import { fetchUsers } from "../../services/userApi";
import {
  fetchAllQuotations,
  fetchInvoices,
  fetchPurchaseOrders,
  fetchRenewals,
} from "../../services/quotationApi";
import {
  cove,
  gridStroke,
  axisTick,
  pct,
  plural,
  lower,
  toRows,
  titleCase,
  fmtDateTime,
  daysSince,
  withColors,
  topWithOther,
  TruncatedAxisTick,
  useDashboardData,
  LoadingState,
  ErrorState,
  PageIntro,
  MetricGrid,
  ChartGrid,
  ChartCard,
  TableCard,
  Chip,
  DefinitionsCard,
} from "./dashboardShared";

const loadAll = async () => {
  const [users, quotations, orders, invoices, renewals] = await Promise.all([
    fetchUsers(),
    fetchAllQuotations(),
    fetchPurchaseOrders(),
    fetchInvoices(),
    fetchRenewals(),
  ]);
  return {
    users: Array.isArray(users) ? users : [],
    quotations: toRows(quotations),
    orders: toRows(orders),
    invoices: toRows(invoices),
    renewals: toRows(renewals),
  };
};

const displayName = (u) =>
  `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email;
/* A record belongs to a user when one of its "owner" fields equals their name or email. */
const owns = (row, fields, user) =>
  fields.some((f) => {
    const v = lower(row[f]);
    return v && (v === lower(displayName(user)) || v === lower(user.email));
  });
const countFor = (rows, fields, user) =>
  rows.filter((r) => owns(r, fields, user)).length;

export default function UsersPage() {
  const { data, loading, error, updatedAt, reload } = useDashboardData(
    loadAll,
    "Unable to load users dashboard data.",
  );

  const { users, quotations, orders, invoices, renewals } = data || {
    users: [],
    quotations: [],
    orders: [],
    invoices: [],
    renewals: [],
  };
  const totalOf = (r) =>
    r.Quotations + r["Purchase orders"] + r.Invoices + r.Renewals;
  const recordsPerUser = React.useMemo(
    () =>
      users.map((u) => ({
        name: displayName(u),
        Quotations: countFor(quotations, ["createdByUser", "referenceBy"], u),
        "Purchase orders": countFor(orders, ["uploadedBy"], u),
        Invoices: countFor(invoices, ["createdByUser", "createdBy"], u),
        Renewals: countFor(renewals, ["createdByUser", "createdBy"], u),
      })),
    [users, quotations, orders, invoices, renewals],
  );
  const chartRecordsPerUser = React.useMemo(
    () =>
      topWithOther(
        [...recordsPerUser].sort((a, b) => totalOf(b) - totalOf(a)),
      ),
    [recordsPerUser],
  );
  const roles = React.useMemo(
    () =>
      topWithOther(
        withColors(
          Object.entries(
            users.reduce(
              (counts, user) => ({
                ...counts,
                [user.role || "Unknown"]:
                  (counts[user.role || "Unknown"] || 0) + 1,
              }),
              {},
            ),
          )
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value),
        ),
      ),
    [users],
  );
  const moduleUsage = React.useMemo(
    () =>
      withColors(
        [
          { name: "Quotations", value: quotations.length },
          { name: "Purchase orders", value: orders.length },
          { name: "Invoices", value: invoices.length },
          { name: "Renewals", value: renewals.length },
        ].filter((i) => i.value > 0),
      ),
    [quotations.length, orders.length, invoices.length, renewals.length],
  );
  const recency = React.useMemo(() => {
    const buckets = [
      { name: "Today", value: 0, color: cove.blue },
      { name: "1-7 days", value: 0, color: cove.aqua },
      { name: "8-30 days", value: 0, color: cove.yellow },
      { name: "30+ days", value: 0, color: cove.orange },
      { name: "Never", value: 0, color: cove.grey },
    ];
    users.forEach((user) => {
      const days = user.lastLoginAt ? daysSince(user.lastLoginAt) : null;
      const index =
        days === null ? 4 : days < 1 ? 0 : days <= 7 ? 1 : days <= 30 ? 2 : 3;
      buckets[index].value += 1;
    });
    return buckets;
  }, [users]);
  const recentSignIns = React.useMemo(
    () =>
      [...users]
        .sort(
          (a, b) =>
            new Date(b.lastLoginAt || 0).getTime() -
            new Date(a.lastLoginAt || 0).getTime(),
        )
        .slice(0, 8),
    [users],
  );

  if (loading && !data)
    return <LoadingState text="Loading user analytics..." />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const allRecords =
    quotations.length + orders.length + invoices.length + renewals.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const topUser = [...recordsPerUser].sort(
    (a, b) => totalOf(b) - totalOf(a),
  )[0];
  const attributed = recordsPerUser.reduce((s, r) => s + totalOf(r), 0);

  const inactive = users.filter((u) => !u.isActive).length;
  const admins = users.filter((u) => lower(u.role) === "admin").length;
  const moduleUsageTotal = moduleUsage.reduce((sum, item) => sum + item.value, 0);
  const roleTotal = roles.reduce((sum, item) => sum + item.value, 0);
  const tooltipStyle = {
    background: "var(--dash-surface)",
    border: "1px solid var(--dash-border)",
    borderRadius: 8,
    fontSize: 12,
  };

  const insight =
    [
      users.length
        ? `${activeUsers} of ${plural(users.length, "user")} ${activeUsers === 1 ? "is" : "are"} active.`
        : "",
      topUser && totalOf(topUser) > 0
        ? `${topUser.name} created ${pct(totalOf(topUser), attributed)}% of the records that can be traced to a user.`
        : "",
      recency[4].value + recency[3].value > 0
        ? `${plural(recency[4].value + recency[3].value, "account")} ${recency[4].value + recency[3].value === 1 ? "has" : "have"} not signed in for 30+ days or never.`
        : "",
    ]
      .filter(Boolean)
      .join(" ") || "No users found.";

  return (
    <div className="dashboard-analytics-page">
      <PageIntro
        description="Who is using the system, how much they create, and which accounts need attention."
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
            label: "Total users",
            value: users.length,
            hint: `${admins} administrator${admins === 1 ? "" : "s"}`,
            tip: "All user accounts",
            icon: (
              <img
                src="/logo/users.png"
                alt="Total users"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
          {
            label: "Active users",
            value: activeUsers,
            hint: inactive ? `${inactive} inactive` : "No inactive accounts",
            tip: "Accounts that are enabled",
            icon: (
              <img
                src="/logo/verification.png"
                alt="Active users"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
          {
            label: "Records created (all users)",
            value: allRecords,
            hint: `${quotations.length} quotations · ${orders.length} POs · ${invoices.length} invoices`,
            tip: "Quotations, purchase orders, invoices and renewals combined",
            icon: (
              <img
                src="/logo/report.png"
                alt="Records created"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
          {
            label: "Avg. records / user",
            value: users.length
              ? (allRecords / users.length).toFixed(1)
              : "0.0",
            hint: "Records divided by total users",
            tip: "Total records divided by the number of users",
            icon: (
              <img
                src="/logo/speedometer.png"
                alt="Average records per user"
                style={{ width: 28, height: 28 }}
              />
            ),
            color: "primary",
          },
        ]}
      />

      {/* <StatStrip
        title="User access health"
        items={[
          {
            label: "Never signed in",
            value: recency[4].value,
            detail: "Accounts that may need onboarding",
            color: cove.orange,
          },
          {
            label: "No sign-in in 30+ days",
            value: recency[3].value,
            detail: "Review access and follow up",
            color: cove.yellow,
          },
          {
            label: "Inactive accounts",
            value: inactive,
            detail: "Access is currently disabled",
            color: cove.grey,
          },
          {
            label: "Administrators",
            value: admins,
            detail: "Accounts with elevated access",
            color: cove.blue,
          },
        ]}
      /> */}

      <ChartGrid>
        <ChartCard
          title="Records created per user"
          ariaLabel="Bar chart of records created per user"
          legendItems={[
            { color: cove.blue, label: "Quotations" },
            { color: cove.orange, label: "Purchase orders" },
            { color: cove.green, label: "Invoices" },
            { color: cove.yellow, label: "Renewals" },
          ]}
          isEmpty={!recordsPerUser.length}
        >
          <BarChart data={chartRecordsPerUser}>
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
                value="User"
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
                value="Records created"
                angle={-90}
                position="insideLeft"
                offset={0}
                dy={12}
                style={axisTick}
              />
            </YAxis>
            <Tooltip contentStyle={tooltipStyle} />
            <Bar
              dataKey="Quotations"
              stackId="a"
              fill={cove.blue}
              maxBarSize={36}
            />
            <Bar
              dataKey="Purchase orders"
              stackId="a"
              fill={cove.orange}
              maxBarSize={36}
            />
            <Bar
              dataKey="Invoices"
              stackId="a"
              fill={cove.green}
              maxBarSize={36}
            />
            <Bar
              dataKey="Renewals"
              stackId="a"
              fill={cove.yellow}
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Records by type"
          ariaLabel="Donut chart of records by type"
          legendLayout="vertical"
          height={150}
          legendItems={moduleUsage.map((i) => ({
            color: i.color,
            label: i.name,
            value: i.value,
          }))}
          isEmpty={!moduleUsage.length}
          donutCenter={{ total: moduleUsageTotal, caption: "records" }}
        >
          <PieChart margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
            <Tooltip contentStyle={tooltipStyle} />
            <Pie
              data={moduleUsage}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="76%"
              paddingAngle={2}
              stroke="none"
            >
              {moduleUsage.map((r, i) => (
                <Cell key={i} fill={r.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>

        <ChartCard
          title="When users last signed in"
          ariaLabel="Bar chart of users by last sign-in"
          legendItems={[{ color: cove.blue, label: "Users" }]}
          isEmpty={!users.length}
        >
          <BarChart data={recency}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStroke}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={axisTick}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              tickCount={3}
            >
              <Label
                value="Users"
                angle={-90}
                position="insideLeft"
                offset={0}
                dy={12}
                style={axisTick}
              />
            </YAxis>
            <Tooltip contentStyle={tooltipStyle} />
            <Bar
              dataKey="value"
              name="Users"
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            >
              {recency.map((r, i) => (
                <Cell key={i} fill={r.color} />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                formatter={(value) => value.toLocaleString("en-IN")}
                style={{ fill: "var(--dash-text)", fontSize: 10 }}
              />
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Users by role"
          ariaLabel="Donut chart of user role distribution"
          legendLayout="vertical"
          height={150}
          legendItems={roles.map((i) => ({
            color: i.color,
            label: titleCase(i.name),
            value: i.value,
          }))}
          isEmpty={!roles.length}
          donutCenter={{ total: roleTotal, caption: "users" }}
        >
          <PieChart margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
            <Tooltip contentStyle={tooltipStyle} />
            <Pie
              data={roles}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="76%"
              paddingAngle={2}
              stroke="none"
            >
              {roles.map((r, i) => (
                <Cell key={i} fill={r.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>

        <TableCard
          title="Recent sign-ins"
          totalRows={users.length}
          rows={recentSignIns}
          highlightHeader
          columns={[
            { key: "n", label: "User", render: (u) => displayName(u) },
            {
              key: "r",
              label: "Role",
              render: (u) => titleCase(u.role) || "-",
            },
            {
              key: "l",
              label: "Last sign-in",
              render: (u) => fmtDateTime(u.lastLoginAt),
            },
            {
              key: "s",
              label: "Status",
              render: (u) => (
                <Chip tone={u.isActive ? "ok" : "neutral"}>
                  {u.isActive ? "Active" : "Inactive"}
                </Chip>
              ),
            },
          ]}
        />

        <DefinitionsCard
          items={[
            [
              "Records created",
              "Quotations, purchase orders, invoices and renewals, counted together.",
            ],
            [
              "Per user",
              "A record is credited to a user when its creator field matches their name or email.",
            ],
            [
              "Active user",
              "An account that is enabled (not disabled by an administrator).",
            ],
            [
              "Last sign-in",
              "Taken from the last login time stored on the user account.",
            ],
          ]}
        />
      </ChartGrid>
    </div>
  );
}

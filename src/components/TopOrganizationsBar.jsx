import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function TopOrganizationsBar({ data }) {
  const chartData = (data || []).slice(0, 8).map((d) => {
    const organizationName = d.organization ?? d.Organization ?? "";
    return {
      org: organizationName.length > 20 ? organizationName.substring(0, 20) + "..." : organizationName,
      fullOrg: organizationName,
      count: Number(d.quoteCount ?? d.QuoteCount ?? d.count ?? d.Count ?? 0),
    };
  });

  if (chartData.length === 0) {
    return (
      <div style={{ width: "100%", height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
        No organization data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          type="number"
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={{ stroke: "#e0e0e0" }}
          tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value)}
        />
        <YAxis
          type="category"
          dataKey="org"
          width={180}
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: 12,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
          formatter={(value, name) => [value, name === "count" ? "Quotes" : ""]}
          labelFormatter={(label) => {
            const item = chartData.find((d) => d.org === label);
            return item ? item.fullOrg : label;
          }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill="#308aea" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
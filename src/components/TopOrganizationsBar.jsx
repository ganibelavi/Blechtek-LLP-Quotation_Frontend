import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Label,
} from "recharts";

export default function TopOrganizationsBar({ data }) {
  const chartData = (data || []).slice(0, 8).map((d) => {
    const organizationName = d.organization ?? d.Organization ?? "";
    const shortOrg = organizationName.length > 5 ? organizationName.substring(0, 5) + "..." : organizationName;
    return {
      org: shortOrg,
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
      <BarChart data={chartData} layout="horizontal" margin={{ top: 20, right: 20, left: 20, bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          type="category"
          dataKey="org"
          width={60}
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickMargin={4}
        />
        <Label value="Organization" position="bottom" offset={38} fontSize={12} fill="#64748b" fontWeight={600} />
        <YAxis
          type="number"
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={{ stroke: "#e0e0e0" }}
          tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : Math.floor(value))}
        />
        <Label value="No. of Quotes" angle={-90} position="insideLeft" offset={-30} fontSize={12} fill="#64748b" fontWeight={600} />
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
        <Bar dataKey="count" radius={[6, 0, 0, 6]} maxBarSize={48}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill="#308aea" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
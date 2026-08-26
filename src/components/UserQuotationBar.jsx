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

export default function UserQuotationBar({ data }) {
  const chartData = (data || []).slice(0, 8).map((d) => {
    const userName = d.user ?? d.User ?? "Unknown";
    return {
      user: userName.length > 18 ? userName.substring(0, 18) + "..." : userName,
      fullUser: userName,
      quoteCount: Number(d.quoteCount ?? d.QuoteCount ?? 0),
    };
  });

  if (chartData.length === 0) {
    return (
      <div style={{ width: "100%", height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
        No quotation creation data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 22, left: 60, bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          type="number"
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={{ stroke: "#e0e0e0" }}
          tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : Math.floor(value))}
        />
        <Label value="No. of Quotations" position="bottom" offset={38} fontSize={12} fill="#64748b" fontWeight={600} />
        <YAxis
          type="category"
          dataKey="user"
          width={94}
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <Label value="User / Creator" angle={-90} position="insideLeft" offset={-60} fontSize={12} fill="#64748b" fontWeight={600} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: 12,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
          formatter={(value, name) => [value, name === "quoteCount" ? "Quotations" : ""]}
          labelFormatter={(label) => {
            const item = chartData.find((d) => d.user === label);
            return item ? item.fullUser : label;
          }}
        />
        <Bar dataKey="quoteCount" radius={[0, 6, 6, 0]} barSize={24}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#2e7d32" : "#66bb6a"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function TrendChart({ data }) {
  const chartData = (data || []).map((d) => {
    const monthValue = d.month ?? d.Month ?? "";
    const date = monthValue ? new Date(monthValue) : null;
    const revenueValue = d.revenue ?? d.Revenue ?? d.totalAmount ?? d.TotalAmount ?? 0;
    const quoteCount = d.quotes ?? d.count ?? d.Count ?? 0;

    return {
      ...d,
      month: date ? date.toLocaleString("en-US", { month: "short", year: "2-digit" }) : monthValue,
      revenue: Number(revenueValue) || 0,
      quotes: Number(quoteCount) || 0,
    };
  });

  if (chartData.length === 0) {
    return (
      <div style={{ width: "100%", height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
        No monthly data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#308aea" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#308aea" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
        <XAxis
          dataKey="month"
          stroke="#999"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="left"
          orientation="left"
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${(value / 100000).toFixed(1)}L`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: 12,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
          labelStyle={{ color: "#1e293b", fontWeight: 600 }}
          formatter={(value, name) => [
            name === "revenue" ? `${value.toLocaleString("en-IN")}` : value,
            name === "revenue" ? "Revenue" : "Quotes",
          ]}
        />
        <Legend
          layout="horizontal"
          align="center"
          verticalAlign="top"
          iconType="line"
          iconSize={12}
          wrapperStyle={{ paddingBottom: 10 }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#308aea"
          strokeWidth={4}
          dot={{ r: 6, strokeWidth: 2, stroke: "#fff", fill: "#308aea" }}
          activeDot={{ r: 8, strokeWidth: 2, stroke: "#fff" }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="quotes"
          name="Quotes"
          stroke="#308aea"
          strokeWidth={3}
          strokeDasharray="5 5"
          dot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: "#308aea" }}
          activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
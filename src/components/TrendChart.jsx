import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
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
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 60, bottom: 50 }}>
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
        <Label value="Month" position="bottom" offset={38} fontSize={12} fill="#64748b" fontWeight={600} />
        <YAxis
          yAxisId="left"
          orientation="left"
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${(value / 100000).toFixed(1)}L`}
        />
        <Label value="Revenue (Lakhs)" angle={-90} position="insideLeft" offset={-60} fontSize={12} fill="#64748b" fontWeight={600} />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value}
        />
        <Label value="Quotes" angle={90} position="insideRight" offset={-40} fontSize={12} fill="#64748b" fontWeight={600} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: 12,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
          labelStyle={{ color: "#1e293b", fontWeight: 600 }}
          // use the payload dataKey (props) to reliably detect which series this value belongs to
          formatter={(value, name, props) => {
            const key = props?.dataKey ?? String(name).toLowerCase();
            if (String(key).toLowerCase() === "revenue") {
              const formatted = Number(value || 0).toLocaleString("en-IN");
              return [formatted, "Revenue"];
            }
            // fallback: show raw value for quotes/counts
            return [value, "Quotes"];
          }}
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
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

export default function ModuleBar({ data }) {
  const chartData = (data || []).slice(0, 5).map((d) => {
    const moduleName = d.module ?? d.Module ?? "";
    const shortModule = moduleName.length > 5 ? moduleName.substring(0, 5) + "..." : moduleName;
    return {
      module: shortModule,
      fullModule: moduleName,
      count: Math.max(0, Number(d.count ?? d.Count ?? 0) || 0),
    };
  });

  if (chartData.length === 0) {
    return (
      <div style={{ width: "100%", height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
        No module data available
      </div>
    );
  }

  return (
    <div style={{ width: "92%", margin: "0 auto" }}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} layout="horizontal" margin={{ top: 12, right: 10, left: 10, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            type="category"
            dataKey="module"
            width={45}
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickMargin={2}
            minTickGap={10}
          >
            <Label value="Module" position="insideBottom" offset={-8} fontSize={12} fill="#64748b" fontWeight={600} />
          </XAxis>
          <YAxis
            type="number"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "#e0e0e0" }}
            domain={[0, (dataMax) => Math.max(1, dataMax || 1)]}
            tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : Math.floor(value))}
          >
            <Label value="No. of Quotes" angle={-90} position="insideLeft" offset={-8} fontSize={12} fill="#64748b" fontWeight={600} />
          </YAxis>
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: 12,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
            formatter={(value, name) => [value, name === "count" ? "Quotes" : ""]}
            labelFormatter={(label) => {
              const item = chartData.find((d) => d.module === label);
              return item ? item.fullModule : label;
            }}
          />
          <Bar dataKey="count" radius={[6, 0, 0, 6]} barSize={24}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="#308aea" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function MachineUtilChart({ data }) {
  const chartData = (data || []).slice(0, 8).map((d) => ({
    machine: d.Machine?.length > 20 ? d.Machine.substring(0, 20) + "..." : d.Machine,
    fullMachine: d.Machine,
    utilization: d.Utilization || d.Usage || d.Count || 0,
  }));

  if (chartData.length === 0) {
    return (
      <div style={{ width: "100%", height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
        No machine utilization data available
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
          tickFormatter={(value) => `${value}%`}
        />
        <YAxis
          type="category"
          dataKey="machine"
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
          formatter={(value) => [`${value}%`, "Utilization"]}
          labelFormatter={(label) => {
            const item = chartData.find((d) => d.machine === label);
            return item ? item.fullMachine : label;
          }}
        />
        <Bar dataKey="utilization" radius={[0, 4, 4, 0]} barSize={20} fill="#607d8b" />
      </BarChart>
    </ResponsiveContainer>
  );
}
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
} from "recharts";

export default function MachineUtilChart({ data }) {
  const chartData = (data || []).slice(0, 8).map((d) => {
    const machineName = d.machine ?? d.Machine ?? "";
    return {
      machine: machineName.length > 20 ? machineName.substring(0, 20) + "..." : machineName,
      fullMachine: machineName,
      utilization: Number(d.utilization ?? d.Utilization ?? d.usage ?? d.Usage ?? d.count ?? d.Count ?? 0),
    };
  });

  if (chartData.length === 0) {
    return (
      <div style={{ width: "100%", height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
        No machine utilization data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 18, left: 60, bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          type="number"
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={{ stroke: "#e0e0e0" }}
          tickFormatter={(value) => `${value}%`}
        />
        <Label value="Utilization (%)" position="bottom" offset={38} fontSize={12} fill="#64748b" fontWeight={600} />
        <YAxis
          type="category"
          dataKey="machine"
          width={90}
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <Label value="Machine" angle={-90} position="insideLeft" offset={-60} fontSize={12} fill="#64748b" fontWeight={600} />
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
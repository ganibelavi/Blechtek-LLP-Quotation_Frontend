import { Box, Typography } from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const STATUS_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function StatusPie({ data }) {
  const chartData = (data || [])
    .filter((d) => d.Count > 0)
    .map((d, index) => ({
      name: d.Status,
      value: d.Count,
      color: STATUS_COLORS[index % STATUS_COLORS.length],
    }));

  if (chartData.length === 0) {
    return (
      <div style={{ width: "100%", height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
        No status data available
      </div>
    );
  }

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Box sx={{ height: 300, display: "flex", flexDirection: "column" }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="46%"
            innerRadius={75}
            outerRadius={110}
            paddingAngle={6}
            dataKey="value"
            nameKey="name"
            label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "none",
              borderRadius: 12,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
            formatter={(value) => [value, "Quotes"]}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
            iconSize={10}
            wrapperStyle={{ paddingTop: 20 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <Box
        sx={{
          textAlign: "center",
          mt: -40,
          mb: 2,
          pointerEvents: "none",
        }}
      >
        <Typography variant="h4" fontWeight={700} color="text.primary">
          {total}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Quotes
        </Typography>
      </Box>
    </Box>
  );
}
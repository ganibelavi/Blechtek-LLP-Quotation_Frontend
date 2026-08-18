import { useEffect, useState } from "react";
import { fetchDashboardData } from "../services/quotationApi";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Business,
  Description,
  Assessment,
  TrendingUp,
  People,
} from "@mui/icons-material";
import DataCard from "../components/DataCard";
import TrendChart from "../components/TrendChart";
import StatusPie from "../components/StatusPie";
import ModuleBar from "../components/ModuleBar";
import TopOrganizationsBar from "../components/TopOrganizationsBar";
import MachineUtilChart from "../components/MachineUtilChart";
import EntityTable, { StatusText } from "../components/EntityTable";

function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value) {
  if (!value) return "��0";
  return `��${Number(value).toLocaleString("en-IN")}`;
}

export default function DashboardPage({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const result = await fetchDashboardData();
      setData(result);
      setError(null);
    } catch (err) {
      setError("Failed to load dashboard data. Please check if the backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }} onClose={() => setError(null)}>
        {error}
      </Alert>
    );
  }

  if (!data) {
    return (
      <Typography sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
        No dashboard data available
      </Typography>
    );
  }

  const statCards = [
    {
      label: "Total Quotations",
      value: data.totalQuotations ?? 0,
      icon: <Description />,
      color: "primary",
    },
    {
      label: "Organizations",
      value: data.totalOrganizations ?? 0,
      icon: <Business />,
      color: "secondary",
    },
    {
      label: "Modules",
      value: data.totalModules ?? 0,
      icon: <Assessment />,
      color: "info",
    },
    {
      label: "Quotation Value",
      value: formatCurrency(data.totalQuotedAmount ?? 0),
      icon: <TrendingUp />,
      color: "success",
    },
    {
      label: "Active Pipeline",
      value: data.statusBreakdown?.find((s) => s.status === "Valid")?.count ?? 0,
      icon: <People />,
      color: "warning",
    },
  ];

  const recentColumns = [
    { key: "srNo", label: "Sr. No.", sortable: false, minWidth: 70, render: ({ index, page, rowsPerPage }) => page * rowsPerPage + index + 1 },
    { key: "quotationId", label: "Quotation ID", sortable: true, minWidth: 180, render: ({ row }) => (
      <Typography variant="body2" fontWeight={600} sx={{ fontFamily: "monospace", fontSize: 12 }}>
        {row.quotationId}
      </Typography>
    )},
    { key: "organizationName", label: "Customer", sortable: true, minWidth: 200 },
    { key: "projectName", label: "Project Name", sortable: true, minWidth: 200 },
    { key: "generatedAt", label: "Date", sortable: true, minWidth: 160, render: ({ row }) => formatDateTime(row.generatedAt) },
    { key: "status", label: "Status", sortable: true, minWidth: 120, render: ({ row }) => <StatusText status={row.status} /> },
    { key: "valuation", label: "Valuation", sortable: true, minWidth: 140, render: ({ row }) => formatCurrency(row.valuation || row.totalQuotedAmount) },
  ];

  const recentRows = (data.recentQuotations || []).map((q) => ({
    quotationId: q.quotationId,
    organizationName: q.organizationName,
    projectName: q.projectName || q.modules?.join(", ") || "—",
    generatedAt: q.generatedAt,
    status: q.status || "Draft",
    valuation: q.valuation || q.totalAmount || 0,
  }));

  const chartContainerStyle = {
    elevation: 0,
    sx: {
      p: { xs: 2, md: 3 },
      borderRadius: 1,
      border: "1px solid",
      borderColor: "divider",
      overflow: "hidden",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      minHeight: 350,
    },
  };

  return (
    <Box sx={{ p: 0, fontSize: "13px", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 2,
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={900} gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.8 }}>
            Real-time insights and quotation analytics
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 3,
          mb: 4,
        }}
      >
        {statCards.map((card, index) => (
          <DataCard key={index} {...card} borderRadius={2} />
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "7.5fr 4.5fr" },
          gap: 3,
          alignItems: "stretch",
          mb: 4,
        }}
      >
        <Paper {...chartContainerStyle}>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
            Monthly Quotation Trend
          </Typography>
          <Box sx={{ flex: 1, minHeight: 300 }}>
            <TrendChart data={data.monthlyQuotes ?? []} />
          </Box>
        </Paper>

        <Paper {...chartContainerStyle}>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
            Quotation Status
          </Typography>
          <Box sx={{ flex: 1, minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <StatusPie data={data.statusBreakdown ?? []} />
          </Box>
        </Paper>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 3,
          alignItems: "stretch",
          mb: 4,
        }}
      >
        <Paper {...chartContainerStyle}>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
            Top Modules by Usage
          </Typography>
          <Box sx={{ flex: 1, minHeight: 300 }}>
            <ModuleBar data={data.moduleDistribution ?? []} />
          </Box>
        </Paper>

        <Paper {...chartContainerStyle}>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
            Top Organizations
          </Typography>
          <Box sx={{ flex: 1, minHeight: 300 }}>
            <TopOrganizationsBar data={data.topOrganizations ?? []} />
          </Box>
        </Paper>

        <Paper {...chartContainerStyle}>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
            Machine Utilization
          </Typography>
          <Box sx={{ flex: 1, minHeight: 300 }}>
            <MachineUtilChart data={data.machineUtilization ?? []} />
          </Box>
        </Paper>
      </Box>

      <Stack spacing={1.5} sx={{ mt: 2 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
          Recent Quotations
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 0,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          }}
        >
          <EntityTable
            title=""
            columns={recentColumns}
            rows={recentRows}
          />
        </Paper>
      </Stack>
    </Box>
  );
}
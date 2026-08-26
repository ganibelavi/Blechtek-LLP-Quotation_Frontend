import { Box, Paper } from "@mui/material";

import UsersPage from "./UsersPage";
import ModulesPage from "./ModulesPage";
import CreatedQuotation from "./CreatedQuotation";
import QuotationPdfView from "./QuotationPdfView";

export default function SettingsPage({ onNavigate, initialTab = "users", quotationDetail = null }) {
  const renderContent = () => {
    if (quotationDetail) {
      return <QuotationPdfView onBack={() => onNavigate("settings", "created-quotations")} />;
    }
    switch (initialTab) {
      case "users":
        return <UsersPage onNavigate={onNavigate} showSidebar={false} />;
      case "modules":
        return <ModulesPage onNavigate={onNavigate} showSidebar={false} />;
      case "created-quotations":
        return <CreatedQuotation onNavigate={onNavigate} />;
      default:
        return <UsersPage onNavigate={onNavigate} showSidebar={false} />;
    }
  };

  return (
    <Box sx={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        }}
      >
        <Paper
          elevation={0}
          className="glass"
          sx={{
            flex: 1,
            p: { xs: 2, md: 4 },
            overflowY: "auto",
            overflowX: "hidden",
            border: "1px solid #d8d2c6",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          }}
        >
          {renderContent()}
        </Paper>
      </Box>
    </Box>
  );
}

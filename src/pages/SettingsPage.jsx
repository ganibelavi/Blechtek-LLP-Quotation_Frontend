import { Box } from "@mui/material";

import UsersPage from "./Settings/Masters/UsersPage";
import ModulesPage from "./Settings/Masters/ModulesPage";
import CreatedQuotation from "./CreatedQuotation";
import QuotationPdfView from "./QuotationPdfView";
import CustomersPage from "./Settings/Masters/CustomersPage";
import SuppliersPage from "./Settings/Masters/SuppliersPage";
import CompanyProfilePage from "./Settings/Masters/CompanyProfilePage";
import BankAccountsPage from "./Settings/Masters/BankAccountsPage";
import GstRatesPage from "./Settings/Masters/GstRatesPage";
import TermsTemplatesPage from "./Settings/Masters/TermsTemplatesPage";

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
      case "customers":
        return <CustomersPage />;
      case "suppliers":
        return <SuppliersPage />;
      case "company-profile":
        return <CompanyProfilePage />;
      case "bank-accounts":
        return <BankAccountsPage />;
      case "gst-rates":
        return <GstRatesPage />;
      case "terms-templates":
        return <TermsTemplatesPage />;
      default:
        return <UsersPage onNavigate={onNavigate} showSidebar={false} />;
    }
  };

  return (
    <Box sx={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <Box
        className="masters-page"
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        }}
      >
        <Box
          sx={{
            flex: 1,
            p: 0,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
}

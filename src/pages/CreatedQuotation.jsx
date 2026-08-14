import { useEffect, useState } from "react";
import { fetchQuotations } from "../services/quotationApi";
import EntityTable from "../components/EntityTable";
import {
  Box,
  Typography,
  Alert,
} from "@mui/material";

const toTableQuotation = (q) => ({
  QuotationId: q.quotationId,
  OrganizationName: q.organizationName,
  ValidationDate: q.validationDate ? new Date(q.validationDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) : "",
  QuotationToName: q.quotationToName,
  QuotationToAddress: q.quotationToAddress,
  QuotationToContactNo: q.quotationToContactNo,
  QuotationToEmail: q.quotationToEmail,
  Modules: (q.modules || []).join(", "),
  GeneratedAt: q.generatedAt ? new Date(q.generatedAt).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) : "",
});

export default function CreatedQuotation({ onNavigate }) {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const data = await fetchQuotations(1, 100);
      setQuotations((data || []).map(toTableQuotation));
      setError(null);
    } catch (err) {
      setError("Failed to load quotations. Please check if the backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const quotationColumns = [
    { key: "QuotationId", label: "Quotation ID", sortable: true, minWidth: 180 },
    { key: "OrganizationName", label: "Organization", sortable: true, minWidth: 220 },
    { key: "ValidationDate", label: "Valid Until", sortable: true, minWidth: 130 },
    { key: "QuotationToName", label: "Contact Name", sortable: true, minWidth: 160 },
    { key: "QuotationToAddress", label: "Address", sortable: true, minWidth: 250 },
    { key: "QuotationToContactNo", label: "Contact No.", sortable: true, minWidth: 150 },
    { key: "QuotationToEmail", label: "Email", sortable: true, minWidth: 200 },
    { key: "Modules", label: "Modules", sortable: true, minWidth: 300 },
    { key: "GeneratedAt", label: "Generated At", sortable: true, minWidth: 180 },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          Created Quotations
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <Typography>Loading quotations...</Typography>
        </Box>
      ) : (
        <EntityTable title="" columns={quotationColumns} rows={quotations} />
      )}
    </Box>
  );
}
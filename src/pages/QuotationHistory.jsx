import { useEffect, useState } from "react";
import { Alert, Box, Typography } from "@mui/material";
import EntityTable from "../components/EntityTable";
import { fetchQuotationRevisions } from "../services/quotationApi";
import "./CreateQuotation.css";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

export default function QuotationHistory({ quotationId, onNavigate }) {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchQuotationRevisions(quotationId)
      .then((data) => setRevisions(data || []))
      .catch((err) => {
        console.error(err);
        setError("Failed to load quotation revisions.");
      })
      .finally(() => setLoading(false));
  }, [quotationId]);

  const columns = [
    {
      key: "changedAt",
      label: "Changed At",
      sortable: true,
      minWidth: 190,
      render: ({ row }) => formatDate(row.changedAt),
    },
    { key: "changeType", label: "Change", sortable: true, minWidth: 150 },
    {
      key: "quotationNo",
      label: "Quotation No.",
      sortable: true,
      minWidth: 180,
    },
    {
      key: "organizationName",
      label: "Organization",
      sortable: true,
      minWidth: 220,
    },
    {
      key: "modules",
      label: "Modules",
      sortable: true,
      minWidth: 300,
      render: ({ row }) => (row.modules || []).join(", "),
    },
    {
      key: "discountPercentage",
      label: "Discount %",
      sortable: true,
      minWidth: 110,
      render: ({ row }) => row.discountPercentage ?? 0,
    },
    {
      key: "referenceBy",
      label: "Reference By",
      sortable: true,
      minWidth: 150,
    },
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
        <h1 className="page-heading page-heading__text">Quotation Revision History</h1>
        <button
          className="create-quotation__back-btn"
          onClick={() => onNavigate("created-quotations")}
          aria-label="Back to quotations list"
        >
          <svg
            className="create-quotation__back-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="create-quotation__back-text"></span>
        </button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {loading ? (
        <Typography>Loading revisions...</Typography>
      ) : (
        <EntityTable title="" columns={columns} rows={revisions} />
      )}
    </Box>
  );
}

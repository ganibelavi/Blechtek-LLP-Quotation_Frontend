import { useEffect, useState } from "react";
import { fetchQuotations } from "../services/quotationApi";
import EntityTable from "../components/EntityTable";
import {
  Box,
  Typography,
  Alert,
  IconButton,
  Tooltip,
  Button,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "https://localhost:5001";
const buildDownloadUrl = (quotationId, format) =>
  `${API_BASE}/api/quotation/${quotationId}/download/${format}`;

const toTableQuotation = (q) => ({
  QuotationId: q.quotationId,
  OrganizationName: q.organizationName,
  ReferenceBy: q.referenceBy,
  QuotationNo: q.quotationNo || "",
  Date: q.date && !q.date.startsWith("0001-01-01")
    ? new Date(q.date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "",
  ValidationDate: q.validationDate
    ? new Date(q.validationDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "",
  QuotationToName: q.quotationToName,
  QuotationToAddress: q.quotationToAddress,
  QuotationToContactNo: q.quotationToContactNo,
  QuotationToEmail: q.quotationToEmail,
  Modules: (q.modules || []).join(", "),
  GeneratedAt: q.generatedAt
    ? new Date(q.generatedAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "",
  originalData: q,
  pdfDownloadUrl: buildDownloadUrl(q.quotationId, "pdf"),
  wordDownloadUrl: buildDownloadUrl(q.quotationId, "word"),
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
      setError(
        "Failed to load quotations. Please check if the backend is running.",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const handleViewQuotation = (quotation) => {
    sessionStorage.setItem(
      "quotationData",
      JSON.stringify({
        quotationId: quotation.quotationId,
        pdfDownloadUrl: quotation.pdfDownloadUrl,
        wordDownloadUrl: quotation.wordDownloadUrl,
      }),
    );
    sessionStorage.setItem(
      "quotationFormValues",
      JSON.stringify({
        organizationName: quotation.organizationName,
        referenceBy: quotation.referenceBy,
        validationDate: quotation.validationDate,
        quotationNo: quotation.quotationNo,
        date: quotation.date,
        selectedModules: quotation.modules || [],
        quotationTo: {
          name: quotation.quotationToName,
          address: quotation.quotationToAddress,
          contactNo: quotation.quotationToContactNo,
          email: quotation.quotationToEmail,
        },
        discountPercentage: quotation.discountPercentage || 0,
      }),
    );
    onNavigate("quotation-detail");
  };

  const handleEditQuotation = (quotation) => {
    sessionStorage.setItem(
      "quotationData",
      JSON.stringify({
        quotationId: quotation.quotationId,
        pdfDownloadUrl: quotation.pdfDownloadUrl,
        wordDownloadUrl: quotation.wordDownloadUrl,
      }),
    );
    sessionStorage.setItem(
      "quotationFormValues",
      JSON.stringify({
        organizationName: quotation.organizationName,
        referenceBy: quotation.referenceBy,
        validationDate: quotation.validationDate,
        quotationNo: quotation.quotationNo,
        date: quotation.date,
        selectedModules: quotation.modules || [],
        quotationTo: {
          name: quotation.quotationToName,
          address: quotation.quotationToAddress,
          contactNo: quotation.quotationToContactNo,
          email: quotation.quotationToEmail,
        },
        discountPercentage: quotation.discountPercentage || 0,
      }),
    );
    onNavigate("edit-quotation", quotation.quotationId);
  };

  const handleNewQuotation = () => {
    onNavigate("create");
  };

  const quotationColumns = [
    {
      key: "srNo",
      label: "Sr. No.",
      sortable: false,
      minWidth: 80,
      render: ({ index, page, rowsPerPage }) => page * rowsPerPage + index + 1,
    },
    {
      key: "OrganizationName",
      label: "Organization",
      sortable: true,
      minWidth: 220,
    },
    {
      key: "ReferenceBy",
      label: "Reference By",
      sortable: true,
      minWidth: 150,
    },
    {
      key: "QuotationNo",
      label: "Quotation No.",
      sortable: true,
      minWidth: 150,
    },
    {
      key: "Date",
      label: "Date",
      sortable: true,
      minWidth: 130,
    },
    {
      key: "ValidationDate",
      label: "Valid Until",
      sortable: true,
      minWidth: 130,
    },
    {
      key: "QuotationToName",
      label: "Contact Name",
      sortable: true,
      minWidth: 160,
    },
    {
      key: "QuotationToAddress",
      label: "Address",
      sortable: true,
      minWidth: 250,
    },
    {
      key: "QuotationToContactNo",
      label: "Contact No.",
      sortable: true,
      minWidth: 150,
    },
    { key: "QuotationToEmail", label: "Email", sortable: true, minWidth: 200 },
    { key: "Modules", label: "Modules", sortable: true, minWidth: 300 },
    {
      key: "GeneratedAt",
      label: "Generated At",
      sortable: true,
      minWidth: 180,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      minWidth: 160,
      render: ({ row }) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Edit Discount">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEditQuotation(row.originalData);
              }}
            >
              <EditIcon fontSize="small" color="warning" />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Quotation">
            <IconButton
              size="small"
              onClick={() => handleViewQuotation(row.originalData)}
            >
              <VisibilityIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download PDF">
            <span>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  if (row.pdfDownloadUrl) window.open(row.pdfDownloadUrl, "_blank");
                }}
              >
                <PictureAsPdfIcon fontSize="small" color="error" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Download Word">
            <span>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  if (row.wordDownloadUrl) window.open(row.wordDownloadUrl, "_blank");
                }}
              >
                <DescriptionIcon fontSize="small" color="success" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ),
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
        <Typography variant="h5" fontWeight={700}>
          Quotations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewQuotation}
          sx={{ px: 3, py: 1 }}
        >
          New Quotation
        </Button>
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

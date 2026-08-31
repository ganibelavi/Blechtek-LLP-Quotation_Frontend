import { useEffect, useState } from "react";
import { fetchQuotations } from "../services/quotationApi";
import { fetchQuotationRevisions } from "../services/quotationApi";
import EntityTable from "../components/EntityTable";
import {
  Box,
  Typography,
  Alert,
  IconButton,
  Tooltip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  TableContainer,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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

const formatDateOnly = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

export default function AllQuotationRevisions({ onNavigate }) {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQuotationId, setExpandedQuotationId] = useState(null);
  const [revisionsCache, setRevisionsCache] = useState({});
  const [revisionLoading, setRevisionLoading] = useState({});

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const data = await fetchQuotations(1, 100);
      setQuotations(data || []);
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

  const handleExpandChange = async (quotationId) => {
    if (expandedQuotationId === quotationId) {
      setExpandedQuotationId(null);
      return;
    }

    setExpandedQuotationId(quotationId);

    if (revisionsCache[quotationId]) {
      return;
    }

    setRevisionLoading((prev) => ({ ...prev, [quotationId]: true }));
    try {
      const revisions = await fetchQuotationRevisions(quotationId);
      setRevisionsCache((prev) => ({ ...prev, [quotationId]: revisions || [] }));
    } catch (err) {
      console.error(err);
      setRevisionsCache((prev) => ({ ...prev, [quotationId]: [] }));
    } finally {
      setRevisionLoading((prev) => ({ ...prev, [quotationId]: false }));
    }
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
      key: "organizationName",
      label: "Organization",
      sortable: true,
      minWidth: 220,
    },
    { key: "quotationNo", label: "Quotation No.", sortable: true, minWidth: 180 },
    {
      key: "date",
      label: "Date",
      sortable: true,
      minWidth: 120,
      render: ({ row }) => formatDateOnly(row.date),
    },
    {
      key: "quotationToName",
      label: "Contact Name",
      sortable: true,
      minWidth: 160,
    },
    {
      key: "referenceBy",
      label: "Reference By",
      sortable: true,
      minWidth: 150,
    },
    { key: "modules", label: "Modules", sortable: true, minWidth: 300 },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      minWidth: 120,
      render: ({ row }) => (
        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
          <Tooltip title="View Revision History">
            <IconButton
              size="small"
              onClick={() => handleExpandChange(row.quotationId)}
              aria-expanded={expandedQuotationId === row.quotationId}
            >
              <HistoryIcon fontSize="small" color="secondary" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const revisionColumns = [
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
        <Typography className="page-heading page-heading__text" component="h1">
          All Quotation Revisions
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
        <EntityTable
          title=""
          columns={quotationColumns}
          rows={quotations.map((q) => ({
            ...q,
            modules: (q.modules || []).join(", "),
          }))}
        />
      )}

      {expandedQuotationId && (
        <Box sx={{ mt: 2 }}>
          <Paper
            sx={{
              p: 1,
              border: "1px solid #d8d2c6",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              background: "#fafafa",
            }}
            elevation={0}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="h6" sx={{ fontSize: 16, flexGrow: 1 }}>
                Revision History for Quotation {quotations.find((q) => q.quotationId === expandedQuotationId)?.quotationNo || ""}
              </Typography>
              <Tooltip title="Close">
                <IconButton
                  size="small"
                  onClick={() => setExpandedQuotationId(null)}
                >
                  <ExpandMoreIcon
                    fontSize="small"
                    sx={{ transform: "rotate(180deg)" }}
                  />
                </IconButton>
              </Tooltip>
            </Box>

            {revisionLoading[expandedQuotationId] ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <Typography>Loading revisions...</Typography>
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 400, overflow: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "#65aadb" }}>
                      {revisionColumns.map((col) => (
                        <TableCell
                          key={col.key}
                          sx={{
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 13,
                            whiteSpace: "nowrap",
                            minWidth: col.minWidth,
                          }}
                        >
                          {col.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {((revisionsCache[expandedQuotationId] || []).length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={revisionColumns.length}
                          sx={{ textAlign: "center", p: 4 }}
                        >
                          No revisions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      (revisionsCache[expandedQuotationId] || []).map((rev, idx) => (
                        <TableRow key={`${rev.id ?? ""}-${idx}`}>
                          {revisionColumns.map((col) => (
                            <TableCell
                              key={col.key}
                              sx={{
                                padding: "5px 10px",
                                fontSize: 13,
                                borderRight: "1px solid #eee",
                                whiteSpace: "nowrap",
                                minWidth: col.minWidth,
                              }}
                            >
                              {col.render
                                ? col.render({ row: rev, index: idx })
                                : rev[col.key] ?? ""}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
}
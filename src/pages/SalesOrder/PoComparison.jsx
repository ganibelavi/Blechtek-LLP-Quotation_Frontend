import React from "react";
import { Alert, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";

export default function PoComparison({ rows = [], hasMismatch }) {
  if (!rows.length) return null;

  return (
    <Paper className="sales-order-create-card sales-order-po-comparison" variant="outlined">
      <Typography variant="h6" sx={{ mb: 1 }}>
        Quotation vs Customer PO vs Sales Order
      </Typography>
      {hasMismatch && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          Differences from the quotation were detected. Add mismatch remarks before confirming this sales order.
        </Alert>
      )}
      <Table size="small">
        <TableHead>
          <TableRow>
            {["Line", "Quotation", "Customer PO", "Sales Order"].map((heading) => (
              <TableCell key={heading} sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                {heading}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${row.itemName}-${index}`} sx={row.hasDifference ? { backgroundColor: "warning.light" } : undefined}>
              <TableCell>{row.itemName}</TableCell>
              <TableCell>{row.quotationValue || "-"}</TableCell>
              <TableCell>{row.poValue || "-"}</TableCell>
              <TableCell>{row.salesOrderValue || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

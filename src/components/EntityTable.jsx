import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import SearchIcon from "@mui/icons-material/Search";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";

function defaultGetValue(row, key) {
  const v = row?.[key];
  if (v === null || v === undefined) return "";
  return String(v);
}

export default function EntityTable({ title, columns, rows }) {
  const [orderBy, setOrderBy] = useState(null);
  const [order, setOrder] = useState("asc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const searchableKeys = useMemo(() => columns.map((c) => c.key), [columns]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows || [];
    if (q) {
      list = list.filter((r) =>
        searchableKeys.some((k) =>
          defaultGetValue(r, k).toLowerCase().includes(q),
        ),
      );
    }
    if (orderBy) {
      list = [...list].sort((a, b) => {
        const va = defaultGetValue(a, orderBy);
        const vb = defaultGetValue(b, orderBy);
        // numeric compare if both are numbers
        const na = Number(va);
        const nb = Number(vb);
        let cmp = 0;
        if (!Number.isNaN(na) && !Number.isNaN(nb)) cmp = na - nb;
        else cmp = va.localeCompare(vb, undefined, { numeric: true });
        return order === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [rows, search, orderBy, order, columns, searchableKeys]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const display = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const handleSort = (key, sortable) => {
    if (!sortable) return;
    if (orderBy === key) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(key);
      setOrder("asc");
    }
  };

  return (
    <Paper
      sx={{
        p: 1,
        border: "1px solid #d8d2c6",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
      elevation={0}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ fontSize: 13, color: "#666" }}>
            Show
          </Typography>
          <Select
            size="small"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(0);
            }}
            sx={{ minWidth: 70, '& .MuiSelect-select': { padding: '4px 10px' } }}
          >
            {[5, 10, 25, 50].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </Select>
          <Typography variant="body2" sx={{ fontSize: 13, color: "#666" }}>
            entries
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" sx={{ fontSize: 16 }}>
            {title}
          </Typography>
          <TextField
            size="small"
            placeholder="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200, '& .MuiInputBase-input': { padding: '4px 10px' } }}
          />
        </Box>
      </Box>

      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ background: "#65aadb" }}>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  onClick={() => handleSort(col.key, col.sortable)}
                  sx={{
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: col.sortable ? "pointer" : "default",
                  }}
                >
                  {col.label}
                  {orderBy === col.key ? (order === "asc" ? " ▲" : " ▼") : null}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {display.map((row, idx) => (
              <TableRow key={`${row.id ?? ""}-${idx}`}>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    sx={{
                      padding: "0.4rem",
                      fontSize: 13,
                      borderRight: "1px solid #eee",
                    }}
                  >
                    {col.render
                      ? col.render(row)
                      : defaultGetValue(row, col.key)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {display.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  sx={{ textAlign: "center", p: 4 }}
                >
                  No records
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 1,
        }}
      >
        <Typography
          sx={{ fontSize: 13 }}
        >{`Showing ${filtered.length} item(s)`}</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            size="small"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft />
          </IconButton>
          <Typography
            sx={{ fontSize: 13 }}
          >{`${page + 1} / ${pageCount}`}</Typography>
          <IconButton
            size="small"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
          >
            <ChevronRight />
          </IconButton>
        </Stack>
      </Box>
    </Paper>
  );
}

EntityTable.propTypes = {
  title: PropTypes.string,
  columns: PropTypes.array.isRequired,
  rows: PropTypes.array.isRequired,
};

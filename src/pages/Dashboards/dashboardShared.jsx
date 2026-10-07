// src/pages/Dashboard/dashboardShared.jsx
// Shared helpers and building blocks used by every dashboard tab page.
// Place this file in the same folder as QuotationsPage.jsx, PurchaseOrdersPage.jsx, etc.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ResponsiveContainer } from "recharts";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
export const cove = {
  blue: "#308aea",
  aqua: "#48cae4",
  yellow: "#f5a623",
  orange: "#e8643a",
  green: "#2e9e5b",
  red: "#c62828",
  grey: "#6b7280",
  purple: "#8e6bd9",
  ok: "#1e8e3e",
  warn: "#b26a00",
  bad: "#c62828",
};
export const palette = [
  cove.blue,
  cove.aqua,
  cove.yellow,
  cove.orange,
  cove.green,
  cove.purple,
];
export const gridStroke = "var(--dash-border)";
export const axisTick = { fill: "#64748b", fontSize: 11 };

export function TruncatedAxisTick({
  x = 0,
  y = 0,
  payload,
  maxLength = 16,
  textAnchor = "end",
  dy = 4,
}) {
  const fullName = String(payload?.value ?? "");
  const label =
    fullName.length > maxLength
      ? `${fullName.slice(0, Math.max(1, maxLength - 1))}…`
      : fullName;
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{fullName}</title>
      <text
        x={0}
        y={0}
        dy={dy}
        textAnchor={textAnchor}
        fill="var(--dash-muted)"
        fontSize={10}
      >
        {label}
      </text>
    </g>
  );
}

/* Optional targets. Leave a value at 0 to hide that target.
   Later these can be loaded from a Settings table instead. */
export const DASHBOARD_TARGETS = {
  quotationsPerMonth: 0,
  poValuePerMonth: 0, // rupees
  invoiceCollectionPercent: 0,
  renewalRatePercent: 0,
};

/* ------------------------------------------------------------------ */
/* Formatters and data helpers                                         */
/* ------------------------------------------------------------------ */
export const finiteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && !Object.is(number, -0) ? number : 0;
};
export const num = (n) =>
  finiteNumber(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
export const inr = (n) => `₹${num(n)}`;
export const inrShort = (n) => {
  const v = finiteNumber(n);
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(1)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)} L`;
  return inr(v);
};
export const pct = (part, whole) => {
  const numerator = finiteNumber(part);
  const denominator = finiteNumber(whole);
  if (!denominator) return 0;
  const percentage = (numerator / denominator) * 100;
  return Number.isFinite(percentage) ? Math.round(percentage) : 0;
};
export const lower = (v) => String(v ?? "").trim().toLowerCase();
export const toRows = (v) =>
  Array.isArray(v) ? v : v?.items || v?.data || v?.rows || [];
export const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
export const titleCase = (v) => {
  const s = String(v ?? "").replace(/_/g, " ").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
};
export const fmtDate = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  const d = parseDate(v);
  return !d
    ? "-"
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
export const fmtDateTime = (v) => {
  if (v === null || v === undefined || v === "") return "Never";
  const d = parseDate(v);
  return !d
    ? "Never"
    : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const parseDate = (value) => {
  try {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};
export const daysSince = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const date = parseDate(v);
  return date ? Math.floor((Date.now() - date.getTime()) / 86400000) : null;
};
export const daysUntil = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const date = parseDate(v);
  return date ? Math.ceil((date.getTime() - Date.now()) / 86400000) : null;
};

/* Group rows by calendar month, oldest first. */
export function groupMonthly(rows, dateOf, init, add) {
  const map = new Map();
  rows.forEach((row) => {
    const d = parseDate(dateOf(row));
    if (!d) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const cur = map.get(key) || {
      key,
      month: d.toLocaleString("en-US", { month: "short", year: "numeric" }),
      ...init(),
    };
    add(cur, row);
    map.set(key, cur);
  });
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

/* Group rows by a name, largest first. */
export function groupBy(rows, nameOf, init, add) {
  const map = new Map();
  rows.forEach((row) => {
    const name = nameOf(row) || "Unknown";
    const cur = map.get(name) || { name, ...init() };
    add(cur, row);
    map.set(name, cur);
  });
  return [...map.values()];
}

/* Sort server-provided month labels ("Jan 2026") oldest first when they parse. */
export function sortMonthRows(rows) {
  const parsed = rows.map((r) => ({ r, t: Date.parse(`1 ${r.month}`) }));
  return parsed.every((p) => !Number.isNaN(p.t))
    ? parsed.sort((a, b) => a.t - b.t).map((p) => p.r)
    : rows;
}

export const withColors = (items, colors = palette) =>
  items.map((item, i) => ({ ...item, color: colors[i % colors.length] }));

export function topWithOther(rows, limit = 8) {
  if (rows.length <= limit) return rows;
  const visible = rows.slice(0, limit);
  const rest = rows.slice(limit);
  const totals = {};
  rest.forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      if (key !== "name" && key !== "color" && typeof value === "number") {
        totals[key] = (totals[key] || 0) + finiteNumber(value);
      }
    });
  });
  return [...visible, { name: "Other", ...totals, color: cove.grey }];
}

export function statusColor(value, index = 0) {
  const status = lower(value);
  if (["paid", "verified", "active", "renewed", "cleared"].includes(status)) {
    return cove.ok;
  }
  if (["pending", "partially paid", "due soon", "grace"].includes(status)) {
    return cove.warn;
  }
  if (["overdue", "expired", "rejected", "bounced"].includes(status)) {
    return cove.bad;
  }
  if (["draft", "unknown", "cancelled", "canceled"].includes(status)) {
    return cove.grey;
  }
  return palette[index % palette.length];
}

/* ------------------------------------------------------------------ */
/* Data loading hook (supports Refresh without a blank screen)         */
/* ------------------------------------------------------------------ */
export function useDashboardData(loader, errorMessage) {
  const [state, setState] = useState({ data: null, loading: true, error: "", updatedAt: null });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const data = await loaderRef.current();
      if (mounted.current) setState({ data, loading: false, error: "", updatedAt: new Date() });
    } catch (err) {
      console.error(errorMessage, err);
      if (mounted.current) setState((s) => ({ ...s, loading: false, error: errorMessage }));
    }
  }, [errorMessage]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}

export function monthlyTrend(rows, key, label = "vs previous month") {
  const trend = {};
  if (rows.length >= 3) {
    trend.spark = rows.slice(-6).map((row) => finiteNumber(row[key]));
  }
  if (rows.length < 2) return trend;
  const previous = finiteNumber(rows[rows.length - 2][key]);
  const latest = finiteNumber(rows[rows.length - 1][key]);
  if (previous === 0) return trend;
  const percent = ((latest - previous) / previous) * 100;
  if (!Number.isFinite(percent)) return trend;
  const rounded = Math.round(percent);
  trend.delta = { value: Object.is(rounded, -0) ? 0 : rounded, label };
  return trend;
}

export function InlineError({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="dashboard-inline-error" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* UI building blocks                                                  */
/* ------------------------------------------------------------------ */
export function LoadingState({ text }) {
  return (
    <div
      className="dashboard-analytics-page dashboard-state dashboard-skeleton"
      role="status"
      aria-label={text}
    >
      <div className="dashboard-skeleton__metrics" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="dashboard-skeleton__card dashboard-skeleton__metric" key={index}>
            <i />
            <i />
            <i />
          </div>
        ))}
      </div>
      <div className="dashboard-skeleton__charts" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="dashboard-skeleton__card dashboard-skeleton__chart" key={index}>
            <i />
            <i />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="dashboard-analytics-page dashboard-state dashboard-state--error">
      {message}
      {onRetry && (
        <button type="button" className="dashboard-btn" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

/* Purpose line, plain-language insight, and Refresh control. */
export function PageIntro({
  description,
  insight,
  updatedAt,
  onRefresh,
  refreshing,
  error,
  onRetry,
}) {
  return (
    <>
      <InlineError message={error} onRetry={onRetry} />
      <div className="dashboard-intro">
        <p className="dashboard-intro__text">{description}</p>
        <div className="dashboard-intro__tools">
          {updatedAt && (
            <span className="dashboard-intro__time">
              Updated {updatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {onRefresh && (
            <button type="button" className="dashboard-btn" onClick={onRefresh} disabled={refreshing}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          )}
        </div>
      </div>
      {insight && (
        <div className="dashboard-insight" role="status">
          <strong>Insight:</strong> {insight}
        </div>
      )}
    </>
  );
}

function KpiCard({ label, value, icon, tip, hint, delta, badWhenUp = false, spark }) {
  const deltaValue =
    typeof delta === "number"
      ? delta
      : delta && typeof delta === "object"
        ? Number(delta.value)
        : null;
  const hasNumericDelta =
    delta !== null &&
    delta !== undefined &&
    deltaValue !== null &&
    Number.isFinite(deltaValue);
  const isBadWhenUp = delta?.badWhenUp ?? badWhenUp;
  const deltaTone = hasNumericDelta
    ? deltaValue === 0
      ? "neutral"
      : (deltaValue > 0) !== isBadWhenUp
        ? "good"
        : "bad"
    : "neutral";
  const deltaText =
    typeof delta === "string"
      ? delta
      : hasNumericDelta
        ? `${deltaValue > 0 ? "▲" : deltaValue < 0 ? "▼" : "•"} ${Math.abs(deltaValue).toLocaleString("en-IN", { maximumFractionDigits: 1 })}% ${delta?.label || "vs previous month"}`
        : "";
  const sparkValues = Array.isArray(spark)
    ? spark.map(Number).filter(Number.isFinite)
    : [];
  const sparkPoints =
    sparkValues.length >= 3
      ? sparkValues
          .map((point, index) => {
            const minimum = Math.min(...sparkValues);
            const maximum = Math.max(...sparkValues);
            const y =
              maximum === minimum
                ? 9
                : 16 - ((point - minimum) / (maximum - minimum)) * 14;
            const x = 2 + (index / (sparkValues.length - 1)) * 56;
            return `${x},${y}`;
          })
          .join(" ")
      : "";

  return (
    <div className="dashboard-kpi-card" title={tip}>
      <div className="dashboard-kpi-card__head">
        <div className="dashboard-kpi-card__label">
          <span>{label}</span>
          {tip && (
            <span className="dashboard-kpi-card__info" aria-label={tip} title={tip}>
              ⓘ
            </span>
          )}
        </div>
        {icon && <div className="dashboard-kpi-card__icon">{icon}</div>}
      </div>
      <div className="dashboard-kpi-card__value">{value}</div>
      {hint && <div className="dashboard-kpi-card__hint">{hint}</div>}
      {deltaText && (
        <div className={`dashboard-kpi-card__delta is-${deltaTone}`}>
          {deltaText}
        </div>
      )}
      {sparkPoints && (
        <svg
          className="dashboard-kpi-card__spark"
          width="60"
          height="18"
          viewBox="0 0 60 18"
          aria-hidden="true"
        >
          <polyline points={sparkPoints} />
        </svg>
      )}
    </div>
  );
}

export function MetricGrid({ cards }) {
  return (
    <div className="dashboard-metric-grid">
      {cards.map((card, index) => (
        <div key={index} className="dashboard-metric-wrap">
          <KpiCard {...card} />
        </div>
      ))}
    </div>
  );
}

export function Legend({ items, layout = "horizontal" }) {
  if (!items?.length) return null;
  return (
    <div className={`dashboard-legend dashboard-legend--${layout}`}>
      {items.map((it, i) => (
        <span key={i} className="dashboard-legend__item">
          <span className="dashboard-legend__swatch" style={{ background: it.color }} />
          <span className="dashboard-legend__label" title={it.label}>{it.label}</span>
          {it.value !== undefined && (
            <span className="dashboard-legend__value">{num(it.value)}</span>
          )}
        </span>
      ))}
    </div>
  );
}

export function ChartGrid({ children }) {
  return <div className="dashboard-chart-grid">{children}</div>;
}

export function ChartCard({
  title,
  ariaLabel,
  legendItems,
  legendLayout = "horizontal",
  height = 240,
  isEmpty = false,
  emptyText = "No data for this chart yet.",
  donutCenter,
  children,
}) {
  return (
    <div className="dashboard-chart-card">
      {title && <h3 className="dashboard-card-title">{title}</h3>}
      {isEmpty ? (
        <div className="dashboard-empty" style={{ minHeight: height }}>
          {emptyText}
        </div>
      ) : (
        <div className={`dashboard-chart-card__body${legendLayout === "vertical" ? " has-side-legend" : ""}`}>
          <Legend items={legendItems} layout={legendLayout} />
          <div style={{ position: "relative", height }} role="img" aria-label={ariaLabel}>
            <ResponsiveContainer width="100%" height="100%">
              {children}
            </ResponsiveContainer>
            {donutCenter && (
              <div className="dashboard-donut-center" aria-hidden="true">
                <strong>{num(donutCenter.total)}</strong>
                <span>{donutCenter.caption}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Chip({ tone = "neutral", children }) {
  return <span className={`dashboard-chip dashboard-chip--${tone}`}>{children}</span>;
}

/* columns: [{ key, label, align?, render?(row) }] */
export function TableCard({
  title,
  columns,
  rows,
  totalRows = rows.length,
  empty = "Nothing needs attention.",
  highlightHeader = false,
}) {
  return (
    <div className="dashboard-chart-card">
      {title && <h3 className="dashboard-card-title">{title}</h3>}
      {rows.length === 0 ? (
        <div className="dashboard-empty">{empty}</div>
      ) : (
        <div className="dashboard-table-wrap">
          <table
            className={`dashboard-table${highlightHeader ? " dashboard-table--highlight-header" : ""}`}
          >
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key} style={{ textAlign: c.align || "left" }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id ?? i}>
                  {columns.map((c) => (
                    <td key={c.key} style={{ textAlign: c.align || "left" }}>
                      {(() => {
                        const value = c.render ? c.render(row) : row[c.key];
                        return typeof value === "string" || typeof value === "number" ? (
                          <span className="dashboard-table__truncate" title={String(value)}>
                            {value}
                          </span>
                        ) : (
                          value
                        );
                      })()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalRows > rows.length && (
        <div className="dashboard-table__count">
          Showing {rows.length} of {num(totalRows)}
        </div>
      )}
    </div>
  );
}

/* items: [{ label, value, target, format? }] — hidden when no target is set. */
export function TargetsCard({ items }) {
  const active = items.filter((i) => finiteNumber(i.target) > 0);
  if (!active.length) return null;
  return (
    <div className="dashboard-chart-card">
      <h3 className="dashboard-card-title">Targets</h3>
      {active.map((i) => {
        const fmt = i.format || num;
        const target = finiteNumber(i.target);
        const value = finiteNumber(i.value);
        const ratio = Math.max(0, Math.min((value / target) * 100, 100));
        return (
          <div key={i.label} className="dashboard-goal">
            <div className="dashboard-goal__head">
              <span>{i.label}</span>
              <strong>
                {fmt(value)} of {fmt(target)}
              </strong>
            </div>
            <div className="dashboard-goal__bar">
              <i style={{ width: `${ratio}%`, background: value >= target ? cove.green : cove.yellow }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* items: [[term, meaning], ...] */
export function DefinitionsCard({ items }) {
  return (
    <div className="dashboard-chart-card">
      <h3 className="dashboard-card-title">How these numbers are calculated</h3>
      <dl className="dashboard-defs">
        {items.map(([term, meaning]) => (
          <React.Fragment key={term}>
            <dt>{term}</dt>
            <dd>{meaning}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );
}

/* items: [{ label, value, detail, color }] */
export function StatStrip({ title, items }) {
  return (
    <div className="dashboard-chart-card dashboard-strip">
      {title && <h3 className="dashboard-card-title">{title}</h3>}
      <div className="dashboard-strip__grid">
        {items.map((item) => (
          <div key={item.label} className="dashboard-strip__item" style={{ borderLeftColor: item.color }}>
            <div className="dashboard-strip__label">{item.label}</div>
            <div className="dashboard-strip__value">{item.value}</div>
            <div className="dashboard-strip__detail">{item.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

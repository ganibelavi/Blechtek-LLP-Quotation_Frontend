import React, { useMemo } from "react";
import "./ModuleSelector.css";

/**
 * Renders the master "Scope" list grouped by pillar as a checklist.
 * Only the modules the user checks here are written into the generated quotation.
 */
export default function ModuleSelector({
  modules,
  selected,
  onToggle,
  error,
  disabled = false,
}) {
  const grouped = useMemo(() => {
    const map = new Map();
    for (const m of modules) {
      if (!map.has(m.pillar)) map.set(m.pillar, []);
      map.get(m.pillar).push(m.module);
    }
    return Array.from(map.entries());
  }, [modules]);

  if (modules.length === 0) {
    return <p className="module-selector__empty">Loading module list…</p>;
  }

  return (
    <div className="module-selector">
      {grouped.map(([pillar, items]) => (
        <div className="module-selector__group" key={pillar}>
          <span className="module-selector__pillar">{pillar}</span>
          <div className="module-selector__chips">
            {items.map((module) => {
              const active = selected.includes(module);
              return (
                <label
                  key={module}
                  className={`module-chip ${active ? "module-chip--active" : ""} ${disabled ? "module-chip--disabled" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => onToggle(module)}
                    disabled={disabled}
                  />
                  <span className="module-chip__box" aria-hidden="true" />
                  {module}
                </label>
              );
            })}
          </div>
        </div>
      ))}
      {error && <p className="module-selector__error">{error}</p>}
    </div>
  );
}

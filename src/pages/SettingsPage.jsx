import React from "react";

export default function SettingsPage({ onNavigate }) {
  return (
    <div style={{ padding: 20 }}>
      <h2>Settings</h2>
      <p>Choose a master to manage:</p>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => onNavigate("users")}>Users Master</button>
        <button onClick={() => onNavigate("modules")}>Modules Master</button>
        <button onClick={() => onNavigate("create")}>Back</button>
      </div>
    </div>
  );
}

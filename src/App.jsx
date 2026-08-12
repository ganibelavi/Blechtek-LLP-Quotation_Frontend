import React from "react";
import CreateQuotation from "./pages/CreateQuotation";
import "./App.css";

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-topbar__brand">
          <span className="app-topbar__mark">BT</span>
          <div>
            <h1 className="app-topbar__title">Quotation Studio</h1>
            <p className="app-topbar__subtitle">BlechTek Software Solutions LLP</p>
          </div>
        </div>
        <span className="app-topbar__badge">Internal tool</span>
      </header>

      <main className="app-main">
        <CreateQuotation />
      </main>
    </div>
  );
}

import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

export default function AppHeader({ user, logout, onNavigate }) {
  return (
    <header className="app-topbar">
      <div className="app-topbar__brand">
        <img
          src="/logo/logo.png"
          alt="BlechTek Software Solutions LLP"
          className="app-topbar__logo"
        />
        {user && <span className="app-topbar__page-title">InvoiceOne</span>}
      </div>
      <div className="app-topbar__actions">
        {user && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginRight: 8,
              }}
            >
              <div style={{ textAlign: "right", lineHeight: 1 }}>
                <div style={{ color: "#1e293b" }}>
                  {user?.name ||
                    user?.firstName ||
                    (user?.email ? user.email.split("@")[0] : "")}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {user?.role || ""}
                </div>
              </div>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 20,
                  border: "2px solid #0f172a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontWeight: 700, color: "#0f172a" }}>
                  {(user?.name || user?.firstName || user?.email || "")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              </div>
            </div>
            <Tooltip title="Guidelines">
              <button
                type="button"
                className="app-topbar__guidelines-btn"
                onClick={() => onNavigate("guidelines")}
              >
                Guidelines
              </button>
            </Tooltip>
            <Tooltip title="Logout">
              <IconButton
                className="app-topbar__icon-btn"
                onClick={() => {
                  logout();
                  onNavigate("login");
                }}
              >
                <img
                  src="/logo/logout.png"
                  alt="Logout"
                  style={{ width: 24, height: 24 }}
                />
              </IconButton>
            </Tooltip>
          </>
        )}
      </div>
    </header>
  );
}

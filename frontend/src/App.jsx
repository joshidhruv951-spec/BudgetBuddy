import React, { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/register.jsx";

function App() {
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      setToken(localStorage.getItem("access_token"));
    };
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setToken(null);
  };

  return (
    <div className="App">
      {token ? (
        <div>
          <div style={{ textAlign: "right", padding: "10px 20px", backgroundColor: "#f8f9fa" }}>
            <button
              onClick={handleLogout}
              style={{
                padding: "8px 16px",
                background: "#c62828",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Logout
            </button>
          </div>
          <Dashboard />
        </div>
      ) : isRegistering ? (
        <Register onSwitchToLogin={() => setIsRegistering(false)} />
      ) : (
        <Login
          onLoginSuccess={() => setToken(localStorage.getItem("access_token"))}
          onSwitchToRegister={() => setIsRegistering(true)}
        />
      )}
    </div>
  );
}

export default App;
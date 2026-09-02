import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [type, setType] = useState("EXPENSE");
  
  // Default limit 1,00,000
  const [budgetLimit, setBudgetLimit] = useState(() => {
    return Number(localStorage.getItem("budget_limit")) || 100000;
  });
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState(budgetLimit);

  const [formError, setFormError] = useState("");
  const [chartTab, setChartTab] = useState("EXPENSE");

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("Food");
  const [editType, setEditType] = useState("EXPENSE");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await api.get("transactions/");
      setTransactions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    }
  };

  const handleSaveLimit = () => {
    const parsed = parseFloat(tempLimit);
    if (!isNaN(parsed) && parsed > 0) {
      setBudgetLimit(parsed);
      localStorage.setItem("budget_limit", parsed);
      setIsEditingLimit(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError("");

    const numAmount = Math.abs(parseFloat(amount));
    if (isNaN(numAmount)) {
      setFormError("Please enter a valid amount");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    const payload = {
      title: title,
      amount: numAmount,
      category: category,
      transaction_type: type,
      date: today,
    };

    try {
      await api.post("transactions/", payload);
      setTitle("");
      setAmount("");
      fetchTransactions();
    } catch (err) {
      console.error("Backend Error Details:", err.response?.data);
      const errorMsg = err.response?.data
        ? JSON.stringify(err.response.data)
        : "Failed to connect to backend server.";
      setFormError(`Add failed: ${errorMsg}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await api.delete(`transactions/${id}/`);
        fetchTransactions();
      } catch (err) {
        console.error("Failed to delete transaction", err);
      }
    }
  };

  const startEditing = (t) => {
    setEditingId(t.id);
    setEditTitle(t.title || "");
    setEditAmount(t.amount !== undefined ? Math.abs(parseFloat(t.amount)) : "");
    setEditCategory(t.category || "Food");
    setEditType(
      t.transaction_type
        ? String(t.transaction_type).toUpperCase()
        : parseFloat(t.amount) < 0
        ? "EXPENSE"
        : "INCOME"
    );
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const numAmount = Math.abs(parseFloat(editAmount));
    const today = new Date().toISOString().split("T")[0];

    try {
      await api.put(`transactions/${editingId}/`, {
        title: editTitle,
        amount: numAmount,
        category: editCategory,
        transaction_type: editType,
        date: today,
      });
      setEditingId(null);
      fetchTransactions();
    } catch (err) {
      console.error("Failed to update transaction", err);
      alert("Update failed: " + JSON.stringify(err.response?.data || "Error updating"));
    }
  };

  // Strict Type Checking
  const isIncome = (t) => {
    if (t.transaction_type) {
      const typeStr = String(t.transaction_type).toUpperCase();
      return typeStr === "INCOME" || typeStr === "INC";
    }
    return parseFloat(t.amount) > 0;
  };

  const isExpense = (t) => {
    if (t.transaction_type) {
      const typeStr = String(t.transaction_type).toUpperCase();
      return typeStr === "EXPENSE" || typeStr === "EXP";
    }
    return parseFloat(t.amount) < 0;
  };

  // Totals Calculations
  const totalIncome = transactions
    .filter(isIncome)
    .reduce((acc, t) => acc + Math.abs(parseFloat(t.amount || 0)), 0);

  const totalExpense = transactions
    .filter(isExpense)
    .reduce((acc, t) => acc + Math.abs(parseFloat(t.amount || 0)), 0);

  const netBalance = totalIncome - totalExpense;
  const budgetUsedPercent = budgetLimit > 0 ? Math.min((totalExpense / budgetLimit) * 100, 100) : 0;

  // 1. Expense Breakdown Data
  const expenses = transactions.filter(isExpense);
  const expenseCategoryTotals = expenses.reduce((acc, t) => {
    const cat = t.category || "Other";
    acc[cat] = (acc[cat] || 0) + Math.abs(parseFloat(t.amount || 0));
    return acc;
  }, {});

  const expensePieData = {
    labels: Object.keys(expenseCategoryTotals),
    datasets: [
      {
        label: "Expenses (₹)",
        data: Object.values(expenseCategoryTotals),
        backgroundColor: ["#EF4444", "#F97316", "#F59E0B", "#EC4899", "#8B5CF6", "#6B7280"],
        borderWidth: 1,
      },
    ],
  };

  // 2. Income Breakdown Data
  const incomes = transactions.filter(isIncome);
  const incomeCategoryTotals = incomes.reduce((acc, t) => {
    const cat = t.category || "Salary";
    acc[cat] = (acc[cat] || 0) + Math.abs(parseFloat(t.amount || 0));
    return acc;
  }, {});

  const incomePieData = {
    labels: Object.keys(incomeCategoryTotals),
    datasets: [
      {
        label: "Income (₹)",
        data: Object.values(incomeCategoryTotals),
        backgroundColor: ["#10B981", "#3B82F6", "#06B6D4", "#6366F1", "#14B8A6", "#84CC16"],
        borderWidth: 1,
      },
    ],
  };

  // 3. Overview Data
  const overviewPieData = {
    labels: ["Total Income", "Total Expense"],
    datasets: [
      {
        label: "Amount (₹)",
        data: [totalIncome, totalExpense],
        backgroundColor: ["#10B981", "#EF4444"],
        borderWidth: 1,
      },
    ],
  };

  const inputStyle = {
    padding: "10px",
    color: "#111827",
    backgroundColor: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
  };

  return (
    <div style={{ maxWidth: "800px", margin: "20px auto", padding: "20px", fontFamily: "Segoe UI, Tahoma, sans-serif" }}>
      <h2 style={{ color: "#1f2937", marginBottom: "20px" }}>BudgetBuddy Dashboard</h2>

      {/* Stats Cards */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
        <div style={{ flex: 1, padding: "16px", background: "#e8f5e9", borderRadius: "8px", border: "1px solid #c8e6c9" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#2e7d32" }}>Total Income</h4>
          <p style={{ fontSize: "24px", color: "#1b5e20", fontWeight: "bold", margin: 0 }}>₹{totalIncome.toLocaleString('en-IN')}</p>
        </div>
        <div style={{ flex: 1, padding: "16px", background: "#ffebee", borderRadius: "8px", border: "1px solid #ffcdd2" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#c62828" }}>Total Expense</h4>
          <p style={{ fontSize: "24px", color: "#b71c1c", fontWeight: "bold", margin: 0 }}>₹{totalExpense.toLocaleString('en-IN')}</p>
        </div>
        <div style={{ flex: 1, padding: "16px", background: "#e3f2fd", borderRadius: "8px", border: "1px solid #bbdefb" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#1565c0" }}>Net Balance</h4>
          <p style={{ fontSize: "24px", color: "#0d47a1", fontWeight: "bold", margin: 0 }}>₹{netBalance.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Budget Limit Progress Bar */}
      <div style={{ marginBottom: "25px", background: "#f8f9fa", padding: "16px", borderRadius: "8px", border: "1px solid #e9ecef" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", fontWeight: "500", color: "#495057" }}>
          <div>
            <span>Monthly Expense Limit: </span>
            {isEditingLimit ? (
              <span style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                <input
                  type="number"
                  value={tempLimit}
                  onChange={(e) => setTempLimit(e.target.value)}
                  style={{ width: "110px", padding: "4px 8px", borderRadius: "4px", border: "1px solid #0284c7" }}
                />
                <button
                  onClick={handleSaveLimit}
                  style={{ background: "#16a34a", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingLimit(false)}
                  style={{ background: "#6b7280", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                >
                  Cancel
                </button>
              </span>
            ) : (
              <span>
                <strong>₹{budgetLimit.toLocaleString('en-IN')}</strong>{" "}
                <button
                  onClick={() => {
                    setTempLimit(budgetLimit);
                    setIsEditingLimit(true);
                  }}
                  style={{ background: "none", border: "none", color: "#0284c7", cursor: "pointer", textDecoration: "underline", fontSize: "13px", marginLeft: "6px" }}
                >
                  Edit Limit
                </button>
              </span>
            )}
          </div>
          <span>{budgetUsedPercent.toFixed(1)}% Used</span>
        </div>
        <div style={{ width: "100%", height: "12px", background: "#dee2e6", borderRadius: "6px", overflow: "hidden" }}>
          <div
            style={{
              width: `${budgetUsedPercent}%`,
              height: "100%",
              background: budgetUsedPercent > 85 ? "#d32f2f" : "#2e7d32",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Error Message */}
      {formError && (
        <div style={{ color: "#d32f2f", background: "#ffebee", padding: "12px", borderRadius: "6px", marginBottom: "20px", border: "1px solid #ffcdd2" }}>
          {formError}
        </div>
      )}

      {/* Add Transaction Form */}
      <form onSubmit={handleAdd} style={{ display: "flex", gap: "10px", marginBottom: "25px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Title (e.g. Salary, Grocery)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ ...inputStyle, flex: 2 }}
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          style={{ ...inputStyle, flex: 1 }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle }}>
          <option value="Food">Food</option>
          <option value="Rent">Rent</option>
          <option value="Travel">Travel</option>
          <option value="Salary">Salary</option>
          <option value="Freelance">Freelance</option>
          <option value="Investment">Investment</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Other">Other</option>
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ ...inputStyle }}>
          <option value="EXPENSE">Expense (-)</option>
          <option value="INCOME">Income (+)</option>
        </select>
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Add
        </button>
      </form>

      {/* Visual Charts Section with Smart Tabs */}
      {(totalIncome > 0 || totalExpense > 0) && (
        <div style={{ marginBottom: "30px", padding: "20px", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #e9ecef", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
            <button
              onClick={() => setChartTab("EXPENSE")}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                background: chartTab === "EXPENSE" ? "#ef4444" : "#e5e7eb",
                color: chartTab === "EXPENSE" ? "#fff" : "#374151",
              }}
            >
              🔴 Expenses
            </button>
            <button
              onClick={() => setChartTab("INCOME")}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                background: chartTab === "INCOME" ? "#10b981" : "#e5e7eb",
                color: chartTab === "INCOME" ? "#fff" : "#374151",
              }}
            >
              🟢 Income
            </button>
            <button
              onClick={() => setChartTab("OVERVIEW")}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                background: chartTab === "OVERVIEW" ? "#3b82f6" : "#e5e7eb",
                color: chartTab === "OVERVIEW" ? "#fff" : "#374151",
              }}
            >
              ⚖️ Income vs Expense
            </button>
          </div>

          <div style={{ maxWidth: "300px", margin: "0 auto" }}>
            {chartTab === "EXPENSE" && (
              Object.keys(expenseCategoryTotals).length > 0 ? (
                <div>
                  <h4 style={{ margin: "0 0 12px 0", color: "#374151" }}>Expense Breakdown by Category</h4>
                  <Pie data={expensePieData} />
                </div>
              ) : (
                <p style={{ color: "#6b7280" }}>No expense records found yet.</p>
              )
            )}

            {chartTab === "INCOME" && (
              Object.keys(incomeCategoryTotals).length > 0 ? (
                <div>
                  <h4 style={{ margin: "0 0 12px 0", color: "#374151" }}>Income Breakdown by Category</h4>
                  <Pie data={incomePieData} />
                </div>
              ) : (
                <p style={{ color: "#6b7280" }}>No income records found yet.</p>
              )
            )}

            {chartTab === "OVERVIEW" && (
              <div>
                <h4 style={{ margin: "0 0 12px 0", color: "#374151" }}>Total Income vs Total Expense</h4>
                <Pie data={overviewPieData} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transactions List */}
      <h3 style={{ color: "#374151", marginBottom: "15px" }}>Transactions</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {transactions.map((t) => (
          <li
            key={t.id}
            style={{
              padding: "14px 16px",
              marginBottom: "10px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            {editingId === t.id ? (
              <div style={{ background: "#f9fafb", padding: "15px", borderRadius: "6px", border: "1px solid #93c5fd" }}>
                <h4 style={{ margin: "0 0 12px 0", color: "#1e40af" }}>✏️ Edit Transaction</h4>
                <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      placeholder="Title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                      autoFocus
                      style={{ ...inputStyle, flex: 2 }}
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      required
                      style={{ ...inputStyle, flex: 1 }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                    >
                      <option value="Food">Food</option>
                      <option value="Rent">Rent</option>
                      <option value="Travel">Travel</option>
                      <option value="Salary">Salary</option>
                      <option value="Freelance">Freelance</option>
                      <option value="Investment">Investment</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Other">Other</option>
                    </select>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                    >
                      <option value="EXPENSE">Expense (-)</option>
                      <option value="INCOME">Income (+)</option>
                    </select>
                    <button
                      type="submit"
                      style={{
                        padding: "10px 18px",
                        background: "#16a34a",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      style={{
                        padding: "10px 18px",
                        background: "#6b7280",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "500",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "16px", color: "#111827" }}>{t.title}</strong>{" "}
                  <small style={{ color: "#6b7280", background: "#f3f4f6", padding: "2px 8px", borderRadius: "12px" }}>
                    {t.category || "General"}
                  </small>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span
                    style={{
                      fontWeight: "bold",
                      fontSize: "15px",
                      color: isIncome(t) ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {isIncome(t) ? `+₹${Math.abs(t.amount).toLocaleString('en-IN')}` : `-₹${Math.abs(t.amount).toLocaleString('en-IN')}`}
                  </span>
                  <button
                    onClick={() => startEditing(t)}
                    style={{
                      background: "#f59e0b",
                      color: "#fff",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "500",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    style={{
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "500",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
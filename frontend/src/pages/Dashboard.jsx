import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function Dashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'User';

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    type: 'EXPENSE',
    date: new Date().toISOString().split('T')[0],
  });
  const [editingId, setEditingId] = useState(null);

  // Dynamic Budget Limit
  const [budgetLimit, setBudgetLimit] = useState(
    Number(localStorage.getItem('budgetLimit')) || 10000
  );
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState(budgetLimit);

  // 1. Fetch Transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('transactions/');
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // 2. Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('username');
    navigate('/login');
  };

  // 3. Form Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 4. Add or Update Transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    const payload = {
      title: formData.title,
      amount: parseFloat(formData.amount),
      category: formData.category,
      type: formData.type,
      transaction_type: formData.type,
      date: formData.date,
    };

    try {
      if (editingId) {
        await api.put(`transactions/${editingId}/`, payload);
      } else {
        await api.post('transactions/', payload);
      }

      setFormData({
        title: '',
        amount: '',
        category: 'Food',
        type: 'EXPENSE',
        date: new Date().toISOString().split('T')[0],
      });
      setEditingId(null);
      fetchTransactions();
    } catch (err) {
      console.error('Failed to save transaction:', err);
      alert('Error saving transaction. Please try again.');
    }
  };

  // 5. Edit Button Handler
  const handleEdit = (item) => {
    setEditingId(item.id);
    const itemType = (item.type || item.transaction_type || 'EXPENSE').toUpperCase();
    setFormData({
      title: item.title,
      amount: item.amount,
      category: item.category || 'Food',
      type: itemType,
      date: item.date || new Date().toISOString().split('T')[0],
    });
  };

  // 6. Delete Transaction
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.delete(`transactions/${id}/`);
      fetchTransactions();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  // 7. Save Budget Limit
  const handleSaveBudget = () => {
    const val = Number(newBudget);
    if (val > 0) {
      setBudgetLimit(val);
      localStorage.setItem('budgetLimit', val);
      setIsEditingBudget(false);
    }
  };

  // Financial Calculations
  const totalIncome = transactions
    .filter((t) => (t.type || t.transaction_type || '').toUpperCase() === 'INCOME')
    .reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);

  const totalExpense = transactions
    .filter((t) => (t.type || t.transaction_type || '').toUpperCase() === 'EXPENSE')
    .reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);

  const totalBalance = totalIncome - totalExpense;
  const budgetSpentPercent = Math.min(Math.round((totalExpense / budgetLimit) * 100), 100);

  // Category Colors Palette for Pie Chart
  const categoryColors = {
    Food: '#f97316',          // Orange
    Rent: '#8b5cf6',          // Purple
    Entertainment: '#ec4899', // Pink
    Shopping: '#3b82f6',      // Blue
    Utilities: '#eab308',     // Yellow
    Other: '#64748b',         // Slate Gray
  };

  // Calculate Category Breakdowns for Pie Chart
  const expenseByCategory = transactions
    .filter((t) => (t.type || t.transaction_type || '').toUpperCase() === 'EXPENSE')
    .reduce((acc, t) => {
      const cat = t.category || 'Other';
      acc[cat] = (acc[cat] || 0) + parseFloat(t.amount || 0);
      return acc;
    }, {});

  const chartData = Object.keys(expenseByCategory).map((cat) => {
    const amount = expenseByCategory[cat];
    const percent = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
    return {
      category: cat,
      amount,
      percent,
      color: categoryColors[cat] || '#94a3b8',
    };
  });

  // Calculate SVG offsets for concentric slices
  let cumulative = 0;
  const slicesWithOffsets = chartData.map((slice) => {
    const offset = cumulative;
    cumulative += slice.percent;
    return { ...slice, offset };
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '24px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* TOP HEADER */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>BudgetBuddy</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Welcome back, <strong style={{ color: '#38bdf8' }}>{username}</strong>
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(239,68,68,0.3)'
            }}
          >
            Logout
          </button>
        </header>

        {/* METRICS CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: '5px solid #2563eb' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Net Balance</span>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: totalBalance >= 0 ? '#0f172a' : '#ef4444', marginTop: '6px' }}>
              ₹{totalBalance.toLocaleString()}
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: '5px solid #10b981' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Total Income</span>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginTop: '6px' }}>
              + ₹{totalIncome.toLocaleString()}
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: '5px solid #ef4444' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Total Expenses</span>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', marginTop: '6px' }}>
              - ₹{totalExpense.toLocaleString()}
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: '5px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Monthly Budget</span>
              <button
                onClick={() => setIsEditingBudget(!isEditingBudget)}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
              >
                {isEditingBudget ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {isEditingBudget ? (
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  style={{ width: '100px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
                <button
                  onClick={handleSaveBudget}
                  style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Save
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', marginTop: '6px' }}>
                ₹{budgetLimit.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* BUDGET PROGRESS BAR */}
        <div style={{ backgroundColor: '#ffffff', padding: '18px 24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>
            <span>Budget Utilisation: {budgetSpentPercent}% used</span>
            <span>₹{totalExpense.toLocaleString()} / ₹{budgetLimit.toLocaleString()}</span>
          </div>
          <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{
              width: `${budgetSpentPercent}%`,
              height: '100%',
              backgroundColor: budgetSpentPercent > 90 ? '#ef4444' : budgetSpentPercent > 70 ? '#f59e0b' : '#10b981',
              borderRadius: '5px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* EXPENSE DONUT / PIE CHART SECTION */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 18px 0', fontSize: '18px', color: '#0f172a' }}>
            📊 Expense Breakdown by Category
          </h3>

          {totalExpense === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>
              No expenses added yet. Add an expense below to see your breakdown chart!
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-around', gap: '30px' }}>
              
              {/* SVG Donut Chart */}
              <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="3.8"
                  />
                  {slicesWithOffsets.map((slice) => (
                    <circle
                      key={slice.category}
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="3.8"
                      strokeDasharray={`${slice.percent} ${100 - slice.percent}`}
                      strokeDashoffset={-slice.offset}
                      style={{ transition: 'stroke-dasharray 0.5s ease' }}
                    />
                  ))}
                </svg>

                {/* Center Badge */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Spent</span>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                    ₹{totalExpense.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Chart Legend with Percentages */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '220px' }}>
                {slicesWithOffsets.map((slice) => (
                  <div key={slice.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: slice.color, display: 'inline-block' }} />
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>{slice.category}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      <strong>₹{slice.amount.toLocaleString()}</strong> ({Math.round(slice.percent)}%)
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>

        {/* MAIN SECTION: FORM & RECENT TRANSACTIONS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* TRANSACTION FORM */}
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a' }}>
              {editingId ? '✏️ Edit Transaction' : '➕ Add Transaction'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g., Grocery Shopping"
                  value={formData.title}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Amount (₹)</label>
                <input
                  type="number"
                  name="amount"
                  required
                  placeholder="e.g., 500"
                  value={formData.amount}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  >
                    <option value="Food">Food</option>
                    <option value="Rent">Rent</option>
                    <option value="Salary">Salary</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    backgroundColor: editingId ? '#f59e0b' : '#2563eb',
                    color: '#ffffff',
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {editingId ? 'Update Transaction' : 'Add Transaction'}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({
                        title: '',
                        amount: '',
                        category: 'Food',
                        type: 'EXPENSE',
                        date: new Date().toISOString().split('T')[0],
                      });
                    }}
                    style={{ backgroundColor: '#94a3b8', color: '#ffffff', padding: '12px 18px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* RECENT TRANSACTIONS */}
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a' }}>📜 Recent Transactions</h3>

            {loading ? (
              <p style={{ color: '#64748b', textAlign: 'center', margin: '40px 0' }}>Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', margin: '40px 0' }}>No transactions recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                {transactions.map((t) => {
                  const isIncome = (t.type || t.transaction_type || '').toUpperCase() === 'INCOME';
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #f1f5f9'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>{t.title}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          <span style={{
                            display: 'inline-block',
                            backgroundColor: '#e2e8f0',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            marginRight: '8px',
                            fontWeight: '500'
                          }}>
                            {t.category || 'General'}
                          </span>
                          {t.date}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          fontWeight: 'bold',
                          fontSize: '16px',
                          color: isIncome ? '#10b981' : '#ef4444'
                        }}>
                          {isIncome ? '+' : '-'}₹{parseFloat(t.amount).toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleEdit(t)}
                          title="Edit"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px' }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          title="Delete"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

export default Dashboard;
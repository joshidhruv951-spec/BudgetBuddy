import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const EXPENSE_CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Education',
  'Entertainment',
  'Miscellaneous',
];

const INCOME_SOURCES = [
  'Pocket Money',
  'Scholarship',
  'Freelance Income',
];

const CATEGORY_COLORS = {
  Food: '#f97316',
  Travel: '#3b82f6',
  Shopping: '#ec4899',
  Education: '#8b5cf6',
  Entertainment: '#eab308',
  Miscellaneous: '#64748b',
  'Pocket Money': '#10b981',
  Scholarship: '#06b6d4',
  'Freelance Income': '#14b8a6',
};

function Dashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'User';

  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [currentBudget, setCurrentBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('EXPENSE');

  // Form State
  const [formType, setFormType] = useState('EXPENSE');
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    source: 'Pocket Money',
    date: new Date().toISOString().split('T')[0],
    details: '',
  });
  const [editingItem, setEditingItem] = useState(null);

  // Category Budget Allocation Modal
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    total_amount: '',
    allocations: EXPENSE_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: '' }), {}),
  });

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // 1. Fetch All Data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [expRes, incRes, budRes] = await Promise.all([
        api.get('expenses/'),
        api.get('incomes/'),
        api.get('budgets/'),
      ]);

      setExpenses(expRes.data || []);
      setIncomes(incRes.data || []);

      const activeBudget = (budRes.data || []).find(
        (b) => Number(b.month) === currentMonth && Number(b.year) === currentYear
      ) || (budRes.data && budRes.data[0]) || null;

      setCurrentBudget(activeBudget);

      if (activeBudget) {
        const initialAllocations = EXPENSE_CATEGORIES.reduce((acc, cat) => {
          const match = activeBudget.category_allocations?.find((a) => a.category === cat);
          acc[cat] = match ? match.allocated_amount : '';
          return acc;
        }, {});

        setBudgetForm({
          total_amount: activeBudget.total_amount,
          allocations: initialAllocations,
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // 2. Submit Transaction (Handles both source & income_type)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Please enter an amount greater than 0');
      return;
    }

    try {
      if (formType === 'EXPENSE') {
        const payload = {
          title: formData.title || formData.category,
          amount: parseFloat(formData.amount),
          category: formData.category,
          date: formData.date,
        };

        if (editingItem) {
          await api.put(`expenses/${editingItem.id}/`, payload);
        } else {
          await api.post('expenses/', payload);
        }
      } else {
        // Sends both source AND income_type to pass backend validation cleanly
        const payload = {
          source: formData.source,
          income_type: formData.source,
          amount: parseFloat(formData.amount),
          date: formData.date,
          details: formData.details || '',
        };

        if (editingItem) {
          await api.put(`incomes/${editingItem.id}/`, payload);
        } else {
          await api.post('incomes/', payload);
        }
      }

      // Reset
      setFormData({
        title: '',
        amount: '',
        category: 'Food',
        source: 'Pocket Money',
        date: new Date().toISOString().split('T')[0],
        details: '',
      });
      setEditingItem(null);
      loadDashboardData();
    } catch (err) {
      console.error('Save failed:', err);
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save.';
      alert(`Backend Validation Error: ${errorMsg}`);
    }
  };

  // 3. Edit Handler
  const handleEdit = (item, type) => {
    setEditingItem(item);
    setFormType(type);
    if (type === 'EXPENSE') {
      setFormData({
        title: item.title,
        amount: item.amount,
        category: item.category,
        source: 'Pocket Money',
        date: item.date,
        details: '',
      });
    } else {
      const incVal = item.source || item.income_type || 'Pocket Money';
      setFormData({
        title: '',
        amount: item.amount,
        category: 'Food',
        source: incVal,
        date: item.date,
        details: item.details || '',
      });
    }
  };

  // 4. Delete Handler
  const handleDelete = async (id, type) => {
    if (!window.confirm(`Delete this ${type.toLowerCase()} record?`)) return;
    try {
      if (type === 'EXPENSE') {
        await api.delete(`expenses/${id}/`);
      } else {
        await api.delete(`incomes/${id}/`);
      }
      loadDashboardData();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Delete operation failed.');
    }
  };

  // 5. Save Category-wise Budget
  const handleSaveBudget = async (e) => {
    e.preventDefault();
    const totalAmount = parseFloat(budgetForm.total_amount);
    if (!totalAmount || totalAmount <= 0) {
      alert('Please enter a valid monthly total budget.');
      return;
    }

    const allocations = Object.keys(budgetForm.allocations)
      .filter((cat) => Number(budgetForm.allocations[cat]) > 0)
      .map((cat) => ({
        category: cat,
        allocated_amount: parseFloat(budgetForm.allocations[cat]),
      }));

    try {
      await api.post('budgets/', {
        month: currentMonth,
        year: currentYear,
        total_amount: totalAmount,
        category_allocations: allocations,
      });
      setShowBudgetModal(false);
      loadDashboardData();
      alert('Monthly budget saved to backend!');
    } catch (err) {
      console.error('Budget save failed:', err);
      alert('Error saving budget to backend.');
    }
  };

  // Calculations
  const totalIncome = incomes.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  const totalExpense = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  const remainingBalance = totalIncome - totalExpense;

  const monthlyBudgetLimit = currentBudget ? parseFloat(currentBudget.total_amount) : 0;
  const budgetSpentPercent = monthlyBudgetLimit > 0
    ? Math.min(Math.round((totalExpense / monthlyBudgetLimit) * 100), 100)
    : 0;

  const expenseByCategory = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + parseFloat(item.amount || 0);
    return acc;
  }, {});

  const incomeBySource = incomes.reduce((acc, item) => {
    const key = item.source || item.income_type || 'Pocket Money';
    acc[key] = (acc[key] || 0) + parseFloat(item.amount || 0);
    return acc;
  }, {});

  // Chronological Activity
  const combinedActivity = [
    ...expenses.map((e) => ({ ...e, type: 'EXPENSE', displayTitle: e.title, displayCat: e.category })),
    ...incomes.map((i) => {
      const src = i.source || i.income_type || 'Pocket Money';
      return { ...i, type: 'INCOME', displayTitle: src, displayCat: src };
    }),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Chart Data
  const activeDataset = chartView === 'EXPENSE' ? expenseByCategory : incomeBySource;
  const activeTotal = chartView === 'EXPENSE' ? totalExpense : totalIncome;

  const chartData = Object.keys(activeDataset).map((key) => {
    const amount = activeDataset[key];
    const percent = activeTotal > 0 ? (amount / activeTotal) * 100 : 0;
    return {
      name: key,
      amount,
      percent,
      color: CATEGORY_COLORS[key] || '#94a3b8',
    };
  });

  let cumulative = 0;
  const slices = chartData.map((slice) => {
    const offset = cumulative;
    cumulative += slice.percent;
    return { ...slice, offset };
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1140px', margin: '0 auto' }}>

        {/* HEADER */}
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
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>BudgetBuddy</h1>
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
              padding: '8px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </header>

        {/* METRICS CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: '5px solid #2563eb' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Remaining Amount</span>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: remainingBalance >= 0 ? '#0f172a' : '#ef4444', marginTop: '6px' }}>
              ₹{remainingBalance.toLocaleString()}
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Total Income − Total Expenses</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: '5px solid #10b981' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Total Income</span>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginTop: '6px' }}>
              + ₹{totalIncome.toLocaleString()}
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Pocket Money, Scholarship, Freelance</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: '5px solid #ef4444' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Total Expenses</span>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', marginTop: '6px' }}>
              - ₹{totalExpense.toLocaleString()}
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Across 6 Approved Categories</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: '5px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Monthly Budget ({currentMonth}/{currentYear})</span>
              <button
                onClick={() => setShowBudgetModal(true)}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ⚙️ Set Allocations
              </button>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', marginTop: '6px' }}>
              {monthlyBudgetLimit > 0 ? `₹${monthlyBudgetLimit.toLocaleString()}` : 'Not Configured'}
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Stored in Django Backend</span>
          </div>

        </div>

        {/* BUDGET UTILIZATION BARS */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px 24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            <span>Monthly Budget Used: {budgetSpentPercent}%</span>
            <span>₹{totalExpense.toLocaleString()} / ₹{monthlyBudgetLimit.toLocaleString()}</span>
          </div>
          <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden', marginBottom: '18px' }}>
            <div style={{
              width: `${budgetSpentPercent}%`,
              height: '100%',
              backgroundColor: budgetSpentPercent > 90 ? '#ef4444' : budgetSpentPercent > 70 ? '#f59e0b' : '#10b981',
              transition: 'width 0.4s ease'
            }} />
          </div>

          {currentBudget?.category_allocations?.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Category-wise Allocation Breakdown
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {currentBudget.category_allocations.map((alloc) => {
                  const spent = expenseByCategory[alloc.category] || 0;
                  const allocated = parseFloat(alloc.allocated_amount);
                  const catPercent = Math.min(Math.round((spent / allocated) * 100), 100);
                  const isOver = spent > allocated;

                  return (
                    <div key={alloc.category} style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                        <span>{alloc.category}</span>
                        <span style={{ color: isOver ? '#ef4444' : '#334155' }}>
                          ₹{spent.toLocaleString()} / ₹{allocated.toLocaleString()} {isOver && '(Exceeded!)'}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${catPercent}%`,
                          height: '100%',
                          backgroundColor: isOver ? '#ef4444' : CATEGORY_COLORS[alloc.category] || '#2563eb'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* PIE / DONUT BREAKDOWN */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
              📊 {chartView === 'EXPENSE' ? 'Expense Categorization (6 Categories)' : 'Income Sources (3 Sources)'}
            </h3>

            <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setChartView('EXPENSE')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: chartView === 'EXPENSE' ? '#ef4444' : 'transparent',
                  color: chartView === 'EXPENSE' ? '#ffffff' : '#64748b',
                }}
              >
                📉 Expenses
              </button>
              <button
                type="button"
                onClick={() => setChartView('INCOME')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: chartView === 'INCOME' ? '#10b981' : 'transparent',
                  color: chartView === 'INCOME' ? '#ffffff' : '#64748b',
                }}
              >
                📈 Income
              </button>
            </div>
          </div>

          {activeTotal === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: '14px' }}>
              No {chartView.toLowerCase()} records found. Record one below to view the breakdown!
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-around', gap: '30px' }}>
              <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#f1f5f9" strokeWidth="3.8" />
                  {slices.map((slice) => (
                    <circle
                      key={slice.name}
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="3.8"
                      strokeDasharray={`${slice.percent} ${100 - slice.percent}`}
                      strokeDashoffset={-slice.offset}
                    />
                  ))}
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                    {chartView === 'EXPENSE' ? 'Spent' : 'Earned'}
                  </span>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: chartView === 'EXPENSE' ? '#ef4444' : '#10b981' }}>
                    ₹{activeTotal.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '240px' }}>
                {slices.map((slice) => (
                  <div key={slice.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: slice.color, display: 'inline-block' }} />
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>{slice.name}</span>
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

        {/* INPUT FORM & CHRONOLOGICAL ACTIVITY */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* CREATE/EDIT FORM */}
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a' }}>
              {editingItem ? `✏️ Edit ${formType}` : `➕ Record ${formType}`}
            </h3>

            {!editingItem && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setFormType('EXPENSE')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: formType === 'EXPENSE' ? '#ef4444' : '#f8fafc',
                    color: formType === 'EXPENSE' ? '#ffffff' : '#475569',
                  }}
                >
                  Record Expense
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('INCOME')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: formType === 'INCOME' ? '#10b981' : '#f8fafc',
                    color: formType === 'INCOME' ? '#ffffff' : '#475569',
                  }}
                >
                  Record Income
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {formType === 'EXPENSE' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Title / Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Campus Cafeteria, Metro Pass"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Income Source (Task 1)</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  >
                    {INCOME_SOURCES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g., 500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                {formType === 'EXPENSE' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Category (Strict 6)</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    >
                      {EXPENSE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Details / Note</label>
                    <input
                      type="text"
                      placeholder="e.g., May Allowance"
                      value={formData.details}
                      onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    backgroundColor: editingItem ? '#f59e0b' : formType === 'EXPENSE' ? '#ef4444' : '#10b981',
                    color: '#ffffff',
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {editingItem ? 'Update Record' : `Save ${formType}`}
                </button>

                {editingItem && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setFormData({
                        title: '',
                        amount: '',
                        category: 'Food',
                        source: 'Pocket Money',
                        date: new Date().toISOString().split('T')[0],
                        details: '',
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

          {/* RECENT ACTIVITY */}
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a' }}>
              📜 Recent Financial Activity
            </h3>

            {loading ? (
              <p style={{ color: '#64748b', textAlign: 'center', margin: '40px 0' }}>Loading activity...</p>
            ) : combinedActivity.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', margin: '40px 0' }}>No transactions recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                {combinedActivity.map((t) => {
                  const isInc = t.type === 'INCOME';
                  return (
                    <div
                      key={`${t.type}-${t.id}`}
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
                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>
                          {t.displayTitle}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          <span style={{
                            display: 'inline-block',
                            backgroundColor: isInc ? '#dcfce7' : '#fee2e2',
                            color: isInc ? '#166534' : '#991b1b',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            marginRight: '8px',
                            fontWeight: '600'
                          }}>
                            {t.displayCat}
                          </span>
                          {t.date}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          fontWeight: 'bold',
                          fontSize: '16px',
                          color: isInc ? '#10b981' : '#ef4444'
                        }}>
                          {isInc ? '+' : '-'}₹{parseFloat(t.amount).toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleEdit(t, t.type)}
                          title="Edit"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px' }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.type)}
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

        {/* MODAL */}
        {showBudgetModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                  🎯 Set Monthly Category Budget ({currentMonth}/{currentYear})
                </h3>
                <button
                  onClick={() => setShowBudgetModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveBudget} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                    Total Monthly Budget (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g., 15000"
                    value={budgetForm.total_amount}
                    onChange={(e) => setBudgetForm({ ...budgetForm, total_amount: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>
                    Category-wise Allocations:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <span style={{ fontSize: '14px', color: '#475569', fontWeight: '500', width: '130px' }}>{cat}:</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="₹ Allocated"
                          value={budgetForm.allocations[cat] || ''}
                          onChange={(e) => setBudgetForm({
                            ...budgetForm,
                            allocations: { ...budgetForm.allocations, [cat]: e.target.value }
                          })}
                          style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      padding: '12px',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    Save to Backend
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBudgetModal(false)}
                    style={{
                      backgroundColor: '#94a3b8',
                      color: '#ffffff',
                      padding: '12px 18px',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Dashboard;
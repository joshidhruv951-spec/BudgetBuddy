import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './Dashboard.css';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [transactionType, setTransactionType] = useState('EXPENSE');
  const [budgetLimit, setBudgetLimit] = useState(25000);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('transactions/');
      setTransactions(res.data);
    } catch (err) {
      console.error('Transactions fetch karne mein error:', err);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || !category) return;

    try {
      const newTx = {
        amount: parseFloat(amount),
        category,
        description,
        transaction_type: transactionType,
        date: new Date().toISOString().split('T')[0],
      };
      await api.post('transactions/', newTx);
      setAmount('');
      setCategory('');
      setDescription('');
      fetchTransactions();
    } catch (err) {
      console.error('Transaction add nahi ho paya:', err);
    }
  };

  const totalIncome = transactions
    .filter((t) => t.transaction_type === 'INCOME')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.transaction_type === 'EXPENSE')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const netBalance = totalIncome - totalExpense;
  const budgetSpentPercentage = Math.min((totalExpense / budgetLimit) * 100, 100);

  return (
    <div className="dashboard-container">
      <h2>BudgetBuddy Dashboard</h2>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="card income">
          <h3>Total Income</h3>
          <p>₹{totalIncome.toLocaleString()}</p>
        </div>
        <div className="card expense">
          <h3>Total Expense</h3>
          <p>₹{totalExpense.toLocaleString()}</p>
        </div>
        <div className="card balance">
          <h3>Net Balance</h3>
          <p>₹{netBalance.toLocaleString()}</p>
        </div>
      </div>

      {/* Budget Limit Progress Bar */}
      <div className="budget-box">
        <div className="budget-header">
          <span>Monthly Budget Limit</span>
          <span>₹{totalExpense.toLocaleString()} / ₹{budgetLimit.toLocaleString()}</span>
        </div>
        <div className="progress-bar-bg">
          <div
            className={`progress-bar-fill ${budgetSpentPercentage >= 90 ? 'danger' : ''}`}
            style={{ width: `${budgetSpentPercentage}%` }}
          ></div>
        </div>
        <small>{budgetSpentPercentage.toFixed(1)}% budget matches your current spending.</small>
      </div>

      {/* Add Transaction Form */}
      <div className="form-box">
        <h3>Add New Transaction</h3>
        <form onSubmit={handleAddTransaction}>
          <div className="type-toggle">
            <button
              type="button"
              className={transactionType === 'EXPENSE' ? 'active expense-btn' : ''}
              onClick={() => setTransactionType('EXPENSE')}
            >
              Expense (-)
            </button>
            <button
              type="button"
              className={transactionType === 'INCOME' ? 'active income-btn' : ''}
              onClick={() => setTransactionType('INCOME')}
            >
              Income (+)
            </button>
          </div>

          <input
            type="number"
            placeholder="Amount (e.g. 500)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Category (e.g. Food, Salary, Rent)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button type="submit" className="submit-btn">
            Save {transactionType === 'EXPENSE' ? 'Expense' : 'Income'}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="history-box">
        <h3>Recent Transactions</h3>
        {transactions.length === 0 ? (
          <p className="no-data">Koi transaction record nahi hai.</p>
        ) : (
          <ul>
            {transactions.map((t) => (
              <li key={t.id} className={t.transaction_type.toLowerCase()}>
                <div>
                  <strong>{t.category}</strong>
                  {t.description && <small> - {t.description}</small>}
                </div>
                <span className="amount">
                  {t.transaction_type === 'INCOME' ? '+' : '-'}₹{Number(t.amount).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
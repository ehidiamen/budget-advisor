"use client";

import { useState } from "react";

export default function BudgetForm({ onSubmit, onCancel }) {
  const [income, setIncome] = useState("");
  const [concerns, setConcerns] = useState("");
  const [expenses, setExpenses] = useState([{ category: "", amount: "" }]);

  // Add a new empty expense field
  const addExpense = () => {
    setExpenses([...expenses, { category: "", amount: "" }]);
  };

  // Update an expense field
  const handleExpenseChange = (index, field, value) => {
    const updatedExpenses = expenses.map((expense, i) =>
      i === index ? { ...expense, [field]: value } : expense
    );
    setExpenses(updatedExpenses);
  };

  // Remove an expense field
  const removeExpense = (index) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const budgetData = {
      income,
      expenses: expenses.filter(exp => exp.category && exp.amount),
      concerns,
    };
    onSubmit(budgetData); // Send data to parent component
  };

  return (
    <div className="p-6 bg-white rounded-md shadow-md w-full max-w-lg">
      <h2 className="text-xl font-bold mb-4">📋 Enter Your Budget Details</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Income Input */}
        <div>
          <label className="block text-gray-700">💰 Monthly Income</label>
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Enter your monthly income"
            required
          />
        </div>

        {/* Expenses Input (Dynamic) */}
        <div>
          <label className="block text-gray-700">💸 Expenses</label>
          {expenses.map((expense, index) => (
            <div key={index} className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={expense.category}
                onChange={(e) => handleExpenseChange(index, "category", e.target.value)}
                className="w-1/2 p-2 border rounded-md"
                placeholder="Expense name (e.g., Rent)"
                required
              />
              <input
                type="number"
                value={expense.amount}
                onChange={(e) => handleExpenseChange(index, "amount", e.target.value)}
                className="w-1/3 p-2 border rounded-md"
                placeholder="Amount"
                required
              />
              <button
                type="button"
                onClick={() => removeExpense(index)}
                className="text-red-500 hover:text-red-700"
              >
                ❌
              </button>
            </div>
          ))}
          <button type="button" onClick={addExpense} className="text-blue-500 mt-2">
            ➕ Add Expense
          </button>
        </div>

        {/* Financial Concerns Input */}
        <div>
          <label className="block text-gray-700">🔍 Financial Concerns</label>
          <textarea
            value={concerns}
            onChange={(e) => setConcerns(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Any financial concerns or goals?"
            rows="3"
          />
        </div>

        {/* Submit & Cancel Buttons */}
        <div className="flex justify-between">
          <button type="button" onClick={onCancel} className="bg-gray-500 text-white px-4 py-2 rounded-md">
            Cancel
          </button>
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-md">
            ✅ Submit Budget
          </button>
        </div>
      </form>
    </div>
  );
}

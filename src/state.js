import { db } from './firebase.js';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

// ============================================================
// STATE MANAGEMENT & DATA LAYER (FIRESTORE)
// ============================================================

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];
export const EXPENSE_CATEGORIES = ['Food', 'Rent', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Other'];

export const CATEGORY_ICONS = {
  'Salary':        'briefcase',
  'Freelance':     'laptop',
  'Investment':    'trending-up',
  'Gift':          'gift',
  'Food':          'utensils',
  'Rent':          'home',
  'Transport':     'car',
  'Entertainment': 'film',
  'Shopping':      'shopping-bag',
  'Health':        'pill',
  'Other':         'more-horizontal'
};

// Internal State Cache
let currentUserUid = null;
let transactions = [];
let budgetGoal = 0;
let categoryBudgets = {}; 
let savingsGoals = [];

// ============================
// INITIALIZATION & RESET
// ============================

export async function initUserState(uid) {
  currentUserUid = uid;
  
  if (!db.app.options.apiKey || db.app.options.apiKey === "YOUR_API_KEY") {
    // If Firebase isn't configured, fallback to localStorage but partitioned by UID
    console.warn("Using local storage fallback for user data");
    loadFallbackData(uid);
    return;
  }

  try {
    // Fetch User Profile (Budget & Category Budgets)
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      budgetGoal = data.budgetGoal || 0;
      categoryBudgets = data.categoryBudgets || {};
    } else {
      budgetGoal = 0;
      categoryBudgets = {};
      // Initialize empty doc
      await setDoc(userDocRef, { budgetGoal: 0, categoryBudgets: {} });
    }

    // Fetch Transactions
    const txRef = collection(db, `users/${uid}/transactions`);
    const txSnap = await getDocs(txRef);
    transactions = [];
    txSnap.forEach(doc => {
      transactions.push({ id: doc.id, ...doc.data() });
    });

    // Fetch Savings Goals
    const sgRef = collection(db, `users/${uid}/savingsGoals`);
    const sgSnap = await getDocs(sgRef);
    savingsGoals = [];
    sgSnap.forEach(doc => {
      savingsGoals.push({ id: doc.id, ...doc.data() });
    });

  } catch (e) {
    console.error("Error fetching user data from Firestore:", e);
    alert("Could not load your data. Please check your network connection.");
  }
}

export function resetState() {
  currentUserUid = null;
  transactions = [];
  budgetGoal = 0;
  categoryBudgets = {};
  savingsGoals = [];
}

// Fallback logic for mock users when Firebase is not setup
function loadFallbackData(uid) {
  transactions = JSON.parse(localStorage.getItem(`fintrack-data-tx-${uid}`)) || [];
  budgetGoal = parseFloat(localStorage.getItem(`fintrack-data-budget-${uid}`)) || 0;
  categoryBudgets = JSON.parse(localStorage.getItem(`fintrack-data-cat-budget-${uid}`)) || {};
  savingsGoals = JSON.parse(localStorage.getItem(`fintrack-data-sg-${uid}`)) || [];
}

async function persistFallbackData() {
  if (!currentUserUid) return;
  localStorage.setItem(`fintrack-data-tx-${currentUserUid}`, JSON.stringify(transactions));
  localStorage.setItem(`fintrack-data-budget-${currentUserUid}`, budgetGoal.toString());
  localStorage.setItem(`fintrack-data-cat-budget-${currentUserUid}`, JSON.stringify(categoryBudgets));
  localStorage.setItem(`fintrack-data-sg-${currentUserUid}`, JSON.stringify(savingsGoals));
}

// ============================
// CRUD TRANSACTIONS
// ============================

export function getTransactions() {
  return [...transactions];
}

export async function addTransaction(description, amount, type, date, category) {
  const transaction = {
    description,
    amount: parseFloat(amount) || 0,
    type,
    date,
    category
  };

  if (!currentUserUid) return null;

  try {
    if (!db.app.options.apiKey || db.app.options.apiKey === "YOUR_API_KEY") {
      transaction.id = Date.now().toString();
      transactions.push(transaction);
      persistFallbackData();
      return transaction;
    }

    const txRef = doc(collection(db, `users/${currentUserUid}/transactions`));
    transaction.id = txRef.id; // Store ID for local cache
    
    // Optimistic update
    transactions.push(transaction);
    
    // Firebase write
    await setDoc(txRef, transaction);
    return transaction;
  } catch (e) {
    console.error("Error adding transaction:", e);
  }
}

export async function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  
  if (!currentUserUid) return;

  if (!db.app.options.apiKey || db.app.options.apiKey === "YOUR_API_KEY") {
    persistFallbackData();
    return;
  }

  try {
    await deleteDoc(doc(db, `users/${currentUserUid}/transactions`, id));
  } catch (e) {
    console.error("Error deleting transaction:", e);
  }
}

export async function updateTransaction(id, updatedFields) {
  let updatedTx = null;
  transactions = transactions.map(t => {
    if (t.id === id) {
      updatedTx = {
        ...t,
        ...updatedFields,
        amount: updatedFields.amount !== undefined ? parseFloat(updatedFields.amount) || 0 : t.amount
      };
      return updatedTx;
    }
    return t;
  });

  if (!currentUserUid || !updatedTx) return;

  if (!db.app.options.apiKey || db.app.options.apiKey === "YOUR_API_KEY") {
    persistFallbackData();
    return;
  }

  try {
    await setDoc(doc(db, `users/${currentUserUid}/transactions`, id), updatedTx);
  } catch (e) {
    console.error("Error updating transaction:", e);
  }
}

// ============================
// BUDGET LAYER
// ============================

export function getBudgetGoal() {
  return budgetGoal;
}

export async function setBudgetGoal(val) {
  budgetGoal = parseFloat(val) || 0;
  
  if (!currentUserUid) return;

  if (!db.app.options.apiKey || db.app.options.apiKey === "YOUR_API_KEY") {
    persistFallbackData();
    return;
  }

  try {
    await setDoc(doc(db, 'users', currentUserUid), { budgetGoal }, { merge: true });
  } catch (e) {
    console.error("Error saving budget goal:", e);
  }
}

// ============================
// CATEGORY BUDGETS LAYER
// ============================

export function getCategoryBudgets() {
  return { ...categoryBudgets };
}

export async function setCategoryBudget(category, amount) {
  const parsedAmount = parseFloat(amount) || 0;
  if (parsedAmount > 0) {
    categoryBudgets[category] = parsedAmount;
  } else {
    delete categoryBudgets[category];
  }
  
  if (!currentUserUid) return;

  if (!db.app.options.apiKey || db.app.options.apiKey === "YOUR_API_KEY") {
    persistFallbackData();
    return;
  }

  try {
    await setDoc(doc(db, 'users', currentUserUid), { categoryBudgets }, { merge: true });
  } catch (e) {
    console.error("Error saving category budgets:", e);
  }
}

export function getCategorySpentThisMonth(category) {
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return transactions
    .filter(t => t.type === 'expense' && t.category === category && t.date.startsWith(currentYearMonth))
    .reduce((sum, t) => sum + t.amount, 0);
}

// ============================
// SAVINGS GOALS LAYER
// ============================

export function getSavingsGoals() {
  return [...savingsGoals];
}

export async function addSavingsGoal(name, target, targetDate, emoji = '🎯') {
  const newGoal = {
    name,
    target: parseFloat(target) || 0,
    current: 0,
    targetDate,
    emoji: emoji || '🎯'
  };

  if (!currentUserUid) return null;

  try {
    if (!db.app.options.apiKey || db.app.options.apiKey === "YOUR_API_KEY") {
      newGoal.id = Date.now().toString();
      savingsGoals.push(newGoal);
      persistFallbackData();
      return newGoal;
    }

    const sgRef = doc(collection(db, `users/${currentUserUid}/savingsGoals`));
    newGoal.id = sgRef.id;
    
    savingsGoals.push(newGoal);
    await setDoc(sgRef, newGoal);
    return newGoal;
  } catch (e) {
    console.error("Error adding savings goal:", e);
  }
}

export async function deleteSavingsGoal(id) {
  savingsGoals = savingsGoals.filter(g => g.id !== id);
  
  if (!currentUserUid) return;

  if (!db.app.options.apiKey || db.app.options.apiKey === "YOUR_API_KEY") {
    persistFallbackData();
    return;
  }

  try {
    await deleteDoc(doc(db, `users/${currentUserUid}/savingsGoals`, id));
  } catch (e) {
    console.error("Error deleting savings goal:", e);
  }
}

export async function adjustSavingsGoalBalance(id, amount) {
  const adjustVal = parseFloat(amount) || 0;
  
  const { totalBalance } = recalculateTotals();
  const totalAllocated = getTotalSavingsAllocated();
  const currentGoal = savingsGoals.find(g => g.id === id);
  
  if (!currentGoal) return { success: false, reason: 'Goal not found' };

  if (adjustVal > 0) {
    const available = totalBalance - totalAllocated;
    if (adjustVal > available) {
      return { success: false, reason: 'Insufficient available balance' };
    }
  } else if (adjustVal < 0) {
    if (Math.abs(adjustVal) > currentGoal.current) {
      return { success: false, reason: 'Cannot withdraw more than goal balance' };
    }
  }

  let updatedGoal = null;
  savingsGoals = savingsGoals.map(g => {
    if (g.id === id) {
      const nextVal = Math.max(0, Math.min(g.current + adjustVal, g.target));
      updatedGoal = { ...g, current: parseFloat(nextVal.toFixed(2)) };
      return updatedGoal;
    }
    return g;
  });

  if (!currentUserUid || !updatedGoal) return { success: false };

  if (!db.app.options.apiKey || db.app.options.apiKey === "YOUR_API_KEY") {
    persistFallbackData();
    return { success: true };
  }

  try {
    await setDoc(doc(db, `users/${currentUserUid}/savingsGoals`, id), updatedGoal);
    return { success: true };
  } catch (e) {
    console.error("Error updating savings goal balance:", e);
    return { success: false, reason: 'Network error' };
  }
}

export function getTotalSavingsAllocated() {
  return savingsGoals.reduce((sum, g) => sum + g.current, 0);
}

// ============================
// CALCULATIONS & METRICS
// ============================

export function recalculateTotals() {
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
    }
  });

  const totalBalance = totalIncome - totalExpense;
  const totalSavings = getTotalSavingsAllocated();
  const availableBalance = totalBalance - totalSavings;

  return {
    totalIncome,
    totalExpense,
    totalBalance,
    totalSavings,
    availableBalance
  };
}

export function getStats() {
  const { totalIncome, totalExpense } = recalculateTotals();
  const count = transactions.length;
  let savingsRate = 0;
  let avgTx = 0;

  if (totalIncome > 0) {
    savingsRate = ((totalIncome - totalExpense) / totalIncome * 100);
  }

  if (count > 0) {
    avgTx = transactions.reduce((sum, t) => sum + t.amount, 0) / count;
  }

  return {
    count,
    savingsRate,
    avgTx
  };
}

import { 
  getTransactions, 
  getBudgetGoal, 
  setBudgetGoal, 
  addTransaction, 
  deleteTransaction, 
  updateTransaction,
  getCategoryBudgets,
  setCategoryBudget,
  getCategorySpentThisMonth,
  getSavingsGoals,
  addSavingsGoal,
  deleteSavingsGoal,
  adjustSavingsGoalBalance,
  recalculateTotals, 
  getStats, 
  INCOME_CATEGORIES, 
  EXPENSE_CATEGORIES, 
  CATEGORY_ICONS 
} from './state.js';
import { updateCharts } from './charts.js';
import { exportToCSV, parseCSV } from './csv.js';
import { showToast } from './toast.js';

// ============================
// DOM ELEMENTS & GLOBAL STATE
// ============================

let navButtons;
let sections;
let transactionForm;
let descriptionInput;
let amountInput;
let typeSelect;
let dateInput;
let categorySelect;
let balanceDisplay;
let availableDisplay;
let incomeDisplay;
let expenseDisplay;
let transactionList;
let searchInput;
let exportBtn;
let budgetGoalInput;
let setBudgetBtn;
let budgetProgress;
let budgetSpentLabel;
let budgetGoalLabel;
let statTotalTx;
let statSavingsRate;
let statAvgTx;

// Theme Toggle
let themeToggleBtn;
let themeToggleIcon;
let themeToggleText;

// Edit Modal
let editModal;
let closeEditModalBtn;
let editForm;
let editTxIdInput;
let editDescriptionInput;
let editAmountInput;
let editTypeSelect;
let editDateInput;
let editCategorySelect;

// Dashboard Widgets
let categoryBudgetsList;
let manageCategoryBudgetsBtn;
let savingsGoalsList;
let addSavingsGoalBtn;

// Category Budgets Modal
let categoryBudgetsModal;
let closeCategoryBudgetsModalBtn;
let categoryBudgetForm;
let budgetCategorySelect;
let budgetCategoryAmount;
let modalCategoryBudgetsList;

// Savings Goal Modal
let savingsGoalModal;
let closeSavingsGoalModalBtn;
let savingsGoalForm;
let goalNameInput;
let goalTargetInput;
let goalEmojiSelect;
let goalDateInput;

// Adjust Goal Modal
let adjustGoalModal;
let closeAdjustGoalModalBtn;
let adjustGoalForm;
let adjustGoalIdInput;
let adjustActionTypeInput;
let adjustGoalTitle;
let adjustAmountLabel;
let adjustAmountInput;
let adjustHelperText;
let adjustGoalSubmitBtn;

// CSV Import Elements
let importCsvBtn;
let csvFileInput;
let importCsvModal;
let closeImportModalBtn;
let importStepMapping;
let importStepPreview;
let mapDescription;
let mapAmount;
let mapDate;
let mapType;
let mapCategory;
let btnSubmitMapping;
let selectAllImports;
let importPreviewTbody;
let importSummaryCount;
let btnConfirmImport;

// Analytics Date Filter
let timeframeSelect;

// CSV Import Session State
let parsedRows = [];
let transactionsToImport = [];

// ============================
// INITIALIZATION
// ============================

function getLocalDateString(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function initUI() {
  cacheElements();
  initializeTheme();
  setupNavigation();
  setupCategorySelects();
  setupEventListeners();
  
  // Set default dates
  if (dateInput) {
    dateInput.value = getLocalDateString();
  }
  if (goalDateInput) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    goalDateInput.value = getLocalDateString(nextMonth);
  }
}

export function triggerFullRender() {
  updateUI();
  renderTransactions();
  renderCategoryBudgets();
  renderSavingsGoals();
  refreshAnalytics();
  if (window.lucide) window.lucide.createIcons();
}

function cacheElements() {
  navButtons       = document.querySelectorAll('.nav-btn');
  sections         = document.querySelectorAll('.page-section');

  transactionForm  = document.getElementById('transaction-form');
  descriptionInput = document.getElementById('description');
  amountInput      = document.getElementById('amount');
  typeSelect       = document.getElementById('type');
  dateInput        = document.getElementById('date');
  categorySelect   = document.getElementById('category');

  balanceDisplay   = document.getElementById('balance');
  availableDisplay = document.getElementById('available-balance');
  incomeDisplay    = document.getElementById('income');
  expenseDisplay   = document.getElementById('expense');

  transactionList  = document.getElementById('transaction-list');
  searchInput      = document.getElementById('search-input');
  exportBtn        = document.getElementById('export-csv-btn');

  budgetGoalInput  = document.getElementById('budget-goal-input');
  setBudgetBtn     = document.getElementById('set-budget-btn');
  budgetProgress   = document.getElementById('budget-progress');
  budgetSpentLabel = document.getElementById('budget-spent-label');
  budgetGoalLabel  = document.getElementById('budget-goal-label');

  statTotalTx      = document.getElementById('stat-total-tx');
  statSavingsRate  = document.getElementById('stat-savings-rate');
  statAvgTx        = document.getElementById('stat-avg-tx');

  // Theme elements
  themeToggleBtn   = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleIcon = themeToggleBtn.querySelector('.toggle-icon');
    themeToggleText = themeToggleBtn.querySelector('.toggle-text');
  }

  // Edit Modal elements
  editModal            = document.getElementById('edit-modal');
  closeEditModalBtn    = document.getElementById('close-edit-modal');
  editForm             = document.getElementById('edit-transaction-form');
  editTxIdInput        = document.getElementById('edit-tx-id');
  editDescriptionInput = document.getElementById('edit-description');
  editAmountInput      = document.getElementById('edit-amount');
  editTypeSelect       = document.getElementById('edit-type');
  editDateInput        = document.getElementById('edit-date');
  editCategorySelect   = document.getElementById('edit-category');

  // Dashboard widgets lists
  categoryBudgetsList      = document.getElementById('category-budgets-list');
  manageCategoryBudgetsBtn = document.getElementById('manage-category-budgets-btn');
  savingsGoalsList         = document.getElementById('savings-goals-list');
  addSavingsGoalBtn        = document.getElementById('add-savings-goal-btn');

  // Category Budgets Modal elements
  categoryBudgetsModal        = document.getElementById('category-budgets-modal');
  closeCategoryBudgetsModalBtn = document.getElementById('close-category-budgets-modal');
  categoryBudgetForm          = document.getElementById('category-budget-form');
  budgetCategorySelect        = document.getElementById('budget-category-select');
  budgetCategoryAmount        = document.getElementById('budget-category-amount');
  modalCategoryBudgetsList    = document.getElementById('modal-category-budgets-list');

  // Savings Goal Modal elements
  savingsGoalModal        = document.getElementById('savings-goal-modal');
  closeSavingsGoalModalBtn = document.getElementById('close-savings-goal-modal');
  savingsGoalForm          = document.getElementById('savings-goal-form');
  goalNameInput            = document.getElementById('goal-name');
  goalTargetInput          = document.getElementById('goal-target');
  goalEmojiSelect          = document.getElementById('goal-emoji');
  goalDateInput            = document.getElementById('goal-date');

  // Adjust Goal Modal elements
  adjustGoalModal         = document.getElementById('adjust-goal-modal');
  closeAdjustGoalModalBtn  = document.getElementById('close-adjust-goal-modal');
  adjustGoalForm           = document.getElementById('adjust-goal-form');
  adjustGoalIdInput        = document.getElementById('adjust-goal-id');
  adjustActionTypeInput    = document.getElementById('adjust-action-type');
  adjustGoalTitle          = document.getElementById('adjust-goal-title');
  adjustAmountLabel        = document.getElementById('adjust-amount-label');
  adjustAmountInput        = document.getElementById('adjust-amount');
  adjustHelperText         = document.getElementById('adjust-helper-text');
  adjustGoalSubmitBtn      = document.getElementById('adjust-goal-submit-btn');

  // CSV Import elements
  importCsvBtn       = document.getElementById('import-csv-btn');
  csvFileInput       = document.getElementById('csv-file-input');
  importCsvModal     = document.getElementById('import-csv-modal');
  closeImportModalBtn = document.getElementById('close-import-modal');
  importStepMapping  = document.getElementById('import-step-mapping');
  importStepPreview  = document.getElementById('import-step-preview');
  mapDescription     = document.getElementById('map-description');
  mapAmount          = document.getElementById('map-amount');
  mapDate            = document.getElementById('map-date');
  mapType            = document.getElementById('map-type');
  mapCategory        = document.getElementById('map-category');
  btnSubmitMapping   = document.getElementById('btn-submit-mapping');
  selectAllImports   = document.getElementById('select-all-imports');
  importPreviewTbody = document.getElementById('import-preview-tbody');
  importSummaryCount = document.getElementById('import-summary-count');
  btnConfirmImport   = document.getElementById('btn-confirm-import');

  // Analytics Date filter
  timeframeSelect = document.getElementById('analytics-timeframe-select');

  // Set budget input default value
  const savedBudget = getBudgetGoal();
  if (savedBudget > 0 && budgetGoalInput) {
    budgetGoalInput.value = savedBudget;
  }
}

// ============================
// THEME MANAGEMENT
// ============================

function initializeTheme() {
  const savedTheme = localStorage.getItem('fintrack-theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    if (themeToggleIcon) themeToggleIcon.textContent = '☀️';
    if (themeToggleText) themeToggleText.textContent = 'Light Mode';
  } else {
    document.body.classList.remove('light-theme');
    if (themeToggleIcon) themeToggleIcon.textContent = '🌙';
    if (themeToggleText) themeToggleText.textContent = 'Dark Mode';
  }
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-theme');
  if (isLight) {
    localStorage.setItem('fintrack-theme', 'light');
    if (themeToggleIcon) themeToggleIcon.innerHTML = '<i data-lucide="sun"></i>';
    if (themeToggleText) themeToggleText.textContent = 'Light Mode';
    showToast('Switched to Light Mode', 'success');
  } else {
    localStorage.setItem('fintrack-theme', 'dark');
    if (themeToggleIcon) themeToggleIcon.innerHTML = '<i data-lucide="moon"></i>';
    if (themeToggleText) themeToggleText.textContent = 'Dark Mode';
    showToast('Switched to Dark Mode', 'success');
  }
  refreshAnalytics();
  if (window.lucide) window.lucide.createIcons();
}

// ============================
// NAVIGATION
// ============================

function setupNavigation() {
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      navButtons.forEach(btn => btn.classList.remove('active'));
      sections.forEach(section => section.classList.remove('active-section'));

      button.classList.add('active');
      const targetSection = document.getElementById(button.dataset.section);
      if (targetSection) {
        targetSection.classList.add('active-section');
      }

      // Refresh charts when Analytics tab opens
      if (button.dataset.section === 'analytics-section') {
        refreshAnalytics();
      }
    });
  });
}

// ============================
// DYNAMIC CATEGORIES FOR FORM DROPDOWNS
// ============================

function setupCategorySelects() {
  if (typeSelect) {
    typeSelect.addEventListener('change', () => {
      updateCategoryOptions(categorySelect, typeSelect.value);
    });
    // Initialize add form
    updateCategoryOptions(categorySelect, typeSelect.value);
  }

  if (editTypeSelect) {
    editTypeSelect.addEventListener('change', () => {
      updateCategoryOptions(editCategorySelect, editTypeSelect.value);
    });
  }

  // Populate budget category select dropdown (only expenses have budgets)
  if (budgetCategorySelect) {
    updateCategoryOptions(budgetCategorySelect, 'expense');
  }
}

function updateCategoryOptions(selectElement, selectedType, selectedValue = null) {
  if (!selectElement) return;

  const isIncome = selectedType === 'income';
  const cats = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  selectElement.innerHTML = '';
  cats.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat; // No icons in select options
    if (selectedValue && cat === selectedValue) {
      option.selected = true;
    }
    selectElement.appendChild(option);
  });
}

// ============================
// FORMAT CURRENCY
// ============================

function formatCurrency(amount) {
  const abs = Math.abs(amount).toFixed(2);
  return amount < 0 ? `-$${abs}` : `$${abs}`;
}

// ============================
// UPDATE SUMMARY CARDS + BUDGET + STATS
// ============================

export function updateUI() {
  const { totalIncome, totalExpense, totalBalance, availableBalance } = recalculateTotals();

  if (balanceDisplay) balanceDisplay.textContent = formatCurrency(totalBalance);
  if (availableDisplay) availableDisplay.textContent = formatCurrency(availableBalance);
  if (incomeDisplay) incomeDisplay.textContent  = formatCurrency(totalIncome);
  if (expenseDisplay) expenseDisplay.textContent = formatCurrency(totalExpense);

  updateBudgetUI(totalExpense);
  updateStats();
}

function updateBudgetUI(totalExpense) {
  if (!budgetSpentLabel) return;
  budgetSpentLabel.textContent = `${formatCurrency(totalExpense)} spent`;

  const budgetGoal = getBudgetGoal();
  if (budgetGoal > 0) {
    if (budgetGoalLabel) budgetGoalLabel.textContent = `Goal: ${formatCurrency(budgetGoal)}`;
    const pct = Math.min((totalExpense / budgetGoal) * 100, 100);
    if (budgetProgress) {
      budgetProgress.style.width = `${pct}%`;

      if (totalExpense > budgetGoal) {
        budgetProgress.classList.add('over-budget');
      } else {
        budgetProgress.classList.remove('over-budget');
      }
    }
  } else {
    if (budgetGoalLabel) budgetGoalLabel.textContent = 'Goal: Not set';
    if (budgetProgress) {
      budgetProgress.style.width = '0%';
      budgetProgress.classList.remove('over-budget');
    }
  }
}

function updateStats() {
  const { count, savingsRate, avgTx } = getStats();

  if (statTotalTx) statTotalTx.textContent = count;

  if (statSavingsRate) {
    if (count > 0 && savingsRate !== undefined && !isNaN(savingsRate)) {
      statSavingsRate.textContent = `${savingsRate.toFixed(1)}%`;
    } else {
      statSavingsRate.textContent = '—';
    }
  }

  if (statAvgTx) {
    statAvgTx.textContent = `$${avgTx.toFixed(0)}`;
  }
}

// ============================
// RENDER TRANSACTIONS LIST
// ============================

export function renderTransactions() {
  if (!transactionList) return;

  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const transactions = getTransactions();

  const filtered = query
    ? transactions.filter(t =>
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      )
    : [...transactions];

  transactionList.innerHTML = '';

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = query
      ? 'No transactions match your search.'
      : 'No transactions yet. Add your first one above!';
    transactionList.appendChild(empty);
    return;
  }

  // Newest first
  [...filtered].reverse().forEach(t => createTransactionRow(t));
  if (window.lucide) window.lucide.createIcons();
}

function createTransactionRow(transaction) {
  const li = document.createElement('li');
  li.className = transaction.type === 'income' ? 'income-item' : 'expense-item';
  li.dataset.id = transaction.id;

  // Icon
  const txIcon = document.createElement('div');
  txIcon.className = 'tx-icon';
  const iconName = CATEGORY_ICONS[transaction.category] ?? 'more-horizontal';
  txIcon.innerHTML = `<i data-lucide="${iconName}" style="width: 20px; height: 20px;"></i>`;

  // Info block
  const txInfo = document.createElement('div');
  txInfo.className = 'tx-info';

  const txDesc = document.createElement('div');
  txDesc.className = 'tx-desc';
  txDesc.textContent = transaction.description;

  const txMeta = document.createElement('div');
  txMeta.className = 'tx-meta';
  if (transaction.date) {
    const d = new Date(transaction.date + 'T00:00:00'); // avoid timezone shift
    txMeta.textContent = d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  txInfo.appendChild(txDesc);
  txInfo.appendChild(txMeta);

  // Category badge
  const txBadge = document.createElement('span');
  txBadge.className = 'tx-badge';
  txBadge.textContent = transaction.category;

  // Amount
  const txAmount = document.createElement('span');
  txAmount.className = 'tx-amount';
  const sign = transaction.type === 'income' ? '+' : '-';
  txAmount.textContent = `${sign}$${transaction.amount.toFixed(2)}`;

  // Actions Container
  const actionsWrap = document.createElement('div');
  actionsWrap.style.display = 'flex';
  actionsWrap.style.gap = '6px';
  actionsWrap.style.alignItems = 'center';

  // Edit button
  const editBtn = document.createElement('button');
  editBtn.className = 'edit-btn';
  editBtn.setAttribute('aria-label', 'Edit transaction');
  editBtn.innerHTML = '<i data-lucide="pencil" style="width: 14px; height: 14px;"></i>';
  editBtn.addEventListener('click', () => {
    openEditModal(transaction);
  });

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.setAttribute('aria-label', 'Delete transaction');
  deleteBtn.innerHTML = '<i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>';
  deleteBtn.addEventListener('click', () => {
    deleteTransaction(transaction.id);
    renderTransactions();
    updateUI();
    refreshAnalytics();
    renderCategoryBudgets(); // Refresh category budget spent
    showToast('Transaction deleted.', 'error');
  });

  actionsWrap.appendChild(editBtn);
  actionsWrap.appendChild(deleteBtn);

  li.appendChild(txIcon);
  li.appendChild(txInfo);
  li.appendChild(txBadge);
  li.appendChild(txAmount);
  li.appendChild(actionsWrap);

  transactionList.appendChild(li);
}

// ============================
// CATEGORY BUDGETS RENDERING
// ============================

export function renderCategoryBudgets() {
  if (!categoryBudgetsList) return;

  const budgets = getCategoryBudgets();
  const activeBudgetedCats = Object.keys(budgets);

  categoryBudgetsList.innerHTML = '';

  if (activeBudgetedCats.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.style.padding = '24px 0';
    empty.textContent = 'No category budgets configured. Click manage to set limits!';
    categoryBudgetsList.appendChild(empty);
    return;
  }

  activeBudgetedCats.forEach(cat => {
    const limit = budgets[cat];
    const spent = getCategorySpentThisMonth(cat);
    const pct = Math.min((spent / limit) * 100, 100);

    const progressItem = document.createElement('div');
    progressItem.className = 'budget-progress-item';

    // Header info
    const infoRow = document.createElement('div');
    infoRow.className = 'budget-progress-info';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'budget-progress-title';
    const iconName = CATEGORY_ICONS[cat] ?? 'more-horizontal';
    titleSpan.innerHTML = `<i data-lucide="${iconName}" style="width: 14px; height: 14px; margin-right: 6px; display: inline-block; vertical-align: text-bottom;"></i>${cat}`;

    const numbersSpan = document.createElement('span');
    numbersSpan.className = 'budget-progress-numbers';
    numbersSpan.textContent = `${formatCurrency(spent)} / ${formatCurrency(limit)}`;

    infoRow.appendChild(titleSpan);
    infoRow.appendChild(numbersSpan);

    // Progress bar
    const barWrap = document.createElement('div');
    barWrap.className = 'progress-bar-wrap thin';

    const barFill = document.createElement('div');
    barFill.className = 'progress-bar-fill';
    barFill.style.width = `${pct}%`;

    // Alert levels
    if (spent >= limit) {
      barFill.classList.add('over-budget');
    } else if (spent >= limit * 0.8) {
      barFill.classList.add('warning');
    }

    barWrap.appendChild(barFill);
    progressItem.appendChild(infoRow);
    progressItem.appendChild(barWrap);

    categoryBudgetsList.appendChild(progressItem);
  });
  if (window.lucide) window.lucide.createIcons();
}

function renderModalCategoryBudgetsList() {
  if (!modalCategoryBudgetsList) return;

  const budgets = getCategoryBudgets();
  const activeBudgetedCats = Object.keys(budgets);

  modalCategoryBudgetsList.innerHTML = '';

  if (activeBudgetedCats.length === 0) {
    const empty = document.createElement('li');
    empty.style.color = 'var(--text-muted)';
    empty.style.justifyContent = 'center';
    empty.style.borderStyle = 'dashed';
    empty.textContent = 'No category budgets set yet.';
    modalCategoryBudgetsList.appendChild(empty);
    return;
  }

  activeBudgetedCats.forEach(cat => {
    const limit = budgets[cat];
    const li = document.createElement('li');

    const span = document.createElement('span');
    const iconName = CATEGORY_ICONS[cat] ?? 'more-horizontal';
    span.innerHTML = `<i data-lucide="${iconName}" style="width: 14px; height: 14px; margin-right: 6px; display: inline-block; vertical-align: text-bottom;"></i><strong>${cat}</strong>: ${formatCurrency(limit)}`;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'delete-btn';
    removeBtn.style.padding = '0';
    removeBtn.style.width = '24px';
    removeBtn.style.height = '24px';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      setCategoryBudget(cat, 0);
      renderModalCategoryBudgetsList();
      renderCategoryBudgets();
      updateUI();
      showToast(`Removed budget for ${cat}.`, 'error');
    });

    li.appendChild(span);
    li.appendChild(delBtn);
    modalCategoryBudgetsList.appendChild(li);
  });
  if (window.lucide) window.lucide.createIcons();
}

// ============================
// SAVINGS GOALS RENDERING
// ============================

export function renderSavingsGoals() {
  if (!savingsGoalsList) return;

  const goals = getSavingsGoals();
  savingsGoalsList.innerHTML = '';

  if (goals.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.style.padding = '24px 0';
    empty.textContent = 'No savings goals set. Time to dream big!';
    savingsGoalsList.appendChild(empty);
    return;
  }

  goals.forEach(goal => {
    const pct = Math.min((goal.current / goal.target) * 100, 100);
    
    // Days remaining calculation
    let daysRemainingText = 'No deadline';
    if (goal.targetDate) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const target = new Date(goal.targetDate + 'T00:00:00');
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        daysRemainingText = 'Deadline passed';
      } else if (diffDays === 0) {
        daysRemainingText = 'Deadline is today!';
      } else {
        daysRemainingText = `${diffDays} days remaining`;
      }
    }

    const li = document.createElement('li');
    li.className = 'savings-goal-item';

    // Goal Details Info
    const infoRow = document.createElement('div');
    infoRow.className = 'goal-info-row';

    const goalEmojiWrap = document.createElement('div');
    goalEmojiWrap.className = 'goal-emoji-wrap';
    // If it's a lucide icon name (like 'target') render it, otherwise just print text
    if (goal.emoji && goal.emoji.length > 2) {
      goalEmojiWrap.innerHTML = `<i data-lucide="${goal.emoji}" style="width: 20px; height: 20px;"></i>`;
    } else {
      goalEmojiWrap.textContent = goal.emoji || '🎯';
    }

    const details = document.createElement('div');
    details.className = 'goal-details';

    const nameText = document.createElement('div');
    nameText.className = 'goal-name-text';
    nameText.textContent = goal.name;

    const deadlineText = document.createElement('div');
    deadlineText.className = 'goal-deadline-text';
    deadlineText.textContent = daysRemainingText;

    details.appendChild(nameText);
    details.appendChild(deadlineText);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'goal-delete-btn';
    deleteBtn.setAttribute('aria-label', 'Delete savings goal');
    deleteBtn.innerHTML = '&times;';
    deleteBtn.addEventListener('click', () => {
      deleteSavingsGoal(goal.id);
      renderSavingsGoals();
      updateUI();
      showToast('Savings goal deleted.', 'error');
    });

    infoRow.appendChild(goalEmojiWrap);
    infoRow.appendChild(details);
    infoRow.appendChild(deleteBtn);

    // Goal Progress Bar
    const progressWrap = document.createElement('div');
    progressWrap.className = 'goal-progress-wrap';

    const progressLabel = document.createElement('div');
    progressLabel.className = 'goal-progress-label';

    const progressPctSpan = document.createElement('span');
    progressPctSpan.textContent = `${pct.toFixed(0)}%`;

    const progressNumsSpan = document.createElement('span');
    progressNumsSpan.textContent = `${formatCurrency(goal.current)} / ${formatCurrency(goal.target)}`;

    progressLabel.appendChild(progressPctSpan);
    progressLabel.appendChild(progressNumsSpan);

    const barWrap = document.createElement('div');
    barWrap.className = 'progress-bar-wrap thin';

    const barFill = document.createElement('div');
    barFill.className = 'progress-bar-fill';
    barFill.style.width = `${pct}%`;
    if (pct >= 100) {
      barFill.style.background = 'linear-gradient(90deg, #8b5cf6, #3b82f6)';
    }

    barWrap.appendChild(barFill);
    progressWrap.appendChild(progressLabel);
    progressWrap.appendChild(barWrap);

    // Goal quick action buttons
    const actionsRow = document.createElement('div');
    actionsRow.className = 'goal-actions-row';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'goal-btn goal-btn-save';
    saveBtn.textContent = '+ Save';
    saveBtn.addEventListener('click', () => {
      openAdjustGoalModal(goal, 'allocate');
    });

    const withdrawBtn = document.createElement('button');
    withdrawBtn.className = 'goal-btn goal-btn-withdraw';
    withdrawBtn.textContent = '- Withdraw';
    if (goal.current <= 0) {
      withdrawBtn.disabled = true;
      withdrawBtn.style.opacity = '0.4';
      withdrawBtn.style.cursor = 'not-allowed';
    }
    withdrawBtn.addEventListener('click', () => {
      openAdjustGoalModal(goal, 'withdraw');
    });

    actionsRow.appendChild(saveBtn);
    actionsRow.appendChild(withdrawBtn);

    li.appendChild(infoRow);
    li.appendChild(progressWrap);
    li.appendChild(actionsRow);

    savingsGoalsList.appendChild(li);
  });
  if (window.lucide) window.lucide.createIcons();
}

// ============================
// MODAL CONTROLS
// ============================

function openEditModal(transaction) {
  if (!editModal) return;

  editTxIdInput.value = transaction.id;
  editDescriptionInput.value = transaction.description;
  editAmountInput.value = transaction.amount;
  editTypeSelect.value = transaction.type;
  editDateInput.value = transaction.date;

  // Populates category select according to type, then selects the current value
  updateCategoryOptions(editCategorySelect, transaction.type, transaction.category);

  editModal.classList.add('active');
}

function closeEditModal() {
  if (editModal) editModal.classList.remove('active');
}

function openCategoryBudgetsModal() {
  if (!categoryBudgetsModal) return;
  renderModalCategoryBudgetsList();
  categoryBudgetsModal.classList.add('active');
}

function closeCategoryBudgetsModal() {
  if (categoryBudgetsModal) categoryBudgetsModal.classList.remove('active');
}

function openSavingsGoalModal() {
  if (!savingsGoalModal) return;
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  goalDateInput.value = getLocalDateString(nextMonth);
  goalNameInput.value = '';
  goalTargetInput.value = '';
  goalEmojiSelect.value = '🎯';
  savingsGoalModal.classList.add('active');
}

function closeSavingsGoalModal() {
  if (savingsGoalModal) savingsGoalModal.classList.remove('active');
}

function openAdjustGoalModal(goal, action) {
  if (!adjustGoalModal) return;

  adjustGoalIdInput.value = goal.id;
  adjustActionTypeInput.value = action;
  adjustAmountInput.value = '';

  const { availableBalance } = recalculateTotals();

  if (action === 'allocate') {
    adjustGoalTitle.textContent = `Allocate to: ${goal.name}`;
    adjustAmountLabel.textContent = `Amount to transfer from Available Cash ($)`;
    adjustHelperText.textContent = `Max available to allocate: ${formatCurrency(availableBalance)}`;
    adjustGoalSubmitBtn.textContent = 'Transfer to Goal';
    adjustGoalSubmitBtn.style.background = 'var(--accent-green)';
  } else {
    adjustGoalTitle.textContent = `Withdraw from: ${goal.name}`;
    adjustAmountLabel.textContent = `Amount to withdraw to Available Cash ($)`;
    adjustHelperText.textContent = `Max available to withdraw: ${formatCurrency(goal.current)}`;
    adjustGoalSubmitBtn.textContent = 'Withdraw to Balance';
    adjustGoalSubmitBtn.style.background = 'var(--accent-blue)';
  }

  adjustGoalModal.classList.add('active');
}

function closeAdjustGoalModal() {
  if (adjustGoalModal) adjustGoalModal.classList.remove('active');
}

function closeImportModal() {
  if (importCsvModal) {
    importCsvModal.classList.remove('active');
    csvFileInput.value = ''; // Reset file input
  }
}

// ============================
// CSV IMPORT WIZARD FLOW
// ============================

function handleCSVFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const text = evt.target.result;
    parsedRows = parseCSV(text);

    if (parsedRows.length <= 1) {
      showToast('CSV file is empty or invalid.', 'error');
      return;
    }

    startImportWizard();
  };
  reader.readAsText(file);
}

function startImportWizard() {
  const headers = parsedRows[0];
  
  // Reset wizards
  importStepMapping.style.display = 'none';
  importStepPreview.style.display = 'none';
  transactionsToImport = [];

  // Try to auto-map columns: Description, Amount, Date
  let descIdx = -1;
  let amtIdx = -1;
  let dateIdx = -1;
  let typeIdx = -1;
  let catIdx = -1;

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase().trim();
    if (/description|desc|details|payee|particulars/i.test(header) && descIdx === -1) {
      descIdx = i;
    } else if (/amount|sum|value|total|deb|cred/i.test(header) && amtIdx === -1) {
      amtIdx = i;
    } else if (/date|time|timestamp/i.test(header) && dateIdx === -1) {
      dateIdx = i;
    } else if (/type|transaction type/i.test(header) && typeIdx === -1) {
      typeIdx = i;
    } else if (/category|group|tag/i.test(header) && catIdx === -1) {
      catIdx = i;
    }
  }

  if (descIdx !== -1 && amtIdx !== -1 && dateIdx !== -1) {
    processParsedTransactions(descIdx, amtIdx, dateIdx, typeIdx, catIdx, '-1');
    showImportPreviewScreen();
  } else {
    showImportMappingScreen(descIdx, amtIdx, dateIdx, typeIdx, catIdx);
  }

  importCsvModal.classList.add('active');
}

function showImportMappingScreen(descIdx, amtIdx, dateIdx, typeIdx, catIdx) {
  importStepMapping.style.display = 'block';
  importStepPreview.style.display = 'none';

  const headers = parsedRows[0];

  const fillSelect = (selectEl, matchedIdx) => {
    selectEl.innerHTML = '';
    headers.forEach((h, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `Col ${idx}: ${h || '(Empty)'}`;
      if (idx === matchedIdx) opt.selected = true;
      selectEl.appendChild(opt);
    });
  };

  fillSelect(mapDescription, descIdx !== -1 ? descIdx : 0);
  fillSelect(mapAmount, amtIdx !== -1 ? amtIdx : 1);
  fillSelect(mapDate, dateIdx !== -1 ? dateIdx : 2);

  const fillSelectOptional = (selectEl, matchedIdx) => {
    selectEl.innerHTML = '';
    
    const defOpt = document.createElement('option');
    defOpt.value = '-1';
    defOpt.textContent = '-- None / Auto Detect --';
    selectEl.appendChild(defOpt);

    headers.forEach((h, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `Col ${idx}: ${h || '(Empty)'}`;
      if (idx === matchedIdx) opt.selected = true;
      selectEl.appendChild(opt);
    });
  };

  fillSelectOptional(mapCategory, catIdx);

  mapType.innerHTML = `
    <option value="-1">-- Auto Detect --</option>
    <option value="fixed-expense">Force: Expense</option>
    <option value="fixed-income">Force: Income</option>
  `;
  headers.forEach((h, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = `Col ${idx}: Type (${h || 'Empty'})`;
    if (idx === typeIdx) opt.selected = true;
    mapType.appendChild(opt);
  });
}

function handleMappingSubmit(e) {
  e.preventDefault();

  const descIdx = parseInt(mapDescription.value);
  const amtIdx  = parseInt(mapAmount.value);
  const dateIdx = parseInt(mapDate.value);
  const typeVal = mapType.value;
  const catIdx  = parseInt(mapCategory.value);

  processParsedTransactions(descIdx, amtIdx, dateIdx, typeVal.includes('fixed') ? -1 : parseInt(typeVal), catIdx, typeVal);
  showImportPreviewScreen();
}

function processParsedTransactions(descIdx, amtIdx, dateIdx, typeIdx, catIdx, typeSetting) {
  transactionsToImport = [];
  const existingTxs = getTransactions();

  for (let i = 1; i < parsedRows.length; i++) {
    const row = parsedRows[i];
    if (row.length <= Math.max(descIdx, amtIdx, dateIdx)) continue;

    const rawDesc = row[descIdx] || '';
    const rawAmt  = row[amtIdx] || '0';
    const rawDate = row[dateIdx] || '';

    if (!rawDesc || !rawAmt) continue;

    let cleanAmtStr = rawAmt.replace(/[$,]/g, '').trim();
    let amount = parseFloat(cleanAmtStr);
    if (isNaN(amount)) continue;

    let type = 'expense';
    if (typeSetting === 'fixed-income') {
      type = 'income';
      amount = Math.abs(amount);
    } else if (typeSetting === 'fixed-expense') {
      type = 'expense';
      amount = Math.abs(amount);
    } else {
      if (typeIdx !== -1 && row[typeIdx]) {
        const tVal = row[typeIdx].toLowerCase().trim();
        if (tVal.startsWith('inc') || tVal.includes('deposit') || tVal.includes('credit')) {
          type = 'income';
        } else {
          type = 'expense';
        }
        amount = Math.abs(amount);
      } else {
        if (amount < 0) {
          type = 'expense';
          amount = Math.abs(amount);
        } else if (amount > 0) {
          type = 'income';
        }
      }
    }

    let date = getLocalDateString();
    if (rawDate) {
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        date = getLocalDateString(parsedDate);
      }
    }

    let category = type === 'income' ? 'Salary' : 'Other';
    if (catIdx !== -1 && row[catIdx]) {
      const rawCat = row[catIdx].trim();
      const matchedCat = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].find(
        c => c.toLowerCase() === rawCat.toLowerCase()
      );
      if (matchedCat) {
        category = matchedCat;
      }
    }

    const isDuplicate = existingTxs.some(
      et => et.date === date && 
            Math.abs(et.amount - amount) < 0.01 && 
            et.type === type &&
            et.description.toLowerCase().trim() === rawDesc.toLowerCase().trim()
    );

    transactionsToImport.push({
      description: rawDesc,
      amount,
      type,
      date,
      category,
      isDuplicate
    });
  }
}

function showImportPreviewScreen() {
  importStepMapping.style.display = 'none';
  importStepPreview.style.display = 'block';

  if (importPreviewTbody) {
    importPreviewTbody.innerHTML = '';
  }

  if (transactionsToImport.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `<td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">No valid transactions found in CSV.</td>`;
    importPreviewTbody.appendChild(emptyRow);
    return;
  }

  transactionsToImport.forEach((tx, idx) => {
    const tr = document.createElement('tr');
    tr.style.background = tx.isDuplicate ? 'rgba(245, 158, 11, 0.03)' : 'transparent';

    const tdCheck = document.createElement('td');
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.className = 'import-row-checkbox';
    chk.dataset.idx = idx;
    chk.checked = !tx.isDuplicate;
    chk.addEventListener('change', updateSelectedImportCount);
    tdCheck.appendChild(chk);

    const tdDate = document.createElement('td');
    tdDate.textContent = tx.date;

    const tdDesc = document.createElement('td');
    tdDesc.textContent = tx.description;
    if (tx.isDuplicate) {
      const dupBadge = document.createElement('span');
      dupBadge.className = 'import-preview-duplicate';
      dupBadge.textContent = '⚠ Potential Duplicate';
      tdDesc.appendChild(dupBadge);
    }

    const tdCat = document.createElement('td');
    tdCat.textContent = tx.category;

    const tdAmt = document.createElement('td');
    tdAmt.style.textAlign = 'right';
    tdAmt.style.fontWeight = '700';
    tdAmt.style.color = tx.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)';
    tdAmt.textContent = `${tx.type === 'income' ? '+' : '-'}$${tx.amount.toFixed(2)}`;

    tr.appendChild(tdCheck);
    tr.appendChild(tdDate);
    tr.appendChild(tdDesc);
    tr.appendChild(tdCat);
    tr.appendChild(tdAmt);

    importPreviewTbody.appendChild(tr);
  });

  if (selectAllImports) {
    selectAllImports.checked = transactionsToImport.some(t => !t.isDuplicate);
  }

  updateSelectedImportCount();
}

function updateSelectedImportCount() {
  const checkedBoxes = importPreviewTbody.querySelectorAll('.import-row-checkbox:checked');
  const count = checkedBoxes.length;
  if (importSummaryCount) {
    importSummaryCount.textContent = `${count} transaction${count === 1 ? '' : 's'} selected`;
  }
}

function handleSelectAllImportsChange() {
  const isChecked = selectAllImports.checked;
  const checkboxes = importPreviewTbody.querySelectorAll('.import-row-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = isChecked;
  });
  updateSelectedImportCount();
}

function handleConfirmImport() {
  const checkedBoxes = importPreviewTbody.querySelectorAll('.import-row-checkbox:checked');
  if (checkedBoxes.length === 0) {
    showToast('No transactions selected to import.', 'error');
    return;
  }

  let importCount = 0;
  checkedBoxes.forEach(cb => {
    const idx = parseInt(cb.dataset.idx);
    const tx = transactionsToImport[idx];
    if (tx) {
      addTransaction(tx.description, tx.amount, tx.type, tx.date, tx.category);
      importCount++;
    }
  });

  closeImportModal();
  renderTransactions();
  updateUI();
  refreshAnalytics();
  renderCategoryBudgets(); // Refresh category budgets spent

  showToast(`Successfully imported ${importCount} transactions! ✓`, 'success');
}

// ============================
// TIMEFRAME FILTERING LOGIC
// ============================

export function refreshAnalytics() {
  const timeframe = timeframeSelect ? timeframeSelect.value : 'all';
  const allTxs = getTransactions();
  const filtered = filterTransactionsByTimeframe(allTxs, timeframe);
  
  updateCharts(filtered);
  updateAnalyticsStats(filtered);
}

function filterTransactionsByTimeframe(txs, timeframe) {
  const now = new Date();
  now.setHours(0,0,0,0);
  
  return txs.filter(t => {
    if (!t.date) return false;
    const tDate = new Date(t.date + 'T00:00:00'); // avoid timezone shifts
    
    if (timeframe === 'this-month') {
      return tDate.getFullYear() === now.getFullYear() && tDate.getMonth() === now.getMonth();
    } else if (timeframe === 'last-3-months') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      threeMonthsAgo.setHours(0,0,0,0);
      return tDate >= threeMonthsAgo;
    } else if (timeframe === 'ytd') {
      return tDate.getFullYear() === now.getFullYear();
    }
    return true; // 'all'
  });
}

function updateAnalyticsStats(filtered) {
  if (!statTotalTx) return;

  const count = filtered.length;
  statTotalTx.textContent = count;

  let totalIncome = 0;
  let totalExpense = 0;
  let sumAmount = 0;

  filtered.forEach(t => {
    sumAmount += t.amount;
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpense += t.amount;
  });

  if (statSavingsRate) {
    if (totalIncome > 0) {
      const rate = ((totalIncome - totalExpense) / totalIncome * 100);
      statSavingsRate.textContent = `${rate.toFixed(1)}%`;
    } else {
      statSavingsRate.textContent = '—';
    }
  }

  if (statAvgTx) {
    if (count > 0) {
      const avg = sumAmount / count;
      statAvgTx.textContent = `$${avg.toFixed(0)}`;
    } else {
      statAvgTx.textContent = '$0';
    }
  }
}

// ============================
// EVENT LISTENERS BINDING
// ============================

function setupEventListeners() {
  // Add Transaction Form
  if (transactionForm) {
    transactionForm.addEventListener('submit', handleAddTransactionSubmit);
  }

  // Set Budget Goal
  if (setBudgetBtn && budgetGoalInput) {
    setBudgetBtn.addEventListener('click', () => {
      const val = parseFloat(budgetGoalInput.value);
      if (isNaN(val) || val <= 0) {
        showToast('Please enter a valid budget amount.', 'error');
        return;
      }
      setBudgetGoal(val);
      updateUI();
      showToast(`Budget set to ${formatCurrency(val)} ✓`, 'success');
    });
  }

  // Live Search
  if (searchInput) {
    searchInput.addEventListener('input', renderTransactions);
  }

  // Export CSV
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportToCSV(getTransactions());
    });
  }

  // Theme Toggle Click
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  // Close Edit Modal
  if (closeEditModalBtn) {
    closeEditModalBtn.addEventListener('click', closeEditModal);
  }

  // Click outside Edit Modal closes it
  if (editModal) {
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) closeEditModal();
    });
  }

  // Edit Form Submit
  if (editForm) {
    editForm.addEventListener('submit', handleEditTransactionSubmit);
  }

  // Category Budgets Modal Triggers
  if (manageCategoryBudgetsBtn) {
    manageCategoryBudgetsBtn.addEventListener('click', openCategoryBudgetsModal);
  }

  if (closeCategoryBudgetsModalBtn) {
    closeCategoryBudgetsModalBtn.addEventListener('click', closeCategoryBudgetsModal);
  }

  if (categoryBudgetsModal) {
    categoryBudgetsModal.addEventListener('click', (e) => {
      if (e.target === categoryBudgetsModal) closeCategoryBudgetsModal();
    });
  }

  // Add Category Budget Form Submit
  if (categoryBudgetForm) {
    categoryBudgetForm.addEventListener('submit', handleCategoryBudgetSubmit);
  }

  // Savings Goal Modal Triggers
  if (addSavingsGoalBtn) {
    addSavingsGoalBtn.addEventListener('click', openSavingsGoalModal);
  }

  if (closeSavingsGoalModalBtn) {
    closeSavingsGoalModalBtn.addEventListener('click', closeSavingsGoalModal);
  }

  if (savingsGoalModal) {
    savingsGoalModal.addEventListener('click', (e) => {
      if (e.target === savingsGoalModal) closeSavingsGoalModal();
    });
  }

  // Add Savings Goal Form Submit
  if (savingsGoalForm) {
    savingsGoalForm.addEventListener('submit', handleSavingsGoalSubmit);
  }

  // Close Adjust Goal Modal
  if (closeAdjustGoalModalBtn) {
    closeAdjustGoalModalBtn.addEventListener('click', closeAdjustGoalModal);
  }

  if (adjustGoalModal) {
    adjustGoalModal.addEventListener('click', (e) => {
      if (e.target === adjustGoalModal) closeAdjustGoalModal();
    });
  }

  // Adjust Savings Goal Balance Submit
  if (adjustGoalForm) {
    adjustGoalForm.addEventListener('submit', handleAdjustGoalSubmit);
  }

  // CSV Import triggers
  if (importCsvBtn) {
    importCsvBtn.addEventListener('click', () => {
      if (csvFileInput) csvFileInput.click();
    });
  }

  if (csvFileInput) {
    csvFileInput.addEventListener('change', handleCSVFileSelect);
  }

  if (closeImportModalBtn) {
    closeImportModalBtn.addEventListener('click', closeImportModal);
  }

  if (importCsvModal) {
    importCsvModal.addEventListener('click', (e) => {
      if (e.target === importCsvModal) closeImportModal();
    });
  }

  if (btnSubmitMapping) {
    btnSubmitMapping.addEventListener('click', handleMappingSubmit);
  }

  if (selectAllImports) {
    selectAllImports.addEventListener('change', handleSelectAllImportsChange);
  }

  if (btnConfirmImport) {
    btnConfirmImport.addEventListener('click', handleConfirmImport);
  }

  // Analytics timeframe filter trigger
  if (timeframeSelect) {
    timeframeSelect.addEventListener('change', refreshAnalytics);
  }
}

// ============================
// SUBMIT HANDLERS
// ============================

function handleAddTransactionSubmit(e) {
  e.preventDefault();

  const descriptionText = descriptionInput.value.trim();
  const amountNumber    = parseFloat(amountInput.value);
  const typeText        = typeSelect.value;
  const dateText        = dateInput.value;
  const categoryText    = categorySelect.value;

  if (!descriptionText || isNaN(amountNumber) || amountNumber <= 0) {
    showToast('Please enter valid transaction details.', 'error');
    return;
  }

  addTransaction(descriptionText, amountNumber, typeText, dateText, categoryText);
  renderTransactions();
  updateUI();
  refreshAnalytics();
  renderCategoryBudgets(); // Refresh category budget spent

  // Reset form inputs (keep date and type)
  descriptionInput.value = '';
  amountInput.value      = '';
  dateInput.value        = getLocalDateString();

  showToast('Transaction added! ✓', 'success');
}

function handleEditTransactionSubmit(e) {
  e.preventDefault();

  const id = editTxIdInput.value;
  const description = editDescriptionInput.value.trim();
  const amount = parseFloat(editAmountInput.value);
  const type = editTypeSelect.value;
  const date = editDateInput.value;
  const category = editCategorySelect.value;

  if (!description || isNaN(amount) || amount <= 0) {
    showToast('Please enter valid transaction details.', 'error');
    return;
  }

  updateTransaction(id, {
    description,
    amount,
    type,
    date,
    category
  });

  closeEditModal();
  renderTransactions();
  updateUI();
  refreshAnalytics();
  renderCategoryBudgets(); // Refresh category budget spent

  showToast('Transaction updated! ✓', 'success');
}

function handleCategoryBudgetSubmit(e) {
  e.preventDefault();

  const cat = budgetCategorySelect.value;
  const amount = parseFloat(budgetCategoryAmount.value);

  if (isNaN(amount) || amount <= 0) {
    showToast('Please enter a valid budget limit.', 'error');
    return;
  }

  setCategoryBudget(cat, amount);
  budgetCategoryAmount.value = '';

  renderModalCategoryBudgetsList();
  renderCategoryBudgets();
  updateUI();

  showToast(`Budget set for ${cat}! ✓`, 'success');
}

// Savings Goal Create
function handleSavingsGoalSubmit(e) {
  e.preventDefault();

  const name = goalNameInput.value.trim();
  const target = parseFloat(goalTargetInput.value);
  const date = goalDateInput.value;
  const emoji = goalEmojiSelect.value;

  if (!name || isNaN(target) || target <= 0 || !date) {
    showToast('Please enter valid savings goal details.', 'error');
    return;
  }

  addSavingsGoal(name, target, date, emoji);
  closeSavingsGoalModal();
  renderSavingsGoals();
  updateUI();

  showToast(`Savings goal "${name}" created! 🎯`, 'success');
}

// Savings Goal balance allocate/withdraw
async function handleAdjustGoalSubmit(e) {
  e.preventDefault();

  const id = adjustGoalIdInput.value;
  const action = adjustActionTypeInput.value;
  let amount = parseFloat(adjustAmountInput.value);

  if (isNaN(amount) || amount <= 0) {
    showToast('Please enter a valid transfer amount.', 'error');
    return;
  }

  // If withdrawing, apply negative amount
  if (action === 'withdraw') {
    amount = -amount;
  }

  const result = await adjustSavingsGoalBalance(id, amount);

  if (result && result.success) {
    closeAdjustGoalModal();
    renderSavingsGoals();
    updateUI();
    showToast('Funds transferred successfully! ✓', 'success');
  } else {
    showToast(result.reason || 'Transfer failed.', 'error');
  }
}

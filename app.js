// ============================
// SECTION NAVIGATION
// ============================

const navButtons = document.querySelectorAll('.nav-btn');

const sections = document.querySelectorAll('.page-section');

navButtons.forEach(function(button) {

    button.addEventListener('click', function() {

        // Remove active button
        navButtons.forEach(function(btn) {
            btn.classList.remove('active');
        });

        // Remove active section
        sections.forEach(function(section) {
            section.classList.remove('active-section');
        });

        // Activate clicked button
        button.classList.add('active');

        // Show target section
        const targetSection =
            document.getElementById(
                button.dataset.section
            );

        targetSection.classList.add('active-section');
    });
});

// ============================
// ELEMENTS
// ============================

const transactionForm =
    document.getElementById('transaction-form');

const description =
    document.getElementById('description');

const amount =
    document.getElementById('amount');

const type =
    document.getElementById('type');

const transactionList =
    document.getElementById('transaction-list');

const balanceDisplay =
    document.getElementById('balance');

const incomeDisplay =
    document.getElementById('income');

const expenseDisplay =
    document.getElementById('expense');

// ============================
// VARIABLES
// ============================

let totalBalance = 0;
let totalIncome = 0;
let totalExpense = 0;

let transactions =
    JSON.parse(
        localStorage.getItem('transactions')
    ) || [];

// ============================
// UPDATE UI
// ============================

function updateUI() {

    balanceDisplay.textContent =
        `$${totalBalance.toFixed(2)}`;

    incomeDisplay.textContent =
        `$${totalIncome.toFixed(2)}`;

    expenseDisplay.textContent =
        `$${totalExpense.toFixed(2)}`;
}

// ============================
// SAVE LOCAL STORAGE
// ============================

function saveTransactions() {

    localStorage.setItem(
        'transactions',
        JSON.stringify(transactions)
    );
}

// ============================
// CREATE TRANSACTION ROW
// ============================

function createTransactionRow(transaction) {

    const row = document.createElement('li');

    row.innerHTML = `
        <span>
            ${transaction.description}
        </span>

        <span>
            $${transaction.amount.toFixed(2)}
        </span>

        <button class="delete-btn">
            X
        </button>
    `;

    if (transaction.type === 'income') {
        row.classList.add('income-item');
    } else {
        row.classList.add('expense-item');
    }

    const deleteBtn =
        row.querySelector('.delete-btn');

    deleteBtn.addEventListener('click', function() {

        row.remove();

        if (transaction.type === 'income') {
            totalIncome -= transaction.amount;
            totalBalance -= transaction.amount;
        } else {
            totalExpense -= transaction.amount;
            totalBalance += transaction.amount;
        }

        transactions = transactions.filter(
            function(t) {
                return t !== transaction;
            }
        );

        saveTransactions();

        updateUI();
    });

    transactionList.appendChild(row);
}

// ============================
// ADD TRANSACTION
// ============================

function addTransaction(e) {

    e.preventDefault();

    const descriptionText =
        description.value.trim();

    const amountNumber =
        parseFloat(amount.value);

    const typeText =
        type.value;

    if (
        descriptionText === '' ||
        isNaN(amountNumber) ||
        amountNumber <= 0
    ) {
        alert('Please enter valid details');
        return;
    }

    const transaction = {
        description: descriptionText,
        amount: amountNumber,
        type: typeText
    };

    if (typeText === 'income') {
        totalIncome += amountNumber;
        totalBalance += amountNumber;
    } else {
        totalExpense += amountNumber;
        totalBalance -= amountNumber;
    }

    transactions.push(transaction);

    saveTransactions();

    createTransactionRow(transaction);

    updateUI();

    description.value = '';
    amount.value = '';
    type.value = 'income';
}

transactionForm.addEventListener(
    'submit',
    addTransaction
);

// ============================
// INITIAL LOAD
// ============================

transactions.forEach(function(transaction) {

    if (transaction.type === 'income') {
        totalIncome += transaction.amount;
        totalBalance += transaction.amount;
    } else {
        totalExpense += transaction.amount;
        totalBalance -= transaction.amount;
    }

    createTransactionRow(transaction);
});

updateUI();

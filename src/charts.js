import Chart from 'chart.js/auto';

let lineChart = null;
let donutChart = null;
let barChart   = null;

// Configure global Chart.js defaults
Chart.defaults.color       = '#94a3b8';

/**
 * Re-renders all analytics charts based on the filtered list of transactions.
 * @param {Array} filteredTransactions - List of transactions within selected date range.
 */
export function updateCharts(filteredTransactions) {
  
  const computedStyle = getComputedStyle(document.body);
  const gridColor = computedStyle.getPropertyValue('--border').trim() || 'rgba(148, 163, 184, 0.2)';
  Chart.defaults.borderColor = gridColor;

  // ============================================
  // 1. LINE CHART: NET WORTH TREND OVER TIME
  // ============================================
  const lineEl = document.getElementById('line-chart');
  if (lineEl) {
    const lineCtx = lineEl.getContext('2d');
    if (lineChart) lineChart.destroy();

    // Sort transactions chronologically (oldest first) to track cumulative progress
    const sorted = [...filteredTransactions].sort((a, b) => a.date.localeCompare(b.date));

    let runningBalance = 0;
    const balanceHistory = [];
    const dateLabels = [];

    sorted.forEach(t => {
      if (t.type === 'income') {
        runningBalance += t.amount;
      } else {
        runningBalance -= t.amount;
      }
      
      const formattedDate = new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short', day: 'numeric'
      });

      // If we already have a data point for this date, update it to the latest cumulative balance
      if (dateLabels.length > 0 && dateLabels[dateLabels.length - 1] === formattedDate) {
        balanceHistory[balanceHistory.length - 1] = parseFloat(runningBalance.toFixed(2));
      } else {
        dateLabels.push(formattedDate);
        balanceHistory.push(parseFloat(runningBalance.toFixed(2)));
      }
    });

    // Create a beautiful fade-out gradient fill below the trend line
    const gradient = lineCtx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.22)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.00)');

    lineChart = new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: dateLabels.length > 0 ? dateLabels : ['No transactions'],
        datasets: [{
          label: 'Net Worth',
          data: balanceHistory.length > 0 ? balanceHistory : [0],
          borderColor: '#3b82f6',
          borderWidth: 3,
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          pointRadius: dateLabels.length > 20 ? 0 : 3.5,
          pointHoverRadius: 6,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `  $${ctx.parsed.y.toFixed(2)}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 11 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              font: { family: 'Inter', size: 11 },
              callback: val => `$${val}`
            }
          }
        }
      }
    });
  }

  // ============================================
  // 2. DONUT CHART: INCOME VS EXPENSES SUBSET
  // ============================================
  let totalIncome = 0;
  let totalExpense = 0;
  filteredTransactions.forEach(t => {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpense += t.amount;
  });

  const donutEl = document.getElementById('donut-chart');
  if (donutEl) {
    const donutCtx = donutEl.getContext('2d');
    if (donutChart) donutChart.destroy();

    donutChart = new Chart(donutCtx, {
      type: 'doughnut',
      data: {
        labels: ['Income', 'Expenses'],
        datasets: [{
          data: [
            parseFloat(totalIncome.toFixed(2)),
            parseFloat(totalExpense.toFixed(2))
          ],
          backgroundColor: [
            'rgba(16,  185, 129, 0.82)',
            'rgba(239, 68,  68,  0.82)'
          ],
          borderColor: ['#10b981', '#ef4444'],
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 18,
              font: { family: 'Inter', size: 13, weight: '500' },
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: ctx => `  $${ctx.parsed.toFixed(2)}`
            }
          }
        }
      }
    });
  }

  // ============================================
  // 3. BAR CHART: SPENDING BY CATEGORY SUBSET
  // ============================================
  const barEl = document.getElementById('bar-chart');
  if (barEl) {
    const categoryMap = {};
    filteredTransactions.forEach(t => {
      if (!categoryMap[t.category]) {
        categoryMap[t.category] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        categoryMap[t.category].income += t.amount;
      } else {
        categoryMap[t.category].expense += t.amount;
      }
    });

    const catLabels = Object.keys(categoryMap);
    const incomeData = catLabels.map(c => parseFloat(categoryMap[c].income.toFixed(2)));
    const expenseData = catLabels.map(c => parseFloat(categoryMap[c].expense.toFixed(2)));

    const barCtx = barEl.getContext('2d');
    if (barChart) barChart.destroy();

    barChart = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: catLabels.length > 0 ? catLabels : ['No categories'],
        datasets: [
          {
            label: 'Income',
            data: incomeData.length > 0 ? incomeData : [0],
            backgroundColor: 'rgba(16, 185, 129, 0.72)',
            borderColor: '#10b981',
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false
          },
          {
            label: 'Expenses',
            data: expenseData.length > 0 ? expenseData : [0],
            backgroundColor: 'rgba(239, 68, 68, 0.72)',
            borderColor: '#ef4444',
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 18,
              font: { family: 'Inter', size: 13, weight: '500' },
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: ctx => `  ${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 12 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: {
              font: { family: 'Inter', size: 12 },
              callback: val => `$${val}`
            }
          }
        }
      }
    });
  }
}

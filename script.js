import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";


import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";


import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";



/* ======================================================
   FIREBASE
====================================================== */

const firebaseConfig = {

  apiKey:
    "AIzaSyBgW3D1UI_EYTJS5m1GXe6XwRTmkR-UcJo",

  authDomain:
    "household-budget-b350e.firebaseapp.com",

  projectId:
    "household-budget-b350e",

  storageBucket:
    "household-budget-b350e.firebasestorage.app",

  messagingSenderId:
    "691191089446",

  appId:
    "1:691191089446:web:03175b656254076da519e7"

};


const firebaseApp =
  initializeApp(firebaseConfig);


const auth =
  getAuth(firebaseApp);


const db =
  getFirestore(firebaseApp);



/* ======================================================
   BUSINESS SETTINGS
====================================================== */

const BUSINESS_ID =
  "ninth-inning-kennesaw";


const FISCAL_START_DATE =
  "2026-08-01";


const FIRST_MONTH =
  "2026-08";



/* ======================================================
   AUTOMATIC MONTHLY EXPENSES
====================================================== */

const FIXED_EXPENSES = {

  "W2 Staff":
    9583,

  "Rent":
    8938.90,

  "Utilities":
    1800

};


const FIXED_MONTHLY_TOTAL =
  Object.values(
    FIXED_EXPENSES
  ).reduce(
    (sum, value) =>
      sum + value,
    0
  );



/* ======================================================
   CATEGORIES
====================================================== */

const EXPENSE_CATEGORIES = [

  "Rent",

  "W2 Staff",

  "1099 Staff",

  "Tournaments",

  "Field Rentals",

  "Utilities",

  "Misc."

];


const REVENUE_CATEGORIES = [

  "Lessons",

  "Tryouts",

  "Point of Sale",

  "Rentals/Memberships",

  "Camps/Clinics/Programs",

  "Team Revenue"

];


const ALL_CATEGORIES = [

  ...REVENUE_CATEGORIES,

  ...EXPENSE_CATEGORIES

];



/* ======================================================
   STATE
====================================================== */

let currentMonth =
  getCurrentMonth();


if (
  monthToIndex(currentMonth) <
  monthToIndex(FIRST_MONTH)
) {

  currentMonth =
    FIRST_MONTH;

}


let transactions =
  [];


let transactionsUnsubscribe =
  null;


let performanceChart =
  null;


let revenueMixChart =
  null;



/* ======================================================
   DOM
====================================================== */

const loginScreen =
  document.getElementById(
    "loginScreen"
  );


const appElement =
  document.getElementById(
    "app"
  );


const loginForm =
  document.getElementById(
    "loginForm"
  );


const loginError =
  document.getElementById(
    "loginError"
  );


const logoutButton =
  document.getElementById(
    "logoutButton"
  );


const monthSelector =
  document.getElementById(
    "monthSelector"
  );


const navButtons =
  document.querySelectorAll(
    ".nav-button"
  );


const pages =
  document.querySelectorAll(
    ".page"
  );



/* DASHBOARD */

const dashboardMonthTitle =
  document.getElementById(
    "dashboardMonthTitle"
  );


const monthlyRevenue =
  document.getElementById(
    "monthlyRevenue"
  );


const monthlyExpenses =
  document.getElementById(
    "monthlyExpenses"
  );


const monthlyExpenseDetail =
  document.getElementById(
    "monthlyExpenseDetail"
  );


const monthlyProfit =
  document.getElementById(
    "monthlyProfit"
  );


const monthlyMargin =
  document.getElementById(
    "monthlyMargin"
  );


const marginCard =
  document.getElementById(
    "marginCard"
  );


const chartFiscalLabel =
  document.getElementById(
    "chartFiscalLabel"
  );


const revenueMixTitle =
  document.getElementById(
    "revenueMixTitle"
  );


const revenueMixEmpty =
  document.getElementById(
    "revenueMixEmpty"
  );


const revenueBreakdown =
  document.getElementById(
    "revenueBreakdown"
  );


const expenseBreakdown =
  document.getElementById(
    "expenseBreakdown"
  );


const recentTransactions =
  document.getElementById(
    "recentTransactions"
  );



/* TRANSACTIONS */

const transactionTypeFilter =
  document.getElementById(
    "transactionTypeFilter"
  );


const transactionCategoryFilter =
  document.getElementById(
    "transactionCategoryFilter"
  );


const transactionTableBody =
  document.getElementById(
    "transactionTableBody"
  );


const transactionEmptyState =
  document.getElementById(
    "transactionEmptyState"
  );



/* FISCAL YEAR */

const fiscalYearTitle =
  document.getElementById(
    "fiscalYearTitle"
  );


const fyRevenue =
  document.getElementById(
    "fyRevenue"
  );


const fyExpenses =
  document.getElementById(
    "fyExpenses"
  );


const fyProfit =
  document.getElementById(
    "fyProfit"
  );


const fyMargin =
  document.getElementById(
    "fyMargin"
  );


const fyMarginCard =
  document.getElementById(
    "fyMarginCard"
  );


const fyTableBody =
  document.getElementById(
    "fyTableBody"
  );


const fyRevenueBreakdown =
  document.getElementById(
    "fyRevenueBreakdown"
  );


const fyExpenseBreakdown =
  document.getElementById(
    "fyExpenseBreakdown"
  );



/* MODAL */

const transactionModal =
  document.getElementById(
    "transactionModal"
  );


const transactionForm =
  document.getElementById(
    "transactionForm"
  );


const transactionModalTitle =
  document.getElementById(
    "transactionModalTitle"
  );


const transactionId =
  document.getElementById(
    "transactionId"
  );


const transactionType =
  document.getElementById(
    "transactionType"
  );


const transactionAmount =
  document.getElementById(
    "transactionAmount"
  );


const transactionDate =
  document.getElementById(
    "transactionDate"
  );


const transactionDescription =
  document.getElementById(
    "transactionDescription"
  );


const transactionCategory =
  document.getElementById(
    "transactionCategory"
  );


const transactionNotes =
  document.getElementById(
    "transactionNotes"
  );


const transactionFormError =
  document.getElementById(
    "transactionFormError"
  );


const saveTransactionButton =
  document.getElementById(
    "saveTransactionButton"
  );


const modalRevenueTypeButton =
  document.getElementById(
    "modalRevenueTypeButton"
  );


const modalExpenseTypeButton =
  document.getElementById(
    "modalExpenseTypeButton"
  );



/* ======================================================
   HELPERS
====================================================== */

function currency(value) {

  return new Intl.NumberFormat(
    "en-US",
    {
      style:
        "currency",

      currency:
        "USD"
    }
  ).format(
    Number(value || 0)
  );

}



function percent(value) {

  return (
    `${Number(value || 0).toFixed(1)}%`
  );

}



function compactMoney(value) {

  const number =
    Number(value || 0);


  if (
    Math.abs(number) >=
    1000000
  ) {

    return (
      `$${(number / 1000000).toFixed(1)}M`
    );

  }


  if (
    Math.abs(number) >=
    1000
  ) {

    return (
      `$${(number / 1000).toFixed(0)}k`
    );

  }


  return (
    `$${number.toFixed(0)}`
  );

}



function getCurrentMonth() {

  const now =
    new Date();


  return (
    `${now.getFullYear()}-` +
    `${String(now.getMonth() + 1).padStart(2, "0")}`
  );

}



function todayString() {

  const now =
    new Date();


  return [

    now.getFullYear(),

    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    ),

    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    )

  ].join("-");

}



function getMonthFromDate(
  dateString
) {

  if (!dateString) {

    return "";

  }


  return (
    dateString.slice(
      0,
      7
    )
  );

}



function formatMonth(
  monthKey
) {

  const [
    year,
    month
  ] =
    monthKey
      .split("-")
      .map(Number);


  return new Date(
    year,
    month - 1,
    1
  ).toLocaleDateString(
    "en-US",
    {
      month:
        "long",

      year:
        "numeric"
    }
  );

}



function shortMonth(
  monthKey
) {

  const [
    year,
    month
  ] =
    monthKey
      .split("-")
      .map(Number);


  return new Date(
    year,
    month - 1,
    1
  ).toLocaleDateString(
    "en-US",
    {
      month:
        "short"
    }
  );

}



function formatDate(
  dateString
) {

  if (!dateString) {

    return "";

  }


  const [
    year,
    month,
    day
  ] =
    dateString
      .split("-")
      .map(Number);


  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString(
    "en-US",
    {
      month:
        "short",

      day:
        "numeric",

      year:
        "numeric"
    }
  );

}



function escapeHtml(
  value = ""
) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}



function monthToIndex(
  monthKey
) {

  const [
    year,
    month
  ] =
    monthKey
      .split("-")
      .map(Number);


  return (
    year * 12 +
    month -
    1
  );

}



function monthInRange(
  monthKey,
  startMonth,
  endMonth
) {

  const current =
    monthToIndex(
      monthKey
    );


  return (
    current >=
      monthToIndex(
        startMonth
      ) &&

    current <=
      monthToIndex(
        endMonth
      )
  );

}



/* ======================================================
   FISCAL YEAR
====================================================== */

function getFiscalYearInfo(
  monthKey
) {

  const [
    year,
    month
  ] =
    monthKey
      .split("-")
      .map(Number);


  let startYear;

  let endYear;


  if (
    month >=
    8
  ) {

    startYear =
      year;

    endYear =
      year + 1;

  } else {

    startYear =
      year - 1;

    endYear =
      year;

  }


  return {

    startYear,

    endYear,

    label:
      `FY${endYear}`,

    startMonth:
      `${startYear}-08`,

    endMonth:
      `${endYear}-07`

  };

}



function buildFiscalMonths(
  startYear
) {

  const months =
    [];


  for (
    let offset = 0;
    offset < 12;
    offset++
  ) {

    const date =
      new Date(
        startYear,
        7 + offset,
        1
      );


    months.push(
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(
        2,
        "0"
      )}`
    );

  }


  return months;

}



/* ======================================================
   MONTH SELECTOR
====================================================== */

function buildMonthSelector() {

  monthSelector.innerHTML =
    "";


  const start =
    new Date(
      2026,
      7,
      1
    );


  const end =
    new Date(
      2031,
      6,
      1
    );


  const cursor =
    new Date(start);


  while (
    cursor <=
    end
  ) {

    const monthKey =
      `${cursor.getFullYear()}-${String(
        cursor.getMonth() + 1
      ).padStart(
        2,
        "0"
      )}`;


    const option =
      document.createElement(
        "option"
      );


    option.value =
      monthKey;


    option.textContent =
      cursor.toLocaleDateString(
        "en-US",
        {
          month:
            "long",

          year:
            "numeric"
        }
      );


    monthSelector.appendChild(
      option
    );


    cursor.setMonth(
      cursor.getMonth() + 1
    );

  }


  monthSelector.value =
    currentMonth;

}



/* ======================================================
   AUTHENTICATION
====================================================== */

loginForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    loginError.textContent =
      "";


    const email =
      document
        .getElementById(
          "email"
        )
        .value
        .trim();


    const password =
      document
        .getElementById(
          "password"
        )
        .value;


    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    } catch (error) {

      console.error(
        error
      );


      loginError.textContent =
        "Unable to sign in. Check your email and password.";

    }

  }
);



logoutButton.addEventListener(
  "click",
  async () => {

    await signOut(
      auth
    );

  }
);



onAuthStateChanged(
  auth,
  user => {

    if (!user) {

      if (
        transactionsUnsubscribe
      ) {

        transactionsUnsubscribe();

        transactionsUnsubscribe =
          null;

      }


      destroyCharts();


      appElement.classList.add(
        "hidden"
      );


      loginScreen.classList.remove(
        "hidden"
      );


      return;

    }


    loginScreen.classList.add(
      "hidden"
    );


    appElement.classList.remove(
      "hidden"
    );


    initializeAppData();

  }
);



/* ======================================================
   INITIALIZE
====================================================== */

function initializeAppData() {

  buildMonthSelector();

  buildFilterCategories();

  updateSelectedMonthDisplay();

  listenForTransactions();

}



/* ======================================================
   NAVIGATION
====================================================== */

navButtons.forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        const target =
          button.dataset.page;


        navButtons.forEach(
          nav => {

            nav.classList.remove(
              "active"
            );

          }
        );


        button.classList.add(
          "active"
        );


        pages.forEach(
          page => {

            page.classList.remove(
              "active-page"
            );

          }
        );


        const targetPage =
          document.getElementById(
            `${target}Page`
          );


        if (
          targetPage
        ) {

          targetPage.classList.add(
            "active-page"
          );

        }


        if (
          target ===
          "reports"
        ) {

          renderFiscalYear();

        }


        if (
          target ===
          "dashboard"
        ) {

          setTimeout(
            () => {

              renderCharts();

            },
            10
          );

        }

      }
    );

  }
);



/* ======================================================
   MONTH CHANGE
====================================================== */

monthSelector.addEventListener(
  "change",
  event => {

    currentMonth =
      event.target.value;


    updateSelectedMonthDisplay();


    renderEverything();

  }
);



function updateSelectedMonthDisplay() {

  dashboardMonthTitle.textContent =
    formatMonth(
      currentMonth
    );


  revenueMixTitle.textContent =
    `${shortMonth(currentMonth)} Revenue`;


  const fiscal =
    getFiscalYearInfo(
      currentMonth
    );


  fiscalYearTitle.textContent =
    `${fiscal.label} Financial Performance`;


  chartFiscalLabel.textContent =
    fiscal.label;

}



/* ======================================================
   FIRESTORE
====================================================== */

function listenForTransactions() {

  if (
    transactionsUnsubscribe
  ) {

    transactionsUnsubscribe();

  }


  const transactionsRef =
    collection(
      db,
      "businesses",
      BUSINESS_ID,
      "transactions"
    );


  const transactionsQuery =
    query(
      transactionsRef,
      orderBy(
        "date",
        "desc"
      )
    );


  transactionsUnsubscribe =
    onSnapshot(

      transactionsQuery,

      snapshot => {

        transactions =
          snapshot.docs.map(
            documentSnapshot => {

              const data =
                documentSnapshot.data();


              return {

                id:
                  documentSnapshot.id,

                ...data,

                month:
                  data.month ||
                  getMonthFromDate(
                    data.date
                  )

              };

            }
          );


        renderEverything();

      },

      error => {

        console.error(
          "Transaction listener error:",
          error
        );

      }

    );

}



/* ======================================================
   TRANSACTION GETTERS
====================================================== */

function getMonthlyTransactions(
  monthKey =
    currentMonth
) {

  return transactions.filter(
    transaction =>
      transaction.month ===
      monthKey
  );

}



/* ======================================================
   MONTH CALCULATION
====================================================== */

function calculateMonth(
  monthKey
) {

  const validMonth =
    monthToIndex(
      monthKey
    ) >=
    monthToIndex(
      FIRST_MONTH
    );


  const monthlyTransactions =
    getMonthlyTransactions(
      monthKey
    );


  const revenue =
    monthlyTransactions

      .filter(
        transaction =>
          transaction.type ===
          "revenue"
      )

      .reduce(
        (sum, transaction) =>
          sum +
          Number(
            transaction.amount ||
            0
          ),
        0
      );


  const manualExpenses =
    monthlyTransactions

      .filter(
        transaction =>
          transaction.type ===
          "expense"
      )

      .reduce(
        (sum, transaction) =>
          sum +
          Number(
            transaction.amount ||
            0
          ),
        0
      );


  const fixedExpenses =
    validMonth
      ? FIXED_MONTHLY_TOTAL
      : 0;


  const expenses =
    fixedExpenses +
    manualExpenses;


  const profit =
    revenue -
    expenses;


  const margin =
    revenue > 0

      ? (
          profit /
          revenue
        ) * 100

      : 0;


  return {

    revenue,

    manualExpenses,

    fixedExpenses,

    expenses,

    profit,

    margin

  };

}



/* ======================================================
   MASTER RENDER
====================================================== */

function renderEverything() {

  updateSelectedMonthDisplay();

  renderDashboard();

  renderTransactions();

  renderFiscalYear();


  const dashboardActive =
    document
      .getElementById(
        "dashboardPage"
      )
      .classList
      .contains(
        "active-page"
      );


  if (
    dashboardActive
  ) {

    requestAnimationFrame(
      () => {

        renderCharts();

      }
    );

  }

}



/* ======================================================
   DASHBOARD
====================================================== */

function renderDashboard() {

  const totals =
    calculateMonth(
      currentMonth
    );


  monthlyRevenue.textContent =
    currency(
      totals.revenue
    );


  monthlyExpenses.textContent =
    currency(
      totals.expenses
    );


  if (
    totals.manualExpenses >
    0
  ) {

    monthlyExpenseDetail.textContent =
      `${currency(totals.fixedExpenses)} automatic + ${currency(totals.manualExpenses)} manual`;

  } else {

    monthlyExpenseDetail.textContent =
      `${currency(totals.fixedExpenses)} automatic monthly expenses`;

  }


  monthlyProfit.textContent =
    currency(
      totals.profit
    );


  monthlyProfit.classList.remove(
    "positive-text",
    "negative-text"
  );


  monthlyProfit.classList.add(
    totals.profit >=
      0

      ? "positive-text"

      : "negative-text"
  );


  monthlyMargin.textContent =
    percent(
      totals.margin
    );


  if (
    totals.profit <
    0
  ) {

    marginCard.style.background =
      "var(--red)";


    marginCard.style.borderColor =
      "var(--red)";

  } else {

    marginCard.style.background =
      "var(--navy)";


    marginCard.style.borderColor =
      "var(--navy)";

  }


  renderRevenueBreakdown();

  renderExpenseBreakdown();

  renderRecentTransactions();

}



/* ======================================================
   DASHBOARD CHARTS
====================================================== */

function destroyCharts() {

  if (
    performanceChart
  ) {

    performanceChart.destroy();

    performanceChart =
      null;

  }


  if (
    revenueMixChart
  ) {

    revenueMixChart.destroy();

    revenueMixChart =
      null;

  }

}



function renderCharts() {

  if (
    typeof Chart ===
    "undefined"
  ) {

    console.error(
      "Chart.js did not load."
    );

    return;

  }


  renderPerformanceChart();

  renderRevenueMixChart();

}



/* ======================================================
   PERFORMANCE CHART
====================================================== */

function renderPerformanceChart() {

  const canvas =
    document.getElementById(
      "performanceChart"
    );


  if (
    !canvas
  ) {

    return;

  }


  if (
    performanceChart
  ) {

    performanceChart.destroy();

  }


  const fiscal =
    getFiscalYearInfo(
      currentMonth
    );


  const fiscalMonths =
    buildFiscalMonths(
      fiscal.startYear
    );


  const selectedIndex =
    monthToIndex(
      currentMonth
    );


  /*
    Show the full Aug-Jul fiscal year.

    Months after the selected month show
    no value rather than pretending the
    future has already happened.
  */

  const revenueData =
    [];


  const expenseData =
    [];


  const profitData =
    [];


  fiscalMonths.forEach(
    monthKey => {

      if (
        monthToIndex(
          monthKey
        ) >
        selectedIndex
      ) {

        revenueData.push(
          null
        );


        expenseData.push(
          null
        );


        profitData.push(
          null
        );


        return;

      }


      const totals =
        calculateMonth(
          monthKey
        );


      revenueData.push(
        totals.revenue
      );


      expenseData.push(
        totals.expenses
      );


      profitData.push(
        totals.profit
      );

    }
  );


  const ctx =
    canvas.getContext(
      "2d"
    );


  performanceChart =
    new Chart(
      ctx,
      {

        data: {

          labels:
            fiscalMonths.map(
              month =>
                shortMonth(
                  month
                )
            ),


          datasets: [

            {

              type:
                "bar",

              label:
                "Revenue",

              data:
                revenueData,

              backgroundColor:
                "rgba(23, 122, 73, 0.75)",

              borderColor:
                "#177a49",

              borderWidth:
                1,

              borderRadius:
                6,

              order:
                2

            },


            {

              type:
                "bar",

              label:
                "Expenses",

              data:
                expenseData,

              backgroundColor:
                "rgba(192, 38, 28, 0.72)",

              borderColor:
                "#c0261c",

              borderWidth:
                1,

              borderRadius:
                6,

              order:
                2

            },


            {

              type:
                "line",

              label:
                "Net Profit",

              data:
                profitData,

              borderColor:
                "#17375e",

              backgroundColor:
                "#17375e",

              pointBackgroundColor:
                "#17375e",

              pointRadius:
                4,

              pointHoverRadius:
                6,

              borderWidth:
                3,

              tension:
                0.25,

              spanGaps:
                false,

              order:
                1

            }

          ]

        },


        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,


          interaction: {

            mode:
              "index",

            intersect:
              false

          },


          plugins: {

            legend: {

              position:
                "top",

              align:
                "start",

              labels: {

                usePointStyle:
                  true,

                boxWidth:
                  8,

                boxHeight:
                  8,

                padding:
                  18,

                font: {

                  size:
                    12,

                  weight:
                    "600"

                }

              }

            },


            tooltip: {

              callbacks: {

                label(
                  context
                ) {

                  const value =
                    context.raw;


                  if (
                    value ===
                    null
                  ) {

                    return (
                      `${context.dataset.label}: —`
                    );

                  }


                  return (
                    `${context.dataset.label}: ${currency(value)}`
                  );

                }

              }

            }

          },


          scales: {

            x: {

              grid: {

                display:
                  false

              },


              ticks: {

                color:
                  "#697382",

                font: {

                  size:
                    11

                }

              }

            },


            y: {

              beginAtZero:
                true,


              grid: {

                color:
                  "rgba(23, 32, 44, 0.08)"

              },


              ticks: {

                color:
                  "#697382",

                callback(
                  value
                ) {

                  return (
                    compactMoney(
                      value
                    )
                  );

                }

              }

            }

          }

        }

      }
    );

}



/* ======================================================
   REVENUE MIX CHART
====================================================== */

function renderRevenueMixChart() {

  const canvas =
    document.getElementById(
      "revenueMixChart"
    );


  if (
    !canvas
  ) {

    return;

  }


  if (
    revenueMixChart
  ) {

    revenueMixChart.destroy();

    revenueMixChart =
      null;

  }


  const monthly =
    getMonthlyTransactions(
      currentMonth
    );


  const totals =
    REVENUE_CATEGORIES.map(
      category => {

        return monthly

          .filter(
            transaction =>
              transaction.type ===
                "revenue" &&
              transaction.category ===
                category
          )

          .reduce(
            (sum, transaction) =>
              sum +
              Number(
                transaction.amount ||
                0
              ),
            0
          );

      }
    );


  const totalRevenue =
    totals.reduce(
      (sum, amount) =>
        sum + amount,
      0
    );


  revenueMixEmpty.classList.toggle(
    "hidden",
    totalRevenue >
      0
  );


  canvas.classList.toggle(
    "hidden",
    totalRevenue ===
      0
  );


  if (
    totalRevenue ===
    0
  ) {

    return;

  }


  const ctx =
    canvas.getContext(
      "2d"
    );


  revenueMixChart =
    new Chart(
      ctx,
      {

        type:
          "doughnut",


        data: {

          labels:
            REVENUE_CATEGORIES,


          datasets: [

            {

              data:
                totals,

              borderWidth:
                3,

              borderColor:
                "#ffffff",

              hoverOffset:
                8

            }

          ]

        },


        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,

          cutout:
            "65%",


          plugins: {

            legend: {

              position:
                "bottom",

              labels: {

                usePointStyle:
                  true,

                pointStyle:
                  "circle",

                padding:
                  13,

                boxWidth:
                  7,

                font: {

                  size:
                    11

                }

              }

            },


            tooltip: {

              callbacks: {

                label(
                  context
                ) {

                  const value =
                    Number(
                      context.raw ||
                      0
                    );


                  const share =
                    totalRevenue >
                    0

                      ? (
                          value /
                          totalRevenue
                        ) * 100

                      : 0;


                  return (
                    `${context.label}: ${currency(value)} (${share.toFixed(1)}%)`
                  );

                }

              }

            }

          }

        }

      }
    );

}



/* ======================================================
   MONTHLY REVENUE BREAKDOWN
====================================================== */

function renderRevenueBreakdown() {

  const monthly =
    getMonthlyTransactions();


  const categoryTotals =
    {};


  REVENUE_CATEGORIES.forEach(
    category => {

      categoryTotals[
        category
      ] =
        monthly

          .filter(
            item =>
              item.type ===
                "revenue" &&
              item.category ===
                category
          )

          .reduce(
            (sum, item) =>
              sum +
              Number(
                item.amount ||
                0
              ),
            0
          );

    }
  );


  const total =
    Object.values(
      categoryTotals
    ).reduce(
      (sum, value) =>
        sum + value,
      0
    );


  renderBreakdownList(
    revenueBreakdown,
    categoryTotals,
    total,
    "revenue"
  );

}



/* ======================================================
   MONTHLY EXPENSE BREAKDOWN
====================================================== */

function renderExpenseBreakdown() {

  const monthly =
    getMonthlyTransactions();


  const categoryTotals =
    {};


  EXPENSE_CATEGORIES.forEach(
    category => {

      const manual =
        monthly

          .filter(
            item =>
              item.type ===
                "expense" &&
              item.category ===
                category
          )

          .reduce(
            (sum, item) =>
              sum +
              Number(
                item.amount ||
                0
              ),
            0
          );


      const automatic =
        Number(
          FIXED_EXPENSES[
            category
          ] ||
          0
        );


      categoryTotals[
        category
      ] =
        manual +
        automatic;

    }
  );


  const total =
    Object.values(
      categoryTotals
    ).reduce(
      (sum, value) =>
        sum + value,
      0
    );


  renderBreakdownList(
    expenseBreakdown,
    categoryTotals,
    total,
    "expense"
  );

}



/* ======================================================
   BREAKDOWN LIST
====================================================== */

function renderBreakdownList(
  container,
  categoryTotals,
  total,
  type
) {

  container.innerHTML =
    "";


  Object.entries(
    categoryTotals
  ).forEach(
    ([
      category,
      amount
    ]) => {

      const share =
        total >
        0

          ? (
              amount /
              total
            ) * 100

          : 0;


      const row =
        document.createElement(
          "div"
        );


      row.className =
        "breakdown-row";


      row.innerHTML =
        `
          <div class="breakdown-top">

            <span class="breakdown-name">
              ${escapeHtml(category)}
            </span>

            <span class="breakdown-value">
              ${currency(amount)}
            </span>

          </div>


          <div class="breakdown-track">

            <div
              class="breakdown-fill ${type}"
              style="width:${Math.min(
                share,
                100
              )}%"
            ></div>

          </div>
        `;


      container.appendChild(
        row
      );

    }
  );

}



/* ======================================================
   RECENT TRANSACTIONS
====================================================== */

function renderRecentTransactions() {

  const monthly =
    [...getMonthlyTransactions()]

      .sort(
        (a, b) =>
          String(
            b.date
          ).localeCompare(
            String(
              a.date
            )
          )
      )

      .slice(
        0,
        8
      );


  if (
    monthly.length ===
    0
  ) {

    recentTransactions.innerHTML =
      `
        <p class="empty-state">
          No manual transactions this month.
        </p>
      `;


    return;

  }


  recentTransactions.innerHTML =
    "";


  monthly.forEach(
    transaction => {

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "recent-transaction";


      row.innerHTML =
        `
          <div>

            <div class="recent-description">
              ${escapeHtml(
                transaction.description ||
                ""
              )}
            </div>

            <div class="recent-meta">

              ${formatDate(
                transaction.date
              )}

              •

              ${escapeHtml(
                transaction.category ||
                ""
              )}

            </div>

          </div>


          <div
            class="
              recent-amount
              ${
                transaction.type ===
                "revenue"

                  ? "positive-text"

                  : "negative-text"
              }
            "
          >

            ${
              transaction.type ===
                "revenue"

                ? "+"

                : "-"
            }

            ${currency(
              transaction.amount
            )}

          </div>
        `;


      recentTransactions.appendChild(
        row
      );

    }
  );

}



/* ======================================================
   FILTER CATEGORIES
====================================================== */

function buildFilterCategories() {

  transactionCategoryFilter.innerHTML =
    `
      <option value="all">
        All Categories
      </option>
    `;


  ALL_CATEGORIES.forEach(
    category => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        category;


      option.textContent =
        category;


      transactionCategoryFilter.appendChild(
        option
      );

    }
  );

}



/* ======================================================
   TRANSACTION TABLE
====================================================== */

function renderTransactions() {

  let filtered =
    [...getMonthlyTransactions()];


  const type =
    transactionTypeFilter.value;


  const category =
    transactionCategoryFilter.value;


  if (
    type !==
    "all"
  ) {

    filtered =
      filtered.filter(
        item =>
          item.type ===
          type
      );

  }


  if (
    category !==
    "all"
  ) {

    filtered =
      filtered.filter(
        item =>
          item.category ===
          category
      );

  }


  filtered.sort(
    (a, b) =>
      String(
        b.date
      ).localeCompare(
        String(
          a.date
        )
      )
  );


  transactionTableBody.innerHTML =
    "";


  transactionEmptyState.classList.toggle(
    "hidden",
    filtered.length >
      0
  );


  filtered.forEach(
    transaction => {

      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML =
        `
          <td>
            ${formatDate(
              transaction.date
            )}
          </td>


          <td>
            ${escapeHtml(
              transaction.description ||
              ""
            )}
          </td>


          <td
            class="${
              transaction.type ===
                "revenue"

                ? "positive-text"

                : "negative-text"
            }"
          >

            ${
              transaction.type ===
                "revenue"

                ? "Revenue"

                : "Expense"
            }

          </td>


          <td>
            ${escapeHtml(
              transaction.category ||
              ""
            )}
          </td>


          <td
            class="${
              transaction.type ===
                "revenue"

                ? "positive-text"

                : "negative-text"
            }"
          >

            ${
              transaction.type ===
                "revenue"

                ? "+"

                : "-"
            }

            ${currency(
              transaction.amount
            )}

          </td>


          <td>

            <div class="transaction-actions">

              <button
                class="small-button edit-transaction"
                data-id="${transaction.id}"
              >
                Edit
              </button>


              <button
                class="small-button delete delete-transaction"
                data-id="${transaction.id}"
              >
                Delete
              </button>

            </div>

          </td>
        `;


      transactionTableBody.appendChild(
        row
      );

    }
  );


  document
    .querySelectorAll(
      ".edit-transaction"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            openEditTransaction(
              button.dataset.id
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".delete-transaction"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            deleteTransaction(
              button.dataset.id
            );

          }
        );

      }
    );

}



transactionTypeFilter.addEventListener(
  "change",
  renderTransactions
);


transactionCategoryFilter.addEventListener(
  "change",
  renderTransactions
);



/* ======================================================
   ADD BUTTONS
====================================================== */

document
  .getElementById(
    "dashboardAddRevenueButton"
  )
  .addEventListener(
    "click",
    () => {

      openNewTransaction(
        "revenue"
      );

    }
  );


document
  .getElementById(
    "dashboardAddExpenseButton"
  )
  .addEventListener(
    "click",
    () => {

      openNewTransaction(
        "expense"
      );

    }
  );


document
  .getElementById(
    "transactionsAddRevenueButton"
  )
  .addEventListener(
    "click",
    () => {

      openNewTransaction(
        "revenue"
      );

    }
  );


document
  .getElementById(
    "transactionsAddExpenseButton"
  )
  .addEventListener(
    "click",
    () => {

      openNewTransaction(
        "expense"
      );

    }
  );



/* ======================================================
   MODAL CLOSE
====================================================== */

document
  .querySelectorAll(
    "[data-close-transaction-modal]"
  )
  .forEach(
    element => {

      element.addEventListener(
        "click",
        closeTransactionModal
      );

    }
  );



function closeTransactionModal() {

  transactionModal.classList.add(
    "hidden"
  );

}



/* ======================================================
   MODAL TYPES
====================================================== */

modalRevenueTypeButton.addEventListener(
  "click",
  () => {

    transactionType.value =
      "revenue";


    updateModalType();

  }
);


modalExpenseTypeButton.addEventListener(
  "click",
  () => {

    transactionType.value =
      "expense";


    updateModalType();

  }
);



function updateModalType() {

  const type =
    transactionType.value;


  modalRevenueTypeButton.classList.toggle(
    "active",
    type ===
      "revenue"
  );


  modalExpenseTypeButton.classList.toggle(
    "active",
    type ===
      "expense"
  );


  if (
    transactionId.value
  ) {

    transactionModalTitle.textContent =
      "Edit Transaction";


    saveTransactionButton.textContent =
      "Save Changes";

  } else {

    transactionModalTitle.textContent =
      type ===
        "revenue"

        ? "Add Revenue"

        : "Add Expense";


    saveTransactionButton.textContent =
      type ===
        "revenue"

        ? "Add Revenue"

        : "Add Expense";

  }


  const previousCategory =
    transactionCategory.value;


  buildTransactionCategories(
    type,
    previousCategory
  );

}



/* ======================================================
   MODAL CATEGORIES
====================================================== */

function buildTransactionCategories(
  type,
  selectedCategory =
    null
) {

  transactionCategory.innerHTML =
    "";


  const categories =
    type ===
      "revenue"

      ? REVENUE_CATEGORIES

      : EXPENSE_CATEGORIES;


  categories.forEach(
    category => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        category;


      option.textContent =
        category;


      if (
        category ===
        selectedCategory
      ) {

        option.selected =
          true;

      }


      transactionCategory.appendChild(
        option
      );

    }
  );

}



/* ======================================================
   NEW TRANSACTION
====================================================== */

function openNewTransaction(
  type
) {

  transactionForm.reset();


  transactionId.value =
    "";


  transactionType.value =
    type;


  const today =
    todayString();


  if (
    getMonthFromDate(
      today
    ) ===
    currentMonth
  ) {

    transactionDate.value =
      today;

  } else {

    transactionDate.value =
      `${currentMonth}-01`;

  }


  buildTransactionCategories(
    type
  );


  updateModalType();


  transactionFormError.textContent =
    "";


  transactionModal.classList.remove(
    "hidden"
  );

}



/* ======================================================
   EDIT TRANSACTION
====================================================== */

function openEditTransaction(
  id
) {

  const transaction =
    transactions.find(
      item =>
        item.id ===
        id
    );


  if (
    !transaction
  ) {

    return;

  }


  transactionId.value =
    transaction.id;


  transactionType.value =
    transaction.type;


  transactionAmount.value =
    transaction.amount;


  transactionDate.value =
    transaction.date;


  transactionDescription.value =
    transaction.description ||
    "";


  transactionNotes.value =
    transaction.notes ||
    "";


  buildTransactionCategories(
    transaction.type,
    transaction.category
  );


  updateModalType();


  /*
    updateModalType rebuilds categories,
    so explicitly restore category.
  */

  transactionCategory.value =
    transaction.category;


  transactionModal.classList.remove(
    "hidden"
  );

}



/* ======================================================
   SAVE TRANSACTION
====================================================== */

transactionForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    transactionFormError.textContent =
      "";


    const amount =
      Number(
        transactionAmount.value
      );


    const date =
      transactionDate.value;


    const description =
      transactionDescription
        .value
        .trim();


    const type =
      transactionType.value;


    const category =
      transactionCategory.value;


    if (
      !amount ||
      amount <=
        0
    ) {

      transactionFormError.textContent =
        "Enter a valid amount.";


      return;

    }


    if (
      !date
    ) {

      transactionFormError.textContent =
        "Choose a date.";


      return;

    }


    if (
      !description
    ) {

      transactionFormError.textContent =
        "Enter a description.";


      return;

    }


    if (
      date <
      FISCAL_START_DATE
    ) {

      transactionFormError.textContent =
        "Financial tracking begins August 1, 2026.";


      return;

    }


    const transactionMonth =
      getMonthFromDate(
        date
      );


    const data = {

      type,

      category,

      amount,

      description,

      date,

      month:
        transactionMonth,

      notes:
        transactionNotes
          .value
          .trim(),

      updatedAt:
        serverTimestamp()

    };


    try {

      const id =
        transactionId.value;


      if (
        id
      ) {

        await updateDoc(
          doc(
            db,
            "businesses",
            BUSINESS_ID,
            "transactions",
            id
          ),
          data
        );

      } else {

        data.createdAt =
          serverTimestamp();


        await addDoc(
          collection(
            db,
            "businesses",
            BUSINESS_ID,
            "transactions"
          ),
          data
        );

      }


      currentMonth =
        transactionMonth;


      monthSelector.value =
        currentMonth;


      updateSelectedMonthDisplay();


      closeTransactionModal();


      renderEverything();

    } catch (error) {

      console.error(
        "Save error:",
        error
      );


      transactionFormError.textContent =
        "Unable to save transaction.";

    }

  }
);



/* ======================================================
   DELETE TRANSACTION
====================================================== */

async function deleteTransaction(
  id
) {

  const transaction =
    transactions.find(
      item =>
        item.id ===
        id
    );


  if (
    !transaction
  ) {

    return;

  }


  const confirmed =
    confirm(
      `Delete "${transaction.description}"?`
    );


  if (
    !confirmed
  ) {

    return;

  }


  try {

    await deleteDoc(
      doc(
        db,
        "businesses",
        BUSINESS_ID,
        "transactions",
        id
      )
    );

  } catch (error) {

    console.error(
      error
    );


    alert(
      "Unable to delete transaction."
    );

  }

}



/* ======================================================
   FISCAL YEAR
====================================================== */

function renderFiscalYear() {

  const fiscal =
    getFiscalYearInfo(
      currentMonth
    );


  fiscalYearTitle.textContent =
    `${fiscal.label} Financial Performance`;


  const fiscalMonths =
    buildFiscalMonths(
      fiscal.startYear
    );


  const selectedMonthIndex =
    monthToIndex(
      currentMonth
    );


  const activeMonths =
    fiscalMonths.filter(
      month =>
        monthToIndex(
          month
        ) <=
        selectedMonthIndex
    );


  let totalRevenue =
    0;


  let totalExpenses =
    0;


  fyTableBody.innerHTML =
    "";


  activeMonths.forEach(
    month => {

      const totals =
        calculateMonth(
          month
        );


      totalRevenue +=
        totals.revenue;


      totalExpenses +=
        totals.expenses;


      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML =
        `
          <td>
            ${formatMonth(month)}
          </td>


          <td class="positive-text">
            ${currency(
              totals.revenue
            )}
          </td>


          <td class="negative-text">
            ${currency(
              totals.expenses
            )}
          </td>


          <td
            class="${
              totals.profit >=
                0

                ? "fy-profit-positive"

                : "fy-profit-negative"
            }"
          >

            ${currency(
              totals.profit
            )}

          </td>


          <td>
            ${percent(
              totals.margin
            )}
          </td>
        `;


      fyTableBody.appendChild(
        row
      );

    }
  );


  const totalProfit =
    totalRevenue -
    totalExpenses;


  const totalMargin =
    totalRevenue >
      0

      ? (
          totalProfit /
          totalRevenue
        ) * 100

      : 0;


  fyRevenue.textContent =
    currency(
      totalRevenue
    );


  fyExpenses.textContent =
    currency(
      totalExpenses
    );


  fyProfit.textContent =
    currency(
      totalProfit
    );


  fyProfit.classList.remove(
    "positive-text",
    "negative-text"
  );


  fyProfit.classList.add(
    totalProfit >=
      0

      ? "positive-text"

      : "negative-text"
  );


  fyMargin.textContent =
    percent(
      totalMargin
    );


  if (
    totalProfit <
      0
  ) {

    fyMarginCard.style.background =
      "var(--red)";


    fyMarginCard.style.borderColor =
      "var(--red)";

  } else {

    fyMarginCard.style.background =
      "var(--navy)";


    fyMarginCard.style.borderColor =
      "var(--navy)";

  }


  renderFiscalBreakdowns(
    activeMonths
  );

}



/* ======================================================
   FISCAL BREAKDOWNS
====================================================== */

function renderFiscalBreakdowns(
  activeMonths
) {

  const revenueTotals =
    {};


  REVENUE_CATEGORIES.forEach(
    category => {

      revenueTotals[
        category
      ] =
        0;

    }
  );


  const expenseTotals =
    {};


  EXPENSE_CATEGORIES.forEach(
    category => {

      expenseTotals[
        category
      ] =
        0;

    }
  );


  activeMonths.forEach(
    month => {

      Object.entries(
        FIXED_EXPENSES
      ).forEach(
        ([
          category,
          amount
        ]) => {

          expenseTotals[
            category
          ] +=
            Number(
              amount
            );

        }
      );


      const monthly =
        getMonthlyTransactions(
          month
        );


      monthly.forEach(
        transaction => {

          if (
            transaction.type ===
            "revenue"
          ) {

            if (
              revenueTotals[
                transaction.category
              ] !==
              undefined
            ) {

              revenueTotals[
                transaction.category
              ] +=
                Number(
                  transaction.amount ||
                    0
                );

            }

          } else {

            if (
              expenseTotals[
                transaction.category
              ] !==
              undefined
            ) {

              expenseTotals[
                transaction.category
              ] +=
                Number(
                  transaction.amount ||
                    0
                );

            }

          }

        }
      );

    }
  );


  const revenueTotal =
    Object.values(
      revenueTotals
    ).reduce(
      (sum, value) =>
        sum +
        value,
      0
    );


  const expenseTotal =
    Object.values(
      expenseTotals
    ).reduce(
      (sum, value) =>
        sum +
        value,
      0
    );


  renderBreakdownList(
    fyRevenueBreakdown,
    revenueTotals,
    revenueTotal,
    "revenue"
  );


  renderBreakdownList(
    fyExpenseBreakdown,
    expenseTotals,
    expenseTotal,
    "expense"
  );

}

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
  setDoc,
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


const FIRST_MONTH =
  "2026-01";


const LAST_MONTH =
  "2031-12";


const FIRST_DATE =
  "2026-01-01";



/* ======================================================
   DEFAULT FIXED MONTHLY EXPENSES
====================================================== */

const DEFAULT_FIXED_COSTS = {

  rent:
    8938.90,

  w2:
    9583,

  utilities:
    1800

};



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

  "Building Supplies",

  "Other"

];


const MANUAL_EXPENSE_CATEGORIES = [

  "1099 Staff",

  "Tournaments",

  "Field Rentals",

  "Building Supplies",

  "Other"

];


const FIXED_EXPENSE_CATEGORY_NAMES = [

  "Rent",

  "W2 Staff",

  "Utilities"

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


if (
  monthToIndex(currentMonth) >
  monthToIndex(LAST_MONTH)
) {

  currentMonth =
    LAST_MONTH;

}


let transactions =
  [];


let monthlyMetrics =
  {};


let transactionsUnsubscribe =
  null;


let metricsUnsubscribe =
  null;


let performanceChart =
  null;


let revenueMixChart =
  null;



/* ======================================================
   DOM HELPER
====================================================== */

const $ =
  id =>
    document.getElementById(id);



/* ======================================================
   DOM
====================================================== */

/* LOGIN */

const loginScreen =
  $("loginScreen");


const appElement =
  $("app");


const loginForm =
  $("loginForm");


const loginError =
  $("loginError");


const logoutButton =
  $("logoutButton");



/* MONTH NAV */

const monthSelector =
  $("monthSelector");


const previousMonthButton =
  $("previousMonthButton");


const nextMonthButton =
  $("nextMonthButton");



/* NAV */

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
  $("dashboardMonthTitle");


const monthlyRevenue =
  $("monthlyRevenue");


const monthlyExpenses =
  $("monthlyExpenses");


const monthlyExpenseDetail =
  $("monthlyExpenseDetail");


const monthlyProfit =
  $("monthlyProfit");


const monthlyMargin =
  $("monthlyMargin");


const marginCard =
  $("marginCard");


const chartYearLabel =
  $("chartYearLabel");


const revenueMixTitle =
  $("revenueMixTitle");


const revenueMixEmpty =
  $("revenueMixEmpty");


const revenueBreakdown =
  $("revenueBreakdown");


const expenseBreakdown =
  $("expenseBreakdown");


const recentTransactions =
  $("recentTransactions");



/* ======================================================
   FIXED COSTS
====================================================== */

const fixedCostsForm =
  $("fixedCostsForm");


const fixedRent =
  $("fixedRent");


const fixedW2 =
  $("fixedW2");


const fixedUtilities =
  $("fixedUtilities");


const fixedCostTotal =
  $("fixedCostTotal");


const startingMonthlyCost =
  $("startingMonthlyCost");


const fixedCostsMessage =
  $("fixedCostsMessage");


const saveFixedCostsButton =
  $("saveFixedCostsButton");



/* ======================================================
   CFO METRICS
====================================================== */

const organicRevenueEl =
  $("organicRevenue");


const organicRevenueDetail =
  $("organicRevenueDetail");


const teamRevenueMixEl =
  $("teamRevenueMix");


const revenuePerPlayerEl =
  $("revenuePerPlayer");


const teamContributionEl =
  $("teamContribution");


const teamContributionDetail =
  $("teamContributionDetail");


const teamContributionMarginEl =
  $("teamContributionMargin");


const revenuePerLessonEl =
  $("revenuePerLesson");


const facilityUtilizationEl =
  $("facilityUtilization");


const revenuePerFacilityHourEl =
  $("revenuePerFacilityHour");


const membershipChurnEl =
  $("membershipChurn");


const breakEvenRevenueEl =
  $("breakEvenRevenue");


const metricsStatus =
  $("metricsStatus");



/* ======================================================
   MONTHLY BUSINESS INPUTS
====================================================== */

const monthlyMetricsForm =
  $("monthlyMetricsForm");


const monthlyMetricsMessage =
  $("monthlyMetricsMessage");


const saveMonthlyMetricsButton =
  $("saveMonthlyMetricsButton");


const metricFieldIds = [

  "activeTeams",

  "rosteredPlayers",

 "lessonHours",

  "programParticipants",

  "activeMemberships",

  "newMemberships",

  "membershipCancellations",

  "availableFacilityHours",

  "usedFacilityHours",

  "paidFacilityHours"

];



/* ======================================================
   TRANSACTIONS
====================================================== */

const transactionTypeFilter =
  $("transactionTypeFilter");


const transactionCategoryFilter =
  $("transactionCategoryFilter");


const transactionTableBody =
  $("transactionTableBody");


const transactionEmptyState =
  $("transactionEmptyState");



/* ======================================================
   YEAR
====================================================== */

const yearTitle =
  $("yearTitle");


const yearRevenue =
  $("yearRevenue");


const yearExpenses =
  $("yearExpenses");


const yearProfit =
  $("yearProfit");


const yearMargin =
  $("yearMargin");


const yearMarginCard =
  $("yearMarginCard");


const yearRevenueForecast =
  $("yearRevenueForecast");


const yearTableBody =
  $("yearTableBody");


const yearRevenueBreakdown =
  $("yearRevenueBreakdown");


const yearExpenseBreakdown =
  $("yearExpenseBreakdown");



/* ======================================================
   TRANSACTION MODAL
====================================================== */

const transactionModal =
  $("transactionModal");


const transactionForm =
  $("transactionForm");


const transactionModalTitle =
  $("transactionModalTitle");


const transactionId =
  $("transactionId");


const transactionType =
  $("transactionType");


const transactionAmount =
  $("transactionAmount");


const transactionDate =
  $("transactionDate");


const transactionDescription =
  $("transactionDescription");


const transactionCategory =
  $("transactionCategory");


const transactionNotes =
  $("transactionNotes");


const transactionFormError =
  $("transactionFormError");


const modalRevenueTypeButton =
  $("modalRevenueTypeButton");


const modalExpenseTypeButton =
  $("modalExpenseTypeButton");


const expenseAttributionFields =
  $("expenseAttributionFields");


const transactionCostType =
  $("transactionCostType");


const transactionBusinessArea =
  $("transactionBusinessArea");


const transactionTeamProgram =
  $("transactionTeamProgram");



/* ======================================================
   HELPERS
====================================================== */

function currency(
  value
) {

  return new Intl.NumberFormat(
    "en-US",
    {
      style:
        "currency",

      currency:
        "USD"
    }
  ).format(
    Number(
      value ||
      0
    )
  );

}



function percent(
  value
) {

  return (
    `${Number(
      value ||
      0
    ).toFixed(1)}%`
  );

}



function getCurrentMonth() {

  const now =
    new Date();


  return (
    `${now.getFullYear()}-` +
    `${String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    )}`
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

  if (
    !dateString
  ) {

    return "";

  }


  return dateString.slice(
    0,
    7
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
    year *
    12 +
    month -
    1
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

  if (
    !dateString
  ) {

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

  return String(
    value
  )

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



function yearFromMonth(
  monthKey
) {

  return Number(
    monthKey.slice(
      0,
      4
    )
  );

}



function buildYearMonths(
  year
) {

  return Array.from(
    {
      length:
        12
    },
    (
      _,
      index
    ) => {

      return (
        `${year}-${String(
          index + 1
        ).padStart(
          2,
          "0"
        )}`
      );

    }
  );

}



function normalizeExpenseCategory(
  category
) {

  if (
    category ===
    "Misc."
  ) {

    return "Other";

  }


  return category;

}



function isFixedExpenseCategory(
  category
) {

  return FIXED_EXPENSE_CATEGORY_NAMES.includes(
    normalizeExpenseCategory(
      category
    )
  );

}



/* ======================================================
   FIXED COST HELPERS
====================================================== */

function getFixedCostsForMonth(
  monthKey
) {

  const metrics =
    monthlyMetrics[
      monthKey
    ] ||
    {};


  return {

    rent:
      metrics.fixedRent !== undefined

        ? Number(
            metrics.fixedRent
          )

        : DEFAULT_FIXED_COSTS.rent,


    w2:
      metrics.fixedW2 !== undefined

        ? Number(
            metrics.fixedW2
          )

        : DEFAULT_FIXED_COSTS.w2,


    utilities:
      metrics.fixedUtilities !== undefined

        ? Number(
            metrics.fixedUtilities
          )

        : DEFAULT_FIXED_COSTS.utilities

  };

}



function getFixedCostTotal(
  monthKey
) {

  const costs =
    getFixedCostsForMonth(
      monthKey
    );


  return (
    costs.rent +
    costs.w2 +
    costs.utilities
  );

}



function updateFixedCostPreview() {

  const rent =
    Number(
      fixedRent.value ||
      0
    );


  const w2 =
    Number(
      fixedW2.value ||
      0
    );


  const utilities =
    Number(
      fixedUtilities.value ||
      0
    );


  const total =
    rent +
    w2 +
    utilities;


  fixedCostTotal.textContent =
    currency(
      total
    );


  startingMonthlyCost.textContent =
    `-${currency(
      total
    )}`;

}



function loadFixedCostForm() {

  const costs =
    getFixedCostsForMonth(
      currentMonth
    );


  fixedRent.value =
    costs.rent.toFixed(
      2
    );


  fixedW2.value =
    costs.w2.toFixed(
      2
    );


  fixedUtilities.value =
    costs.utilities.toFixed(
      2
    );


  fixedCostsMessage.textContent =
    "";


  updateFixedCostPreview();

}



[
  fixedRent,
  fixedW2,
  fixedUtilities
].forEach(
  element => {

    element.addEventListener(
      "input",
      updateFixedCostPreview
    );

  }
);



fixedCostsForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    fixedCostsMessage.textContent =
      "";


    saveFixedCostsButton.disabled =
      true;


    const rent =
      Number(
        fixedRent.value ||
        0
      );


    const w2 =
      Number(
        fixedW2.value ||
        0
      );


    const utilities =
      Number(
        fixedUtilities.value ||
        0
      );


    if (
      rent <
      0 ||
      w2 <
      0 ||
      utilities <
      0
    ) {

      fixedCostsMessage.textContent =
        "Fixed costs cannot be negative.";


      saveFixedCostsButton.disabled =
        false;


      return;

    }


    try {

      await setDoc(

        doc(
          db,
          "businesses",
          BUSINESS_ID,
          "monthlyMetrics",
          currentMonth
        ),

        {
          month:
            currentMonth,

          year:
            yearFromMonth(
              currentMonth
            ),

          fixedRent:
            rent,

          fixedW2:
            w2,

          fixedUtilities:
            utilities,

          updatedAt:
            serverTimestamp()
        },

        {
          merge:
            true
        }

      );


      fixedCostsMessage.textContent =
        "Fixed costs saved.";

    } catch (
      error
    ) {

      console.error(
        error
      );


      fixedCostsMessage.textContent =
        "Unable to save fixed costs.";

    } finally {

      saveFixedCostsButton.disabled =
        false;

    }

  }
);



/* ======================================================
   MONTH SELECTOR
====================================================== */

function buildMonthSelector() {

  monthSelector.innerHTML =
    "";


  const start =
    new Date(
      2026,
      0,
      1
    );


  const end =
    new Date(
      2031,
      11,
      1
    );


  const cursor =
    new Date(
      start
    );


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



function moveMonth(
  offset
) {

  const [
    year,
    month
  ] =
    currentMonth
      .split("-")
      .map(Number);


  const newDate =
    new Date(
      year,
      month - 1 +
      offset,
      1
    );


  const newMonth =
    `${newDate.getFullYear()}-${String(
      newDate.getMonth() + 1
    ).padStart(
      2,
      "0"
    )}`;


  if (
    monthToIndex(
      newMonth
    ) <
    monthToIndex(
      FIRST_MONTH
    )
  ) {

    return;

  }


  if (
    monthToIndex(
      newMonth
    ) >
    monthToIndex(
      LAST_MONTH
    )
  ) {

    return;

  }


  currentMonth =
    newMonth;


  monthSelector.value =
    currentMonth;


  renderEverything();

}



function updateMonthNavigation() {

  previousMonthButton.disabled =
    monthToIndex(
      currentMonth
    ) <=
    monthToIndex(
      FIRST_MONTH
    );


  nextMonthButton.disabled =
    monthToIndex(
      currentMonth
    ) >=
    monthToIndex(
      LAST_MONTH
    );

}



previousMonthButton.addEventListener(
  "click",
  () => {

    moveMonth(
      -1
    );

  }
);



nextMonthButton.addEventListener(
  "click",
  () => {

    moveMonth(
      1
    );

  }
);



monthSelector.addEventListener(
  "change",
  event => {

    currentMonth =
      event.target.value;


    renderEverything();

  }
);



/* ======================================================
   FILTER CATEGORIES
====================================================== */

function buildFilterCategories() {

  transactionCategoryFilter.innerHTML =
    '<option value="all">All Categories</option>';


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
   AUTHENTICATION
====================================================== */

loginForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    loginError.textContent =
      "";


    try {

      await signInWithEmailAndPassword(

        auth,

        $("email")
          .value
          .trim(),

        $("password")
          .value

      );

    } catch (
      error
    ) {

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

    if (
      !user
    ) {

      if (
        transactionsUnsubscribe
      ) {

        transactionsUnsubscribe();

      }


      if (
        metricsUnsubscribe
      ) {

        metricsUnsubscribe();

      }


      transactionsUnsubscribe =
        null;


      metricsUnsubscribe =
        null;


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

  listenForMonthlyMetrics();

}



/* ======================================================
   NAVIGATION
====================================================== */

navButtons.forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

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


        const target =
          button.dataset.page;


        const targetPage =
          $(
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

          renderYear();

        }


        if (
          target ===
          "dashboard"
        ) {

          setTimeout(
            renderCharts,
            10
          );

        }

      }
    );

  }
);



/* ======================================================
   SELECTED MONTH DISPLAY
====================================================== */

function updateSelectedMonthDisplay() {

  const year =
    yearFromMonth(
      currentMonth
    );


  dashboardMonthTitle.textContent =
    formatMonth(
      currentMonth
    );


  revenueMixTitle.textContent =
    `${shortMonth(
      currentMonth
    )} Revenue`;


  chartYearLabel.textContent =
    year;


  yearTitle.textContent =
    `${year} Financial Performance`;


  monthSelector.value =
    currentMonth;


  updateMonthNavigation();

  loadFixedCostForm();

  loadMonthlyMetricsForm();

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



function listenForMonthlyMetrics() {

  if (
    metricsUnsubscribe
  ) {

    metricsUnsubscribe();

  }


  const metricsRef =
    collection(
      db,
      "businesses",
      BUSINESS_ID,
      "monthlyMetrics"
    );


  metricsUnsubscribe =
    onSnapshot(

      metricsRef,

      snapshot => {

        monthlyMetrics =
          {};


        snapshot.docs.forEach(
          documentSnapshot => {

            monthlyMetrics[
              documentSnapshot.id
            ] = {

              ...documentSnapshot.data()

            };

          }
        );


        renderEverything();

      },

      error => {

        console.error(
          "Metrics listener error:",
          error
        );

      }

    );

}



/* ======================================================
   TRANSACTION DATA
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



function getRevenueByCategory(
  monthKey
) {

  const totals =
    Object.fromEntries(

      REVENUE_CATEGORIES.map(
        category => [

          category,

          0

        ]
      )

    );


  getMonthlyTransactions(
    monthKey
  )

    .filter(
      transaction =>
        transaction.type ===
        "revenue"
    )

    .forEach(
      transaction => {

        if (
          totals[
            transaction.category
          ] !==
          undefined
        ) {

          totals[
            transaction.category
          ] +=
            Number(
              transaction.amount ||
              0
            );

        }

      }
    );


  return totals;

}



function getExpenseByCategory(
  monthKey
) {

  const totals =
    Object.fromEntries(

      EXPENSE_CATEGORIES.map(
        category => [

          category,

          0

        ]
      )

    );


  const fixedCosts =
    getFixedCostsForMonth(
      monthKey
    );


  totals[
    "Rent"
  ] =
    fixedCosts.rent;


  totals[
    "W2 Staff"
  ] =
    fixedCosts.w2;


  totals[
    "Utilities"
  ] =
    fixedCosts.utilities;


  getMonthlyTransactions(
    monthKey
  )

    .filter(
      transaction =>
        transaction.type ===
        "expense"
    )

    .forEach(
      transaction => {

        const category =
          normalizeExpenseCategory(
            transaction.category
          );


        /*
          Rent, W2 and Utilities are handled
          through the monthly fixed-cost panel.
          Ignore legacy manual entries in these categories
          so they are not double-counted.
        */

        if (
          isFixedExpenseCategory(
            category
          )
        ) {

          return;

        }


        if (
          totals[
            category
          ] !==
          undefined
        ) {

          totals[
            category
          ] +=
            Number(
              transaction.amount ||
              0
            );

        }

      }
    );


  return totals;

}



/* ======================================================
   EXPENSE ATTRIBUTION
====================================================== */

function inferBusinessArea(
  transaction
) {

  if (
    transaction.businessArea
  ) {

    return transaction.businessArea;

  }


  const category =
    normalizeExpenseCategory(
      transaction.category
    );


  if (
    category ===
    "Tournaments" ||
    category ===
    "Field Rentals"
  ) {

    return "Teams";

  }


  if (
    category ===
    "Building Supplies"
  ) {

    return "Facility";

  }


  return "General";

}



function inferCostType(
  transaction
) {

  if (
    transaction.costType
  ) {

    return transaction.costType;

  }


  const category =
    normalizeExpenseCategory(
      transaction.category
    );


  if (
    category ===
    "Tournaments" ||
    category ===
    "Field Rentals"
  ) {

    return "direct";

  }


  return "overhead";

}



/* ======================================================
   MONTH CALCULATIONS
====================================================== */

function calculateMonth(
  monthKey
) {

  const monthly =
    getMonthlyTransactions(
      monthKey
    );


  const revenue =
    monthly

      .filter(
        transaction =>
          transaction.type ===
          "revenue"
      )

      .reduce(
        (
          sum,
          transaction
        ) => {

          return (
            sum +
            Number(
              transaction.amount ||
              0
            )
          );

        },
        0
      );


  const manualExpenseTransactions =
    monthly.filter(
      transaction => {

        return (
          transaction.type ===
          "expense" &&
          !isFixedExpenseCategory(
            transaction.category
          )
        );

      }
    );


  const manualExpenses =
    manualExpenseTransactions.reduce(
      (
        sum,
        transaction
      ) => {

        return (
          sum +
          Number(
            transaction.amount ||
            0
          )
        );

      },
      0
    );


  const fixedExpenses =
    getFixedCostTotal(
      monthKey
    );


  const expenses =
    fixedExpenses +
    manualExpenses;


  const profit =
    revenue -
    expenses;


  const margin =
    revenue >
    0

      ? (
          profit /
          revenue
        ) *
        100

      : 0;


  const revenueCats =
    getRevenueByCategory(
      monthKey
    );


  const teamRevenue =
    revenueCats[
      "Team Revenue"
    ] ||
    0;


  const organicRevenue =
    revenue -
    teamRevenue;


  const teamRevenueMix =
    revenue >
    0

      ? (
          teamRevenue /
          revenue
        ) *
        100

      : 0;


  const directExpenses =
    manualExpenseTransactions

      .filter(
        transaction => {

          return (
            inferCostType(
              transaction
            ) ===
            "direct"
          );

        }
      )

      .reduce(
        (
          sum,
          transaction
        ) => {

          return (
            sum +
            Number(
              transaction.amount ||
              0
            )
          );

        },
        0
      );


  const manualOverhead =
    manualExpenseTransactions

      .filter(
        transaction => {

          return (
            inferCostType(
              transaction
            ) !==
            "direct"
          );

        }
      )

      .reduce(
        (
          sum,
          transaction
        ) => {

          return (
            sum +
            Number(
              transaction.amount ||
              0
            )
          );

        },
        0
      );


  const overhead =
    fixedExpenses +
    manualOverhead;


  const teamDirectCosts =
    manualExpenseTransactions

      .filter(
        transaction => {

          return (
            inferCostType(
              transaction
            ) ===
            "direct" &&

            inferBusinessArea(
              transaction
            ) ===
            "Teams"
          );

        }
      )

      .reduce(
        (
          sum,
          transaction
        ) => {

          return (
            sum +
            Number(
              transaction.amount ||
              0
            )
          );

        },
        0
      );


  const teamContribution =
    teamRevenue -
    teamDirectCosts;


  const teamContributionMargin =
    teamRevenue >
    0

      ? (
          teamContribution /
          teamRevenue
        ) *
        100

      : NaN;


  const contributionMarginRatio =
    revenue >
    0

      ? Math.max(
          0,
          1 -
          (
            directExpenses /
            revenue
          )
        )

      : 0;


  const breakEvenRevenue =
    contributionMarginRatio >
    0

      ? (
          overhead /
          contributionMarginRatio
        )

      : NaN;


  return {

    revenue,

    manualExpenses,

    fixedExpenses,

    expenses,

    profit,

    margin,

    revenueCats,

    teamRevenue,

    organicRevenue,

    teamRevenueMix,

    directExpenses,

    overhead,

    teamDirectCosts,

    teamContribution,

    teamContributionMargin,

    breakEvenRevenue

  };

}



/* ======================================================
   DASHBOARD
====================================================== */

function currentMetrics() {

  return (
    monthlyMetrics[
      currentMonth
    ] ||
    {}
  );

}



function renderEverything() {

  updateSelectedMonthDisplay();

  renderDashboard();

  renderTransactions();

  renderYear();


  if (
    $("dashboardPage")
      .classList
      .contains(
        "active-page"
      )
  ) {

    setTimeout(
      renderCharts,
      10
    );

  }

}



function renderDashboard() {

  const totals =
    calculateMonth(
      currentMonth
    );


  const metrics =
    currentMetrics();


  monthlyRevenue.textContent =
    currency(
      totals.revenue
    );


  monthlyExpenses.textContent =
    currency(
      totals.expenses
    );


  monthlyExpenseDetail.textContent =
    `${currency(
      totals.fixedExpenses
    )} fixed starting cost + ${currency(
      totals.manualExpenses
    )} variable expenses`;


  monthlyProfit.textContent =
    currency(
      totals.profit
    );


  monthlyProfit.className =
    totals.profit >=
    0

      ? "positive-text"

      : "negative-text";


  monthlyMargin.textContent =
    totals.revenue >
    0

      ? percent(
          totals.margin
        )

      : "—";


  marginCard.classList.toggle(
    "loss-card",
    totals.profit <
    0
  );


  const fixedCosts =
    getFixedCostsForMonth(
      currentMonth
    );


  fixedCostTotal.textContent =
    currency(
      totals.fixedExpenses
    );


  startingMonthlyCost.textContent =
    `-${currency(
      totals.fixedExpenses
    )}`;


  /*
    ORGANIC REVENUE
  */

  organicRevenueEl.textContent =
    currency(
      totals.organicRevenue
    );


  organicRevenueDetail.textContent =
    `${percent(
      totals.revenue >
      0

        ? (
            totals.organicRevenue /
            totals.revenue
          ) *
          100

        : 0
    )} of revenue`;


  /*
    TEAM MIX
  */

  teamRevenueMixEl.textContent =
    percent(
      totals.teamRevenueMix
    );


  /*
    OPERATING INPUT VALUES
  */

  const players =
    Number(
      metrics.rosteredPlayers ||
      0
    );


  const lessonHours =
  Number(
    metrics.lessonHours ||
    0
  );


  const availableHours =
    Number(
      metrics.availableFacilityHours ||
      0
    );


  const usedHours =
    Number(
      metrics.usedFacilityHours ||
      0
    );


  const activeMembers =
    Number(
      metrics.activeMemberships ||
      0
    );


  const newMembers =
    Number(
      metrics.newMemberships ||
      0
    );


  const cancellations =
    Number(
      metrics.membershipCancellations ||
      0
    );


  /*
    REVENUE PER PLAYER
  */

 revenuePerLessonEl.textContent =
  lessonHours >
  0

    ? currency(
        (
          totals.revenueCats[
            "Lessons"
          ] ||
          0
        ) /
        lessonHours
      )

    : "—";


  /*
    TEAM CONTRIBUTION
  */

  teamContributionEl.textContent =
    totals.teamRevenue >
    0

      ? currency(
          totals.teamContribution
        )

      : "—";


  teamContributionDetail.textContent =
    totals.teamRevenue >
    0

      ? `${currency(
          totals.teamDirectCosts
        )} direct team costs`

      : "Add team revenue and direct team expenses";


  /*
    TEAM MARGIN
  */

  teamContributionMarginEl.textContent =
    Number.isFinite(
      totals.teamContributionMargin
    )

      ? percent(
          totals.teamContributionMargin
        )

      : "—";


  /*
    LESSON REVENUE PER LESSON
  */

  revenuePerLessonEl.textContent =
    lessons >
    0

      ? currency(
          (
            totals.revenueCats[
              "Lessons"
            ] ||
            0
          ) /
          lessons
        )

      : "—";


  /*
    FACILITY UTILIZATION
  */

  facilityUtilizationEl.textContent =
    availableHours >
    0

      ? percent(
          (
            usedHours /
            availableHours
          ) *
          100
        )

      : "—";


  /*
    ORGANIC REVENUE PER AVAILABLE HOUR
  */

  revenuePerFacilityHourEl.textContent =
    availableHours >
    0

      ? currency(
          totals.organicRevenue /
          availableHours
        )

      : "—";


  /*
    MEMBERSHIP CHURN
  */

  const estimatedOpeningMembers =
    Math.max(
      0,
      activeMembers -
      newMembers +
      cancellations
    );


  membershipChurnEl.textContent =
    estimatedOpeningMembers >
    0

      ? percent(
          (
            cancellations /
            estimatedOpeningMembers
          ) *
          100
        )

      : "—";


  /*
    BREAK EVEN
  */

  breakEvenRevenueEl.textContent =
    Number.isFinite(
      totals.breakEvenRevenue
    )

      ? currency(
          totals.breakEvenRevenue
        )

      : currency(
          totals.fixedExpenses
        );


  /*
    MONTHLY INPUT STATUS
  */

  const hasOperatingMetrics =
    metricFieldIds.some(
      id => {

        return (
          monthlyMetrics[
            currentMonth
          ] &&
          monthlyMetrics[
            currentMonth
          ][
            id
          ] !==
          undefined
        );

      }
    );


  metricsStatus.textContent =
    hasOperatingMetrics

      ? "Inputs saved"

      : "Monthly inputs not saved";


  metricsStatus.classList.toggle(
    "saved-badge",
    hasOperatingMetrics
  );


  /*
    BREAKDOWNS
  */

  renderBreakdownList(

    revenueBreakdown,

    totals.revenueCats,

    totals.revenue,

    "revenue"

  );


  renderBreakdownList(

    expenseBreakdown,

    getExpenseByCategory(
      currentMonth
    ),

    totals.expenses,

    "expense"

  );


  renderRecentTransactions();

}



/* ======================================================
   MONTHLY BUSINESS INPUT FORM
====================================================== */

function loadMonthlyMetricsForm() {

  const metrics =
    monthlyMetrics[
      currentMonth
    ] ||
    {};


  metricFieldIds.forEach(
    id => {

      const element =
        $(
          id
        );


      if (
        element
      ) {

        element.value =
          metrics[
            id
          ] ??
          "";

      }

    }
  );


  monthlyMetricsMessage.textContent =
    "";

}



monthlyMetricsForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    monthlyMetricsMessage.textContent =
      "";


    saveMonthlyMetricsButton.disabled =
      true;


    const data = {

      month:
        currentMonth,

      year:
        yearFromMonth(
          currentMonth
        ),

      updatedAt:
        serverTimestamp()

    };


    metricFieldIds.forEach(
      id => {

        data[
          id
        ] =
          Number(
            $(
              id
            ).value ||
            0
          );

      }
    );


    if (
      data.availableFacilityHours >
      0 &&
      data.usedFacilityHours >
      data.availableFacilityHours
    ) {

      monthlyMetricsMessage.textContent =
        "Used hours cannot exceed available hours.";


      saveMonthlyMetricsButton.disabled =
        false;


      return;

    }


    try {

      await setDoc(

        doc(
          db,
          "businesses",
          BUSINESS_ID,
          "monthlyMetrics",
          currentMonth
        ),

        data,

        {
          merge:
            true
        }

      );


      monthlyMetricsMessage.textContent =
        "Monthly inputs saved.";

    } catch (
      error
    ) {

      console.error(
        error
      );


      monthlyMetricsMessage.textContent =
        "Unable to save monthly inputs.";

    } finally {

      saveMonthlyMetricsButton.disabled =
        false;

    }

  }
);



/* ======================================================
   CHARTS
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

  renderPerformanceChart();

  renderRevenueMixChart();

}



function renderPerformanceChart() {

  const canvas =
    $("performanceChart");


  if (
    !canvas ||
    typeof Chart ===
    "undefined"
  ) {

    return;

  }


  if (
    performanceChart
  ) {

    performanceChart.destroy();

  }


  const months =
    buildYearMonths(
      yearFromMonth(
        currentMonth
      )
    );


  const revenueData =
    months.map(
      month => {

        return calculateMonth(
          month
        ).revenue;

      }
    );


  const expenseData =
    months.map(
      month => {

        return calculateMonth(
          month
        ).expenses;

      }
    );


  const profitData =
    months.map(
      month => {

        return calculateMonth(
          month
        ).profit;

      }
    );


  performanceChart =
    new Chart(

      canvas,

      {

        type:
          "bar",

        data: {

          labels:
            months.map(
              shortMonth
            ),

          datasets: [

            {
              label:
                "Revenue",

              data:
                revenueData,

              backgroundColor:
                "#177a49"
            },

            {
              label:
                "Expenses",

              data:
                expenseData,

              backgroundColor:
                "#c0261c"
            },

            {
              label:
                "Profit",

              data:
                profitData,

              type:
                "line",

              borderColor:
                "#17375e",

              backgroundColor:
                "#17375e",

              tension:
                0.25
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
                "bottom"

            },

            tooltip: {

              callbacks: {

                label:
                  context => {

                    return (
                      `${context.dataset.label}: ${currency(
                        context.raw
                      )}`
                    );

                  }

              }

            }

          },

          scales: {

            y: {

              beginAtZero:
                true,

              ticks: {

                callback:
                  value => {

                    return (
                      `$${Math.round(
                        value /
                        1000
                      )}k`
                    );

                  }

              }

            },

            x: {

              grid: {

                display:
                  false

              }

            }

          }

        }

      }

    );

}



function renderRevenueMixChart() {

  const canvas =
    $("revenueMixChart");


  if (
    !canvas ||
    typeof Chart ===
    "undefined"
  ) {

    return;

  }


  if (
    revenueMixChart
  ) {

    revenueMixChart.destroy();

  }


  const categories =
    getRevenueByCategory(
      currentMonth
    );


  const entries =
    Object.entries(
      categories
    ).filter(
      (
        [
          ,
          value
        ]
      ) => {

        return (
          value >
          0
        );

      }
    );


  revenueMixEmpty.classList.toggle(
    "hidden",
    entries.length >
    0
  );


  canvas.classList.toggle(
    "hidden",
    entries.length ===
    0
  );


  if (
    !entries.length
  ) {

    return;

  }


  revenueMixChart =
    new Chart(

      canvas,

      {

        type:
          "doughnut",

        data: {

          labels:
            entries.map(
              entry => {

                return entry[
                  0
                ];

              }
            ),

          datasets: [

            {

              data:
                entries.map(
                  entry => {

                    return entry[
                      1
                    ];

                  }
                ),

              backgroundColor: [

                "#17375e",

                "#177a49",

                "#4c78a8",

                "#7b61a8",

                "#d18c38",

                "#5b6573"

              ]

            }

          ]

        },

        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,

          cutout:
            "66%",

          plugins: {

            legend: {

              position:
                "bottom",

              labels: {

                boxWidth:
                  12

              }

            },

            tooltip: {

              callbacks: {

                label:
                  context => {

                    return (
                      `${context.label}: ${currency(
                        context.raw
                      )}`
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
   BREAKDOWNS
====================================================== */

function renderBreakdownList(
  container,
  data,
  total,
  type
) {

  container.innerHTML =
    "";


  Object.entries(
    data
  ).forEach(
    (
      [
        name,
        value
      ]
    ) => {

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "breakdown-row";


      const percentage =
        total >
        0

          ? (
              value /
              total
            ) *
            100

          : 0;


      row.innerHTML = `

        <div class="breakdown-top">

          <span class="breakdown-name">
            ${escapeHtml(
              name
            )}
          </span>

          <span class="breakdown-value">

            ${currency(
              value
            )}

            <em>
              ${percentage.toFixed(
                1
              )}%
            </em>

          </span>

        </div>


        <div class="breakdown-track">

          <div
            class="breakdown-fill ${type}"
            style="width:${Math.min(
              100,
              percentage
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

  const list =
    getMonthlyTransactions(
      currentMonth
    ).slice(
      0,
      6
    );


  recentTransactions.innerHTML =
    "";


  if (
    !list.length
  ) {

    recentTransactions.innerHTML =
      '<div class="empty-state">No manual transactions for this month.</div>';


    return;

  }


  list.forEach(
    transaction => {

      const element =
        document.createElement(
          "div"
        );


      element.className =
        "recent-transaction";


      element.innerHTML = `

        <div>

          <div class="recent-description">

            ${escapeHtml(
              transaction.description
            )}

          </div>

          <div class="recent-meta">

            ${formatDate(
              transaction.date
            )}

            ·

            ${escapeHtml(
              normalizeExpenseCategory(
                transaction.category
              )
            )}

            ${
              transaction.type ===
              "expense"

                ? ` · ${escapeHtml(
                    inferBusinessArea(
                      transaction
                    )
                  )}`

                : ""
            }

          </div>

        </div>


        <div
          class="recent-amount ${
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

        </div>

      `;


      recentTransactions.appendChild(
        element
      );

    }
  );

}



/* ======================================================
   TRANSACTION TABLE
====================================================== */

function renderTransactions() {

  const typeFilter =
    transactionTypeFilter.value;


  const categoryFilter =
    transactionCategoryFilter.value;


  const rows =
    getMonthlyTransactions(
      currentMonth
    ).filter(
      transaction => {

        const typeMatches =
          typeFilter ===
          "all" ||
          transaction.type ===
          typeFilter;


        const categoryMatches =
          categoryFilter ===
          "all" ||
          normalizeExpenseCategory(
            transaction.category
          ) ===
          categoryFilter;


        return (
          typeMatches &&
          categoryMatches
        );

      }
    );


  transactionTableBody.innerHTML =
    "";


  transactionEmptyState.classList.toggle(
    "hidden",
    rows.length >
    0
  );


  rows.forEach(
    transaction => {

      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td>
          ${formatDate(
            transaction.date
          )}
        </td>


        <td>

          <strong>
            ${escapeHtml(
              transaction.description
            )}
          </strong>

          ${
            transaction.notes

              ? `
                <div class="table-note">
                  ${escapeHtml(
                    transaction.notes
                  )}
                </div>
              `

              : ""
          }

        </td>


        <td>

          <span
            class="type-pill ${transaction.type}"
          >
            ${transaction.type}
          </span>

        </td>


        <td>
          ${escapeHtml(
            normalizeExpenseCategory(
              transaction.category
            )
          )}
        </td>


        <td>

          ${
            transaction.type ===
            "expense"

              ? escapeHtml(
                  inferBusinessArea(
                    transaction
                  )
                )

              : "—"
          }

        </td>


        <td
          class="${
            transaction.type ===
            "revenue"

              ? "positive-text"

              : "negative-text"
          }"
        >
          ${currency(
            transaction.amount
          )}
        </td>


        <td>

          <div class="transaction-actions">

            <button
              class="small-button edit-button"
              data-id="${transaction.id}"
            >
              Edit
            </button>


            <button
              class="small-button delete"
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


  document.querySelectorAll(
    ".edit-button"
  ).forEach(
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


  document.querySelectorAll(
    ".small-button.delete"
  ).forEach(
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
   OPEN TRANSACTION MODAL
====================================================== */

[
  "dashboardAddRevenueButton",
  "transactionsAddRevenueButton"
].forEach(
  id => {

    $(
      id
    ).addEventListener(
      "click",
      () => {

        openNewTransaction(
          "revenue"
        );

      }
    );

  }
);



[
  "dashboardAddExpenseButton",
  "transactionsAddExpenseButton"
].forEach(
  id => {

    $(
      id
    ).addEventListener(
      "click",
      () => {

        openNewTransaction(
          "expense"
        );

      }
    );

  }
);



document.querySelectorAll(
  "[data-close-transaction-modal]"
).forEach(
  element => {

    element.addEventListener(
      "click",
      closeTransactionModal
    );

  }
);



modalRevenueTypeButton.addEventListener(
  "click",
  () => {

    setModalType(
      "revenue"
    );

  }
);



modalExpenseTypeButton.addEventListener(
  "click",
  () => {

    setModalType(
      "expense"
    );

  }
);



/* ======================================================
   MODAL TYPE
====================================================== */

function setModalType(
  type
) {

  transactionType.value =
    type;


  transactionModalTitle.textContent =
    type ===
    "revenue"

      ? "Add Revenue"

      : "Add Expense";


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


  expenseAttributionFields.classList.toggle(
    "hidden",
    type !==
    "expense"
  );


  buildTransactionCategories(
    type
  );

}



function buildTransactionCategories(
  type
) {

  const categories =
    type ===
    "revenue"

      ? REVENUE_CATEGORIES

      : MANUAL_EXPENSE_CATEGORIES;


  const previousCategory =
    normalizeExpenseCategory(
      transactionCategory.value
    );


  transactionCategory.innerHTML =
    "";


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


      transactionCategory.appendChild(
        option
      );

    }
  );


  if (
    categories.includes(
      previousCategory
    )
  ) {

    transactionCategory.value =
      previousCategory;

  }

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


  transactionDate.value =
    currentMonth ===
    getCurrentMonth()

      ? todayString()

      : `${currentMonth}-01`;


  transactionFormError.textContent =
    "";


  transactionCostType.value =
    "direct";


  transactionBusinessArea.value =
    type ===
    "expense"

      ? "Teams"

      : "General";


  setModalType(
    type
  );


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


  transactionForm.reset();


  transactionId.value =
    transaction.id;


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


  setModalType(
    transaction.type
  );


  const category =
    normalizeExpenseCategory(
      transaction.category
    );


  const categoryExists =
    [
      ...transactionCategory.options
    ].some(
      option =>
        option.value ===
        category
    );


  if (
    categoryExists
  ) {

    transactionCategory.value =
      category;

  }


  if (
    transaction.type ===
    "expense"
  ) {

    transactionCostType.value =
      inferCostType(
        transaction
      );


    transactionBusinessArea.value =
      inferBusinessArea(
        transaction
      );


    transactionTeamProgram.value =
      transaction.teamProgram ||
      "";

  }


  transactionModalTitle.textContent =
    transaction.type ===
    "revenue"

      ? "Edit Revenue"

      : "Edit Expense";


  transactionModal.classList.remove(
    "hidden"
  );

}



function closeTransactionModal() {

  transactionModal.classList.add(
    "hidden"
  );


  transactionFormError.textContent =
    "";

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
      date <
      FIRST_DATE
    ) {

      transactionFormError.textContent =
        "Financial tracking begins January 1, 2026.";


      return;

    }


    if (
      !description
    ) {

      transactionFormError.textContent =
        "Enter a vendor or description.";


      return;

    }


    const data = {

      type,

      category,

      amount,

      description,

      date,

      month:
        getMonthFromDate(
          date
        ),

      notes:
        transactionNotes
          .value
          .trim(),

      updatedAt:
        serverTimestamp()

    };


    if (
      type ===
      "expense"
    ) {

      data.costType =
        transactionCostType.value;


      data.businessArea =
        transactionBusinessArea.value;


      data.teamProgram =
        transactionTeamProgram
          .value
          .trim();

    } else {

      data.costType =
        "";


      data.businessArea =
        "";


      data.teamProgram =
        "";

    }


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
        data.month;


      monthSelector.value =
        currentMonth;


      closeTransactionModal();

    } catch (
      error
    ) {

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

  } catch (
    error
  ) {

    console.error(
      error
    );


    alert(
      "Unable to delete transaction."
    );

  }

}



/* ======================================================
   YEAR REPORT
====================================================== */

function renderYear() {

  const year =
    yearFromMonth(
      currentMonth
    );


  const months =
    buildYearMonths(
      year
    );


  const selectedIndex =
    monthToIndex(
      currentMonth
    );


  const activeMonths =
    months.filter(
      month => {

        return (
          monthToIndex(
            month
          ) <=
          selectedIndex
        );

      }
    );


  let totalRevenue =
    0;


  let totalExpenses =
    0;


  yearTableBody.innerHTML =
    "";


  months.forEach(
    month => {

      const active =
        monthToIndex(
          month
        ) <=
        selectedIndex;


      const totals =
        calculateMonth(
          month
        );


      if (
        active
      ) {

        totalRevenue +=
          totals.revenue;


        totalExpenses +=
          totals.expenses;

      }


      const row =
        document.createElement(
          "tr"
        );


      row.classList.toggle(
        "future-row",
        !active
      );


      row.innerHTML = `

        <td>
          ${formatMonth(
            month
          )}
        </td>


        <td class="positive-text">

          ${
            active

              ? currency(
                  totals.revenue
                )

              : "—"
          }

        </td>


        <td class="negative-text">

          ${
            active

              ? currency(
                  totals.expenses
                )

              : "—"
          }

        </td>


        <td
          class="${
            active

              ? (
                  totals.profit >=
                  0

                    ? "fy-profit-positive"

                    : "fy-profit-negative"
                )

              : ""
          }"
        >

          ${
            active

              ? currency(
                  totals.profit
                )

              : "—"
          }

        </td>


        <td>

          ${
            active &&
            totals.revenue >
            0

              ? percent(
                  totals.margin
                )

              : "—"
          }

        </td>


        <td>

          <span
            class="status-pill ${
              active

                ? "actual"

                : "future"
            }"
          >

            ${
              active

                ? "Actual"

                : "Future"
            }

          </span>

        </td>

      `;


      yearTableBody.appendChild(
        row
      );

    }
  );


  const profit =
    totalRevenue -
    totalExpenses;


  const margin =
    totalRevenue >
    0

      ? (
          profit /
          totalRevenue
        ) *
        100

      : 0;


  const elapsedMonths =
    Math.max(
      1,
      activeMonths.length
    );


  const revenueForecast =
    (
      totalRevenue /
      elapsedMonths
    ) *
    12;


  yearTitle.textContent =
    `${year} Financial Performance`;


  yearRevenue.textContent =
    currency(
      totalRevenue
    );


  yearExpenses.textContent =
    currency(
      totalExpenses
    );


  yearProfit.textContent =
    currency(
      profit
    );


  yearProfit.className =
    profit >=
    0

      ? "positive-text"

      : "negative-text";


  yearMargin.textContent =
    totalRevenue >
    0

      ? percent(
          margin
        )

      : "—";


  yearMarginCard.classList.toggle(
    "loss-card",
    profit <
    0
  );


  yearRevenueForecast.textContent =
    currency(
      revenueForecast
    );


  const revenueTotals =
    Object.fromEntries(

      REVENUE_CATEGORIES.map(
        category => [

          category,

          0

        ]
      )

    );


  const expenseTotals =
    Object.fromEntries(

      EXPENSE_CATEGORIES.map(
        category => [

          category,

          0

        ]
      )

    );


  activeMonths.forEach(
    month => {

      const revenueCategories =
        getRevenueByCategory(
          month
        );


      const expenseCategories =
        getExpenseByCategory(
          month
        );


      Object.keys(
        revenueTotals
      ).forEach(
        category => {

          revenueTotals[
            category
          ] +=
            revenueCategories[
              category
            ] ||
            0;

        }
      );


      Object.keys(
        expenseTotals
      ).forEach(
        category => {

          expenseTotals[
            category
          ] +=
            expenseCategories[
              category
            ] ||
            0;

        }
      );

    }
  );


  renderBreakdownList(

    yearRevenueBreakdown,

    revenueTotals,

    totalRevenue,

    "revenue"

  );


  renderBreakdownList(

    yearExpenseBreakdown,

    expenseTotals,

    totalExpenses,

    "expense"

  );

}

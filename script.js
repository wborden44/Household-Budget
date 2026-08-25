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


/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyBgW3D1UI_EYTJS5m1GXe6XwRTmkR-UcJo",
  authDomain: "household-budget-b350e.firebaseapp.com",
  projectId: "household-budget-b350e",
  storageBucket: "household-budget-b350e.firebasestorage.app",
  messagingSenderId: "691191089446",
  appId: "1:691191089446:web:03175b656254076da519e7"
};

const firebaseApp =
  initializeApp(firebaseConfig);

const auth =
  getAuth(firebaseApp);

const db =
  getFirestore(firebaseApp);


/* =========================================================
   BUSINESS / DATABASE
========================================================= */

const BUSINESS_ID =
  "ninth-inning-kennesaw";

/*
  IMPORTANT:

  These are the collections containing the populated
  version of the financial data.
*/

const TRANSACTIONS_COLLECTION =
  "transactions_v2";

const METRICS_COLLECTION =
  "monthlyMetrics_v2";


/*
  Calendar reporting begins January 2026.

  YEAR TAB = JANUARY THROUGH DECEMBER.
*/

const FIRST_MONTH =
  "2026-01";

const FIRST_DATE =
  "2026-01-01";

const LAST_MONTH =
  "2031-12";


/* =========================================================
   FIXED MONTHLY EXPENSES
========================================================= */

const FIXED_EXPENSES = {
  "W2 Staff": 9583,
  "Rent": 8938.90,
  "Utilities": 1800
};

const FIXED_MONTHLY_TOTAL =
  Object
    .values(FIXED_EXPENSES)
    .reduce(
      (sum, value) =>
        sum + value,
      0
    );


/* =========================================================
   CATEGORIES
========================================================= */

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


/* =========================================================
   STATE
========================================================= */

let currentMonth =
  clampMonth(
    getCurrentMonth()
  );

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


/* =========================================================
   DOM
========================================================= */

const $ =
  id =>
    document.getElementById(id);


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


/* DASHBOARD SUMMARY */

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


/* DASHBOARD CHARTS */

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


/* DASHBOARD METRICS */

const organicRevenueEl =
  $("organicRevenue");

const organicRevenueDetail =
  $("organicRevenueDetail");

const fixedCostCoverageEl =
  $("fixedCostCoverage");

const fixedCostCoverageDetail =
  $("fixedCostCoverageDetail");

const laborPercentEl =
  $("laborPercent");

const laborPercentDetail =
  $("laborPercentDetail");

const expenseRatioEl =
  $("expenseRatio");

const expenseRatioDetail =
  $("expenseRatioDetail");

const operatingProfitPerPlayerEl =
  $("operatingProfitPerPlayer");

const operatingProfitPerPlayerDetail =
  $("operatingProfitPerPlayerDetail");

const teamRevenueMixEl =
  $("teamRevenueMix");

const teamRevenueMixDetail =
  $("teamRevenueMixDetail");

const revenuePerPlayerEl =
  $("revenuePerPlayer");

const revenuePerPlayerDetail =
  $("revenuePerPlayerDetail");

const teamContributionEl =
  $("teamContribution");

const teamContributionDetail =
  $("teamContributionDetail");

const teamContributionMarginEl =
  $("teamContributionMargin");

const teamContributionMarginDetail =
  $("teamContributionMarginDetail");

const rosterFillRateEl =
  $("rosterFillRate");

const rosterFillRateDetail =
  $("rosterFillRateDetail");

const lessonHoursMetricEl =
  $("lessonHoursMetric");

const lessonHoursDetail =
  $("lessonHoursDetail");

const revenuePerLessonHourEl =
  $("revenuePerLessonHour");

const revenuePerLessonHourDetail =
  $("revenuePerLessonHourDetail");

const facilityUtilizationEl =
  $("facilityUtilization");

const facilityUtilizationDetail =
  $("facilityUtilizationDetail");

const membershipChangeEl =
  $("membershipChange");

const membershipChangeDetail =
  $("membershipChangeDetail");

const metricsStatus =
  $("metricsStatus");


/* MONTHLY INPUT FORM */

const monthlyMetricsForm =
  $("monthlyMetricsForm");

const monthlyMetricsMessage =
  $("monthlyMetricsMessage");

const saveMonthlyMetricsButton =
  $("saveMonthlyMetricsButton");


/* TRANSACTIONS PAGE */

const transactionTypeFilter =
  $("transactionTypeFilter");

const transactionCategoryFilter =
  $("transactionCategoryFilter");

const transactionTableBody =
  $("transactionTableBody");

const transactionEmptyState =
  $("transactionEmptyState");


/* YEAR PAGE */

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

const ytdMetricsPeriod =
  $("ytdMetricsPeriod");


/* YTD METRICS */

const ytdOrganicRevenue =
  $("ytdOrganicRevenue");

const ytdFixedCostCoverage =
  $("ytdFixedCostCoverage");

const ytdFixedCostCoverageDetail =
  $("ytdFixedCostCoverageDetail");

const ytdLaborPercent =
  $("ytdLaborPercent");

const ytdLaborPercentDetail =
  $("ytdLaborPercentDetail");

const ytdExpenseRatio =
  $("ytdExpenseRatio");

const ytdOperatingProfitPerPlayer =
  $("ytdOperatingProfitPerPlayer");

const ytdOperatingProfitPerPlayerDetail =
  $("ytdOperatingProfitPerPlayerDetail");

const ytdTeamRevenueMix =
  $("ytdTeamRevenueMix");

const ytdRevenuePerPlayer =
  $("ytdRevenuePerPlayer");

const ytdRevenuePerPlayerDetail =
  $("ytdRevenuePerPlayerDetail");

const ytdTeamContribution =
  $("ytdTeamContribution");

const ytdTeamContributionDetail =
  $("ytdTeamContributionDetail");

const ytdTeamContributionMargin =
  $("ytdTeamContributionMargin");

const ytdLessonHours =
  $("ytdLessonHours");

const ytdRevenuePerLessonHour =
  $("ytdRevenuePerLessonHour");

const ytdRevenuePerLessonHourDetail =
  $("ytdRevenuePerLessonHourDetail");

const ytdFacilityUtilization =
  $("ytdFacilityUtilization");

const ytdFacilityUtilizationDetail =
  $("ytdFacilityUtilizationDetail");


/* TRANSACTION MODAL */

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


/* HELP MODAL */

const metricHelpModal =
  $("metricHelpModal");

const metricHelpTitle =
  $("metricHelpTitle");

const metricHelpText =
  $("metricHelpText");


/* =========================================================
   FORMATTERS
========================================================= */

function currency(value) {

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD"
    }
  ).format(
    Number(value || 0)
  );

}


function percent(value) {

  return `${Number(value || 0).toFixed(1)}%`;

}


function ratio(value) {

  return Number.isFinite(value)
    ? `${value.toFixed(2)}x`
    : "—";

}


function number(
  value,
  decimals = 0
) {

  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed)
  ) {

    return "—";

  }

  return parsed.toLocaleString(
    "en-US",
    {
      minimumFractionDigits:
        decimals,

      maximumFractionDigits:
        decimals
    }
  );

}


/* =========================================================
   DATE HELPERS
========================================================= */

function getCurrentMonth() {

  const now =
    new Date();

  return (
    `${now.getFullYear()}-` +
    `${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`
  );

}


function todayString() {

  const now =
    new Date();

  return (
    `${now.getFullYear()}-` +
    `${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-` +
    `${String(
      now.getDate()
    ).padStart(2, "0")}`
  );

}


function getMonthFromDate(
  dateString
) {

  return dateString
    ? dateString.slice(0, 7)
    : "";

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


function indexToMonth(
  index
) {

  const year =
    Math.floor(
      index / 12
    );

  const month =
    (
      index % 12
    ) + 1;

  return (
    `${year}-` +
    `${String(month).padStart(2, "0")}`
  );

}


function previousMonth(
  monthKey
) {

  return indexToMonth(
    monthToIndex(monthKey) - 1
  );

}


function nextMonth(
  monthKey
) {

  return indexToMonth(
    monthToIndex(monthKey) + 1
  );

}


function clampMonth(
  monthKey
) {

  if (
    monthToIndex(monthKey) <
    monthToIndex(FIRST_MONTH)
  ) {

    return FIRST_MONTH;

  }

  if (
    monthToIndex(monthKey) >
    monthToIndex(LAST_MONTH)
  ) {

    return LAST_MONTH;

  }

  return monthKey;

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


/*
  YEAR ALWAYS JANUARY THROUGH DECEMBER.
*/

function buildYearMonths(
  year
) {

  return Array.from(
    {
      length: 12
    },
    (_, index) =>
      `${year}-${String(
        index + 1
      ).padStart(2, "0")}`
  );

}


/*
  YTD ALWAYS JANUARY THROUGH SELECTED MONTH.
*/

function getYtdMonths(
  monthKey
) {

  const year =
    yearFromMonth(
      monthKey
    );

  const selectedIndex =
    monthToIndex(
      monthKey
    );

  return buildYearMonths(
    year
  ).filter(
    month =>
      monthToIndex(month) <=
      selectedIndex
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
      month: "long",
      year: "numeric"
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
      month: "short"
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
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  );

}


/* =========================================================
   GENERIC HELPERS
========================================================= */

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


function normalizeExpenseCategory(
  category
) {

  const map = {

    "Misc.":
      "Other",

    "Misc":
      "Other"

  };

  return (
    map[category] ||
    category
  );

}


function normalizeRevenueCategory(
  category
) {

  const map = {

    "Rentals / Memberships":
      "Rentals/Memberships",

    "Rentals & Memberships":
      "Rentals/Memberships",

    "Rentals and Memberships":
      "Rentals/Memberships",

    "Camps / Clinics / Programs":
      "Camps/Clinics/Programs",

    "Camps / Clinics":
      "Camps/Clinics/Programs",

    "Camps/Clinics":
      "Camps/Clinics/Programs",

    "Teams":
      "Team Revenue",

    "Team":
      "Team Revenue",

    "Travel Team Revenue":
      "Team Revenue",

    "Team Fees":
      "Team Revenue",

    "POS":
      "Point of Sale"

  };

  return (
    map[category] ||
    category
  );

}


function normalizeTransactionType(
  type
) {

  const value =
    String(
      type || ""
    )
      .trim()
      .toLowerCase();

  if (
    value === "income"
  ) {

    return "revenue";

  }

  if (
    value === "revenue"
  ) {

    return "revenue";

  }

  if (
    value === "expense" ||
    value === "expenses"
  ) {

    return "expense";

  }

  return value;

}


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
    category === "Tournaments" ||
    category === "Field Rentals"
  ) {

    return "Teams";

  }

  if (
    category === "Building Supplies"
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
    category === "Tournaments" ||
    category === "Field Rentals"
  ) {

    return "direct";

  }

  return "overhead";

}


/* =========================================================
   MONTHLY METRICS COMPATIBILITY
========================================================= */

/*
  This reads BOTH the original field names and
  any newer aliases.

  No old data needs to be migrated manually.
*/

function metricNumber(
  monthKey,
  ...keys
) {

  const metrics =
    monthlyMetrics[
      monthKey
    ] || {};

  for (
    const key of keys
  ) {

    const value =
      metrics[key];

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {

      continue;

    }

    const parsed =
      Number(value);

    if (
      Number.isFinite(parsed)
    ) {

      return parsed;

    }

  }

  return 0;

}


function getMetricSnapshot(
  monthKey
) {

  return {

    rosteredPlayers:
      metricNumber(
        monthKey,
        "rosteredPlayers",
        "players",
        "playerCount",
        "rosterCount"
      ),

    rosterCapacity:
      metricNumber(
        monthKey,
        "rosterCapacity",
        "totalRosterSpots",
        "availableRosterSpots",
        "rosterSpots",
        "totalSpots"
      ),

    activeMemberships:
      metricNumber(
        monthKey,
        "activeMemberships",
        "memberships",
        "membershipCount"
      ),

    /*
      Original versions used lessonsCompleted.
      Newer versions used lessonHours.
    */

    lessonHours:
      metricNumber(
        monthKey,
        "lessonsCompleted",
        "lessonHours",
        "lessonHoursCompleted",
        "lessonCount"
      ),

    availableFacilityHours:
      metricNumber(
        monthKey,
        "availableFacilityHours",
        "facilityAvailableHours",
        "facilityHoursAvailable"
      ),

    usedFacilityHours:
      metricNumber(
        monthKey,
        "usedFacilityHours",
        "facilityUsedHours",
        "facilityHoursUsed"
      )

  };

}


/* =========================================================
   MONTH SELECTOR
========================================================= */

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
    new Date(start);

  while (
    cursor <= end
  ) {

    const key =
      `${cursor.getFullYear()}-${String(
        cursor.getMonth() + 1
      ).padStart(2, "0")}`;

    const option =
      document.createElement(
        "option"
      );

    option.value =
      key;

    option.textContent =
      cursor.toLocaleDateString(
        "en-US",
        {
          month: "long",
          year: "numeric"
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

  updateMonthButtons();

}


function updateMonthButtons() {

  previousMonthButton.disabled =
    monthToIndex(currentMonth) <=
    monthToIndex(FIRST_MONTH);

  nextMonthButton.disabled =
    monthToIndex(currentMonth) >=
    monthToIndex(LAST_MONTH);

}


function changeMonth(
  monthKey
) {

  currentMonth =
    clampMonth(
      monthKey
    );

  monthSelector.value =
    currentMonth;

  updateSelectedMonthDisplay();

  renderEverything();

}


monthSelector.addEventListener(
  "change",
  event =>
    changeMonth(
      event.target.value
    )
);


previousMonthButton.addEventListener(
  "click",
  () =>
    changeMonth(
      previousMonth(
        currentMonth
      )
    )
);


nextMonthButton.addEventListener(
  "click",
  () =>
    changeMonth(
      nextMonth(
        currentMonth
      )
    )
);


/* =========================================================
   FILTER CATEGORIES
========================================================= */

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


/* =========================================================
   AUTH
========================================================= */

loginForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    loginError.textContent =
      "";

    try {

      await signInWithEmailAndPassword(
        auth,
        $("email").value.trim(),
        $("password").value
      );

    }

    catch (error) {

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
  () =>
    signOut(auth)
);


onAuthStateChanged(
  auth,
  user => {

    if (!user) {

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


/* =========================================================
   INITIALIZE APP
========================================================= */

function initializeAppData() {

  buildMonthSelector();

  buildFilterCategories();

  updateSelectedMonthDisplay();

  bindMetricHelp();

  listenForTransactions();

  listenForMonthlyMetrics();

}


/* =========================================================
   NAVIGATION
========================================================= */

navButtons.forEach(
  button =>

    button.addEventListener(
      "click",
      () => {

        navButtons.forEach(
          nav =>
            nav.classList.remove(
              "active"
            )
        );

        button.classList.add(
          "active"
        );

        pages.forEach(
          page =>
            page.classList.remove(
              "active-page"
            )
        );

        const target =
          $(
            button.dataset.page +
            "Page"
          );

        if (target) {

          target.classList.add(
            "active-page"
          );

        }

        if (
          button.dataset.page ===
          "reports"
        ) {

          renderYear();

        }

        if (
          button.dataset.page ===
          "dashboard"
        ) {

          requestAnimationFrame(
            renderCharts
          );

        }

      }
    )

);


/* =========================================================
   SELECTED MONTH DISPLAY
========================================================= */

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
    `${shortMonth(currentMonth)} Revenue`;

  chartYearLabel.textContent =
    year;

  yearTitle.textContent =
    `${year} Financial Performance`;

  monthSelector.value =
    currentMonth;

  updateMonthButtons();

  loadMonthlyMetricsForm();

}


/* =========================================================
   FIRESTORE — TRANSACTIONS V2
========================================================= */

function listenForTransactions() {

  if (
    transactionsUnsubscribe
  ) {

    transactionsUnsubscribe();

  }

  const ref =
    collection(
      db,
      "businesses",
      BUSINESS_ID,
      TRANSACTIONS_COLLECTION
    );

  transactionsUnsubscribe =
    onSnapshot(

      query(
        ref,
        orderBy(
          "date",
          "desc"
        )
      ),

      snapshot => {

        transactions =
          snapshot.docs.map(
            snapshotDoc => {

              const data =
                snapshotDoc.data();

              const normalizedType =
                normalizeTransactionType(
                  data.type
                );

              const normalizedCategory =
                normalizedType ===
                "expense"

                  ? normalizeExpenseCategory(
                      data.category
                    )

                  : normalizeRevenueCategory(
                      data.category
                    );

              return {

                id:
                  snapshotDoc.id,

                ...data,

                type:
                  normalizedType,

                category:
                  normalizedCategory,

                month:
                  data.month ||
                  getMonthFromDate(
                    data.date
                  )

              };

            }
          );

        console.log(
          `Loaded ${transactions.length} transactions from ${TRANSACTIONS_COLLECTION}`
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


/* =========================================================
   FIRESTORE — MONTHLY METRICS V2
========================================================= */

function listenForMonthlyMetrics() {

  if (
    metricsUnsubscribe
  ) {

    metricsUnsubscribe();

  }

  const ref =
    collection(
      db,
      "businesses",
      BUSINESS_ID,
      METRICS_COLLECTION
    );

  metricsUnsubscribe =
    onSnapshot(

      ref,

      snapshot => {

        monthlyMetrics =
          {};

        snapshot.docs.forEach(
          snapshotDoc => {

            const data =
              snapshotDoc.data();

            /*
              Normally:
              document ID = 2026-01

              Also support a stored "month" field.
            */

            const monthKey =
              data.month ||
              snapshotDoc.id;

            monthlyMetrics[
              monthKey
            ] = {

              ...data,

              _documentId:
                snapshotDoc.id

            };

          }
        );

        console.log(
          `Loaded ${Object.keys(monthlyMetrics).length} monthly metric records from ${METRICS_COLLECTION}`
        );

        console.log(
          "Monthly metrics:",
          monthlyMetrics
        );

        loadMonthlyMetricsForm();

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


/* =========================================================
   MONTHLY TRANSACTIONS
========================================================= */

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


/* =========================================================
   REVENUE BY CATEGORY
========================================================= */

function getRevenueByCategory(
  monthKey
) {

  const totals =
    Object.fromEntries(
      REVENUE_CATEGORIES.map(
        category =>
          [
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

        const category =
          normalizeRevenueCategory(
            transaction.category
          );

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


/* =========================================================
   EXPENSES BY CATEGORY
========================================================= */

function getExpenseByCategory(
  monthKey
) {

  const totals =
    Object.fromEntries(
      EXPENSE_CATEGORIES.map(
        category =>
          [
            category,
            0
          ]
      )
    );


  /*
    Recurring expenses apply to every tracked month.
  */

  if (
    monthToIndex(monthKey) >=
    monthToIndex(FIRST_MONTH)
  ) {

    Object.entries(
      FIXED_EXPENSES
    ).forEach(
      (
        [
          category,
          amount
        ]
      ) => {

        totals[
          category
        ] +=
          amount;

      }
    );

  }


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


/* =========================================================
   MONTH CALCULATIONS
========================================================= */

function calculateMonth(
  monthKey
) {

  const monthly =
    getMonthlyTransactions(
      monthKey
    );


  /* REVENUE */

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
        ) =>
          sum +
          Number(
            transaction.amount ||
            0
          ),
        0
      );


  /* MANUAL EXPENSES */

  const manualExpenses =
    monthly

      .filter(
        transaction =>
          transaction.type ===
          "expense"
      )

      .reduce(
        (
          sum,
          transaction
        ) =>
          sum +
          Number(
            transaction.amount ||
            0
          ),
        0
      );


  /* FIXED EXPENSES */

  const fixedExpenses =
    monthToIndex(monthKey) >=
    monthToIndex(FIRST_MONTH)

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


  const revenueCats =
    getRevenueByCategory(
      monthKey
    );


  const expenseCats =
    getExpenseByCategory(
      monthKey
    );


  /* TEAM REVENUE */

  const teamRevenue =
    revenueCats[
      "Team Revenue"
    ] || 0;


  const organicRevenue =
    revenue -
    teamRevenue;


  const teamRevenueMix =
    revenue > 0

      ? (
          teamRevenue /
          revenue
        ) * 100

      : NaN;


  /* LABOR */

  const w2Labor =
    Number(
      expenseCats[
        "W2 Staff"
      ] || 0
    );


  const contractorLabor =
    Number(
      expenseCats[
        "1099 Staff"
      ] || 0
    );


  const labor =
    w2Labor +
    contractorLabor;


  const laborPercent =
    revenue > 0

      ? (
          labor /
          revenue
        ) * 100

      : NaN;


  /* EXPENSE RATIO */

  const expenseRatio =
    revenue > 0

      ? (
          expenses /
          revenue
        ) * 100

      : NaN;


  /* IDENTIFIABLE TEAM COST */

  const teamDirectCosts =
    monthly

      .filter(
        transaction =>
          transaction.type ===
            "expense"

          &&

          inferCostType(
            transaction
          ) ===
            "direct"

          &&

          inferBusinessArea(
            transaction
          ) ===
            "Teams"
      )

      .reduce(
        (
          sum,
          transaction
        ) =>
          sum +
          Number(
            transaction.amount ||
            0
          ),
        0
      );


  const teamContribution =
    teamRevenue -
    teamDirectCosts;


  const teamContributionMargin =
    teamRevenue > 0

      ? (
          teamContribution /
          teamRevenue
        ) * 100

      : NaN;


  /* FIXED COST COVERAGE */

  const fixedCostCoverage =
    fixedExpenses > 0

      ? organicRevenue /
        fixedExpenses

      : NaN;


  return {

    revenue,

    manualExpenses,

    fixedExpenses,

    expenses,

    profit,

    margin,

    revenueCats,

    expenseCats,

    teamRevenue,

    organicRevenue,

    teamRevenueMix,

    w2Labor,

    contractorLabor,

    labor,

    laborPercent,

    expenseRatio,

    teamDirectCosts,

    teamContribution,

    teamContributionMargin,

    fixedCostCoverage

  };

}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

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

    requestAnimationFrame(
      renderCharts
    );

  }

}


/* =========================================================
   MONTH-OVER-MONTH COMPARISON HELPERS
========================================================= */

function getComparison(
  currentValue,
  previousValue,
  type =
    "percent"
) {

  if (
    !Number.isFinite(
      currentValue
    ) ||
    !Number.isFinite(
      previousValue
    )
  ) {

    return null;

  }

  if (
    type ===
    "points"
  ) {

    return (
      currentValue -
      previousValue
    );

  }

  if (
    previousValue ===
    0
  ) {

    return null;

  }

  return (
    (
      currentValue -
      previousValue
    ) /
    Math.abs(
      previousValue
    )
  ) * 100;

}


function setComparisonDetail(
  element,
  currentValue,
  previousValue,
  options = {}
) {

  if (!element) {

    return;

  }

  const {
    type =
      "percent",

    positiveIsGood =
      true,

    suffix =
      "vs last month"
  } =
    options;


  element.classList.remove(
    "positive-text",
    "negative-text"
  );


  const comparison =
    getComparison(
      currentValue,
      previousValue,
      type
    );


  if (
    !Number.isFinite(
      comparison
    )
  ) {

    return;

  }


  const sign =
    comparison > 0
      ? "+"
      : "";


  if (
    type ===
    "points"
  ) {

    element.textContent =
      `${sign}${comparison.toFixed(1)} pts ${suffix}`;

  }

  else {

    element.textContent =
      `${sign}${comparison.toFixed(1)}% ${suffix}`;

  }


  if (
    comparison !== 0
  ) {

    const good =
      positiveIsGood

        ? comparison > 0

        : comparison < 0;


    element.classList.add(
      good
        ? "positive-text"
        : "negative-text"
    );

  }

}


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

  const totals =
    calculateMonth(
      currentMonth
    );


  const metrics =
    getMetricSnapshot(
      currentMonth
    );


  const previousKey =
    previousMonth(
      currentMonth
    );


  const previousTotals =
    calculateMonth(
      previousKey
    );


  const previousMetrics =
    getMetricSnapshot(
      previousKey
    );


  /* =====================================================
     FINANCIAL SUMMARY
  ===================================================== */

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
    )} recurring + ${currency(
      totals.manualExpenses
    )} entered`;


  monthlyProfit.textContent =
    currency(
      totals.profit
    );


  monthlyProfit.className =
    totals.profit >= 0
      ? "positive-text"
      : "negative-text";


  monthlyMargin.textContent =
    percent(
      totals.margin
    );


  marginCard.classList.toggle(
    "loss-card",
    totals.profit < 0
  );


  /* =====================================================
     INPUT VALUES
  ===================================================== */

  const players =
    metrics.rosteredPlayers;


  const capacity =
    metrics.rosterCapacity;


  const lessonHours =
    metrics.lessonHours;


  const availableHours =
    metrics.availableFacilityHours;


  const usedHours =
    metrics.usedFacilityHours;


  const activeMemberships =
    metrics.activeMemberships;


  const previousPlayers =
    previousMetrics.rosteredPlayers;


  const previousLessonHours =
    previousMetrics.lessonHours;


  const previousAvailableHours =
    previousMetrics.availableFacilityHours;


  const previousUsedHours =
    previousMetrics.usedFacilityHours;


  const previousActiveMemberships =
    previousMetrics.activeMemberships;


  /* =====================================================
     DERIVED METRICS
  ===================================================== */

  const operatingProfitPerPlayer =
    players > 0

      ? totals.profit /
        players

      : NaN;


  const previousOperatingProfitPerPlayer =
    previousPlayers > 0

      ? previousTotals.profit /
        previousPlayers

      : NaN;


  const revenuePerPlayer =
    players > 0

      ? totals.teamRevenue /
        players

      : NaN;


  const previousRevenuePerPlayer =
    previousPlayers > 0

      ? previousTotals.teamRevenue /
        previousPlayers

      : NaN;


  const rosterFillRate =
    capacity > 0

      ? (
          players /
          capacity
        ) * 100

      : NaN;


  const lessonRevenue =
    totals.revenueCats[
      "Lessons"
    ] || 0;


  const revenuePerLessonHour =
    lessonHours > 0

      ? lessonRevenue /
        lessonHours

      : NaN;


  const previousLessonRevenue =
    previousTotals.revenueCats[
      "Lessons"
    ] || 0;


  const previousRevenuePerLessonHour =
    previousLessonHours > 0

      ? previousLessonRevenue /
        previousLessonHours

      : NaN;


  const facilityUtilization =
    availableHours > 0

      ? (
          usedHours /
          availableHours
        ) * 100

      : NaN;


  const previousFacilityUtilization =
    previousAvailableHours > 0

      ? (
          previousUsedHours /
          previousAvailableHours
        ) * 100

      : NaN;


  /* =====================================================
     ORGANIC REVENUE
  ===================================================== */

  organicRevenueEl.textContent =
    currency(
      totals.organicRevenue
    );


  organicRevenueDetail.textContent =
    "Excludes team revenue";


  if (
    monthlyMetrics[
      previousKey
    ] ||
    getMonthlyTransactions(
      previousKey
    ).length
  ) {

    setComparisonDetail(
      organicRevenueDetail,
      totals.organicRevenue,
      previousTotals.organicRevenue
    );

  }


  /* =====================================================
     FIXED COST COVERAGE
  ===================================================== */

  fixedCostCoverageEl.textContent =
    ratio(
      totals.fixedCostCoverage
    );


  fixedCostCoverageDetail.classList.remove(
    "positive-text",
    "negative-text"
  );


  if (
    Number.isFinite(
      totals.fixedCostCoverage
    )
  ) {

    fixedCostCoverageDetail.textContent =
      `${Math.round(
        totals.fixedCostCoverage *
        100
      )}% of fixed costs covered by organic revenue`;


    fixedCostCoverageDetail.classList.add(
      totals.fixedCostCoverage >=
      1

        ? "positive-text"

        : "negative-text"
    );

  }

  else {

    fixedCostCoverageDetail.textContent =
      "Organic revenue ÷ fixed operating costs";

  }


  /* =====================================================
     LABOR %
  ===================================================== */

  laborPercentEl.textContent =
    Number.isFinite(
      totals.laborPercent
    )

      ? percent(
          totals.laborPercent
        )

      : "—";


  laborPercentDetail.textContent =
    `${currency(
      totals.labor
    )} W2 + 1099 labor`;


  /* =====================================================
     EXPENSE RATIO
  ===================================================== */

  expenseRatioEl.textContent =
    Number.isFinite(
      totals.expenseRatio
    )

      ? percent(
          totals.expenseRatio
        )

      : "—";


  expenseRatioDetail.textContent =
    "Total expenses ÷ revenue";


  if (
    Number.isFinite(
      previousTotals.expenseRatio
    )
  ) {

    setComparisonDetail(
      expenseRatioDetail,
      totals.expenseRatio,
      previousTotals.expenseRatio,
      {
        type:
          "points",

        positiveIsGood:
          false
      }
    );

  }


  /* =====================================================
     PROFIT / PLAYER
  ===================================================== */

  operatingProfitPerPlayerEl.textContent =
    Number.isFinite(
      operatingProfitPerPlayer
    )

      ? currency(
          operatingProfitPerPlayer
        )

      : "—";


  operatingProfitPerPlayerDetail.textContent =
    "Operating profit ÷ rostered players";


  if (
    previousPlayers > 0
  ) {

    setComparisonDetail(
      operatingProfitPerPlayerDetail,
      operatingProfitPerPlayer,
      previousOperatingProfitPerPlayer
    );

  }


  /* =====================================================
     TEAM REVENUE MIX
  ===================================================== */

  teamRevenueMixEl.textContent =
    Number.isFinite(
      totals.teamRevenueMix
    )

      ? percent(
          totals.teamRevenueMix
        )

      : "—";


  teamRevenueMixDetail.textContent =
    "Team revenue ÷ total revenue";


  if (
    previousTotals.revenue > 0
  ) {

    setComparisonDetail(
      teamRevenueMixDetail,
      totals.teamRevenueMix,
      previousTotals.teamRevenueMix,
      {
        type:
          "points",

        positiveIsGood:
          false
      }
    );

  }


  /* =====================================================
     REVENUE / PLAYER
  ===================================================== */

  revenuePerPlayerEl.textContent =
    Number.isFinite(
      revenuePerPlayer
    )

      ? currency(
          revenuePerPlayer
        )

      : "—";


  revenuePerPlayerDetail.textContent =
    "Team revenue ÷ rostered players";


  if (
    previousPlayers > 0
  ) {

    setComparisonDetail(
      revenuePerPlayerDetail,
      revenuePerPlayer,
      previousRevenuePerPlayer
    );

  }


  /* =====================================================
     TEAM CONTRIBUTION
  ===================================================== */

  teamContributionEl.textContent =
    totals.teamRevenue > 0

      ? currency(
          totals.teamContribution
        )

      : "—";


  teamContributionDetail.textContent =
    totals.teamRevenue > 0

      ? `${currency(
          totals.teamDirectCosts
        )} identifiable direct team costs`

      : "No team revenue recorded";


  /* =====================================================
     TEAM MARGIN
  ===================================================== */

  teamContributionMarginEl.textContent =
    Number.isFinite(
      totals.teamContributionMargin
    )

      ? percent(
          totals.teamContributionMargin
        )

      : "—";


  teamContributionMarginDetail.textContent =
    "Contribution ÷ team revenue";


  if (
    Number.isFinite(
      previousTotals.teamContributionMargin
    )
  ) {

    setComparisonDetail(
      teamContributionMarginDetail,
      totals.teamContributionMargin,
      previousTotals.teamContributionMargin,
      {
        type:
          "points",

        positiveIsGood:
          true
      }
    );

  }


  /* =====================================================
     ROSTER FILL
  ===================================================== */

  rosterFillRateEl.textContent =
    Number.isFinite(
      rosterFillRate
    )

      ? percent(
          rosterFillRate
        )

      : "—";


  rosterFillRateDetail.textContent =
    capacity > 0

      ? `${number(
          players
        )} of ${number(
          capacity
        )} spots filled · ${number(
          Math.max(
            0,
            capacity -
            players
          )
        )} open`

      : "Enter rostered players and total roster spots";


  /* =====================================================
     LESSON HOURS
  ===================================================== */

  lessonHoursMetricEl.textContent =
    number(
      lessonHours,
      Number.isInteger(
        lessonHours
      )
        ? 0
        : 1
    );


  lessonHoursDetail.textContent =
    "Paid lesson hours completed";


  if (
    monthlyMetrics[
      previousKey
    ]
  ) {

    setComparisonDetail(
      lessonHoursDetail,
      lessonHours,
      previousLessonHours
    );

  }


  /* =====================================================
     REVENUE / LESSON HOUR
  ===================================================== */

  revenuePerLessonHourEl.textContent =
    Number.isFinite(
      revenuePerLessonHour
    )

      ? currency(
          revenuePerLessonHour
        )

      : "—";


  revenuePerLessonHourDetail.textContent =
    "Lesson revenue ÷ lesson hours";


  if (
    previousLessonHours >
    0
  ) {

    setComparisonDetail(
      revenuePerLessonHourDetail,
      revenuePerLessonHour,
      previousRevenuePerLessonHour
    );

  }


  /* =====================================================
     FACILITY UTILIZATION
  ===================================================== */

  facilityUtilizationEl.textContent =
    Number.isFinite(
      facilityUtilization
    )

      ? percent(
          facilityUtilization
        )

      : "—";


  facilityUtilizationDetail.textContent =
    availableHours > 0

      ? `${number(
          usedHours,
          Number.isInteger(
            usedHours
          )
            ? 0
            : 1
        )} of ${number(
          availableHours,
          Number.isInteger(
            availableHours
          )
            ? 0
            : 1
        )} available hours utilized`

      : "Used facility hours ÷ available hours";


  if (
    previousAvailableHours >
    0
  ) {

    setComparisonDetail(
      facilityUtilizationDetail,
      facilityUtilization,
      previousFacilityUtilization,
      {
        type:
          "points",

        positiveIsGood:
          true
      }
    );

  }


  /* =====================================================
     MEMBERSHIP CHANGE
  ===================================================== */

  const previousMonthExists =
    Boolean(
      monthlyMetrics[
        previousKey
      ]
    );


  const membershipChange =
    previousMonthExists

      ? (
          activeMemberships -
          previousActiveMemberships
        )

      : NaN;


  membershipChangeEl.textContent =
    Number.isFinite(
      membershipChange
    )

      ? (
          membershipChange > 0

            ? `+${membershipChange}`

            : String(
                membershipChange
              )
        )

      : "—";


  membershipChangeDetail.classList.remove(
    "positive-text",
    "negative-text"
  );


  if (
    Number.isFinite(
      membershipChange
    )
  ) {

    membershipChangeDetail.textContent =
      `${number(
        activeMemberships
      )} active memberships`;


    if (
      membershipChange >
      0
    ) {

      membershipChangeDetail.classList.add(
        "positive-text"
      );

    }


    if (
      membershipChange <
      0
    ) {

      membershipChangeDetail.classList.add(
        "negative-text"
      );

    }

  }

  else {

    membershipChangeDetail.textContent =
      "No previous month available";

  }


  /* =====================================================
     INPUT STATUS
  ===================================================== */

  metricsStatus.textContent =
    monthlyMetrics[
      currentMonth
    ]

      ? "Inputs saved"

      : "Monthly inputs not saved";


  metricsStatus.classList.toggle(
    "saved-badge",
    Boolean(
      monthlyMetrics[
        currentMonth
      ]
    )
  );


  /* =====================================================
     BREAKDOWNS
  ===================================================== */

  renderBreakdownList(
    revenueBreakdown,
    totals.revenueCats,
    totals.revenue,
    "revenue"
  );


  renderBreakdownList(
    expenseBreakdown,
    totals.expenseCats,
    totals.expenses,
    "expense"
  );


  renderRecentTransactions();

}


/* =========================================================
   LOAD MONTHLY INPUT FORM
========================================================= */

function loadMonthlyMetricsForm() {

  const metrics =
    getMetricSnapshot(
      currentMonth
    );


  /*
    Your current HTML uses lessonsCompleted.

    The JS still supports lessonHours in old/new Firestore
    documents.
  */

  if (
    $("rosteredPlayers")
  ) {

    $("rosteredPlayers").value =
      monthlyMetrics[
        currentMonth
      ]

        ? metrics.rosteredPlayers

        : "";

  }


  if (
    $("rosterCapacity")
  ) {

    $("rosterCapacity").value =
      monthlyMetrics[
        currentMonth
      ]

        ? metrics.rosterCapacity

        : "";

  }


  if (
    $("activeMemberships")
  ) {

    $("activeMemberships").value =
      monthlyMetrics[
        currentMonth
      ]

        ? metrics.activeMemberships

        : "";

  }


  if (
    $("lessonsCompleted")
  ) {

    $("lessonsCompleted").value =
      monthlyMetrics[
        currentMonth
      ]

        ? metrics.lessonHours

        : "";

  }


  /*
    Also support HTML from the version that used lessonHours.
  */

  if (
    $("lessonHours")
  ) {

    $("lessonHours").value =
      monthlyMetrics[
        currentMonth
      ]

        ? metrics.lessonHours

        : "";

  }


  if (
    $("availableFacilityHours")
  ) {

    $("availableFacilityHours").value =
      monthlyMetrics[
        currentMonth
      ]

        ? metrics.availableFacilityHours

        : "";

  }


  if (
    $("usedFacilityHours")
  ) {

    $("usedFacilityHours").value =
      monthlyMetrics[
        currentMonth
      ]

        ? metrics.usedFacilityHours

        : "";

  }


  monthlyMetricsMessage.textContent =
    "";

}


/* =========================================================
   SAVE MONTHLY INPUTS TO V2
========================================================= */

monthlyMetricsForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    monthlyMetricsMessage.textContent =
      "";


    saveMonthlyMetricsButton.disabled =
      true;


    const rosteredPlayers =
      Number(
        $("rosteredPlayers")
          ?.value ||
        0
      );


    const rosterCapacity =
      Number(
        $("rosterCapacity")
          ?.value ||
        0
      );


    const activeMemberships =
      Number(
        $("activeMemberships")
          ?.value ||
        0
      );


    /*
      Support either HTML input ID.
    */

    const lessonInput =
      $("lessonsCompleted") ||
      $("lessonHours");


    const lessonHours =
      Number(
        lessonInput
          ?.value ||
        0
      );


    const availableFacilityHours =
      Number(
        $("availableFacilityHours")
          ?.value ||
        0
      );


    const usedFacilityHours =
      Number(
        $("usedFacilityHours")
          ?.value ||
        0
      );


    if (
      usedFacilityHours >
      availableFacilityHours

      &&

      availableFacilityHours >
      0
    ) {

      monthlyMetricsMessage.textContent =
        "Used hours cannot exceed available hours.";


      saveMonthlyMetricsButton.disabled =
        false;


      return;

    }


    if (
      rosteredPlayers >
      rosterCapacity

      &&

      rosterCapacity >
      0
    ) {

      monthlyMetricsMessage.textContent =
        "Rostered players cannot exceed total roster spots.";


      saveMonthlyMetricsButton.disabled =
        false;


      return;

    }


    /*
      Store original AND compatibility fields.

      merge:true protects other historical fields from
      being deleted.
    */

    const data = {

      month:
        currentMonth,

      year:
        yearFromMonth(
          currentMonth
        ),

      rosteredPlayers,

      rosterCapacity,

      totalRosterSpots:
        rosterCapacity,

      activeMemberships,

      lessonsCompleted:
        lessonHours,

      lessonHours,

      availableFacilityHours,

      usedFacilityHours,

      updatedAt:
        serverTimestamp()

    };


    try {

      await setDoc(

        doc(
          db,
          "businesses",
          BUSINESS_ID,
          METRICS_COLLECTION,
          currentMonth
        ),

        data,

        {
          merge:
            true
        }

      );


      monthlyMetricsMessage.textContent =
        "Saved.";

    }

    catch (error) {

      console.error(
        "Monthly input save error:",
        error
      );


      monthlyMetricsMessage.textContent =
        "Unable to save monthly inputs.";

    }

    finally {

      saveMonthlyMetricsButton.disabled =
        false;

    }

  }
);


/* =========================================================
   CHARTS
========================================================= */

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


/* =========================================================
   YEAR PERFORMANCE CHART
========================================================= */

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


  const revenueData =
    months.map(
      month =>

        monthToIndex(month) <=
        selectedIndex

          ? calculateMonth(
              month
            ).revenue

          : null
    );


  const expenseData =
    months.map(
      month =>

        monthToIndex(month) <=
        selectedIndex

          ? calculateMonth(
              month
            ).expenses

          : null
    );


  const profitData =
    months.map(
      month =>

        monthToIndex(month) <=
        selectedIndex

          ? calculateMonth(
              month
            ).profit

          : null
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
                revenueData

            },


            {

              label:
                "Expenses",

              data:
                expenseData

            },


            {

              label:
                "Profit",

              data:
                profitData,

              type:
                "line",

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
                  context =>
                    `${context.dataset.label}: ${currency(
                      context.raw
                    )}`

              }

            }

          },


          scales: {

            y: {

              beginAtZero:
                true,


              ticks: {

                callback:
                  value =>
                    `$${Math.round(
                      value /
                      1000
                    )}k`

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


/* =========================================================
   REVENUE MIX CHART
========================================================= */

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
      ) =>
        value >
        0
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
              entry =>
                entry[0]
            ),


          datasets: [

            {

              data:
                entries.map(
                  entry =>
                    entry[1]
                )

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
                  context =>
                    `${context.label}: ${currency(
                      context.raw
                    )}`

              }

            }

          }

        }

      }
    );

}


/* =========================================================
   BREAKDOWN LIST
========================================================= */

function renderBreakdownList(
  container,
  data,
  total,
  type
) {

  if (!container) {

    return;

  }


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
        total > 0

          ? (
              value /
              total
            ) * 100

          : 0;


      row.innerHTML = `

        <div class="breakdown-top">

          <span class="breakdown-name">
            ${escapeHtml(name)}
          </span>

          <span class="breakdown-value">

            ${currency(value)}

            <em>
              ${percentage.toFixed(1)}%
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


/* =========================================================
   RECENT TRANSACTIONS
========================================================= */

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
      `
        <div class="empty-state">
          No manual transactions for this month.
        </div>
      `;


    return;

  }


  list.forEach(
    transaction => {

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "recent-transaction";


      row.innerHTML = `

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

            ·

            ${escapeHtml(
              transaction.category ||
              ""
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


/* =========================================================
   TRANSACTION TABLE
========================================================= */

function renderTransactions() {

  const typeFilter =
    transactionTypeFilter.value;


  const categoryFilter =
    transactionCategoryFilter.value;


  const rows =
    getMonthlyTransactions(
      currentMonth
    ).filter(
      transaction =>

        (
          typeFilter ===
          "all"

          ||

          transaction.type ===
          typeFilter
        )

        &&

        (
          categoryFilter ===
          "all"

          ||

          transaction.category ===
          categoryFilter
        )
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
              transaction.description ||
              ""
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

            ${escapeHtml(
              transaction.type
            )}

          </span>

        </td>


        <td>

          ${escapeHtml(
            transaction.category ||
            ""
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
          class="
            ${
              transaction.type ===
              "revenue"

                ? "positive-text"

                : "negative-text"
            }
          "
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


  document
    .querySelectorAll(
      ".edit-button"
    )
    .forEach(
      button =>

        button.addEventListener(
          "click",
          () =>
            openEditTransaction(
              button.dataset.id
            )
        )

    );


  document
    .querySelectorAll(
      ".small-button.delete"
    )
    .forEach(
      button =>

        button.addEventListener(
          "click",
          () =>
            deleteTransaction(
              button.dataset.id
            )
        )

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


/* =========================================================
   ADD REVENUE / EXPENSE BUTTONS
========================================================= */

[
  "dashboardAddRevenueButton",
  "transactionsAddRevenueButton"
].forEach(
  id =>

    $(id).addEventListener(
      "click",
      () =>
        openNewTransaction(
          "revenue"
        )
    )

);


[
  "dashboardAddExpenseButton",
  "transactionsAddExpenseButton"
].forEach(
  id =>

    $(id).addEventListener(
      "click",
      () =>
        openNewTransaction(
          "expense"
        )
    )

);


/* =========================================================
   TRANSACTION MODAL
========================================================= */

document
  .querySelectorAll(
    "[data-close-transaction-modal]"
  )
  .forEach(
    element =>

      element.addEventListener(
        "click",
        closeTransactionModal
      )

  );


modalRevenueTypeButton.addEventListener(
  "click",
  () =>
    setModalType(
      "revenue"
    )
);


modalExpenseTypeButton.addEventListener(
  "click",
  () =>
    setModalType(
      "expense"
    )
);


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
    transactionCategory.value;


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


function openEditTransaction(
  id
) {

  const transaction =
    transactions.find(
      item =>
        item.id ===
        id
    );


  if (!transaction) {

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


  buildTransactionCategories(
    transaction.type
  );


  if (
    [
      ...transactionCategory.options
    ].some(
      option =>
        option.value ===
        transaction.category
    )
  ) {

    transactionCategory.value =
      transaction.category;

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


/* =========================================================
   SAVE TRANSACTION TO V2
========================================================= */

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
        "Enter a vendor or description.";


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

    }

    else {

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


      if (id) {

        await updateDoc(

          doc(
            db,
            "businesses",
            BUSINESS_ID,
            TRANSACTIONS_COLLECTION,
            id
          ),

          data

        );

      }

      else {

        data.createdAt =
          serverTimestamp();


        await addDoc(

          collection(
            db,
            "businesses",
            BUSINESS_ID,
            TRANSACTIONS_COLLECTION
          ),

          data

        );

      }


      closeTransactionModal();


      changeMonth(
        data.month
      );

    }

    catch (error) {

      console.error(
        "Save transaction error:",
        error
      );


      transactionFormError.textContent =
        "Unable to save transaction.";

    }

  }
);


/* =========================================================
   DELETE TRANSACTION FROM V2
========================================================= */

async function deleteTransaction(
  id
) {

  const transaction =
    transactions.find(
      item =>
        item.id ===
        id
    );


  if (!transaction) {

    return;

  }


  if (
    !confirm(
      `Delete "${transaction.description}"?`
    )
  ) {

    return;

  }


  try {

    await deleteDoc(

      doc(
        db,
        "businesses",
        BUSINESS_ID,
        TRANSACTIONS_COLLECTION,
        id
      )

    );

  }

  catch (error) {

    console.error(
      error
    );


    alert(
      "Unable to delete transaction."
    );

  }

}


/* =========================================================
   YTD CALCULATIONS
   JANUARY THROUGH SELECTED MONTH
========================================================= */

function calculateYtd(
  monthKey
) {

  const months =
    getYtdMonths(
      monthKey
    );


  const revenueCats =
    Object.fromEntries(
      REVENUE_CATEGORIES.map(
        category =>
          [
            category,
            0
          ]
      )
    );


  const expenseCats =
    Object.fromEntries(
      EXPENSE_CATEGORIES.map(
        category =>
          [
            category,
            0
          ]
      )
    );


  let revenue =
    0;


  let expenses =
    0;


  let fixedExpenses =
    0;


  let organicRevenue =
    0;


  let teamRevenue =
    0;


  let teamDirectCosts =
    0;


  let labor =
    0;


  let lessonHours =
    0;


  let usedFacilityHours =
    0;


  let availableFacilityHours =
    0;


  months.forEach(
    month => {

      const totals =
        calculateMonth(
          month
        );


      const metrics =
        getMetricSnapshot(
          month
        );


      revenue +=
        totals.revenue;


      expenses +=
        totals.expenses;


      fixedExpenses +=
        totals.fixedExpenses;


      organicRevenue +=
        totals.organicRevenue;


      teamRevenue +=
        totals.teamRevenue;


      teamDirectCosts +=
        totals.teamDirectCosts;


      labor +=
        totals.labor;


      lessonHours +=
        metrics.lessonHours;


      usedFacilityHours +=
        metrics.usedFacilityHours;


      availableFacilityHours +=
        metrics.availableFacilityHours;


      Object.keys(
        revenueCats
      ).forEach(
        category => {

          revenueCats[
            category
          ] +=
            totals.revenueCats[
              category
            ] ||
            0;

        }
      );


      Object.keys(
        expenseCats
      ).forEach(
        category => {

          expenseCats[
            category
          ] +=
            totals.expenseCats[
              category
            ] ||
            0;

        }
      );

    }
  );


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


  const fixedCostCoverage =
    fixedExpenses > 0

      ? organicRevenue /
        fixedExpenses

      : NaN;


  const laborPercent =
    revenue > 0

      ? (
          labor /
          revenue
        ) * 100

      : NaN;


  const expenseRatio =
    revenue > 0

      ? (
          expenses /
          revenue
        ) * 100

      : NaN;


  const teamRevenueMix =
    revenue > 0

      ? (
          teamRevenue /
          revenue
        ) * 100

      : NaN;


  const teamContribution =
    teamRevenue -
    teamDirectCosts;


  const teamContributionMargin =
    teamRevenue > 0

      ? (
          teamContribution /
          teamRevenue
        ) * 100

      : NaN;


  const lessonRevenue =
    revenueCats[
      "Lessons"
    ] ||
    0;


  const revenuePerLessonHour =
    lessonHours > 0

      ? lessonRevenue /
        lessonHours

      : NaN;


  const facilityUtilization =
    availableFacilityHours > 0

      ? (
          usedFacilityHours /
          availableFacilityHours
        ) * 100

      : NaN;


  /*
    Roster count is point-in-time.

    It should NOT be summed across months.

    Use latest roster count in YTD period.
  */

  let latestRosterCount =
    0;


  for (
    let index =
      months.length -
      1;

    index >=
    0;

    index--
  ) {

    const rosterCount =
      getMetricSnapshot(
        months[index]
      ).rosteredPlayers;


    if (
      rosterCount >
      0
    ) {

      latestRosterCount =
        rosterCount;


      break;

    }

  }


  const operatingProfitPerPlayer =
    latestRosterCount > 0

      ? profit /
        latestRosterCount

      : NaN;


  const revenuePerPlayer =
    latestRosterCount > 0

      ? teamRevenue /
        latestRosterCount

      : NaN;


  return {

    months,

    revenue,

    expenses,

    profit,

    margin,

    fixedExpenses,

    organicRevenue,

    fixedCostCoverage,

    labor,

    laborPercent,

    expenseRatio,

    teamRevenue,

    teamRevenueMix,

    teamDirectCosts,

    teamContribution,

    teamContributionMargin,

    revenueCats,

    expenseCats,

    latestRosterCount,

    operatingProfitPerPlayer,

    revenuePerPlayer,

    lessonHours,

    lessonRevenue,

    revenuePerLessonHour,

    usedFacilityHours,

    availableFacilityHours,

    facilityUtilization

  };

}


/* =========================================================
   YEAR PAGE
   CALENDAR YEAR: JANUARY THROUGH DECEMBER
========================================================= */

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


  const ytd =
    calculateYtd(
      currentMonth
    );


  /* HEADER */

  yearTitle.textContent =
    `${year} Financial Performance`;


  ytdMetricsPeriod.textContent =
    `January ${year} through ${formatMonth(
      currentMonth
    )}`;


  /* =====================================================
     YTD FINANCIAL SUMMARY
  ===================================================== */

  yearRevenue.textContent =
    currency(
      ytd.revenue
    );


  yearExpenses.textContent =
    currency(
      ytd.expenses
    );


  yearProfit.textContent =
    currency(
      ytd.profit
    );


  yearProfit.className =
    ytd.profit >=
    0

      ? "positive-text"

      : "negative-text";


  yearMargin.textContent =
    percent(
      ytd.margin
    );


  yearMarginCard.classList.toggle(
    "loss-card",
    ytd.profit <
    0
  );


  const elapsedMonths =
    Math.max(
      1,
      ytd.months.length
    );


  const revenueForecast =
    (
      ytd.revenue /
      elapsedMonths
    ) * 12;


  yearRevenueForecast.textContent =
    currency(
      revenueForecast
    );


  /* =====================================================
     YTD OPERATING METRICS
  ===================================================== */

  ytdOrganicRevenue.textContent =
    currency(
      ytd.organicRevenue
    );


  ytdFixedCostCoverage.textContent =
    ratio(
      ytd.fixedCostCoverage
    );


  ytdFixedCostCoverageDetail.textContent =
    Number.isFinite(
      ytd.fixedCostCoverage
    )

      ? `${Math.round(
          ytd.fixedCostCoverage *
          100
        )}% of YTD fixed costs covered by organic revenue`

      : "Organic revenue ÷ fixed operating costs";


  ytdLaborPercent.textContent =
    Number.isFinite(
      ytd.laborPercent
    )

      ? percent(
          ytd.laborPercent
        )

      : "—";


  ytdLaborPercentDetail.textContent =
    `${currency(
      ytd.labor
    )} YTD W2 + 1099 labor`;


  ytdExpenseRatio.textContent =
    Number.isFinite(
      ytd.expenseRatio
    )

      ? percent(
          ytd.expenseRatio
        )

      : "—";


  ytdOperatingProfitPerPlayer.textContent =
    Number.isFinite(
      ytd.operatingProfitPerPlayer
    )

      ? currency(
          ytd.operatingProfitPerPlayer
        )

      : "—";


  ytdOperatingProfitPerPlayerDetail.textContent =
    ytd.latestRosterCount > 0

      ? `Based on ${number(
          ytd.latestRosterCount
        )} current rostered players`

      : "Latest roster count unavailable";


  ytdTeamRevenueMix.textContent =
    Number.isFinite(
      ytd.teamRevenueMix
    )

      ? percent(
          ytd.teamRevenueMix
        )

      : "—";


  ytdRevenuePerPlayer.textContent =
    Number.isFinite(
      ytd.revenuePerPlayer
    )

      ? currency(
          ytd.revenuePerPlayer
        )

      : "—";


  ytdRevenuePerPlayerDetail.textContent =
    ytd.latestRosterCount > 0

      ? `YTD team revenue ÷ ${number(
          ytd.latestRosterCount
        )} players`

      : "Latest roster count unavailable";


  ytdTeamContribution.textContent =
    ytd.teamRevenue > 0

      ? currency(
          ytd.teamContribution
        )

      : "—";


  ytdTeamContributionDetail.textContent =
    `${currency(
      ytd.teamDirectCosts
    )} YTD identifiable direct team costs`;


  ytdTeamContributionMargin.textContent =
    Number.isFinite(
      ytd.teamContributionMargin
    )

      ? percent(
          ytd.teamContributionMargin
        )

      : "—";


  ytdLessonHours.textContent =
    number(
      ytd.lessonHours,
      Number.isInteger(
        ytd.lessonHours
      )

        ? 0

        : 1
    );


  ytdRevenuePerLessonHour.textContent =
    Number.isFinite(
      ytd.revenuePerLessonHour
    )

      ? currency(
          ytd.revenuePerLessonHour
        )

      : "—";


  ytdRevenuePerLessonHourDetail.textContent =
    `${currency(
      ytd.lessonRevenue
    )} YTD lesson revenue`;


  ytdFacilityUtilization.textContent =
    Number.isFinite(
      ytd.facilityUtilization
    )

      ? percent(
          ytd.facilityUtilization
        )

      : "—";


  ytdFacilityUtilizationDetail.textContent =
    ytd.availableFacilityHours > 0

      ? `${number(
          ytd.usedFacilityHours,
          Number.isInteger(
            ytd.usedFacilityHours
          )
            ? 0
            : 1
        )} of ${number(
          ytd.availableFacilityHours,
          Number.isInteger(
            ytd.availableFacilityHours
          )
            ? 0
            : 1
        )} available hours utilized`

      : "No facility-hour data entered";


  /* =====================================================
     JANUARY - DECEMBER TABLE
  ===================================================== */

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
          class="
            ${
              active

                ? (
                    totals.profit >=
                    0

                      ? "fy-profit-positive"

                      : "fy-profit-negative"
                  )

                : ""
            }
          "
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
            active

              ? percent(
                  totals.margin
                )

              : "—"
          }

        </td>


        <td>

          <span
            class="
              status-pill
              ${
                active

                  ? "actual"

                  : "future"
              }
            "
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


  /* =====================================================
     YTD BREAKDOWNS
  ===================================================== */

  renderBreakdownList(
    yearRevenueBreakdown,
    ytd.revenueCats,
    ytd.revenue,
    "revenue"
  );


  renderBreakdownList(
    yearExpenseBreakdown,
    ytd.expenseCats,
    ytd.expenses,
    "expense"
  );

}


/* =========================================================
   METRIC HELP
========================================================= */

let metricHelpBound =
  false;


function bindMetricHelp() {

  if (
    metricHelpBound
  ) {

    return;

  }


  metricHelpBound =
    true;


  document
    .querySelectorAll(
      ".metric-help"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const card =
              button.closest(
                ".metric-card"
              );


            const label =
              card
                ?.querySelector(
                  "span"
                )
                ?.textContent
                ?.trim()

              ||
              "Metric";


            metricHelpTitle.textContent =
              label;


            metricHelpText.textContent =
              button.dataset.help ||
              "";


            metricHelpModal.classList.remove(
              "hidden"
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-close-metric-help]"
    )
    .forEach(
      element => {

        element.addEventListener(
          "click",
          closeMetricHelp
        );

      }
    );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Escape"
      ) {

        closeMetricHelp();

      }

    }
  );

}


function closeMetricHelp() {

  metricHelpModal.classList.add(
    "hidden"
  );

}


/* =========================================================
   INITIAL UI
========================================================= */

buildMonthSelector();

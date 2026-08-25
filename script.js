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

  We have historical data split between two versions
  because prior iterations of the app wrote to both.

  READ BOTH PERMANENTLY.
*/

const TRANSACTION_COLLECTIONS = [
  "transactions_v2",
  "transactions"
];

const METRIC_COLLECTIONS = [
  "monthlyMetrics_v2",
  "monthlyMetrics"
];


/*
  ALL NEW DATA GOES HERE.
*/

const WRITE_TRANSACTION_COLLECTION =
  "transactions_v2";

const WRITE_METRICS_COLLECTION =
  "monthlyMetrics_v2";


/* =========================================================
   DATE RANGE
========================================================= */

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
  "Utilities": 2000
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
  "Front Desk",
  "Tournaments",
  "Field Rentals",
  "Utilities",
  "Building Supplies",
  "Other"
];

const MANUAL_EXPENSE_CATEGORIES = [
  "1099 Staff",
  "Front Desk",
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


/*
  We keep separate snapshots of each Firestore collection
  and merge them after every update.
*/

let transactionSources =
  {};

let metricSources =
  {};


let transactionUnsubscribers =
  [];

let metricUnsubscribers =
  [];


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


/* CHARTS / BREAKDOWNS */

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


/* INPUT FORM */

const monthlyMetricsForm =
  $("monthlyMetricsForm");

const monthlyMetricsMessage =
  $("monthlyMetricsMessage");

const saveMonthlyMetricsButton =
  $("saveMonthlyMetricsButton");


/* TRANSACTION PAGE */

const transactionTypeFilter =
  $("transactionTypeFilter");

const transactionCategoryFilter =
  $("transactionCategoryFilter");

const transactionTableBody =
  $("transactionTableBody");

const transactionEmptyState =
  $("transactionEmptyState");


/* YEAR */

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
    ? String(dateString).slice(0, 7)
    : "";

}


function monthToIndex(
  monthKey
) {

  const [
    year,
    month
  ] =
    String(monthKey)
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
    `${year}-${String(
      month
    ).padStart(2, "0")}`
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
    String(monthKey).slice(
      0,
      4
    )
  );

}


/*
  CALENDAR YEAR ONLY:
  JANUARY -> DECEMBER
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
  YTD:
  JANUARY -> SELECTED MONTH
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
    String(monthKey)
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
    String(monthKey)
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
    String(dateString)
      .slice(0, 10)
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
   SAFE HELPERS
========================================================= */

function escapeHtml(
  value = ""
) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

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


function normalizeRevenueCategory(
  category
) {

  const value =
    String(
      category || ""
    ).trim();

  const map = {

    "Rentals / Memberships":
      "Rentals/Memberships",

    "Rentals & Memberships":
      "Rentals/Memberships",

    "Rentals and Memberships":
      "Rentals/Memberships",

    "Camps / Clinics / Programs":
      "Camps/Clinics/Programs",

    "Camps/Clinics":
      "Camps/Clinics/Programs",

    "Camps / Clinics":
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
    map[value] ||
    value
  );

}


function normalizeExpenseCategory(
  category
) {

  const value =
    String(
      category || ""
    ).trim();

  const lower =
    value.toLowerCase();

  if (
    lower === "misc" ||
    lower === "misc."
  ) {

    return "Other";

  }

  if (
    lower === "front desk" ||
    lower === "frontdesk" ||
    lower === "front desk staff" ||
    lower === "front desk labor" ||
    lower === "frontdesk staff" ||
    lower === "frontdesk labor"
  ) {

    return "Front Desk";

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

  if (
    category === "Front Desk"
  ) {

    return "Administration";

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
   TIMESTAMP
========================================================= */

function timestampMillis(
  value
) {

  if (!value) {

    return 0;

  }

  if (
    typeof value.toMillis ===
    "function"
  ) {

    return value.toMillis();

  }

  if (
    typeof value.seconds ===
    "number"
  ) {

    return value.seconds * 1000;

  }

  if (
    typeof value ===
    "number"
  ) {

    return value;

  }

  return 0;

}


/* =========================================================
   METRIC COMPATIBILITY
========================================================= */

function metricNumber(
  monthKey,
  ...keys
) {

  const metrics =
    monthlyMetrics[
      monthKey
    ] || {};

  for (
    const key
    of keys
  ) {

    const value =
      metrics[
        key
      ];

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {

      continue;

    }

    const parsed =
      Number(
        value
      );

    if (
      Number.isFinite(
        parsed
      )
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
        "totalSpots",
        "maxRosterSpots",
        "rosterTotal"
      ),

    activeMemberships:
      metricNumber(
        monthKey,
        "activeMemberships",
        "memberships",
        "membershipCount"
      ),

    lessonHours:
      metricNumber(
        monthKey,
        "lessonHours",
        "lessonsCompleted",
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
    monthToIndex(
      FIRST_MONTH
    );

  const end =
    monthToIndex(
      LAST_MONTH
    );

  for (
    let index = start;
    index <= end;
    index++
  ) {

    const monthKey =
      indexToMonth(
        index
      );

    const option =
      document.createElement(
        "option"
      );

    option.value =
      monthKey;

    option.textContent =
      formatMonth(
        monthKey
      );

    monthSelector.appendChild(
      option
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
    `<option value="all">All Categories</option>`;

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

      transactionUnsubscribers
        .forEach(
          unsubscribe =>
            unsubscribe()
        );

      metricUnsubscribers
        .forEach(
          unsubscribe =>
            unsubscribe()
        );

      transactionUnsubscribers =
        [];

      metricUnsubscribers =
        [];

      transactionSources =
        {};

      metricSources =
        {};

      transactions =
        [];

      monthlyMetrics =
        {};

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
   INITIALIZE
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
   PAGE NAV
========================================================= */

navButtons.forEach(
  button => {

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
    );

  }
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
   TRANSACTIONS — READ BOTH DATABASE VERSIONS
========================================================= */

function listenForTransactions() {

  transactionUnsubscribers
    .forEach(
      unsubscribe =>
        unsubscribe()
    );

  transactionUnsubscribers =
    [];

  transactionSources =
    {};


  TRANSACTION_COLLECTIONS.forEach(
    collectionName => {

      const ref =
        collection(
          db,
          "businesses",
          BUSINESS_ID,
          collectionName
        );


      const unsubscribe =
        onSnapshot(

          ref,

          snapshot => {

            transactionSources[
              collectionName
            ] =
              snapshot.docs.map(
                snapshotDoc => {

                  const data =
                    snapshotDoc.data();

                  const type =
                    normalizeTransactionType(
                      data.type
                    );

                  const category =
                    type ===
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

                    _collection:
                      collectionName,

                    ...data,

                    type,

                    category,

                    amount:
                      Number(
                        data.amount ||
                        0
                      ),

                    month:
                      data.month ||
                      getMonthFromDate(
                        data.date
                      )

                  };

                }
              );


            mergeTransactionSources();

          },

          error => {

            console.error(
              `Transaction listener error (${collectionName}):`,
              error
            );

          }

        );


      transactionUnsubscribers.push(
        unsubscribe
      );

    }
  );

}


/* =========================================================
   TRANSACTION DUPLICATE PROTECTION
========================================================= */

function transactionSignature(
  transaction
) {

  return [

    transaction.date || "",

    transaction.month || "",

    transaction.type || "",

    transaction.category || "",

    Number(
      transaction.amount ||
      0
    ).toFixed(2),

    String(
      transaction.description ||
      ""
    )
      .trim()
      .toLowerCase(),

    String(
      transaction.businessArea ||
      ""
    )
      .trim()
      .toLowerCase(),

    String(
      transaction.teamProgram ||
      ""
    )
      .trim()
      .toLowerCase(),

    String(
      transaction.notes ||
      ""
    )
      .trim()
      .toLowerCase()

  ].join(
    "|"
  );

}


function mergeTransactionSources() {

  const combined =
    [];

  const signatures =
    new Set();


  /*
    Prefer V2 when an identical transaction exists
    in both databases.
  */

  const priorityOrder = [
    "transactions_v2",
    "transactions"
  ];


  priorityOrder.forEach(
    collectionName => {

      const rows =
        transactionSources[
          collectionName
        ] || [];


      rows.forEach(
        transaction => {

          const signature =
            transactionSignature(
              transaction
            );

          if (
            signatures.has(
              signature
            )
          ) {

            return;

          }

          signatures.add(
            signature
          );

          combined.push(
            transaction
          );

        }
      );

    }
  );


  combined.sort(
    (a, b) => {

      const dateCompare =
        String(
          b.date || ""
        ).localeCompare(
          String(
            a.date || ""
          )
        );

      if (
        dateCompare !==
        0
      ) {

        return dateCompare;

      }

      const bTime =
        timestampMillis(
          b.updatedAt ||
          b.createdAt
        );

      const aTime =
        timestampMillis(
          a.updatedAt ||
          a.createdAt
        );

      return (
        bTime -
        aTime
      );

    }
  );


  transactions =
    combined;


  console.log(
    "MERGED TRANSACTIONS:",
    transactions
  );


  renderEverything();

}


/* =========================================================
   MONTHLY METRICS — READ BOTH DATABASE VERSIONS
========================================================= */

function listenForMonthlyMetrics() {

  metricUnsubscribers
    .forEach(
      unsubscribe =>
        unsubscribe()
    );

  metricUnsubscribers =
    [];

  metricSources =
    {};


  METRIC_COLLECTIONS.forEach(
    collectionName => {

      const ref =
        collection(
          db,
          "businesses",
          BUSINESS_ID,
          collectionName
        );


      const unsubscribe =
        onSnapshot(

          ref,

          snapshot => {

            const source =
              {};


            snapshot.docs.forEach(
              snapshotDoc => {

                const data =
                  snapshotDoc.data();

                const monthKey =
                  data.month ||
                  snapshotDoc.id;


                source[
                  monthKey
                ] = {

                  ...data,

                  _documentId:
                    snapshotDoc.id,

                  _collection:
                    collectionName

                };

              }
            );


            metricSources[
              collectionName
            ] =
              source;


            mergeMetricSources();

          },

          error => {

            console.error(
              `Metric listener error (${collectionName}):`,
              error
            );

          }

        );


      metricUnsubscribers.push(
        unsubscribe
      );

    }
  );

}


/* =========================================================
   METRIC MERGE
========================================================= */

function getPositiveNumberFromRecords(
  records,
  keys
) {

  for (
    const record
    of records
  ) {

    if (!record) {

      continue;

    }

    for (
      const key
      of keys
    ) {

      const value =
        Number(
          record[
            key
          ]
        );

      if (
        Number.isFinite(value) &&
        value > 0
      ) {

        return value;

      }

    }

  }

  return 0;

}


function mergeMetricSources() {

  const v2 =
    metricSources[
      "monthlyMetrics_v2"
    ] || {};

  const original =
    metricSources[
      "monthlyMetrics"
    ] || {};


  const months =
    new Set(
      [
        ...Object.keys(
          v2
        ),
        ...Object.keys(
          original
        )
      ]
    );


  const merged =
    {};


  months.forEach(
    monthKey => {

      const v2Record =
        v2[
          monthKey
        ] || {};

      const originalRecord =
        original[
          monthKey
        ] || {};


      const v2Time =
        timestampMillis(
          v2Record.updatedAt
        );

      const originalTime =
        timestampMillis(
          originalRecord.updatedAt
        );


      /*
        Newer record wins generally.
        Missing properties fall back to the other source.
      */

      const newer =
        originalTime >
        v2Time

          ? originalRecord

          : v2Record;


      const older =
        originalTime >
        v2Time

          ? v2Record

          : originalRecord;


      merged[
        monthKey
      ] = {

        ...older,
        ...newer

      };


      /*
        SPECIAL PROTECTION:
        Do not let an old 0 overwrite a real Total Roster Spots
        value stored in either collection.
      */

      const rosterCapacity =
        getPositiveNumberFromRecords(
          [
            newer,
            older
          ],
          [
            "rosterCapacity",
            "totalRosterSpots",
            "availableRosterSpots",
            "rosterSpots",
            "totalSpots",
            "maxRosterSpots",
            "rosterTotal"
          ]
        );


      if (
        rosterCapacity >
        0
      ) {

        merged[
          monthKey
        ].rosterCapacity =
          rosterCapacity;

        merged[
          monthKey
        ].totalRosterSpots =
          rosterCapacity;

      }


      /*
        Same protection for other positive operating inputs.

        This prevents a stale 0 from one collection from
        hiding actual data saved in the other collection.
      */

      const rosteredPlayers =
        getPositiveNumberFromRecords(
          [
            newer,
            older
          ],
          [
            "rosteredPlayers",
            "players",
            "playerCount",
            "rosterCount"
          ]
        );


      if (
        rosteredPlayers >
        0
      ) {

        merged[
          monthKey
        ].rosteredPlayers =
          rosteredPlayers;

      }


      const activeMemberships =
        getPositiveNumberFromRecords(
          [
            newer,
            older
          ],
          [
            "activeMemberships",
            "memberships",
            "membershipCount"
          ]
        );


      if (
        activeMemberships >
        0
      ) {

        merged[
          monthKey
        ].activeMemberships =
          activeMemberships;

      }


      const lessonHours =
        getPositiveNumberFromRecords(
          [
            newer,
            older
          ],
          [
            "lessonHours",
            "lessonsCompleted",
            "lessonHoursCompleted",
            "lessonCount"
          ]
        );


      if (
        lessonHours >
        0
      ) {

        merged[
          monthKey
        ].lessonHours =
          lessonHours;

        merged[
          monthKey
        ].lessonsCompleted =
          lessonHours;

      }


      const availableFacilityHours =
        getPositiveNumberFromRecords(
          [
            newer,
            older
          ],
          [
            "availableFacilityHours",
            "facilityAvailableHours",
            "facilityHoursAvailable"
          ]
        );


      if (
        availableFacilityHours >
        0
      ) {

        merged[
          monthKey
        ].availableFacilityHours =
          availableFacilityHours;

      }


      const usedFacilityHours =
        getPositiveNumberFromRecords(
          [
            newer,
            older
          ],
          [
            "usedFacilityHours",
            "facilityUsedHours",
            "facilityHoursUsed"
          ]
        );


      if (
        usedFacilityHours >
        0
      ) {

        merged[
          monthKey
        ].usedFacilityHours =
          usedFacilityHours;

      }

    }
  );


  monthlyMetrics =
    merged;


  console.log(
    "MERGED MONTHLY METRICS:",
    monthlyMetrics
  );


  loadMonthlyMetricsForm();

  renderEverything();

}


/* =========================================================
   MONTH TRANSACTIONS
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
   CATEGORY CALCULATIONS
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
          ] === undefined
        ) {

          return;

        }


        totals[
          category
        ] +=
          Number(
            transaction.amount ||
            0
          );

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
        category =>
          [
            category,
            0
          ]
      )
    );


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

        let category =
          normalizeExpenseCategory(
            transaction.category
          );


        /*
          Never throw away an expense.
        */

        if (
          totals[
            category
          ] === undefined
        ) {

          category =
            "Other";

        }


        totals[
          category
        ] +=
          Number(
            transaction.amount ||
            0
          );

      }
    );


  return totals;

}


/* =========================================================
   MONTH CALCULATION
========================================================= */

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
        ) =>
          sum +
          Number(
            transaction.amount ||
            0
          ),
        0
      );


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


  const frontDeskLabor =
    Number(
      expenseCats[
        "Front Desk"
      ] || 0
    );


  /*
    Front Desk is labor.
  */

  const labor =
    w2Labor +
    contractorLabor +
    frontDeskLabor;


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

    frontDeskLabor,

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
   COMPARISONS
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
      true
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
      `${sign}${comparison.toFixed(1)} pts vs last month`;

  }

  else {

    element.textContent =
      `${sign}${comparison.toFixed(1)}% vs last month`;

  }


  if (
    comparison !==
    0
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


  /* SUMMARY */

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
    totals.profit >=
    0

      ? "positive-text"

      : "negative-text";


  monthlyMargin.textContent =
    percent(
      totals.margin
    );


  marginCard.classList.toggle(
    "loss-card",
    totals.profit <
    0
  );


  /* INPUT VALUES */

  const players =
    metrics.rosteredPlayers;


  const capacity =
    metrics.rosterCapacity;


  const activeMemberships =
    metrics.activeMemberships;


  const lessonHours =
    metrics.lessonHours;


  const availableHours =
    metrics.availableFacilityHours;


  const usedHours =
    metrics.usedFacilityHours;


  const previousPlayers =
    previousMetrics.rosteredPlayers;


  const previousMemberships =
    previousMetrics.activeMemberships;


  const previousLessonHours =
    previousMetrics.lessonHours;


  const previousAvailable =
    previousMetrics.availableFacilityHours;


  const previousUsed =
    previousMetrics.usedFacilityHours;


  /* DERIVED */

  const profitPerPlayer =
    players >
    0

      ? totals.profit /
        players

      : NaN;


  const previousProfitPerPlayer =
    previousPlayers >
    0

      ? previousTotals.profit /
        previousPlayers

      : NaN;


  const teamRevenuePerPlayer =
    players >
    0

      ? totals.teamRevenue /
        players

      : NaN;


  const previousTeamRevenuePerPlayer =
    previousPlayers >
    0

      ? previousTotals.teamRevenue /
        previousPlayers

      : NaN;


  const rosterFill =
    capacity >
    0

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
    lessonHours >
    0

      ? lessonRevenue /
        lessonHours

      : NaN;


  const previousLessonRevenue =
    previousTotals.revenueCats[
      "Lessons"
    ] || 0;


  const previousRevenuePerLessonHour =
    previousLessonHours >
    0

      ? previousLessonRevenue /
        previousLessonHours

      : NaN;


  const facilityUtilization =
    availableHours >
    0

      ? (
          usedHours /
          availableHours
        ) * 100

      : NaN;


  const previousFacilityUtilization =
    previousAvailable >
    0

      ? (
          previousUsed /
          previousAvailable
        ) * 100

      : NaN;


  /* ORGANIC REVENUE */

  organicRevenueEl.textContent =
    currency(
      totals.organicRevenue
    );


  organicRevenueDetail.textContent =
    "Excludes team revenue";


  if (
    previousTotals.revenue >
    0
  ) {

    setComparisonDetail(
      organicRevenueDetail,
      totals.organicRevenue,
      previousTotals.organicRevenue
    );

  }


  /* FIXED COVERAGE */

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


  /* LABOR */

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
    )} W2 + 1099 + Front Desk labor`;


  /* EXPENSE RATIO */

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


  /* PROFIT / PLAYER */

  operatingProfitPerPlayerEl.textContent =
    Number.isFinite(
      profitPerPlayer
    )

      ? currency(
          profitPerPlayer
        )

      : "—";


  operatingProfitPerPlayerDetail.textContent =
    "Operating profit ÷ rostered players";


  if (
    Number.isFinite(
      previousProfitPerPlayer
    )
  ) {

    setComparisonDetail(
      operatingProfitPerPlayerDetail,
      profitPerPlayer,
      previousProfitPerPlayer
    );

  }


  /* TEAM MIX */

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
    Number.isFinite(
      previousTotals.teamRevenueMix
    )
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


  /* REVENUE / PLAYER */

  revenuePerPlayerEl.textContent =
    Number.isFinite(
      teamRevenuePerPlayer
    )

      ? currency(
          teamRevenuePerPlayer
        )

      : "—";


  revenuePerPlayerDetail.textContent =
    "Team revenue ÷ rostered players";


  if (
    Number.isFinite(
      previousTeamRevenuePerPlayer
    )
  ) {

    setComparisonDetail(
      revenuePerPlayerDetail,
      teamRevenuePerPlayer,
      previousTeamRevenuePerPlayer
    );

  }


  /* TEAM CONTRIBUTION */

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
        )} identifiable direct team costs`

      : "No team revenue recorded";


  /* TEAM MARGIN */

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


  /* ROSTER FILL */

  rosterFillRateEl.textContent =
    Number.isFinite(
      rosterFill
    )

      ? percent(
          rosterFill
        )

      : "—";


  rosterFillRateDetail.textContent =
    capacity >
    0

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


  /* LESSON HOURS */

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


  /* LESSON ECONOMICS */

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
    Number.isFinite(
      previousRevenuePerLessonHour
    )
  ) {

    setComparisonDetail(
      revenuePerLessonHourDetail,
      revenuePerLessonHour,
      previousRevenuePerLessonHour
    );

  }


  /* FACILITY */

  facilityUtilizationEl.textContent =
    Number.isFinite(
      facilityUtilization
    )

      ? percent(
          facilityUtilization
        )

      : "—";


  facilityUtilizationDetail.textContent =
    availableHours >
    0

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
    Number.isFinite(
      previousFacilityUtilization
    )
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


  /* MEMBERSHIP CHANGE */

  const membershipChange =
    monthlyMetrics[
      previousKey
    ]

      ? (
          activeMemberships -
          previousMemberships
        )

      : NaN;


  membershipChangeEl.textContent =
    Number.isFinite(
      membershipChange
    )

      ? (
          membershipChange >
          0

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


  /* STATUS */

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
   LOAD INPUT FORM
========================================================= */

function loadMonthlyMetricsForm() {

  const metrics =
    getMetricSnapshot(
      currentMonth
    );


  const hasData =
    Boolean(
      monthlyMetrics[
        currentMonth
      ]
    );


  if (
    $("rosteredPlayers")
  ) {

    $("rosteredPlayers").value =
      hasData
        ? metrics.rosteredPlayers
        : "";

  }


  if (
    $("rosterCapacity")
  ) {

    $("rosterCapacity").value =
      hasData
        ? metrics.rosterCapacity
        : "";

  }


  if (
    $("activeMemberships")
  ) {

    $("activeMemberships").value =
      hasData
        ? metrics.activeMemberships
        : "";

  }


  if (
    $("lessonHours")
  ) {

    $("lessonHours").value =
      hasData
        ? metrics.lessonHours
        : "";

  }


  /*
    Compatibility if HTML still uses lessonsCompleted.
  */

  if (
    $("lessonsCompleted")
  ) {

    $("lessonsCompleted").value =
      hasData
        ? metrics.lessonHours
        : "";

  }


  if (
    $("availableFacilityHours")
  ) {

    $("availableFacilityHours").value =
      hasData
        ? metrics.availableFacilityHours
        : "";

  }


  if (
    $("usedFacilityHours")
  ) {

    $("usedFacilityHours").value =
      hasData
        ? metrics.usedFacilityHours
        : "";

  }


  monthlyMetricsMessage.textContent =
    "";

}


/* =========================================================
   SAVE MONTHLY INPUTS
   ALL NEW WRITES -> V2
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


    const lessonInput =
      $("lessonHours") ||
      $("lessonsCompleted");


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

      lessonHours,

      lessonsCompleted:
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
          WRITE_METRICS_COLLECTION,
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


  const selectedIndex =
    monthToIndex(
      currentMonth
    );


  const revenueData =
    months.map(
      month =>
        monthToIndex(
          month
        ) <=
        selectedIndex

          ? calculateMonth(
              month
            ).revenue

          : null
    );


  const expenseData =
    months.map(
      month =>
        monthToIndex(
          month
        ) <=
        selectedIndex

          ? calculateMonth(
              month
            ).expenses

          : null
    );


  const profitData =
    months.map(
      month =>
        monthToIndex(
          month
        ) <=
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
        total >
        0

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
      8
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
   TRANSACTION KEY
========================================================= */

function transactionKey(
  transaction
) {

  return (
    `${transaction._collection}::` +
    `${transaction.id}`
  );

}


function findTransactionByKey(
  key
) {

  const [
    collectionName,
    id
  ] =
    String(key)
      .split("::");


  return transactions.find(
    transaction =>
      transaction.id ===
        id

      &&

      transaction._collection ===
        collectionName
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


      const key =
        transactionKey(
          transaction
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
              data-key="${escapeHtml(key)}"
            >
              Edit
            </button>

            <button
              class="small-button delete"
              data-key="${escapeHtml(key)}"
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
      button => {

        button.addEventListener(
          "click",
          () =>
            openEditTransaction(
              button.dataset.key
            )
        );

      }
    );


  document
    .querySelectorAll(
      ".small-button.delete"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () =>
            deleteTransaction(
              button.dataset.key
            )
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


/* =========================================================
   ADD BUTTONS
========================================================= */

[
  "dashboardAddRevenueButton",
  "transactionsAddRevenueButton"
].forEach(
  id => {

    $(id).addEventListener(
      "click",
      () =>
        openNewTransaction(
          "revenue"
        )
    );

  }
);


[
  "dashboardAddExpenseButton",
  "transactionsAddExpenseButton"
].forEach(
  id => {

    $(id).addEventListener(
      "click",
      () =>
        openNewTransaction(
          "expense"
        )
    );

  }
);


/* =========================================================
   TRANSACTION MODAL
========================================================= */

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


  const previous =
    type ===
    "expense"

      ? normalizeExpenseCategory(
          transactionCategory.value
        )

      : normalizeRevenueCategory(
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
      previous
    )
  ) {

    transactionCategory.value =
      previous;

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
    type ===
    "expense"

      ? "overhead"

      : "direct";


  transactionBusinessArea.value =
    type ===
    "expense"

      ? "General"

      : "General";


  setModalType(
    type
  );


  transactionModal.classList.remove(
    "hidden"
  );

}


function openEditTransaction(
  key
) {

  const transaction =
    findTransactionByKey(
      key
    );


  if (!transaction) {

    return;

  }


  transactionForm.reset();


  /*
    Store collection + document ID together.
  */

  transactionId.value =
    key;


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


  const category =
    transaction.type ===
    "expense"

      ? normalizeExpenseCategory(
          transaction.category
        )

      : normalizeRevenueCategory(
          transaction.category
        );


  if (
    [
      ...transactionCategory.options
    ].some(
      option =>
        option.value ===
        category
    )
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


/* =========================================================
   SAVE TRANSACTION
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


    if (!date) {

      transactionFormError.textContent =
        "Choose a date.";

      return;

    }


    if (!description) {

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

      const editKey =
        transactionId.value;


      /*
        EDIT:
        Update the exact collection where that transaction
        currently lives.
      */

      if (
        editKey
      ) {

        const existing =
          findTransactionByKey(
            editKey
          );


        if (!existing) {

          throw new Error(
            "Could not locate transaction to edit."
          );

        }


        await updateDoc(

          doc(
            db,
            "businesses",
            BUSINESS_ID,
            existing._collection,
            existing.id
          ),

          data

        );

      }

      /*
        NEW:
        Always write to V2.
      */

      else {

        data.createdAt =
          serverTimestamp();


        await addDoc(

          collection(
            db,
            "businesses",
            BUSINESS_ID,
            WRITE_TRANSACTION_COLLECTION
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
   DELETE TRANSACTION
========================================================= */

async function deleteTransaction(
  key
) {

  const transaction =
    findTransactionByKey(
      key
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
        transaction._collection,
        transaction.id
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
   YTD CALCULATION
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
            ] || 0;

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
            ] || 0;

        }
      );

    }
  );


  const profit =
    revenue -
    expenses;


  const margin =
    revenue >
    0

      ? (
          profit /
          revenue
        ) * 100

      : 0;


  const fixedCostCoverage =
    fixedExpenses >
    0

      ? organicRevenue /
        fixedExpenses

      : NaN;


  const laborPercent =
    revenue >
    0

      ? (
          labor /
          revenue
        ) * 100

      : NaN;


  const expenseRatio =
    revenue >
    0

      ? (
          expenses /
          revenue
        ) * 100

      : NaN;


  const teamRevenueMix =
    revenue >
    0

      ? (
          teamRevenue /
          revenue
        ) * 100

      : NaN;


  const teamContribution =
    teamRevenue -
    teamDirectCosts;


  const teamContributionMargin =
    teamRevenue >
    0

      ? (
          teamContribution /
          teamRevenue
        ) * 100

      : NaN;


  const lessonRevenue =
    revenueCats[
      "Lessons"
    ] || 0;


  const revenuePerLessonHour =
    lessonHours >
    0

      ? lessonRevenue /
        lessonHours

      : NaN;


  const facilityUtilization =
    availableFacilityHours >
    0

      ? (
          usedFacilityHours /
          availableFacilityHours
        ) * 100

      : NaN;


  /*
    ROSTER COUNT IS POINT-IN-TIME.
    DO NOT SUM IT.
  */

  let latestRosterCount =
    0;


  for (
    let index =
      months.length - 1;

    index >=
    0;

    index--
  ) {

    const count =
      getMetricSnapshot(
        months[
          index
        ]
      ).rosteredPlayers;


    if (
      count >
      0
    ) {

      latestRosterCount =
        count;

      break;

    }

  }


  const operatingProfitPerPlayer =
    latestRosterCount >
    0

      ? profit /
        latestRosterCount

      : NaN;


  const revenuePerPlayer =
    latestRosterCount >
    0

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
   JANUARY -> DECEMBER
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


  yearTitle.textContent =
    `${year} Financial Performance`;


  ytdMetricsPeriod.textContent =
    `January ${year} through ${formatMonth(
      currentMonth
    )}`;


  /* FINANCIAL SUMMARY */

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


  yearRevenueForecast.textContent =
    currency(
      (
        ytd.revenue /
        elapsedMonths
      ) * 12
    );


  /* YTD METRICS */

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
    )} YTD labor`;


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
    ytd.latestRosterCount >
    0

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
    ytd.latestRosterCount >
    0

      ? `YTD team revenue ÷ ${number(
          ytd.latestRosterCount
        )} players`

      : "Latest roster count unavailable";


  ytdTeamContribution.textContent =
    ytd.teamRevenue >
    0

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
    ytd.availableFacilityHours >
    0

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


  /* MONTHLY TABLE */

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
   HELP MODAL
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

        closeTransactionModal();

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

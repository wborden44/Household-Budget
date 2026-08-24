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


const firebaseConfig = {
  apiKey: "AIzaSyBgW3D1UI_EYTJS5m1GXe6XwRTmkR-UcJo",
  authDomain: "household-budget-b350e.firebaseapp.com",
  projectId: "household-budget-b350e",
  storageBucket: "household-budget-b350e.firebasestorage.app",
  messagingSenderId: "691191089446",
  appId: "1:691191089446:web:03175b656254076da519e7"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const BUSINESS_ID = "ninth-inning-kennesaw";

const TRANSACTIONS_COLLECTION = "transactions_v2";
const METRICS_COLLECTION = "monthlyMetrics_v2";

const FIRST_MONTH = "2026-01";
const LAST_MONTH = "2031-12";
const FIRST_DATE = "2026-01-01";

const DEFAULT_FIXED_COSTS = {
  rent: 8938.90,
  w2: 9583,
  utilities: 1800
};

const REVENUE_CATEGORIES = [
  "Lessons",
  "Tryouts",
  "Point of Sale",
  "Rentals/Memberships",
  "Camps/Clinics/Programs",
  "Team Revenue"
];

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

const ALL_CATEGORIES = [
  ...REVENUE_CATEGORIES,
  ...EXPENSE_CATEGORIES
];

const $ = id => document.getElementById(id);

let currentMonth = getCurrentMonth();

if (monthToIndex(currentMonth) < monthToIndex(FIRST_MONTH)) {
  currentMonth = FIRST_MONTH;
}

if (monthToIndex(currentMonth) > monthToIndex(LAST_MONTH)) {
  currentMonth = LAST_MONTH;
}

let transactions = [];
let monthlyMetrics = {};

let transactionsUnsubscribe = null;
let metricsUnsubscribe = null;

let performanceChart = null;
let revenueMixChart = null;


/* DOM */

const loginScreen = $("loginScreen");
const app = $("app");

const loginForm = $("loginForm");
const loginError = $("loginError");
const logoutButton = $("logoutButton");

const monthSelector = $("monthSelector");
const previousMonthButton = $("previousMonthButton");
const nextMonthButton = $("nextMonthButton");

const navButtons = document.querySelectorAll(".nav-button");
const pages = document.querySelectorAll(".page");

const dashboardMonthTitle = $("dashboardMonthTitle");

const monthlyRevenue = $("monthlyRevenue");
const monthlyRevenueTrend = $("monthlyRevenueTrend");

const monthlyExpenses = $("monthlyExpenses");
const monthlyExpenseDetail = $("monthlyExpenseDetail");

const monthlyProfit = $("monthlyProfit");
const monthlyProfitTrend = $("monthlyProfitTrend");

const monthlyMargin = $("monthlyMargin");
const monthlyMarginTrend = $("monthlyMarginTrend");
const marginCard = $("marginCard");

const fixedCostsForm = $("fixedCostsForm");
const fixedRent = $("fixedRent");
const fixedW2 = $("fixedW2");
const fixedUtilities = $("fixedUtilities");
const fixedCostTotal = $("fixedCostTotal");
const startingMonthlyCost = $("startingMonthlyCost");
const fixedCostsMessage = $("fixedCostsMessage");

const organicRevenue = $("organicRevenue");
const organicRevenueDetail = $("organicRevenueDetail");

const fixedCostCoverage = $("fixedCostCoverage");
const fixedCostCoverageDetail = $("fixedCostCoverageDetail");

const laborPercent = $("laborPercent");
const laborPercentDetail = $("laborPercentDetail");

const expenseRatio = $("expenseRatio");
const expenseRatioDetail = $("expenseRatioDetail");

const profitPerPlayer = $("profitPerPlayer");
const profitPerPlayerDetail = $("profitPerPlayerDetail");

const teamRevenueMix = $("teamRevenueMix");
const teamRevenueMixDetail = $("teamRevenueMixDetail");

const revenuePerPlayer = $("revenuePerPlayer");
const revenuePerPlayerDetail = $("revenuePerPlayerDetail");

const teamContribution = $("teamContribution");
const teamContributionDetail = $("teamContributionDetail");

const teamContributionMargin = $("teamContributionMargin");
const teamMarginDetail = $("teamMarginDetail");

const rosterFillRate = $("rosterFillRate");
const rosterFillRateDetail = $("rosterFillRateDetail");

const lessonHoursMetric = $("lessonHoursMetric");
const lessonHoursMetricDetail = $("lessonHoursMetricDetail");

const revenuePerLesson = $("revenuePerLesson");
const revenuePerLessonDetail = $("revenuePerLessonDetail");

const facilityUtilization = $("facilityUtilization");
const facilityUtilizationDetail = $("facilityUtilizationDetail");

const membershipChange = $("membershipChange");
const membershipChangeDetail = $("membershipChangeDetail");

const metricsStatus = $("metricsStatus");

const monthlyMetricsForm = $("monthlyMetricsForm");
const monthlyMetricsMessage = $("monthlyMetricsMessage");

const metricFieldIds = [
  "activeTeams",
  "rosteredPlayers",
  "targetRosterSpots",
  "lessonHours",
  "programParticipants",
  "activeMemberships",
  "availableFacilityHours",
  "usedFacilityHours"
];

const revenueBreakdown = $("revenueBreakdown");
const expenseBreakdown = $("expenseBreakdown");
const recentTransactions = $("recentTransactions");

const chartYearLabel = $("chartYearLabel");
const revenueMixTitle = $("revenueMixTitle");
const revenueMixEmpty = $("revenueMixEmpty");

const transactionTypeFilter = $("transactionTypeFilter");
const transactionCategoryFilter = $("transactionCategoryFilter");
const transactionTableBody = $("transactionTableBody");
const transactionEmptyState = $("transactionEmptyState");

const yearTitle = $("yearTitle");
const yearRevenue = $("yearRevenue");
const yearExpenses = $("yearExpenses");
const yearProfit = $("yearProfit");
const yearMargin = $("yearMargin");
const yearMarginCard = $("yearMarginCard");
const yearRevenueForecast = $("yearRevenueForecast");
const yearTableBody = $("yearTableBody");
const yearRevenueBreakdown = $("yearRevenueBreakdown");
const yearExpenseBreakdown = $("yearExpenseBreakdown");

const transactionModal = $("transactionModal");
const transactionForm = $("transactionForm");
const transactionModalTitle = $("transactionModalTitle");
const transactionId = $("transactionId");
const transactionType = $("transactionType");
const transactionAmount = $("transactionAmount");
const transactionDate = $("transactionDate");
const transactionDescription = $("transactionDescription");
const transactionCategory = $("transactionCategory");
const transactionNotes = $("transactionNotes");
const transactionFormError = $("transactionFormError");

const modalRevenueTypeButton = $("modalRevenueTypeButton");
const modalExpenseTypeButton = $("modalExpenseTypeButton");

const expenseAttributionFields = $("expenseAttributionFields");
const transactionCostType = $("transactionCostType");
const transactionBusinessArea = $("transactionBusinessArea");
const transactionTeamProgram = $("transactionTeamProgram");


/* HELPERS */

function currency(value) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD"
    }
  ).format(Number(value || 0));
}

function percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function multiple(value) {
  return `${Number(value || 0).toFixed(2)}x`;
}

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

function todayString() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
}

function getMonthFromDate(date) {
  return date ? date.slice(0, 7) : "";
}

function monthToIndex(key) {
  const [year, month] = key.split("-").map(Number);

  return year * 12 + month - 1;
}

function previousMonthKey(key) {
  const [year, month] = key.split("-").map(Number);

  const date = new Date(
    year,
    month - 2,
    1
  );

  const previous =
    `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

  if (
    monthToIndex(previous) <
    monthToIndex(FIRST_MONTH)
  ) {
    return null;
  }

  return previous;
}

function formatMonth(key) {
  const [year, month] = key.split("-").map(Number);

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

function shortMonth(key) {
  const [year, month] = key.split("-").map(Number);

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

function formatDate(date) {
  if (!date) return "";

  const [year, month, day] =
    date.split("-").map(Number);

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

function yearFromMonth(key) {
  return Number(key.slice(0, 4));
}

function buildYearMonths(year) {
  return Array.from(
    { length: 12 },
    (_, index) =>
      `${year}-${String(index + 1).padStart(2, "0")}`
  );
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function changePercent(current, previous) {
  current = Number(current || 0);
  previous = Number(previous || 0);

  if (previous === 0) {
    return null;
  }

  return (
    (
      current -
      previous
    ) /
    Math.abs(previous)
  ) * 100;
}

function formatChange(
  current,
  previous,
  options = {}
) {
  const {
    points = false,
    inverse = false
  } = options;

  if (
    previous === null ||
    previous === undefined
  ) {
    return {
      text: "No prior month",
      className: "trend-neutral"
    };
  }

  const difference =
    Number(current || 0) -
    Number(previous || 0);

  if (points) {
    const sign =
      difference > 0
        ? "+"
        : "";

    const better =
      inverse
        ? difference < 0
        : difference > 0;

    const worse =
      inverse
        ? difference > 0
        : difference < 0;

    return {
      text:
        `${sign}${difference.toFixed(1)} pts vs last month`,

      className:
        better
          ? "trend-good"
          : worse
            ? "trend-bad"
            : "trend-neutral"
    };
  }

  const percentage =
    changePercent(
      current,
      previous
    );

  if (percentage === null) {
    return {
      text:
        difference === 0
          ? "No change vs last month"
          : "No comparable prior month",

      className:
        "trend-neutral"
    };
  }

  const sign =
    percentage > 0
      ? "+"
      : "";

  const better =
    inverse
      ? percentage < 0
      : percentage > 0;

  const worse =
    inverse
      ? percentage > 0
      : percentage < 0;

  return {
    text:
      `${sign}${percentage.toFixed(1)}% vs last month`,

    className:
      better
        ? "trend-good"
        : worse
          ? "trend-bad"
          : "trend-neutral"
  };
}

function setTrend(
  element,
  trend,
  fallback = ""
) {
  if (!element) return;

  element.textContent =
    trend?.text || fallback;

  element.classList.remove(
    "trend-good",
    "trend-bad",
    "trend-neutral"
  );

  if (trend?.className) {
    element.classList.add(
      trend.className
    );
  }
}


/* MONTH NAVIGATION */

function buildMonthSelector() {
  monthSelector.innerHTML = "";

  const start =
    new Date(2026, 0, 1);

  const end =
    new Date(2031, 11, 1);

  const cursor =
    new Date(start);

  while (cursor <= end) {
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
}

function moveMonth(offset) {
  const [year, month] =
    currentMonth
      .split("-")
      .map(Number);

  const date =
    new Date(
      year,
      month - 1 + offset,
      1
    );

  const key =
    `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

  if (
    monthToIndex(key) <
    monthToIndex(FIRST_MONTH)
  ) {
    return;
  }

  if (
    monthToIndex(key) >
    monthToIndex(LAST_MONTH)
  ) {
    return;
  }

  currentMonth =
    key;

  monthSelector.value =
    currentMonth;

  renderEverything();
}

previousMonthButton.addEventListener(
  "click",
  () => moveMonth(-1)
);

nextMonthButton.addEventListener(
  "click",
  () => moveMonth(1)
);

monthSelector.addEventListener(
  "change",
  event => {
    currentMonth =
      event.target.value;

    renderEverything();
  }
);


/* AUTH */

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
    } catch (error) {
      console.error(error);

      loginError.textContent =
        "Unable to sign in.";
    }
  }
);

logoutButton.addEventListener(
  "click",
  () => signOut(auth)
);

onAuthStateChanged(
  auth,
  user => {
    if (!user) {
      if (transactionsUnsubscribe) {
        transactionsUnsubscribe();
      }

      if (metricsUnsubscribe) {
        metricsUnsubscribe();
      }

      transactionsUnsubscribe = null;
      metricsUnsubscribe = null;

      app.classList.add("hidden");
      loginScreen.classList.remove("hidden");

      return;
    }

    loginScreen.classList.add("hidden");
    app.classList.remove("hidden");

    initialize();
  }
);


/* INITIALIZE */

function initialize() {
  buildMonthSelector();
  buildCategoryFilter();
  listenTransactions();
  listenMetrics();
}


/* NAVIGATION */

navButtons.forEach(
  button => {
    button.addEventListener(
      "click",
      () => {
        navButtons.forEach(
          item =>
            item.classList.remove(
              "active"
            )
        );

        pages.forEach(
          page =>
            page.classList.remove(
              "active-page"
            )
        );

        button.classList.add(
          "active"
        );

        const page =
          $(
            `${button.dataset.page}Page`
          );

        if (page) {
          page.classList.add(
            "active-page"
          );
        }

        if (
          button.dataset.page ===
          "dashboard"
        ) {
          setTimeout(
            renderCharts,
            10
          );
        }

        if (
          button.dataset.page ===
          "reports"
        ) {
          renderYear();
        }
      }
    );
  }
);


/* FIRESTORE */

function listenTransactions() {
  if (transactionsUnsubscribe) {
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
            item => {
              const data =
                item.data();

              return {
                id: item.id,
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

function listenMetrics() {
  if (metricsUnsubscribe) {
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
        monthlyMetrics = {};

        snapshot.docs.forEach(
          item => {
            monthlyMetrics[
              item.id
            ] = {
              ...item.data()
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


/* FIXED COSTS */

function getFixedCosts(month) {
  const saved =
    monthlyMetrics[month] ||
    {};

  return {
    rent:
      saved.fixedRent !== undefined
        ? Number(saved.fixedRent)
        : DEFAULT_FIXED_COSTS.rent,

    w2:
      saved.fixedW2 !== undefined
        ? Number(saved.fixedW2)
        : DEFAULT_FIXED_COSTS.w2,

    utilities:
      saved.fixedUtilities !== undefined
        ? Number(saved.fixedUtilities)
        : DEFAULT_FIXED_COSTS.utilities
  };
}

function fixedTotal(month) {
  const fixed =
    getFixedCosts(month);

  return (
    fixed.rent +
    fixed.w2 +
    fixed.utilities
  );
}

function loadFixedCosts() {
  const fixed =
    getFixedCosts(
      currentMonth
    );

  fixedRent.value =
    fixed.rent.toFixed(2);

  fixedW2.value =
    fixed.w2.toFixed(2);

  fixedUtilities.value =
    fixed.utilities.toFixed(2);

  updateFixedPreview();
}

function updateFixedPreview() {
  const total =
    Number(
      fixedRent.value || 0
    ) +
    Number(
      fixedW2.value || 0
    ) +
    Number(
      fixedUtilities.value || 0
    );

  fixedCostTotal.textContent =
    currency(total);

  startingMonthlyCost.textContent =
    `-${currency(total)}`;
}

[
  fixedRent,
  fixedW2,
  fixedUtilities
].forEach(
  input =>
    input.addEventListener(
      "input",
      updateFixedPreview
    )
);

fixedCostsForm.addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    fixedCostsMessage.textContent =
      "";

    const rent =
      Number(
        fixedRent.value || 0
      );

    const w2 =
      Number(
        fixedW2.value || 0
      );

    const utilities =
      Number(
        fixedUtilities.value || 0
      );

    try {
      await setDoc(
        doc(
          db,
          "businesses",
          BUSINESS_ID,
          METRICS_COLLECTION,
          currentMonth
        ),

        {
          month: currentMonth,
          year:
            yearFromMonth(
              currentMonth
            ),
          fixedRent: rent,
          fixedW2: w2,
          fixedUtilities: utilities,
          updatedAt:
            serverTimestamp()
        },

        {
          merge: true
        }
      );

      fixedCostsMessage.textContent =
        "Saved.";
    } catch (error) {
      console.error(error);

      fixedCostsMessage.textContent =
        "Unable to save.";
    }
  }
);


/* BUSINESS INPUTS */

function loadMetrics() {
  const values =
    monthlyMetrics[
      currentMonth
    ] ||
    {};

  metricFieldIds.forEach(
    id => {
      const element =
        $(id);

      if (!element) return;

      element.value =
        values[id] ??
        "";
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
        const element =
          $(id);

        if (!element) return;

        data[id] =
          Number(
            element.value ||
            0
          );
      }
    );

    if (
      data.availableFacilityHours > 0 &&
      data.usedFacilityHours >
      data.availableFacilityHours
    ) {
      monthlyMetricsMessage.textContent =
        "Used facility hours cannot exceed available facility hours.";

      return;
    }

    if (
      data.targetRosterSpots > 0 &&
      data.rosteredPlayers >
      data.targetRosterSpots
    ) {
      monthlyMetricsMessage.textContent =
        "Rostered players cannot exceed target roster spots.";

      return;
    }

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
          merge: true
        }
      );

      monthlyMetricsMessage.textContent =
        "Saved.";
    } catch (error) {
      console.error(error);

      monthlyMetricsMessage.textContent =
        "Unable to save.";
    }
  }
);


/* TRANSACTION CALCULATIONS */

function monthlyTransactions(month) {
  return transactions.filter(
    item =>
      (
        item.month ||
        getMonthFromDate(
          item.date
        )
      ) === month
  );
}

function revenueCategories(month) {
  const totals =
    Object.fromEntries(
      REVENUE_CATEGORIES.map(
        category => [
          category,
          0
        ]
      )
    );

  monthlyTransactions(month)
    .filter(
      item =>
        item.type ===
        "revenue"
    )
    .forEach(
      item => {
        if (
          totals[
            item.category
          ] !== undefined
        ) {
          totals[
            item.category
          ] +=
            Number(
              item.amount || 0
            );
        }
      }
    );

  return totals;
}

function expenseCategories(month) {
  const fixed =
    getFixedCosts(month);

  const totals = {
    "Rent":
      fixed.rent,

    "W2 Staff":
      fixed.w2,

    "1099 Staff":
      0,

    "Tournaments":
      0,

    "Field Rentals":
      0,

    "Utilities":
      fixed.utilities,

    "Building Supplies":
      0,

    "Other":
      0
  };

  monthlyTransactions(month)
    .filter(
      item =>
        item.type ===
        "expense"
    )
    .forEach(
      item => {
        const category =
          item.category ===
          "Misc."
            ? "Other"
            : item.category;

        if (
          category === "Rent" ||
          category === "W2 Staff" ||
          category === "Utilities"
        ) {
          return;
        }

        if (
          totals[
            category
          ] !== undefined
        ) {
          totals[
            category
          ] +=
            Number(
              item.amount || 0
            );
        }
      }
    );

  return totals;
}

function inferBusinessArea(item) {
  if (item.businessArea) {
    return item.businessArea;
  }

  if (
    item.category ===
    "Tournaments" ||
    item.category ===
    "Field Rentals"
  ) {
    return "Teams";
  }

  if (
    item.category ===
    "Building Supplies"
  ) {
    return "Facility";
  }

  return "General";
}

function inferCostType(item) {
  if (item.costType) {
    return item.costType;
  }

  if (
    item.category ===
    "Tournaments" ||
    item.category ===
    "Field Rentals"
  ) {
    return "direct";
  }

  return "overhead";
}

function calculateMonth(month) {
  const monthTransactions =
    monthlyTransactions(month);

  const revenueByCategory =
    revenueCategories(month);

  const expenseByCategory =
    expenseCategories(month);

  const revenue =
    Object.values(
      revenueByCategory
    ).reduce(
      (total, value) =>
        total +
        Number(value || 0),

      0
    );

  const expenses =
    Object.values(
      expenseByCategory
    ).reduce(
      (total, value) =>
        total +
        Number(value || 0),

      0
    );

  const fixed =
    fixedTotal(month);

  const variableExpenses =
    expenses -
    fixed;

  const profit =
    revenue -
    expenses;

  const margin =
    revenue > 0
      ? (
          profit /
          revenue
        ) *
        100
      : 0;

  const expenseRatioValue =
    revenue > 0
      ? (
          expenses /
          revenue
        ) *
        100
      : 0;

  const teamRevenue =
    Number(
      revenueByCategory[
        "Team Revenue"
      ] ||
      0
    );

  const organic =
    revenue -
    teamRevenue;

  const teamMix =
    revenue > 0
      ? (
          teamRevenue /
          revenue
        ) *
        100
      : 0;

  const directTeamCosts =
    monthTransactions
      .filter(
        item =>
          item.type ===
          "expense" &&
          inferCostType(item) ===
          "direct" &&
          inferBusinessArea(item) ===
          "Teams"
      )
      .reduce(
        (total, item) =>
          total +
          Number(
            item.amount || 0
          ),

        0
      );

  const teamContributionValue =
    teamRevenue -
    directTeamCosts;

  const teamMargin =
    teamRevenue > 0
      ? (
          teamContributionValue /
          teamRevenue
        ) *
        100
      : NaN;

  const w2Labor =
    Number(
      getFixedCosts(month).w2 ||
      0
    );

  const contractorLabor =
    Number(
      expenseByCategory[
        "1099 Staff"
      ] ||
      0
    );

  const totalLabor =
    w2Labor +
    contractorLabor;

  const laborPercentValue =
    revenue > 0
      ? (
          totalLabor /
          revenue
        ) *
        100
      : NaN;

  const fixedCostCoverageValue =
    fixed > 0
      ? organic /
        fixed
      : NaN;

  return {
    revenue,
    expenses,
    fixed,
    variableExpenses,
    profit,
    margin,
    expenseRatioValue,
    revenueByCategory,
    expenseByCategory,
    teamRevenue,
    organic,
    teamMix,
    directTeamCosts,
    teamContributionValue,
    teamMargin,
    w2Labor,
    contractorLabor,
    totalLabor,
    laborPercentValue,
    fixedCostCoverageValue
  };
}


/* RENDER */

function renderEverything() {
  dashboardMonthTitle.textContent =
    formatMonth(
      currentMonth
    );

  chartYearLabel.textContent =
    yearFromMonth(
      currentMonth
    );

  revenueMixTitle.textContent =
    `${shortMonth(
      currentMonth
    )} Revenue`;

  previousMonthButton.disabled =
    currentMonth ===
    FIRST_MONTH;

  nextMonthButton.disabled =
    currentMonth ===
    LAST_MONTH;

  monthSelector.value =
    currentMonth;

  loadFixedCosts();
  loadMetrics();
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

  const previousKey =
    previousMonthKey(
      currentMonth
    );

  const previousTotals =
    previousKey
      ? calculateMonth(
          previousKey
        )
      : null;

  const metrics =
    monthlyMetrics[
      currentMonth
    ] ||
    {};

  const previousMetrics =
    previousKey
      ? (
          monthlyMetrics[
            previousKey
          ] ||
          {}
        )
      : {};


  monthlyRevenue.textContent =
    currency(
      totals.revenue
    );

  setTrend(
    monthlyRevenueTrend,

    previousTotals
      ? formatChange(
          totals.revenue,
          previousTotals.revenue
        )
      : {
          text:
            "No prior month",

          className:
            "trend-neutral"
        }
  );


  monthlyExpenses.textContent =
    currency(
      totals.expenses
    );

  monthlyExpenseDetail.textContent =
    `${currency(
      totals.fixed
    )} fixed + ${currency(
      totals.variableExpenses
    )} variable`;


  monthlyProfit.textContent =
    currency(
      totals.profit
    );

  monthlyProfit.className =
    totals.profit >= 0
      ? "positive-text"
      : "negative-text";


  setTrend(
    monthlyProfitTrend,

    previousTotals
      ? formatChange(
          totals.profit,
          previousTotals.profit
        )
      : {
          text:
            "No prior month",

          className:
            "trend-neutral"
        }
  );


  monthlyMargin.textContent =
    totals.revenue > 0
      ? percent(
          totals.margin
        )
      : "—";

  setTrend(
    monthlyMarginTrend,

    previousTotals &&
    previousTotals.revenue > 0
      ? formatChange(
          totals.margin,
          previousTotals.margin,
          {
            points: true
          }
        )
      : {
          text:
            "No prior month",

          className:
            "trend-neutral"
        }
  );

  marginCard.classList.toggle(
    "loss-card",
    totals.profit < 0
  );


  organicRevenue.textContent =
    currency(
      totals.organic
    );

  setTrend(
    organicRevenueDetail,

    previousTotals
      ? formatChange(
          totals.organic,
          previousTotals.organic
        )
      : {
          text:
            "Revenue excluding Team Revenue",

          className:
            "trend-neutral"
        }
  );


  fixedCostCoverage.textContent =
    Number.isFinite(
      totals.fixedCostCoverageValue
    )
      ? multiple(
          totals.fixedCostCoverageValue
        )
      : "—";

  if (
    Number.isFinite(
      totals.fixedCostCoverageValue
    )
  ) {
    fixedCostCoverageDetail.textContent =
      `${(
        totals.fixedCostCoverageValue *
        100
      ).toFixed(0)}% of fixed costs covered by organic revenue`;

    fixedCostCoverageDetail.className =
      totals.fixedCostCoverageValue >= 1
        ? "metric-detail trend-good"
        : "metric-detail trend-bad";
  }


  laborPercent.textContent =
    Number.isFinite(
      totals.laborPercentValue
    )
      ? percent(
          totals.laborPercentValue
        )
      : "—";

  laborPercentDetail.textContent =
    Number.isFinite(
      totals.laborPercentValue
    )
      ? `${currency(
          totals.totalLabor
        )} W2 + 1099 labor`
      : "W2 + 1099 labor ÷ revenue";


  expenseRatio.textContent =
    totals.revenue > 0
      ? percent(
          totals.expenseRatioValue
        )
      : "—";

  setTrend(
    expenseRatioDetail,

    previousTotals &&
    previousTotals.revenue > 0 &&
    totals.revenue > 0
      ? formatChange(
          totals.expenseRatioValue,
          previousTotals.expenseRatioValue,
          {
            points: true,
            inverse: true
          }
        )
      : {
          text:
            "Expenses ÷ revenue",

          className:
            "trend-neutral"
        }
  );


  const players =
    Number(
      metrics.rosteredPlayers ||
      0
    );

  const previousPlayers =
    Number(
      previousMetrics.rosteredPlayers ||
      0
    );

  const targetSpots =
    Number(
      metrics.targetRosterSpots ||
      0
    );


  const profitPlayer =
    players > 0
      ? totals.profit /
        players
      : null;

  const previousProfitPlayer =
    previousTotals &&
    previousPlayers > 0
      ? previousTotals.profit /
        previousPlayers
      : null;

  profitPerPlayer.textContent =
    profitPlayer !== null
      ? currency(
          profitPlayer
        )
      : "—";

  setTrend(
    profitPerPlayerDetail,

    profitPlayer !== null &&
    previousProfitPlayer !== null
      ? formatChange(
          profitPlayer,
          previousProfitPlayer
        )
      : {
          text:
            "Operating profit ÷ rostered players",

          className:
            "trend-neutral"
        }
  );


  teamRevenueMix.textContent =
    percent(
      totals.teamMix
    );

  setTrend(
    teamRevenueMixDetail,

    previousTotals &&
    previousTotals.revenue > 0
      ? formatChange(
          totals.teamMix,
          previousTotals.teamMix,
          {
            points: true,
            inverse: true
          }
        )
      : {
          text:
            "Team revenue ÷ total revenue",

          className:
            "trend-neutral"
        }
  );


  const revPlayer =
    players > 0
      ? totals.teamRevenue /
        players
      : null;

  const previousRevPlayer =
    previousPlayers > 0 &&
    previousTotals
      ? previousTotals.teamRevenue /
        previousPlayers
      : null;

  revenuePerPlayer.textContent =
    revPlayer !== null
      ? currency(
          revPlayer
        )
      : "—";

  setTrend(
    revenuePerPlayerDetail,

    revPlayer !== null &&
    previousRevPlayer !== null
      ? formatChange(
          revPlayer,
          previousRevPlayer
        )
      : {
          text:
            "Team revenue ÷ rostered players",

          className:
            "trend-neutral"
        }
  );


  teamContribution.textContent =
    totals.teamRevenue > 0
      ? currency(
          totals.teamContributionValue
        )
      : "—";

  teamContributionDetail.textContent =
    totals.teamRevenue > 0
      ? `${currency(
          totals.directTeamCosts
        )} identifiable direct team costs`
      : "Team revenue less identifiable direct costs";


  teamContributionMargin.textContent =
    Number.isFinite(
      totals.teamMargin
    )
      ? percent(
          totals.teamMargin
        )
      : "—";

  setTrend(
    teamMarginDetail,

    Number.isFinite(
      totals.teamMargin
    ) &&
    previousTotals &&
    Number.isFinite(
      previousTotals.teamMargin
    )
      ? formatChange(
          totals.teamMargin,
          previousTotals.teamMargin,
          {
            points: true
          }
        )
      : {
          text:
            "Contribution ÷ team revenue",

          className:
            "trend-neutral"
        }
  );


  if (
    targetSpots > 0
  ) {
    const fillRate =
      (
        players /
        targetSpots
      ) *
      100;

    const openSpots =
      Math.max(
        0,
        targetSpots -
        players
      );

    rosterFillRate.textContent =
      percent(
        fillRate
      );

    rosterFillRateDetail.textContent =
      `${players} of ${targetSpots} spots filled · ${openSpots} open`;

    rosterFillRateDetail.className =
      fillRate >= 95
        ? "metric-detail trend-good"
        : fillRate < 85
          ? "metric-detail trend-bad"
          : "metric-detail trend-neutral";
  } else {
    rosterFillRate.textContent =
      "—";

    rosterFillRateDetail.textContent =
      "Enter target roster spots";
  }


  const lessonHours =
    Number(
      metrics.lessonHours ||
      0
    );

  const previousLessonHours =
    Number(
      previousMetrics.lessonHours ||
      0
    );

  lessonHoursMetric.textContent =
    lessonHours > 0
      ? lessonHours.toLocaleString(
          "en-US",
          {
            maximumFractionDigits: 1
          }
        )
      : "—";

  setTrend(
    lessonHoursMetricDetail,

    lessonHours > 0 &&
    previousLessonHours > 0
      ? formatChange(
          lessonHours,
          previousLessonHours
        )
      : {
          text:
            "Total lesson hours this month",

          className:
            "trend-neutral"
        }
  );


  const lessonRevenue =
    Number(
      totals.revenueByCategory[
        "Lessons"
      ] ||
      0
    );

  const lessonRevenuePerHour =
    lessonHours > 0
      ? lessonRevenue /
        lessonHours
      : null;

  const previousLessonRevenue =
    previousTotals
      ? Number(
          previousTotals.revenueByCategory[
            "Lessons"
          ] ||
          0
        )
      : 0;

  const previousLessonRevenuePerHour =
    previousTotals &&
    previousLessonHours > 0
      ? previousLessonRevenue /
        previousLessonHours
      : null;

  revenuePerLesson.textContent =
    lessonRevenuePerHour !== null
      ? currency(
          lessonRevenuePerHour
        )
      : "—";

  setTrend(
    revenuePerLessonDetail,

    lessonRevenuePerHour !== null &&
    previousLessonRevenuePerHour !== null
      ? formatChange(
          lessonRevenuePerHour,
          previousLessonRevenuePerHour
        )
      : {
          text:
            "Lesson revenue ÷ lesson hours",

          className:
            "trend-neutral"
        }
  );


  const available =
    Number(
      metrics.availableFacilityHours ||
      0
    );

  const used =
    Number(
      metrics.usedFacilityHours ||
      0
    );

  const previousAvailable =
    Number(
      previousMetrics.availableFacilityHours ||
      0
    );

  const previousUsed =
    Number(
      previousMetrics.usedFacilityHours ||
      0
    );

  const utilization =
    available > 0
      ? (
          used /
          available
        ) *
        100
      : null;

  const previousUtilization =
    previousAvailable > 0
      ? (
          previousUsed /
          previousAvailable
        ) *
        100
      : null;

  facilityUtilization.textContent =
    utilization !== null
      ? percent(
          utilization
        )
      : "—";

  setTrend(
    facilityUtilizationDetail,

    utilization !== null &&
    previousUtilization !== null
      ? formatChange(
          utilization,
          previousUtilization,
          {
            points: true
          }
        )
      : {
          text:
            "Used cage-hours ÷ available cage-hours",

          className:
            "trend-neutral"
        }
  );


  const currentMemberships =
    metrics.activeMemberships !==
    undefined
      ? Number(
          metrics.activeMemberships ||
          0
        )
      : null;

  const previousMemberships =
    previousKey &&
    previousMetrics.activeMemberships !==
    undefined
      ? Number(
          previousMetrics.activeMemberships ||
          0
        )
      : null;

  if (
    currentMemberships !== null &&
    previousMemberships !== null
  ) {
    const change =
      currentMemberships -
      previousMemberships;

    membershipChange.textContent =
      change > 0
        ? `+${change}`
        : `${change}`;

    if (
      previousMemberships > 0
    ) {
      const percentage =
        (
          change /
          previousMemberships
        ) *
        100;

      membershipChangeDetail.textContent =
        `${
          percentage > 0
            ? "+"
            : ""
        }${percentage.toFixed(1)}% vs last month`;

      membershipChangeDetail.className =
        change > 0
          ? "metric-detail trend-good"
          : change < 0
            ? "metric-detail trend-bad"
            : "metric-detail trend-neutral";
    } else {
      membershipChangeDetail.textContent =
        `${previousMemberships} → ${currentMemberships} active memberships`;
    }
  } else {
    membershipChange.textContent =
      "—";

    membershipChangeDetail.textContent =
      previousKey
        ? "No prior month membership count"
        : "No prior month";

    membershipChangeDetail.className =
      "metric-detail trend-neutral";
  }


  const hasInputs =
    metricFieldIds.some(
      id =>
        monthlyMetrics[
          currentMonth
        ]?.[
          id
        ] !== undefined
    );

  metricsStatus.textContent =
    hasInputs
      ? "Inputs saved"
      : "Inputs not saved";

  metricsStatus.classList.toggle(
    "saved-badge",
    hasInputs
  );


  renderBreakdown(
    revenueBreakdown,
    totals.revenueByCategory,
    totals.revenue,
    "revenue"
  );

  renderBreakdown(
    expenseBreakdown,
    totals.expenseByCategory,
    totals.expenses,
    "expense"
  );

  renderRecentTransactions();
}


/* BREAKDOWNS */

function renderBreakdown(
  container,
  data,
  total,
  type
) {
  container.innerHTML = "";

  Object.entries(
    data
  ).forEach(
    ([name, value]) => {
      const share =
        total > 0
          ? (
              value /
              total
            ) *
            100
          : 0;

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "breakdown-row";

      row.innerHTML = `
        <div class="breakdown-top">
          <span class="breakdown-name">
            ${escapeHtml(name)}
          </span>

          <span class="breakdown-value">
            ${currency(value)}
            <em>
              ${share.toFixed(1)}%
            </em>
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


/* RECENT TRANSACTIONS */

function renderRecentTransactions() {
  const items =
    monthlyTransactions(
      currentMonth
    ).slice(
      0,
      6
    );

  recentTransactions.innerHTML =
    "";

  if (!items.length) {
    recentTransactions.innerHTML =
      `
        <div class="empty-state">
          No revenue or variable expenses entered yet.
        </div>
      `;

    return;
  }

  items.forEach(
    item => {
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
              item.description
            )}
          </div>

          <div class="recent-meta">
            ${formatDate(
              item.date
            )}
            ·
            ${escapeHtml(
              item.category
            )}
          </div>
        </div>

        <div
          class="recent-amount ${
            item.type ===
            "revenue"
              ? "positive-text"
              : "negative-text"
          }"
        >
          ${
            item.type ===
            "revenue"
              ? "+"
              : "-"
          }
          ${currency(
            item.amount
          )}
        </div>
      `;

      recentTransactions.appendChild(
        row
      );
    }
  );
}


/* TRANSACTIONS PAGE */

function buildCategoryFilter() {
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

function renderTransactions() {
  const items =
    monthlyTransactions(
      currentMonth
    ).filter(
      item => {
        const typeMatches =
          transactionTypeFilter.value ===
          "all" ||
          item.type ===
          transactionTypeFilter.value;

        const categoryMatches =
          transactionCategoryFilter.value ===
          "all" ||
          item.category ===
          transactionCategoryFilter.value;

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
    items.length > 0
  );

  items.forEach(
    item => {
      const row =
        document.createElement(
          "tr"
        );

      row.innerHTML = `
        <td>
          ${formatDate(
            item.date
          )}
        </td>

        <td>
          ${escapeHtml(
            item.description
          )}
        </td>

        <td>
          ${escapeHtml(
            item.type
          )}
        </td>

        <td>
          ${escapeHtml(
            item.category
          )}
        </td>

        <td>
          ${
            item.type ===
            "expense"
              ? escapeHtml(
                  inferBusinessArea(
                    item
                  )
                )
              : "—"
          }
        </td>

        <td>
          ${currency(
            item.amount
          )}
        </td>

        <td>
          <div class="transaction-actions">
            <button
              class="small-button edit-transaction"
              data-id="${item.id}"
              type="button"
            >
              Edit
            </button>

            <button
              class="small-button delete delete-transaction"
              data-id="${item.id}"
              type="button"
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
    ".edit-transaction"
  ).forEach(
    button =>
      button.addEventListener(
        "click",
        () =>
          editTransaction(
            button.dataset.id
          )
      )
  );

  document.querySelectorAll(
    ".delete-transaction"
  ).forEach(
    button =>
      button.addEventListener(
        "click",
        () =>
          removeTransaction(
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


/* TRANSACTION MODAL */

function buildTransactionCategories(type) {
  transactionCategory.innerHTML =
    "";

  const categories =
    type ===
    "revenue"
      ? REVENUE_CATEGORIES
      : MANUAL_EXPENSE_CATEGORIES;

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
}

function setTransactionType(type) {
  transactionType.value =
    type;

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

  transactionModalTitle.textContent =
    type ===
    "revenue"
      ? "Add Revenue"
      : "Add Expense";

  buildTransactionCategories(
    type
  );
}

function openTransaction(type) {
  transactionForm.reset();

  transactionId.value =
    "";

  transactionDate.value =
    currentMonth ===
    getCurrentMonth()
      ? todayString()
      : `${currentMonth}-01`;

  transactionCostType.value =
    "direct";

  transactionBusinessArea.value =
    "Teams";

  transactionFormError.textContent =
    "";

  setTransactionType(
    type
  );

  transactionModal.classList.remove(
    "hidden"
  );
}

function closeTransaction() {
  transactionModal.classList.add(
    "hidden"
  );

  transactionFormError.textContent =
    "";
}

[
  "dashboardAddRevenueButton",
  "transactionsAddRevenueButton"
].forEach(
  id =>
    $(id).addEventListener(
      "click",
      () =>
        openTransaction(
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
        openTransaction(
          "expense"
        )
    )
);

modalRevenueTypeButton.addEventListener(
  "click",
  () =>
    setTransactionType(
      "revenue"
    )
);

modalExpenseTypeButton.addEventListener(
  "click",
  () =>
    setTransactionType(
      "expense"
    )
);

document.querySelectorAll(
  "[data-close-transaction-modal]"
).forEach(
  element =>
    element.addEventListener(
      "click",
      closeTransaction
    )
);


transactionForm.addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    transactionFormError.textContent =
      "";

    const data = {
      amount:
        Number(
          transactionAmount.value
        ),

      date:
        transactionDate.value,

      month:
        getMonthFromDate(
          transactionDate.value
        ),

      description:
        transactionDescription
          .value
          .trim(),

      category:
        transactionCategory.value,

      type:
        transactionType.value,

      notes:
        transactionNotes
          .value
          .trim(),

      updatedAt:
        serverTimestamp()
    };

    if (
      !data.amount ||
      data.amount <= 0
    ) {
      transactionFormError.textContent =
        "Enter a valid amount.";

      return;
    }

    if (
      !data.description
    ) {
      transactionFormError.textContent =
        "Enter a description.";

      return;
    }

    if (
      !data.date ||
      data.date <
      FIRST_DATE
    ) {
      transactionFormError.textContent =
        "Date must be January 1, 2026 or later.";

      return;
    }

    if (
      data.type ===
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

    try {
      if (
        transactionId.value
      ) {
        await updateDoc(
          doc(
            db,
            "businesses",
            BUSINESS_ID,
            TRANSACTIONS_COLLECTION,
            transactionId.value
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
            TRANSACTIONS_COLLECTION
          ),

          data
        );
      }

      currentMonth =
        data.month;

      closeTransaction();
    } catch (error) {
      console.error(error);

      transactionFormError.textContent =
        "Unable to save.";
    }
  }
);

function editTransaction(id) {
  const item =
    transactions.find(
      transaction =>
        transaction.id ===
        id
    );

  if (!item) return;

  transactionForm.reset();

  transactionId.value =
    item.id;

  transactionAmount.value =
    item.amount;

  transactionDate.value =
    item.date;

  transactionDescription.value =
    item.description ||
    "";

  transactionNotes.value =
    item.notes ||
    "";

  setTransactionType(
    item.type
  );

  const validCategory =
    [
      ...transactionCategory.options
    ].some(
      option =>
        option.value ===
        item.category
    );

  if (validCategory) {
    transactionCategory.value =
      item.category;
  }

  if (
    item.type ===
    "expense"
  ) {
    transactionCostType.value =
      inferCostType(
        item
      );

    transactionBusinessArea.value =
      inferBusinessArea(
        item
      );

    transactionTeamProgram.value =
      item.teamProgram ||
      "";
  }

  transactionModalTitle.textContent =
    item.type ===
    "revenue"
      ? "Edit Revenue"
      : "Edit Expense";

  transactionModal.classList.remove(
    "hidden"
  );
}

async function removeTransaction(id) {
  const item =
    transactions.find(
      transaction =>
        transaction.id ===
        id
    );

  if (!item) return;

  if (
    !confirm(
      `Delete "${item.description}"?`
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
  } catch (error) {
    console.error(error);

    alert(
      "Unable to delete transaction."
    );
  }
}


/* CHARTS */

function renderCharts() {
  if (
    typeof Chart ===
    "undefined"
  ) {
    return;
  }

  renderPerformanceChart();
  renderRevenueChart();
}

function renderPerformanceChart() {
  const canvas =
    $("performanceChart");

  if (!canvas) return;

  const months =
    buildYearMonths(
      yearFromMonth(
        currentMonth
      )
    );

  if (performanceChart) {
    performanceChart.destroy();
  }

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
                months.map(
                  month =>
                    calculateMonth(
                      month
                    ).revenue
                )
            },

            {
              label:
                "Expenses",

              data:
                months.map(
                  month =>
                    calculateMonth(
                      month
                    ).expenses
                )
            },

            {
              label:
                "Profit",

              type:
                "line",

              data:
                months.map(
                  month =>
                    calculateMonth(
                      month
                    ).profit
                )
            }
          ]
        },

        options: {
          responsive:
            true,

          maintainAspectRatio:
            false
        }
      }
    );
}

function renderRevenueChart() {
  const canvas =
    $("revenueMixChart");

  if (!canvas) return;

  const values =
    revenueCategories(
      currentMonth
    );

  const entries =
    Object.entries(
      values
    ).filter(
      ([, value]) =>
        value > 0
    );

  if (revenueMixChart) {
    revenueMixChart.destroy();
  }

  revenueMixEmpty.classList.toggle(
    "hidden",
    entries.length > 0
  );

  canvas.classList.toggle(
    "hidden",
    entries.length === 0
  );

  if (!entries.length) {
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
            false
        }
      }
    );
}


/* YEAR */

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

  let revenueTotal = 0;
  let expenseTotal = 0;
  let elapsed = 0;

  yearTableBody.innerHTML =
    "";

  const revenueCategoriesYTD =
    Object.fromEntries(
      REVENUE_CATEGORIES.map(
        category => [
          category,
          0
        ]
      )
    );

  const expenseCategoriesYTD =
    Object.fromEntries(
      EXPENSE_CATEGORIES.map(
        category => [
          category,
          0
        ]
      )
    );

  months.forEach(
    month => {
      if (
        monthToIndex(
          month
        ) >
        selectedIndex
      ) {
        return;
      }

      elapsed++;

      const totals =
        calculateMonth(
          month
        );

      revenueTotal +=
        totals.revenue;

      expenseTotal +=
        totals.expenses;

      Object.keys(
        revenueCategoriesYTD
      ).forEach(
        category => {
          revenueCategoriesYTD[
            category
          ] +=
            totals.revenueByCategory[
              category
            ] ||
            0;
        }
      );

      Object.keys(
        expenseCategoriesYTD
      ).forEach(
        category => {
          expenseCategoriesYTD[
            category
          ] +=
            totals.expenseByCategory[
              category
            ] ||
            0;
        }
      );

      const row =
        document.createElement(
          "tr"
        );

      row.innerHTML = `
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
            totals.profit >= 0
              ? "positive-text"
              : "negative-text"
          }"
        >
          ${currency(
            totals.profit
          )}
        </td>

        <td>
          ${
            totals.revenue > 0
              ? percent(
                  totals.margin
                )
              : "—"
          }
        </td>
      `;

      yearTableBody.appendChild(
        row
      );
    }
  );

  const profit =
    revenueTotal -
    expenseTotal;

  const margin =
    revenueTotal > 0
      ? (
          profit /
          revenueTotal
        ) *
        100
      : 0;

  yearTitle.textContent =
    `${year} Financial Performance`;

  yearRevenue.textContent =
    currency(
      revenueTotal
    );

  yearExpenses.textContent =
    currency(
      expenseTotal
    );

  yearProfit.textContent =
    currency(
      profit
    );

  yearProfit.className =
    profit >= 0
      ? "positive-text"
      : "negative-text";

  yearMargin.textContent =
    revenueTotal > 0
      ? percent(
          margin
        )
      : "—";

  yearMarginCard.classList.toggle(
    "loss-card",
    profit < 0
  );

  yearRevenueForecast.textContent =
    elapsed > 0
      ? currency(
          (
            revenueTotal /
            elapsed
          ) *
          12
        )
      : "$0.00";

  renderBreakdown(
    yearRevenueBreakdown,
    revenueCategoriesYTD,
    revenueTotal,
    "revenue"
  );

  renderBreakdown(
    yearExpenseBreakdown,
    expenseCategoriesYTD,
    expenseTotal,
    "expense"
  );
}


/* KPI HELP */

const METRIC_HELP = {
  organicRevenue: {
    title:
      "Organic Revenue",

    description:
      "Revenue generated outside of travel-team dues. This shows how much revenue the facility and its programs generate independently of the team business.",

    formula:
      "Lessons + Tryouts + Point of Sale + Rentals/Memberships + Camps/Clinics/Programs",

    interpretation:
      "Higher is generally better. Growing organic revenue reduces dependence on Team Revenue.",

    tone:
      "good"
  },

  fixedCostCoverage: {
    title:
      "Fixed Cost Coverage",

    description:
      "Measures whether non-team revenue is large enough to support the facility's fixed operating base without relying on Team Revenue.",

    formula:
      "Organic Revenue ÷ (Rent + W2 Staff + Utilities)",

    interpretation:
      "1.00x means organic revenue exactly covers fixed costs. Above 1.00x means non-team revenue alone covers the fixed operating base.",

    tone:
      "good"
  },

  laborPercent: {
    title:
      "Labor % of Revenue",

    description:
      "Shows what percentage of total revenue is consumed by employee and contractor labor.",

    formula:
      "(W2 Staff + 1099 Staff) ÷ Total Revenue",

    interpretation:
      "Lower is generally better, provided staffing and service quality remain appropriate.",

    tone:
      "neutral"
  },

  expenseRatio: {
    title:
      "Expense Ratio",

    description:
      "Shows how much of every revenue dollar is consumed by total operating expenses.",

    formula:
      "Total Expenses ÷ Total Revenue",

    interpretation:
      "A 60% expense ratio means $0.60 of every $1.00 of revenue is consumed by expenses. Lower is generally better.",

    tone:
      "good"
  },

  profitPerPlayer: {
    title:
      "Operating Profit / Player",

    description:
      "Measures branch operating profit relative to the size of the rostered player base.",

    formula:
      "Operating Profit ÷ Rostered Players",

    interpretation:
      "Higher is generally better. This is a branch efficiency metric, not literal profit attributable to each player.",

    tone:
      "good"
  },

  teamRevenueMix: {
    title:
      "Team Revenue Mix",

    description:
      "Measures how much of total revenue comes from travel-team revenue.",

    formula:
      "Team Revenue ÷ Total Revenue",

    interpretation:
      "A high percentage means greater dependence on the travel-team business. Lower concentration can make the organization more diversified.",

    tone:
      "neutral"
  },

  revenuePerPlayer: {
    title:
      "Revenue / Player",

    description:
      "Shows average monthly Team Revenue generated per rostered player.",

    formula:
      "Team Revenue ÷ Rostered Players",

    interpretation:
      "Useful for monitoring player economics over time. Payment timing and seasonality can affect this number.",

    tone:
      "neutral"
  },

  teamContribution: {
    title:
      "Identifiable Team Contribution",

    description:
      "Estimates how much Team Revenue remains after subtracting direct team costs that are specifically identifiable in the transaction data.",

    formula:
      "Team Revenue − Identifiable Direct Team Costs",

    interpretation:
      "Use with caution. This is not true team profit because shared tournaments, fields, coaching and bundled expenses may not be fully allocated.",

    tone:
      "warning"
  },

  teamMargin: {
    title:
      "Identifiable Team Margin",

    description:
      "Shows Identifiable Team Contribution as a percentage of Team Revenue.",

    formula:
      "Identifiable Team Contribution ÷ Team Revenue",

    interpretation:
      "Use with caution. Shared or bundled team expenses can cause this metric to overstate true team profitability.",

    tone:
      "warning"
  },

  rosterFillRate: {
    title:
      "Roster Fill Rate",

    description:
      "Measures how much of planned team capacity is currently filled by rostered players.",

    formula:
      "Rostered Players ÷ Target Roster Spots",

    interpretation:
      "Higher is generally better. Open roster spots represent unused team capacity and potential lost revenue.",

    tone:
      "good"
  },

  lessonHours: {
    title:
      "Lesson Hours",

    description:
      "Total private lesson hours completed during the selected month.",

    formula:
      "Total Completed Lesson Hours",

    interpretation:
      "Measures lesson volume. Compare it with Revenue / Lesson Hour to understand whether growth comes from more volume or better monetization.",

    tone:
      "neutral"
  },

  revenuePerLesson: {
    title:
      "Revenue / Lesson Hour",

    description:
      "Measures how much lesson revenue is generated for every completed lesson hour.",

    formula:
      "Lesson Revenue ÷ Lesson Hours",

    interpretation:
      "Higher is generally better. Use together with Lesson Hours so price/productivity and volume are both visible.",

    tone:
      "good"
  },

  facilityUtilization: {
    title:
      "Facility Utilization",

    description:
      "Measures how much of available cage capacity was actually used. Used hours can include practices, lessons, rentals, camps, memberships and programs.",

    formula:
      "Used Facility Cage-Hours ÷ Available Facility Cage-Hours",

    interpretation:
      "Higher generally indicates stronger use of the facility, though extremely high utilization may indicate capacity constraints.",

    tone:
      "neutral"
  },

  membershipChange: {
    title:
      "Membership Change",

    description:
      "Shows whether active memberships increased or decreased compared with the previous month.",

    formula:
      "Current Active Memberships − Previous Month Active Memberships",

    interpretation:
      "Positive numbers indicate growth. Negative numbers indicate contraction.",

    tone:
      "good"
  }
};

const metricHelpModal =
  $("metricHelpModal");

const metricHelpTitle =
  $("metricHelpTitle");

const metricHelpDescription =
  $("metricHelpDescription");

const metricHelpFormula =
  $("metricHelpFormula");

const metricHelpInterpretation =
  $("metricHelpInterpretation");

function openMetricHelp(key) {
  const metric =
    METRIC_HELP[key];

  if (
    !metric ||
    !metricHelpModal
  ) {
    return;
  }

  metricHelpTitle.textContent =
    metric.title;

  metricHelpDescription.textContent =
    metric.description;

  metricHelpFormula.textContent =
    metric.formula;

  metricHelpInterpretation.textContent =
    metric.interpretation;

  metricHelpInterpretation.classList.remove(
    "warning",
    "neutral"
  );

  if (
    metric.tone ===
    "warning"
  ) {
    metricHelpInterpretation.classList.add(
      "warning"
    );
  }

  if (
    metric.tone ===
    "neutral"
  ) {
    metricHelpInterpretation.classList.add(
      "neutral"
    );
  }

  metricHelpModal.classList.remove(
    "hidden"
  );
}

function closeMetricHelp() {
  metricHelpModal.classList.add(
    "hidden"
  );
}

document.querySelectorAll(
  "[data-metric-help]"
).forEach(
  button => {
    button.addEventListener(
      "click",
      () =>
        openMetricHelp(
          button.dataset.metricHelp
        )
    );
  }
);

document.querySelectorAll(
  "[data-close-metric-help]"
).forEach(
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
      "Escape" &&
      !metricHelpModal.classList.contains(
        "hidden"
      )
    ) {
      closeMetricHelp();
    }
  }
);

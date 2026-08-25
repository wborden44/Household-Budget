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



/* =========================================================
   BUSINESS
========================================================= */

const BUSINESS_ID =
  "ninth-inning-kennesaw";


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

  "W2 Staff":
    9583,

  "Rent":
    8938.90,

  "Utilities":
    1800

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



/* =========================================================
   DOM
========================================================= */

const $ =
  id =>
    document.getElementById(id);



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


const monthSelector =
  $("monthSelector");


const previousMonthButton =
  $("previousMonthButton");


const nextMonthButton =
  $("nextMonthButton");


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



/* CHARTS */

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



/* MONTHLY METRICS */

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



/* MONTHLY INPUTS */

const monthlyMetricsForm =
  $("monthlyMetricsForm");


const monthlyMetricsMessage =
  $("monthlyMetricsMessage");


const saveMonthlyMetricsButton =
  $("saveMonthlyMetricsButton");



/* TRANSACTIONS */

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



/* HELP */

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
    ) =>
      `${year}-${String(
        index + 1
      ).padStart(2, "0")}`
  );

}


function getYtdMonths(
  monthKey
) {

  const year =
    yearFromMonth(
      monthKey
    );


  const selected =
    monthToIndex(
      monthKey
    );


  return buildYearMonths(
    year
  ).filter(
    month =>
      monthToIndex(month) <=
      selected
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

  if (
    category ===
    "Misc."
  ) {

    return "Other";

  }


  return category;

}


function normalizeRevenueCategory(
  category
) {

  const map = {

    "Rentals / Memberships":
      "Rentals/Memberships",

    "Rentals & Memberships":
      "Rentals/Memberships",

    "Camps / Clinics / Programs":
      "Camps/Clinics/Programs",

    "Camps/Clinics":
      "Camps/Clinics/Programs",

    "Teams":
      "Team Revenue",

    "Travel Team Revenue":
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
    ).toLowerCase();


  if (
    value ===
    "income"
  ) {

    return "revenue";

  }


  if (
    value ===
    "revenue"
  ) {

    return "revenue";

  }


  if (
    value ===
    "expense"
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



/* =========================================================
   HISTORICAL MONTHLY METRIC COMPATIBILITY

   ORIGINAL SAVED FIELD NAMES ARE KEPT.
========================================================= */

function firstNumber(
  object,
  keys,
  fallback = 0
) {

  if (!object) {

    return fallback;

  }


  for (
    const key
    of keys
  ) {

    if (
      object[key] === undefined ||
      object[key] === null ||
      object[key] === ""
    ) {

      continue;

    }


    const value =
      Number(
        object[key]
      );


    if (
      Number.isFinite(value)
    ) {

      return value;

    }

  }


  return fallback;

}



function getMetricSnapshot(
  monthKey
) {

  const raw =
    monthlyMetrics[
      monthKey
    ] || {};


  return {

    rosteredPlayers:
      firstNumber(
        raw,
        [
          "rosteredPlayers",
          "players",
          "playerCount"
        ]
      ),


    rosterCapacity:
      firstNumber(
        raw,
        [
          "rosterCapacity",
          "totalRosterSpots",
          "rosterSpots",
          "availableRosterSpots"
        ]
      ),


    activeMemberships:
      firstNumber(
        raw,
        [
          "activeMemberships",
          "memberships",
          "membershipCount"
        ]
      ),


    /*
    ORIGINAL WORKING FIELD:
    lessonsCompleted
    */

    lessonsCompleted:
      firstNumber(
        raw,
        [
          "lessonsCompleted",
          "lessonHours",
          "lessonHoursCompleted"
        ]
      ),


    /*
    ORIGINAL WORKING FIELD:
    availableFacilityHours
    */

    availableFacilityHours:
      firstNumber(
        raw,
        [
          "availableFacilityHours",
          "facilityHoursAvailable"
        ]
      ),


    /*
    ORIGINAL WORKING FIELD:
    usedFacilityHours
    */

    usedFacilityHours:
      firstNumber(
        raw,
        [
          "usedFacilityHours",
          "facilityHoursUsed"
        ]
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

  const index =
    monthToIndex(
      monthKey
    );


  if (
    index <
    monthToIndex(FIRST_MONTH)
  ) {

    return;

  }


  if (
    index >
    monthToIndex(LAST_MONTH)
  ) {

    return;

  }


  currentMonth =
    monthKey;


  monthSelector.value =
    currentMonth;


  updateSelectedMonthDisplay();


  renderEverything();


  updateMonthButtons();

}



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


monthSelector.addEventListener(
  "change",
  event =>
    changeMonth(
      event.target.value
    )
);



/* =========================================================
   CATEGORY FILTER
========================================================= */

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
   NAV
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
   DISPLAY MONTH
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


  loadMonthlyMetricsForm();


  updateMonthButtons();

}



/* =========================================================
   FIRESTORE TRANSACTIONS

   SAME ORIGINAL COLLECTION PATH.
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
      "transactions"
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


              return {

                id:
                  snapshotDoc.id,

                ...data,

                type:
                  normalizeTransactionType(
                    data.type
                  ),

                category:
                  data.type === "expense"

                    ? normalizeExpenseCategory(
                        data.category
                      )

                    : normalizeRevenueCategory(
                        data.category
                      ),

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

      error =>
        console.error(
          "Transaction listener error:",
          error
        )

    );

}



/* =========================================================
   FIRESTORE MONTHLY METRICS

   ORIGINAL COLLECTION PATH AND MONTH DOC IDS.
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
      "monthlyMetrics"
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
            Normally document id = 2026-01 etc.
            If data.month exists, support that too.
            */

            const monthKey =
              data.month ||
              snapshotDoc.id;


            monthlyMetrics[
              monthKey
            ] = {

              ...(monthlyMetrics[
                monthKey
              ] || {}),

              ...data,

              _documentId:
                snapshotDoc.id

            };

          }
        );


        loadMonthlyMetricsForm();


        renderEverything();

      },

      error =>
        console.error(
          "Monthly metrics listener error:",
          error
        )

    );

}



/* =========================================================
   TRANSACTIONS BY MONTH
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
          totals[category] !==
          undefined
        ) {

          totals[category] +=
            Number(
              transaction.amount || 0
            );

        }

      }
    );


  return totals;

}



/* =========================================================
   EXPENSE BY CATEGORY
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
              transaction.amount || 0
            );

        }

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
            transaction.amount || 0
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
            transaction.amount || 0
          ),
        0
      );


  const fixedExpenses =
    FIXED_MONTHLY_TOTAL;


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



  /* REVENUE */

  const revenueCats =
    getRevenueByCategory(
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



  /* EXPENSES */

  const expenseCats =
    getExpenseByCategory(
      monthKey
    );


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


  const expenseRatio =
    revenue > 0

      ? (
          expenses /
          revenue
        ) * 100

      : NaN;



  /* TEAM COSTS */

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
            transaction.amount || 0
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

    revenueCats,

    manualExpenses,

    fixedExpenses,

    expenses,

    profit,

    margin,

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



  /* INPUTS */

  const players =
    metrics.rosteredPlayers;


  const capacity =
    metrics.rosterCapacity;


  const lessons =
    metrics.lessonsCompleted;


  const available =
    metrics.availableFacilityHours;


  const used =
    metrics.usedFacilityHours;


  const activeMemberships =
    metrics.activeMemberships;



  const previousPlayers =
    previousMetrics.rosteredPlayers;


  const previousLessons =
    previousMetrics.lessonsCompleted;


  const previousAvailable =
    previousMetrics.availableFacilityHours;


  const previousUsed =
    previousMetrics.usedFacilityHours;


  const previousActiveMemberships =
    previousMetrics.activeMemberships;



  /* PROFIT / PLAYER */

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



  /* TEAM REVENUE / PLAYER */

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



  /* ROSTER FILL */

  const rosterFillRate =
    capacity > 0

      ? (
          players /
          capacity
        ) * 100

      : NaN;



  /* LESSON ECONOMICS */

  const lessonRevenue =
    totals.revenueCats[
      "Lessons"
    ] || 0;


  const revenuePerLessonHour =
    lessons > 0

      ? lessonRevenue /
        lessons

      : NaN;


  const previousLessonRevenue =
    previousTotals.revenueCats[
      "Lessons"
    ] || 0;


  const previousRevenuePerLessonHour =
    previousLessons > 0

      ? previousLessonRevenue /
        previousLessons

      : NaN;



  /* FACILITY */

  const facilityUtilization =
    available > 0

      ? (
          used /
          available
        ) * 100

      : NaN;


  const previousFacilityUtilization =
    previousAvailable > 0

      ? (
          previousUsed /
          previousAvailable
        ) * 100

      : NaN;



  /* ORGANIC */

  organicRevenueEl.textContent =
    currency(
      totals.organicRevenue
    );


  organicRevenueDetail.textContent =
    "Excludes team revenue";


  if (
    previousTotals.revenue > 0
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
    )} W2 + 1099 labor`;



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
      operatingProfitPerPlayer
    )

      ? currency(
          operatingProfitPerPlayer
        )

      : "—";


  operatingProfitPerPlayerDetail.textContent =
    "Operating profit ÷ rostered players";


  if (
    Number.isFinite(
      previousOperatingProfitPerPlayer
    )
  ) {

    setComparisonDetail(
      operatingProfitPerPlayerDetail,
      operatingProfitPerPlayer,
      previousOperatingProfitPerPlayer
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
      revenuePerPlayer
    )

      ? currency(
          revenuePerPlayer
        )

      : "—";


  revenuePerPlayerDetail.textContent =
    "Team revenue ÷ rostered players";


  if (
    Number.isFinite(
      previousRevenuePerPlayer
    )
  ) {

    setComparisonDetail(
      revenuePerPlayerDetail,
      revenuePerPlayer,
      previousRevenuePerPlayer
    );

  }



  /* TEAM CONTRIBUTION */

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
          "points"
      }
    );

  }



  /* ROSTER FILL */

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



  /* LESSON HOURS */

  lessonHoursMetricEl.textContent =
    number(
      lessons,
      Number.isInteger(
        lessons
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
      lessons,
      previousLessons
    );

  }



  /* LESSON REVENUE / HOUR */

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



  /* FACILITY UTILIZATION */

  facilityUtilizationEl.textContent =
    Number.isFinite(
      facilityUtilization
    )

      ? percent(
          facilityUtilization
        )

      : "—";


  facilityUtilizationDetail.textContent =
    available > 0

      ? `${number(
          used,
          Number.isInteger(used)
            ? 0
            : 1
        )} of ${number(
          available,
          Number.isInteger(available)
            ? 0
            : 1
        )} hours utilized`

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
          "points"
      }
    );

  }



  /* MEMBERSHIP CHANGE */

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
      membershipChange > 0
    ) {

      membershipChangeDetail.classList.add(
        "positive-text"
      );

    }


    if (
      membershipChange < 0
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
   LOAD MONTHLY INPUT FORM

   USES ORIGINAL FIELD NAMES.
========================================================= */

function loadMonthlyMetricsForm() {

  const metrics =
    getMetricSnapshot(
      currentMonth
    );


  $("rosteredPlayers").value =
    metrics.rosteredPlayers ||
    "";


  $("rosterCapacity").value =
    metrics.rosterCapacity ||
    "";


  $("activeMemberships").value =
    metrics.activeMemberships ||
    "";


  $("lessonsCompleted").value =
    metrics.lessonsCompleted ||
    "";


  $("availableFacilityHours").value =
    metrics.availableFacilityHours ||
    "";


  $("usedFacilityHours").value =
    metrics.usedFacilityHours ||
    "";


  monthlyMetricsMessage.textContent =
    "";

}



/* =========================================================
   SAVE MONTHLY INPUTS

   IMPORTANT:
   Preserve original Firestore field names.

   lessonsCompleted = ORIGINAL
   lessonHours = compatibility copy

   availableFacilityHours = ORIGINAL
   usedFacilityHours = ORIGINAL
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
        $("rosteredPlayers").value ||
        0
      );


    const rosterCapacity =
      Number(
        $("rosterCapacity").value ||
        0
      );


    const activeMemberships =
      Number(
        $("activeMemberships").value ||
        0
      );


    const lessonsCompleted =
      Number(
        $("lessonsCompleted").value ||
        0
      );


    const availableFacilityHours =
      Number(
        $("availableFacilityHours").value ||
        0
      );


    const usedFacilityHours =
      Number(
        $("usedFacilityHours").value ||
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
    MERGE = TRUE

    Existing fields such as:
    activeTeams
    programParticipants
    newMemberships
    membershipCancellations
    paidFacilityHours

    are NOT deleted.
    */


    const data = {

      month:
        currentMonth,

      year:
        yearFromMonth(
          currentMonth
        ),


      /*
      ORIGINAL FIELDS
      */

      rosteredPlayers,

      activeMemberships,

      lessonsCompleted,

      availableFacilityHours,

      usedFacilityHours,


      /*
      NEW FIELDS
      */

      rosterCapacity,


      /*
      COMPATIBILITY COPIES
      */

      totalRosterSpots:
        rosterCapacity,

      lessonHours:
        lessonsCompleted,


      updatedAt:
        serverTimestamp()

    };


    try {

      /*
      Original system used:
      monthlyMetrics / 2026-01
      monthlyMetrics / 2026-02
      etc.
      */

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
        "Saved.";

    }

    catch (error) {

      console.error(
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


  const revenue =
    months.map(
      month =>

        monthToIndex(month) <=
        selectedIndex

          ? calculateMonth(
              month
            ).revenue

          : null
    );


  const expenses =
    months.map(
      month =>

        monthToIndex(month) <=
        selectedIndex

          ? calculateMonth(
              month
            ).expenses

          : null
    );


  const profit =
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
                revenue

            },


            {

              label:
                "Expenses",

              data:
                expenses

            },


            {

              label:
                "Profit",

              data:
                profit,

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
        value > 0
    );


  revenueMixEmpty.classList.toggle(
    "hidden",
    entries.length > 0
  );


  canvas.classList.toggle(
    "hidden",
    entries.length === 0
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
   BREAKDOWN
========================================================= */

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


      const pct =
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
              ${pct.toFixed(1)}%
            </em>

          </span>

        </div>


        <div class="breakdown-track">

          <div
            class="breakdown-fill ${type}"
            style="width:${Math.min(
              100,
              pct
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
      '<div class="empty-state">No manual transactions for this month.</div>';


    return;

  }


  list.forEach(
    transaction => {

      const div =
        document.createElement(
          "div"
        );


      div.className =
        "recent-transaction";


      div.innerHTML = `

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
              transaction.category
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
        div
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
    rows.length > 0
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
            transaction.category
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
   TRANSACTION MODAL
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
      amount <= 0
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

      const id =
        transactionId.value;


      if (id) {

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

      }

      else {

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
        "transactions",
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
   YTD
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


  let labor =
    0;


  let teamRevenue =
    0;


  let teamDirectCosts =
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


      labor +=
        totals.labor;


      teamRevenue +=
        totals.teamRevenue;


      teamDirectCosts +=
        totals.teamDirectCosts;


      lessonHours +=
        metrics.lessonsCompleted;


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
    ] || 0;


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
  Player count is NOT summed.

  Find latest available roster count.
  */

  let latestRosterCount =
    0;


  for (
    let index =
      months.length - 1;

    index >= 0;

    index--
  ) {

    const count =
      getMetricSnapshot(
        months[index]
      ).rosteredPlayers;


    if (
      count > 0
    ) {

      latestRosterCount =
        count;


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

    lessonHours,

    lessonRevenue,

    revenuePerLessonHour,

    usedFacilityHours,

    availableFacilityHours,

    facilityUtilization,

    latestRosterCount,

    operatingProfitPerPlayer,

    revenuePerPlayer,

    revenueCats,

    expenseCats

  };

}



/* =========================================================
   YEAR PAGE
   JANUARY THROUGH DECEMBER ONLY
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
    ytd.profit >= 0

      ? "positive-text"

      : "negative-text";


  yearMargin.textContent =
    percent(
      ytd.margin
    );


  yearMarginCard.classList.toggle(
    "loss-card",
    ytd.profit < 0
  );


  const elapsedMonths =
    Math.max(
      1,
      ytd.months.length
    );


  const forecast =
    (
      ytd.revenue /
      elapsedMonths
    ) * 12;


  yearRevenueForecast.textContent =
    currency(
      forecast
    );



  /* YTD SCORECARD */

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



  /* MONTH TABLE */

  yearTableBody.innerHTML =
    "";


  months.forEach(
    month => {

      const active =
        monthToIndex(month) <=
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
                    totals.profit >= 0

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

              || "Metric";


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

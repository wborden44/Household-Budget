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
   BUSINESS
====================================================== */

const BUSINESS_ID =
  "ninth-inning-kennesaw";


/*
  CLEAN DATABASE VERSION

  Old data remains safely stored in:
  transactions
  monthlyMetrics

  This version uses:
  transactions_v2
  monthlyMetrics_v2
*/

const TRANSACTIONS_COLLECTION =
  "transactions_v2";


const METRICS_COLLECTION =
  "monthlyMetrics_v2";


const FIRST_MONTH =
  "2026-01";


const LAST_MONTH =
  "2031-12";


const FIRST_DATE =
  "2026-01-01";



/* ======================================================
   DEFAULT FIXED COSTS
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
   DOM
====================================================== */

const $ =
  id =>
    document.getElementById(id);


const loginScreen =
  $("loginScreen");


const app =
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


const organicRevenue =
  $("organicRevenue");


const organicRevenueDetail =
  $("organicRevenueDetail");


const teamRevenueMix =
  $("teamRevenueMix");


const revenuePerPlayer =
  $("revenuePerPlayer");


const teamContribution =
  $("teamContribution");


const teamContributionDetail =
  $("teamContributionDetail");


const teamContributionMargin =
  $("teamContributionMargin");


const revenuePerLesson =
  $("revenuePerLesson");


const facilityUtilization =
  $("facilityUtilization");


const revenuePerFacilityHour =
  $("revenuePerFacilityHour");


const membershipChurn =
  $("membershipChurn");


const breakEvenRevenue =
  $("breakEvenRevenue");


const metricsStatus =
  $("metricsStatus");


const monthlyMetricsForm =
  $("monthlyMetricsForm");


const monthlyMetricsMessage =
  $("monthlyMetricsMessage");


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


const revenueBreakdown =
  $("revenueBreakdown");


const expenseBreakdown =
  $("expenseBreakdown");


const recentTransactions =
  $("recentTransactions");


const chartYearLabel =
  $("chartYearLabel");


const revenueMixTitle =
  $("revenueMixTitle");


const revenueMixEmpty =
  $("revenueMixEmpty");


const transactionTypeFilter =
  $("transactionTypeFilter");


const transactionCategoryFilter =
  $("transactionCategoryFilter");


const transactionTableBody =
  $("transactionTableBody");


const transactionEmptyState =
  $("transactionEmptyState");


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
  date
) {

  return (
    date
      ? date.slice(
          0,
          7
        )
      : ""
  );

}


function monthToIndex(
  key
) {

  const [
    year,
    month
  ] =
    key
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
  key
) {

  const [
    year,
    month
  ] =
    key
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
  key
) {

  const [
    year,
    month
  ] =
    key
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
  date
) {

  if (
    !date
  ) {

    return "";

  }


  const [
    year,
    month,
    day
  ] =
    date
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


function yearFromMonth(
  key
) {

  return Number(
    key.slice(
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
      ).padStart(
        2,
        "0"
      )}`
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



/* ======================================================
   MONTH NAVIGATION
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

    const key =
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


  const date =
    new Date(
      year,
      month - 1 +
      offset,
      1
    );


  const key =
    `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    )}`;


  if (
    monthToIndex(
      key
    ) <
    monthToIndex(
      FIRST_MONTH
    )
  ) {

    return;

  }


  if (
    monthToIndex(
      key
    ) >
    monthToIndex(
      LAST_MONTH
    )
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
  () =>
    moveMonth(
      -1
    )
);


nextMonthButton.addEventListener(
  "click",
  () =>
    moveMonth(
      1
    )
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
   AUTH
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
        "Unable to sign in.";

    }

  }
);


logoutButton.addEventListener(
  "click",
  () =>
    signOut(
      auth
    )
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


      app.classList.add(
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


    app.classList.remove(
      "hidden"
    );


    initialize();

  }
);



/* ======================================================
   INITIALIZE
====================================================== */

function initialize() {

  buildMonthSelector();

  buildCategoryFilter();

  listenTransactions();

  listenMetrics();

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


        if (
          page
        ) {

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

      }
    );

  }
);



/* ======================================================
   FIRESTORE
====================================================== */

function listenTransactions() {

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
            item => {

              const data =
                item.data();


              return {

                id:
                  item.id,

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

      }

    );

}


function listenMetrics() {

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
          item => {

            monthlyMetrics[
              item.id
            ] =
              item.data();

          }
        );


        renderEverything();

      }

    );

}



/* ======================================================
   FIXED COSTS
====================================================== */

function getFixedCosts(
  month
) {

  const saved =
    monthlyMetrics[
      month
    ] ||
    {};


  return {

    rent:
      saved.fixedRent ??
      DEFAULT_FIXED_COSTS.rent,

    w2:
      saved.fixedW2 ??
      DEFAULT_FIXED_COSTS.w2,

    utilities:
      saved.fixedUtilities ??
      DEFAULT_FIXED_COSTS.utilities

  };

}


function fixedTotal(
  month
) {

  const fixed =
    getFixedCosts(
      month
    );


  return (
    Number(
      fixed.rent
    ) +

    Number(
      fixed.w2
    ) +

    Number(
      fixed.utilities
    )
  );

}


function loadFixedCosts() {

  const fixed =
    getFixedCosts(
      currentMonth
    );


  fixedRent.value =
    Number(
      fixed.rent
    ).toFixed(
      2
    );


  fixedW2.value =
    Number(
      fixed.w2
    ).toFixed(
      2
    );


  fixedUtilities.value =
    Number(
      fixed.utilities
    ).toFixed(
      2
    );


  updateFixedPreview();

}


function updateFixedPreview() {

  const total =

    Number(
      fixedRent.value ||
      0
    ) +

    Number(
      fixedW2.value ||
      0
    ) +

    Number(
      fixedUtilities.value ||
      0
    );


  fixedCostTotal.textContent =
    currency(
      total
    );


  startingMonthlyCost.textContent =
    `-${currency(
      total
    )}`;

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

          month:
            currentMonth,

          year:
            yearFromMonth(
              currentMonth
            ),

          fixedRent:
            Number(
              fixedRent.value ||
              0
            ),

          fixedW2:
            Number(
              fixedW2.value ||
              0
            ),

          fixedUtilities:
            Number(
              fixedUtilities.value ||
              0
            ),

          updatedAt:
            serverTimestamp()

        },

        {
          merge:
            true
        }

      );


      fixedCostsMessage.textContent =
        "Saved.";

    } catch (
      error
    ) {

      console.error(
        error
      );


      fixedCostsMessage.textContent =
        "Unable to save.";

    }

  }
);



/* ======================================================
   MONTHLY METRICS
====================================================== */

function loadMetrics() {

  const values =
    monthlyMetrics[
      currentMonth
    ] ||
    {};


  metricFieldIds.forEach(
    id => {

      $(
        id
      ).value =
        values[
          id
        ] ??
        "";

    }
  );

}


monthlyMetricsForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


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

    } catch (
      error
    ) {

      console.error(
        error
      );


      monthlyMetricsMessage.textContent =
        "Unable to save.";

    }

  }
);



/* ======================================================
   TRANSACTION CALCULATIONS
====================================================== */

function monthlyTransactions(
  month
) {

  return transactions.filter(
    item =>
      item.month ===
      month
  );

}


function revenueCategories(
  month
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


  monthlyTransactions(
    month
  )

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
          ] !==
          undefined
        ) {

          totals[
            item.category
          ] +=
            Number(
              item.amount ||
              0
            );

        }

      }
    );


  return totals;

}


function expenseCategories(
  month
) {

  const fixed =
    getFixedCosts(
      month
    );


  const totals = {

    "Rent":
      Number(
        fixed.rent
      ),

    "W2 Staff":
      Number(
        fixed.w2
      ),

    "1099 Staff":
      0,

    "Tournaments":
      0,

    "Field Rentals":
      0,

    "Utilities":
      Number(
        fixed.utilities
      ),

    "Building Supplies":
      0,

    "Other":
      0

  };


  monthlyTransactions(
    month
  )

    .filter(
      item =>
        item.type ===
        "expense"
    )

    .forEach(
      item => {

        if (
          totals[
            item.category
          ] !==
          undefined
        ) {

          totals[
            item.category
          ] +=
            Number(
              item.amount ||
              0
            );

        }

      }
    );


  return totals;

}


function calculateMonth(
  month
) {

  const revenueByCategory =
    revenueCategories(
      month
    );


  const expenseByCategory =
    expenseCategories(
      month
    );


  const revenue =
    Object.values(
      revenueByCategory
    ).reduce(
      (
        total,
        value
      ) =>
        total +
        value,
      0
    );


  const expenses =
    Object.values(
      expenseByCategory
    ).reduce(
      (
        total,
        value
      ) =>
        total +
        value,
      0
    );


  const fixed =
    fixedTotal(
      month
    );


  const variableExpenses =
    expenses -
    fixed;


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


  const teamRevenue =
    revenueByCategory[
      "Team Revenue"
    ] ||
    0;


  const organic =
    revenue -
    teamRevenue;


  const teamMix =
    revenue >
    0

      ? (
          teamRevenue /
          revenue
        ) *
        100

      : 0;


  const directTeamCosts =
    monthlyTransactions(
      month
    )

      .filter(
        item =>
          item.type ===
          "expense" &&
          item.costType ===
          "direct" &&
          item.businessArea ===
          "Teams"
      )

      .reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.amount ||
            0
          ),
        0
      );


  const teamContributionValue =
    teamRevenue -
    directTeamCosts;


  const teamMargin =
    teamRevenue >
    0

      ? (
          teamContributionValue /
          teamRevenue
        ) *
        100

      : NaN;


  return {

    revenue,

    expenses,

    fixed,

    variableExpenses,

    profit,

    margin,

    revenueByCategory,

    expenseByCategory,

    teamRevenue,

    organic,

    teamMix,

    directTeamCosts,

    teamContributionValue,

    teamMargin

  };

}



/* ======================================================
   DASHBOARD
====================================================== */

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


  const metrics =
    monthlyMetrics[
      currentMonth
    ] ||
    {};


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
      totals.fixed
    )} fixed + ${currency(
      totals.variableExpenses
    )} variable`;


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


  organicRevenue.textContent =
    currency(
      totals.organic
    );


  organicRevenueDetail.textContent =
    "Revenue excluding Team Revenue";


  teamRevenueMix.textContent =
    percent(
      totals.teamMix
    );


  const players =
    Number(
      metrics.rosteredPlayers ||
      0
    );


  revenuePerPlayer.textContent =
    players >
    0

      ? currency(
          totals.teamRevenue /
          players
        )

      : "—";


  teamContribution.textContent =
    totals.teamRevenue >
    0

      ? currency(
          totals.teamContributionValue
        )

      : "—";


  teamContributionDetail.textContent =
    `${currency(
      totals.directTeamCosts
    )} direct team costs`;


  teamContributionMargin.textContent =
    Number.isFinite(
      totals.teamMargin
    )

      ? percent(
          totals.teamMargin
        )

      : "—";


  const lessonHours =
    Number(
      metrics.lessonHours ||
      0
    );


  revenuePerLesson.textContent =
    lessonHours >
    0

      ? currency(
          (
            totals.revenueByCategory[
              "Lessons"
            ] ||
            0
          ) /
          lessonHours
        )

      : "—";


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


  facilityUtilization.textContent =
    available >
    0

      ? percent(
          (
            used /
            available
          ) *
          100
        )

      : "—";


  revenuePerFacilityHour.textContent =
    available >
    0

      ? currency(
          totals.organic /
          available
        )

      : "—";


  const active =
    Number(
      metrics.activeMemberships ||
      0
    );


  const added =
    Number(
      metrics.newMemberships ||
      0
    );


  const cancelled =
    Number(
      metrics.membershipCancellations ||
      0
    );


  const opening =
    Math.max(
      0,
      active -
      added +
      cancelled
    );


  membershipChurn.textContent =
    opening >
    0

      ? percent(
          (
            cancelled /
            opening
          ) *
          100
        )

      : "—";


  breakEvenRevenue.textContent =
    currency(
      totals.fixed
    );


  const hasInputs =
    Boolean(
      monthlyMetrics[
        currentMonth
      ]
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



/* ======================================================
   BREAKDOWN
====================================================== */

function renderBreakdown(
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

      const share =
        total >
        0

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



/* ======================================================
   RECENT TRANSACTIONS
====================================================== */

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


  if (
    !items.length
  ) {

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



/* ======================================================
   CATEGORY FILTER
====================================================== */

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



/* ======================================================
   TRANSACTION TABLE
====================================================== */

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
    items.length >
    0
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
                  item.businessArea ||
                  "General"
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

          <button
            class="small-button edit-transaction"
            data-id="${item.id}"
          >
            Edit
          </button>

          <button
            class="small-button delete delete-transaction"
            data-id="${item.id}"
          >
            Delete
          </button>

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



/* ======================================================
   TRANSACTION MODAL
====================================================== */

function buildTransactionCategories(
  type
) {

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


function setTransactionType(
  type
) {

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


function openTransaction(
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


  transactionCostType.value =
    "direct";


  transactionBusinessArea.value =
    "Teams";


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

}


[
  "dashboardAddRevenueButton",
  "transactionsAddRevenueButton"
].forEach(
  id =>
    $(
      id
    ).addEventListener(
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
    $(
      id
    ).addEventListener(
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



/* ======================================================
   SAVE TRANSACTION
====================================================== */

transactionForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


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


    if (
      data.date <
      FIRST_DATE
    ) {

      transactionFormError.textContent =
        "Date must be January 1, 2026 or later.";


      return;

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

    } catch (
      error
    ) {

      console.error(
        error
      );


      transactionFormError.textContent =
        "Unable to save.";

    }

  }
);



/* ======================================================
   EDIT / DELETE
====================================================== */

function editTransaction(
  id
) {

  const item =
    transactions.find(
      transaction =>
        transaction.id ===
        id
    );


  if (
    !item
  ) {

    return;

  }


  transactionForm.reset();


  transactionId.value =
    item.id;


  transactionAmount.value =
    item.amount;


  transactionDate.value =
    item.date;


  transactionDescription.value =
    item.description;


  transactionNotes.value =
    item.notes ||
    "";


  setTransactionType(
    item.type
  );


  transactionCategory.value =
    item.category;


  if (
    item.type ===
    "expense"
  ) {

    transactionCostType.value =
      item.costType ||
      "direct";


    transactionBusinessArea.value =
      item.businessArea ||
      "General";


    transactionTeamProgram.value =
      item.teamProgram ||
      "";

  }


  transactionModal.classList.remove(
    "hidden"
  );

}


async function removeTransaction(
  id
) {

  if (
    !confirm(
      "Delete this transaction?"
    )
  ) {

    return;

  }


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



/* ======================================================
   CHARTS
====================================================== */

function renderCharts() {

  renderPerformanceChart();

  renderRevenueChart();

}


function renderPerformanceChart() {

  const months =
    buildYearMonths(
      yearFromMonth(
        currentMonth
      )
    );


  if (
    performanceChart
  ) {

    performanceChart.destroy();

  }


  performanceChart =
    new Chart(

      $("performanceChart"),

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

  const values =
    revenueCategories(
      currentMonth
    );


  const entries =
    Object.entries(
      values
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


  if (
    revenueMixChart
  ) {

    revenueMixChart.destroy();

  }


  revenueMixEmpty.classList.toggle(
    "hidden",
    entries.length >
    0
  );


  if (
    !entries.length
  ) {

    return;

  }


  revenueMixChart =
    new Chart(

      $("revenueMixChart"),

      {

        type:
          "doughnut",

        data: {

          labels:
            entries.map(
              entry =>
                entry[
                  0
                ]
            ),

          datasets: [

            {

              data:
                entries.map(
                  entry =>
                    entry[
                      1
                    ]
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


  const currentIndex =
    monthToIndex(
      currentMonth
    );


  let revenueTotal =
    0;


  let expenseTotal =
    0;


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


  let elapsed =
    0;


  months.forEach(
    month => {

      if (
        monthToIndex(
          month
        ) >
        currentIndex
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

        <td>
          ${currency(
            totals.revenue
          )}
        </td>

        <td>
          ${currency(
            totals.expenses
          )}
        </td>

        <td>
          ${currency(
            totals.profit
          )}
        </td>

        <td>

          ${
            totals.revenue >
            0

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
    revenueTotal >
    0

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


  yearMargin.textContent =
    revenueTotal >
    0

      ? percent(
          margin
        )

      : "—";


  yearRevenueForecast.textContent =
    elapsed >
    0

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

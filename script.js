import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyBgW3D1UI_EYTJS5m1GXe6XwRTmkR-UcJo",
  authDomain: "household-budget-b350e.firebaseapp.com",
  projectId: "household-budget-b350e",
  storageBucket: "household-budget-b350e.firebasestorage.app",
  messagingSenderId: "691191089446",
  appId: "1:691191089446:web:03175b656254076da519e7"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const HOUSEHOLD_ID = "main";


const categories = [
  "Mortgage",
  "Groceries",
  "Restaurants",
  "Utilities",
  "Gas",
  "Auto",
  "Kids",
  "Medical",
  "Shopping",
  "Travel",
  "Entertainment",
  "Home",
  "Subscriptions",
  "Personal",
  "Gifts",
  "Other"
];


let currentMonth = getCurrentMonth();

let transactions = [];
let budgets = {};
let savingsTarget = 0;
let goals = [];

let transactionsUnsubscribe = null;
let goalsUnsubscribe = null;


// ------------------------------------------------------
// DOM
// ------------------------------------------------------

const loginScreen = document.getElementById("loginScreen");
const appElement = document.getElementById("app");

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

const logoutButton = document.getElementById("logoutButton");

const monthSelector = document.getElementById("monthSelector");

const navButtons = document.querySelectorAll(".nav-button");
const pages = document.querySelectorAll(".page");

const dashboardMonthTitle =
  document.getElementById("dashboardMonthTitle");

const moneyInTotal =
  document.getElementById("moneyInTotal");

const spentTotal =
  document.getElementById("spentTotal");

const budgetRemainingTotal =
  document.getElementById("budgetRemainingTotal");

const safeToSpendTotal =
  document.getElementById("safeToSpendTotal");

const safeToSpendCard =
  document.getElementById("safeToSpendCard");

const safeMoneyIn =
  document.getElementById("safeMoneyIn");

const safeExpenses =
  document.getElementById("safeExpenses");

const safeReserved =
  document.getElementById("safeReserved");

const safeSavings =
  document.getElementById("safeSavings");

const safeResult =
  document.getElementById("safeResult");

const categoryProgressList =
  document.getElementById("categoryProgressList");

const recentTransactions =
  document.getElementById("recentTransactions");

const transactionTableBody =
  document.getElementById("transactionTableBody");

const transactionEmptyState =
  document.getElementById("transactionEmptyState");

const transactionTypeFilter =
  document.getElementById("transactionTypeFilter");

const transactionCategoryFilter =
  document.getElementById("transactionCategoryFilter");

const budgetForm =
  document.getElementById("budgetForm");

const budgetTotal =
  document.getElementById("budgetTotal");

const plannedTotal =
  document.getElementById("plannedTotal");

const savingsTargetInput =
  document.getElementById("savingsTargetInput");

const budgetSaveStatus =
  document.getElementById("budgetSaveStatus");

const saveBudgetButton =
  document.getElementById("saveBudgetButton");

const transactionModal =
  document.getElementById("transactionModal");

const transactionForm =
  document.getElementById("transactionForm");

const transactionModalTitle =
  document.getElementById("transactionModalTitle");

const transactionId =
  document.getElementById("transactionId");

const transactionType =
  document.getElementById("transactionType");

const transactionAmount =
  document.getElementById("transactionAmount");

const transactionDate =
  document.getElementById("transactionDate");

const transactionDescription =
  document.getElementById("transactionDescription");

const transactionCategory =
  document.getElementById("transactionCategory");

const transactionNeedWant =
  document.getElementById("transactionNeedWant");

const transactionAccount =
  document.getElementById("transactionAccount");

const transactionNotes =
  document.getElementById("transactionNotes");

const transactionFormError =
  document.getElementById("transactionFormError");

const expenseFields =
  document.getElementById("expenseFields");

const goalModal =
  document.getElementById("goalModal");

const goalForm =
  document.getElementById("goalForm");

const goalName =
  document.getElementById("goalName");

const goalTarget =
  document.getElementById("goalTarget");

const goalSaved =
  document.getElementById("goalSaved");

const goalsGrid =
  document.getElementById("goalsGrid");


// ------------------------------------------------------
// HELPERS
// ------------------------------------------------------

function currency(value) {

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Number(value || 0));

}


function getCurrentMonth() {

  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

}


function formatMonth(monthKey) {

  const [year, month] =
    monthKey.split("-");

  return new Date(
    Number(year),
    Number(month) - 1,
    1
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

}


function formatDate(dateString) {

  if (!dateString) return "";

  const [year, month, day] =
    dateString.split("-");

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });

}


function getMonthFromDate(dateString) {
  return dateString.slice(0, 7);
}


function todayString() {

  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(now.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(now.getDate())
      .padStart(2, "0");

  return `${year}-${month}-${day}`;

}


// ------------------------------------------------------
// MONTH SELECTOR
// ------------------------------------------------------

function buildMonthSelector() {

  monthSelector.innerHTML = "";

  const now = new Date();

  for (let i = -18; i <= 12; i++) {

    const date =
      new Date(
        now.getFullYear(),
        now.getMonth() + i,
        1
      );

    const value =
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

    const option =
      document.createElement("option");

    option.value = value;

    option.textContent =
      date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
      });

    if (value === currentMonth) {
      option.selected = true;
    }

    monthSelector.appendChild(option);

  }

}


// ------------------------------------------------------
// AUTH
// ------------------------------------------------------

loginForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    loginError.textContent = "";

    const email =
      document
        .getElementById("email")
        .value
        .trim();

    const password =
      document
        .getElementById("password")
        .value;

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    } catch (error) {

      console.error(error);

      loginError.textContent =
        "Unable to sign in. Check your email and password.";

    }

  }
);


logoutButton.addEventListener(
  "click",
  async () => {
    await signOut(auth);
  }
);


onAuthStateChanged(
  auth,
  async user => {

    if (user) {

      loginScreen.classList.add("hidden");
      appElement.classList.remove("hidden");

      await initializeAppData();

    } else {

      if (transactionsUnsubscribe) {
        transactionsUnsubscribe();
        transactionsUnsubscribe = null;
      }

      if (goalsUnsubscribe) {
        goalsUnsubscribe();
        goalsUnsubscribe = null;
      }

      appElement.classList.add("hidden");
      loginScreen.classList.remove("hidden");

    }

  }
);


// ------------------------------------------------------
// INITIALIZE
// ------------------------------------------------------

async function initializeAppData() {

  buildMonthSelector();
  buildCategoryDropdowns();
  buildBudgetForm();

  dashboardMonthTitle.textContent =
    formatMonth(currentMonth);

  await loadBudget();

  listenForTransactions();
  listenForGoals();

}


// ------------------------------------------------------
// NAVIGATION
// ------------------------------------------------------

navButtons.forEach(button => {

  button.addEventListener("click", () => {

    const pageName =
      button.dataset.page;

    navButtons.forEach(nav => {
      nav.classList.remove("active");
    });

    button.classList.add("active");

    pages.forEach(page => {
      page.classList.remove("active-page");
    });

    document
      .getElementById(`${pageName}Page`)
      .classList.add("active-page");

  });

});


// ------------------------------------------------------
// CATEGORY DROPDOWNS
// ------------------------------------------------------

function buildCategoryDropdowns() {

  transactionCategory.innerHTML = "";

  transactionCategoryFilter.innerHTML =
    `<option value="all">All Categories</option>`;

  categories.forEach(category => {

    const option =
      document.createElement("option");

    option.value = category;
    option.textContent = category;

    transactionCategory.appendChild(option);


    const filterOption =
      document.createElement("option");

    filterOption.value = category;
    filterOption.textContent = category;

    transactionCategoryFilter.appendChild(
      filterOption
    );

  });

}


// ------------------------------------------------------
// ADD MONEY / ADD EXPENSE BUTTONS
// ------------------------------------------------------

document
  .getElementById("dashboardAddMoneyButton")
  .addEventListener(
    "click",
    () => openNewTransaction("income")
  );


document
  .getElementById("dashboardAddExpenseButton")
  .addEventListener(
    "click",
    () => openNewTransaction("expense")
  );


document
  .getElementById("transactionsAddMoneyButton")
  .addEventListener(
    "click",
    () => openNewTransaction("income")
  );


document
  .getElementById("transactionsAddExpenseButton")
  .addEventListener(
    "click",
    () => openNewTransaction("expense")
  );


// ------------------------------------------------------
// TRANSACTIONS
// ------------------------------------------------------

function listenForTransactions() {

  if (transactionsUnsubscribe) {
    transactionsUnsubscribe();
  }

  const transactionsRef =
    collection(
      db,
      "households",
      HOUSEHOLD_ID,
      "transactions"
    );

  const q =
    query(
      transactionsRef,
      orderBy("date", "desc")
    );

  transactionsUnsubscribe =
    onSnapshot(
      q,
      snapshot => {

        transactions =
          snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }));

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


// ------------------------------------------------------
// RENDER
// ------------------------------------------------------

function renderEverything() {

  renderDashboard();
  renderTransactions();
  renderGoals();

}


// ------------------------------------------------------
// MONTH TRANSACTIONS
// ------------------------------------------------------

function getMonthlyTransactions() {

  return transactions.filter(
    transaction =>
      transaction.month === currentMonth
  );

}


// ------------------------------------------------------
// DASHBOARD
// ------------------------------------------------------

function renderDashboard() {

  const monthlyTransactions =
    getMonthlyTransactions();


  const income =
    monthlyTransactions
      .filter(
        transaction =>
          transaction.type === "income"
      )
      .reduce(
        (sum, transaction) =>
          sum +
          Number(transaction.amount || 0),
        0
      );


  const expenses =
    monthlyTransactions
      .filter(
        transaction =>
          transaction.type === "expense"
      )
      .reduce(
        (sum, transaction) =>
          sum +
          Number(transaction.amount || 0),
        0
      );


  const totalBudget =
    Object.values(budgets)
      .reduce(
        (sum, amount) =>
          sum + Number(amount || 0),
        0
      );


  const budgetRemaining =
    totalBudget - expenses;


  /*
    RESERVED REMAINING

    We calculate each category separately.

    If groceries:
      budget = $1,000
      spent = $600
      reserved = $400

    If restaurants:
      budget = $500
      spent = $600
      reserved = $0

    We never use a negative reservation.
    Overspending is already included in total expenses.
  */

  let reservedRemaining = 0;


  categories.forEach(category => {

    const categoryBudget =
      Number(budgets[category] || 0);


    const categorySpent =
      monthlyTransactions
        .filter(
          transaction =>
            transaction.type === "expense" &&
            transaction.category === category
        )
        .reduce(
          (sum, transaction) =>
            sum +
            Number(transaction.amount || 0),
          0
        );


    reservedRemaining +=
      Math.max(
        categoryBudget - categorySpent,
        0
      );

  });


  /*
    TRUE SAFE TO SPEND

    Income
    - money already spent
    - money still reserved for budgets
    - savings target
  */

  const safeToSpend =
    income
    - expenses
    - reservedRemaining
    - Number(savingsTarget || 0);


  moneyInTotal.textContent =
    currency(income);

  spentTotal.textContent =
    currency(expenses);

  budgetRemainingTotal.textContent =
    currency(budgetRemaining);

  safeToSpendTotal.textContent =
    currency(safeToSpend);


  // Budget Remaining color

  budgetRemainingTotal
    .closest(".summary-card")
    .classList.remove(
      "positive-value",
      "negative-value"
    );


  budgetRemainingTotal
    .closest(".summary-card")
    .classList.add(
      budgetRemaining >= 0
        ? "positive-value"
        : "negative-value"
    );


  // Safe to Spend card color

  safeToSpendCard.classList.remove(
    "positive",
    "negative"
  );

  safeToSpendCard.classList.add(
    safeToSpend >= 0
      ? "positive"
      : "negative"
  );


  // Formula breakdown

  safeMoneyIn.textContent =
    currency(income);

  safeExpenses.textContent =
    currency(expenses);

  safeReserved.textContent =
    currency(reservedRemaining);

  safeSavings.textContent =
    currency(savingsTarget);

  safeResult.textContent =
    currency(safeToSpend);

  safeResult.style.color =
    safeToSpend >= 0
      ? "var(--positive)"
      : "var(--negative)";


  renderCategoryProgress(
    monthlyTransactions
  );

  renderRecentTransactions(
    monthlyTransactions
  );

}


// ------------------------------------------------------
// CATEGORY PROGRESS
// ------------------------------------------------------

function renderCategoryProgress(
  monthlyTransactions
) {

  const categoriesWithBudget =
    categories.filter(
      category =>
        Number(budgets[category] || 0) > 0
    );


  if (!categoriesWithBudget.length) {

    categoryProgressList.innerHTML =
      `<p class="empty-state">
        No monthly budget has been set yet.
      </p>`;

    return;

  }


  categoryProgressList.innerHTML = "";


  categoriesWithBudget.forEach(category => {

    const budgetAmount =
      Number(budgets[category] || 0);


    const spent =
      monthlyTransactions
        .filter(
          transaction =>
            transaction.type === "expense" &&
            transaction.category === category
        )
        .reduce(
          (sum, transaction) =>
            sum +
            Number(transaction.amount || 0),
          0
        );


    const remaining =
      budgetAmount - spent;


    const percent =
      budgetAmount > 0
        ? (spent / budgetAmount) * 100
        : 0;


    const item =
      document.createElement("div");


    item.className =
      "category-progress-item";


    item.innerHTML = `

      <div class="category-progress-top">

        <div class="category-progress-name">
          ${category}
        </div>

        <div class="category-progress-values">
          ${currency(spent)} / ${currency(budgetAmount)}
        </div>

      </div>


      <div class="progress-track">

        <div
          class="progress-fill ${percent > 100 ? "over" : ""}"
          style="width: ${Math.min(percent, 100)}%"
        ></div>

      </div>


      <div class="category-progress-bottom">

        <span>
          ${Math.round(percent)}% used
        </span>

        <span class="${remaining < 0 ? "over-budget-text" : ""}">

          ${
            remaining >= 0
              ? `${currency(remaining)} remaining`
              : `${currency(Math.abs(remaining))} over`
          }

        </span>

      </div>
    `;


    categoryProgressList.appendChild(item);

  });

}


// ------------------------------------------------------
// RECENT TRANSACTIONS
// ------------------------------------------------------

function renderRecentTransactions(
  monthlyTransactions
) {

  const sorted =
    [...monthlyTransactions]
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date)
      )
      .slice(0, 7);


  if (!sorted.length) {

    recentTransactions.innerHTML =
      `<p class="empty-state">
        No transactions yet.
      </p>`;

    return;

  }


  recentTransactions.innerHTML = "";


  sorted.forEach(transaction => {

    const row =
      document.createElement("div");


    row.className =
      "recent-transaction";


    row.innerHTML = `

      <div>

        <div class="recent-description">
          ${escapeHtml(transaction.description)}
        </div>

        <div class="recent-meta">

          ${formatDate(transaction.date)}

          ${
            transaction.type === "expense"
              ? ` • ${transaction.category}`
              : " • Money In"
          }

        </div>

      </div>


      <div class="${
        transaction.type === "income"
          ? "amount-income"
          : "amount-expense"
      }">

        ${
          transaction.type === "income"
            ? "+"
            : "-"
        }

        ${currency(transaction.amount)}

      </div>
    `;


    recentTransactions.appendChild(row);

  });

}


// ------------------------------------------------------
// TRANSACTION TABLE
// ------------------------------------------------------

function renderTransactions() {

  let filtered =
    getMonthlyTransactions();


  const typeFilter =
    transactionTypeFilter.value;


  const categoryFilter =
    transactionCategoryFilter.value;


  if (typeFilter !== "all") {

    filtered =
      filtered.filter(
        transaction =>
          transaction.type === typeFilter
      );

  }


  if (categoryFilter !== "all") {

    filtered =
      filtered.filter(
        transaction =>
          transaction.category === categoryFilter
      );

  }


  filtered.sort(
    (a, b) =>
      b.date.localeCompare(a.date)
  );


  transactionTableBody.innerHTML = "";


  transactionEmptyState.classList.toggle(
    "hidden",
    filtered.length > 0
  );


  filtered.forEach(transaction => {

    const row =
      document.createElement("tr");


    row.innerHTML = `

      <td>
        ${formatDate(transaction.date)}
      </td>

      <td>
        ${escapeHtml(transaction.description)}
      </td>

      <td>

        ${
          transaction.type === "income"
            ? "Money In"
            : transaction.category
        }

      </td>

      <td>

        ${
          transaction.type === "expense"
            ? capitalize(transaction.needWant || "")
            : "—"
        }

      </td>

      <td class="${
        transaction.type === "income"
          ? "amount-income"
          : "amount-expense"
      }">

        ${
          transaction.type === "income"
            ? "+"
            : "-"
        }

        ${currency(transaction.amount)}

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


    transactionTableBody.appendChild(row);

  });


  document
    .querySelectorAll(".edit-transaction")
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          openEditTransaction(
            button.dataset.id
          )
      );

    });


  document
    .querySelectorAll(".delete-transaction")
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          deleteTransaction(
            button.dataset.id
          )
      );

    });

}


transactionTypeFilter.addEventListener(
  "change",
  renderTransactions
);


transactionCategoryFilter.addEventListener(
  "change",
  renderTransactions
);


// ------------------------------------------------------
// TRANSACTION MODAL
// ------------------------------------------------------

document
  .querySelectorAll(
    "[data-close-transaction-modal]"
  )
  .forEach(element => {

    element.addEventListener(
      "click",
      closeTransactionModal
    );

  });


function openNewTransaction(type = "expense") {

  transactionForm.reset();

  transactionId.value = "";

  transactionType.value = type;

  transactionDate.value =
    todayString();

  transactionNeedWant.value =
    "need";

  transactionModalTitle.textContent =
    type === "income"
      ? "Add Money"
      : "Add Expense";

  updateTransactionTypeButtons();
  updateNeedWantButtons();

  transactionFormError.textContent = "";

  transactionModal.classList.remove("hidden");

}


function closeTransactionModal() {

  transactionModal.classList.add("hidden");

}


function openEditTransaction(id) {

  const transaction =
    transactions.find(
      transaction =>
        transaction.id === id
    );


  if (!transaction) return;


  transactionId.value =
    transaction.id;

  transactionType.value =
    transaction.type;

  transactionAmount.value =
    transaction.amount;

  transactionDate.value =
    transaction.date;

  transactionDescription.value =
    transaction.description || "";

  transactionCategory.value =
    transaction.category || categories[0];

  transactionNeedWant.value =
    transaction.needWant || "need";

  transactionAccount.value =
    transaction.account || "";

  transactionNotes.value =
    transaction.notes || "";

  transactionModalTitle.textContent =
    "Edit Transaction";

  updateTransactionTypeButtons();
  updateNeedWantButtons();

  transactionModal.classList.remove("hidden");

}


// ------------------------------------------------------
// TYPE BUTTONS
// ------------------------------------------------------

document
  .querySelectorAll(".transaction-type-button")
  .forEach(button => {

    button.addEventListener("click", () => {

      transactionType.value =
        button.dataset.type;

      transactionModalTitle.textContent =
        transactionType.value === "income"
          ? "Add Money"
          : "Add Expense";

      updateTransactionTypeButtons();

    });

  });


function updateTransactionTypeButtons() {

  document
    .querySelectorAll(".transaction-type-button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.type ===
          transactionType.value
      );

    });


  expenseFields.classList.toggle(
    "hidden",
    transactionType.value !== "expense"
  );

}


// ------------------------------------------------------
// NEED / WANT
// ------------------------------------------------------

document
  .querySelectorAll(".need-want-button")
  .forEach(button => {

    button.addEventListener("click", () => {

      transactionNeedWant.value =
        button.dataset.value;

      updateNeedWantButtons();

    });

  });


function updateNeedWantButtons() {

  document
    .querySelectorAll(".need-want-button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.value ===
          transactionNeedWant.value
      );

    });

}


// ------------------------------------------------------
// SAVE TRANSACTION
// ------------------------------------------------------

transactionForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    transactionFormError.textContent = "";


    const amount =
      Number(transactionAmount.value);


    if (!amount || amount <= 0) {

      transactionFormError.textContent =
        "Enter a valid amount.";

      return;

    }


    const type =
      transactionType.value;


    const data = {

      type,

      amount,

      description:
        transactionDescription.value.trim(),

      date:
        transactionDate.value,

      month:
        getMonthFromDate(
          transactionDate.value
        ),

      account:
        transactionAccount.value.trim(),

      notes:
        transactionNotes.value.trim(),

      updatedAt:
        serverTimestamp()

    };


    if (type === "expense") {

      data.category =
        transactionCategory.value;

      data.needWant =
        transactionNeedWant.value;

    } else {

      data.category =
        "Income";

      data.needWant =
        null;

    }


    try {

      const id =
        transactionId.value;


      if (id) {

        await updateDoc(
          doc(
            db,
            "households",
            HOUSEHOLD_ID,
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
            "households",
            HOUSEHOLD_ID,
            "transactions"
          ),
          data
        );

      }


      closeTransactionModal();


    } catch (error) {

      console.error(error);

      transactionFormError.textContent =
        "Unable to save transaction.";

    }

  }
);


// ------------------------------------------------------
// DELETE TRANSACTION
// ------------------------------------------------------

async function deleteTransaction(id) {

  const transaction =
    transactions.find(
      transaction =>
        transaction.id === id
    );


  const confirmed =
    confirm(
      `Delete "${
        transaction?.description ||
        "this transaction"
      }"?`
    );


  if (!confirmed) return;


  try {

    await deleteDoc(
      doc(
        db,
        "households",
        HOUSEHOLD_ID,
        "transactions",
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


// ------------------------------------------------------
// BUDGET FORM
// ------------------------------------------------------

function buildBudgetForm() {

  budgetForm.innerHTML = "";


  categories.forEach(category => {

    const row =
      document.createElement("div");


    row.className =
      "budget-row";


    row.innerHTML = `

      <label>
        ${category}
      </label>

      <div class="budget-input-wrapper">

        <span>$</span>

        <input
          type="number"
          min="0"
          step="1"
          class="budget-input"
          data-category="${category}"
          value="0"
        >

      </div>
    `;


    budgetForm.appendChild(row);

  });


  document
    .querySelectorAll(".budget-input")
    .forEach(input => {

      input.addEventListener(
        "input",
        updateBudgetTotal
      );

    });

}


// ------------------------------------------------------
// LOAD BUDGET
// ------------------------------------------------------

async function loadBudget() {

  const budgetRef =
    doc(
      db,
      "households",
      HOUSEHOLD_ID,
      "budgets",
      currentMonth
    );


  try {

    const snapshot =
      await getDoc(budgetRef);


    if (snapshot.exists()) {

      const data =
        snapshot.data();

      budgets =
        data.categories || {};

      savingsTarget =
        Number(data.savingsTarget || 0);

    } else {

      budgets = {};
      savingsTarget = 0;

    }


    populateBudgetInputs();

    renderDashboard();


  } catch (error) {

    console.error(
      "Unable to load budget:",
      error
    );

  }

}


// ------------------------------------------------------
// POPULATE BUDGET
// ------------------------------------------------------

function populateBudgetInputs() {

  document
    .querySelectorAll(".budget-input")
    .forEach(input => {

      const category =
        input.dataset.category;

      input.value =
        budgets[category] || 0;

    });


  savingsTargetInput.value =
    savingsTarget || 0;


  updateBudgetTotal();

}


// ------------------------------------------------------
// BUDGET TOTAL
// ------------------------------------------------------

function updateBudgetTotal() {

  let total = 0;


  document
    .querySelectorAll(".budget-input")
    .forEach(input => {

      total +=
        Number(input.value || 0);

    });


  const currentSavingsTarget =
    Number(
      savingsTargetInput.value || 0
    );


  budgetTotal.textContent =
    currency(total);


  plannedTotal.textContent =
    currency(
      total + currentSavingsTarget
    );

}


savingsTargetInput.addEventListener(
  "input",
  updateBudgetTotal
);


// ------------------------------------------------------
// SAVE BUDGET
// ------------------------------------------------------

saveBudgetButton.addEventListener(
  "click",
  async () => {

    const categoryValues = {};


    document
      .querySelectorAll(".budget-input")
      .forEach(input => {

        categoryValues[
          input.dataset.category
        ] =
          Number(input.value || 0);

      });


    const newSavingsTarget =
      Number(
        savingsTargetInput.value || 0
      );


    try {

      await setDoc(
        doc(
          db,
          "households",
          HOUSEHOLD_ID,
          "budgets",
          currentMonth
        ),
        {
          month: currentMonth,

          categories:
            categoryValues,

          savingsTarget:
            newSavingsTarget,

          updatedAt:
            serverTimestamp()
        }
      );


      budgets =
        categoryValues;

      savingsTarget =
        newSavingsTarget;


      budgetSaveStatus.textContent =
        "Budget saved.";


      renderDashboard();


      setTimeout(() => {

        budgetSaveStatus.textContent = "";

      }, 2000);


    } catch (error) {

      console.error(error);

      budgetSaveStatus.textContent =
        "Unable to save budget.";

    }

  }
);


// ------------------------------------------------------
// GOALS
// ------------------------------------------------------

function listenForGoals() {

  if (goalsUnsubscribe) {
    goalsUnsubscribe();
  }


  const goalsRef =
    collection(
      db,
      "households",
      HOUSEHOLD_ID,
      "goals"
    );


  goalsUnsubscribe =
    onSnapshot(
      goalsRef,
      snapshot => {

        goals =
          snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }));

        renderGoals();

      }
    );

}


// ------------------------------------------------------
// RENDER GOALS
// ------------------------------------------------------

function renderGoals() {

  if (!goals.length) {

    goalsGrid.innerHTML =
      `<p class="empty-state">
        No savings goals yet.
      </p>`;

    return;

  }


  goalsGrid.innerHTML = "";


  goals.forEach(goal => {

    const target =
      Number(goal.target || 0);

    const saved =
      Number(goal.saved || 0);

    const percent =
      target > 0
        ? (saved / target) * 100
        : 0;

    const remaining =
      Math.max(
        target - saved,
        0
      );


    const card =
      document.createElement("div");


    card.className =
      "goal-card";


    card.innerHTML = `

      <h3>
        ${escapeHtml(goal.name)}
      </h3>

      <div class="goal-numbers">

        <span>
          ${currency(saved)} saved
        </span>

        <span>
          ${currency(target)} goal
        </span>

      </div>

      <div class="progress-track">

        <div
          class="progress-fill"
          style="width: ${Math.min(percent, 100)}%"
        ></div>

      </div>

      <div class="goal-footer">

        <span>
          ${Math.round(percent)}%
        </span>

        <span>
          ${currency(remaining)} remaining
        </span>

      </div>

      <div class="goal-actions">

        <button
          class="small-button goal-add-money"
          data-id="${goal.id}"
        >
          Add Money
        </button>

        <button
          class="small-button goal-remove-money"
          data-id="${goal.id}"
        >
          Remove
        </button>

        <button
          class="small-button delete goal-delete"
          data-id="${goal.id}"
        >
          Delete
        </button>

      </div>
    `;


    goalsGrid.appendChild(card);

  });


  document
    .querySelectorAll(".goal-add-money")
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          changeGoalAmount(
            button.dataset.id,
            1
          )
      );

    });


  document
    .querySelectorAll(".goal-remove-money")
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          changeGoalAmount(
            button.dataset.id,
            -1
          )
      );

    });


  document
    .querySelectorAll(".goal-delete")
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          deleteGoal(
            button.dataset.id
          )
      );

    });

}


// ------------------------------------------------------
// GOAL MODAL
// ------------------------------------------------------

document
  .getElementById("openGoalModalButton")
  .addEventListener(
    "click",
    () => {

      goalForm.reset();

      goalSaved.value = 0;

      goalModal.classList.remove("hidden");

    }
  );


document
  .querySelectorAll(
    "[data-close-goal-modal]"
  )
  .forEach(element => {

    element.addEventListener(
      "click",
      () => {

        goalModal.classList.add("hidden");

      }
    );

  });


goalForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const name =
      goalName.value.trim();


    const target =
      Number(goalTarget.value);


    const saved =
      Number(goalSaved.value);


    if (!name || target <= 0) return;


    try {

      await addDoc(
        collection(
          db,
          "households",
          HOUSEHOLD_ID,
          "goals"
        ),
        {
          name,
          target,
          saved,

          createdAt:
            serverTimestamp()
        }
      );


      goalModal.classList.add("hidden");


    } catch (error) {

      console.error(error);

      alert(
        "Unable to save goal."
      );

    }

  }
);


// ------------------------------------------------------
// CHANGE GOAL MONEY
// ------------------------------------------------------

async function changeGoalAmount(
  id,
  direction
) {

  const goal =
    goals.find(
      goal =>
        goal.id === id
    );


  if (!goal) return;


  const input =
    prompt(
      direction > 0
        ? "How much do you want to add?"
        : "How much do you want to remove?"
    );


  if (input === null) return;


  const amount =
    Number(input);


  if (!amount || amount <= 0) return;


  let newSaved =
    Number(goal.saved || 0) +
    direction * amount;


  newSaved =
    Math.max(
      newSaved,
      0
    );


  try {

    await updateDoc(
      doc(
        db,
        "households",
        HOUSEHOLD_ID,
        "goals",
        id
      ),
      {
        saved:
          newSaved,

        updatedAt:
          serverTimestamp()
      }
    );

  } catch (error) {

    console.error(error);

    alert(
      "Unable to update goal."
    );

  }

}


// ------------------------------------------------------
// DELETE GOAL
// ------------------------------------------------------

async function deleteGoal(id) {

  const goal =
    goals.find(
      goal =>
        goal.id === id
    );


  const confirmed =
    confirm(
      `Delete savings goal "${
        goal?.name || ""
      }"?`
    );


  if (!confirmed) return;


  try {

    await deleteDoc(
      doc(
        db,
        "households",
        HOUSEHOLD_ID,
        "goals",
        id
      )
    );

  } catch (error) {

    console.error(error);

    alert(
      "Unable to delete goal."
    );

  }

}


// ------------------------------------------------------
// MONTH CHANGE
// ------------------------------------------------------

monthSelector.addEventListener(
  "change",
  async () => {

    currentMonth =
      monthSelector.value;


    dashboardMonthTitle.textContent =
      formatMonth(currentMonth);


    await loadBudget();


    renderEverything();

  }
);


// ------------------------------------------------------
// DISPLAY HELPERS
// ------------------------------------------------------

function escapeHtml(value = "") {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function capitalize(value = "") {

  return value
    ? value.charAt(0).toUpperCase() +
      value.slice(1)
    : "";

}

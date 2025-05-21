const firebaseConfig = {
  apiKey: "AIzaSyC0UVAvnoCCKPDCuos2ln3pz_9p9y3eRBM",
  authDomain: "myfirstshop-8ca21.firebaseapp.com",
  databaseURL: "https://myfirstshop-8ca21-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "myfirstshop-8ca21",
  storageBucket: "myfirstshop-8ca21.appspot.com",
  messagingSenderId: "934135342723",
  appId: "1:934135342723:web:c6e182fca7c05dfd14ddb6",
  measurementId: "G-G93MJXYPF0"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const authMsg = document.getElementById('authMsg');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');

const expenseForm = document.getElementById('expenseForm');
const expenseIdInput = document.getElementById('expenseId');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const descriptionInput = document.getElementById('description');
const expensesList = document.getElementById('expensesList');

let currentUser = null;
let expensesData = {};

loginBtn.onclick = () => {
  const email = emailInput.value.trim();
  const pass = passwordInput.value.trim();
  auth.signInWithEmailAndPassword(email, pass)
    .catch(err => authMsg.textContent = err.message);
};

registerBtn.onclick = () => {
  const email = emailInput.value.trim();
  const pass = passwordInput.value.trim();
  auth.createUserWithEmailAndPassword(email, pass)
    .catch(err => authMsg.textContent = err.message);
};

logoutBtn.onclick = () => {
  auth.signOut();
};

auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    authSection.style.display = 'none';
    appSection.style.display = 'block';
    loadExpenses();
  } else {
    currentUser = null;
    authSection.style.display = 'block';
    appSection.style.display = 'none';
    authMsg.textContent = '';
    emailInput.value = '';
    passwordInput.value = '';
    expensesList.innerHTML = '';
    clearForm();
    if(expenseChart) expenseChart.destroy();
  }
});

function loadExpenses() {
  const expensesRef = db.ref('expenses/' + currentUser.uid);
  expensesRef.off();
  expensesRef.on('value', snapshot => {
    expensesData = snapshot.val() || {};
    renderExpenses();
    renderChart();
  });
}

function renderExpenses() {
  expensesList.innerHTML = '';
  for (const id in expensesData) {
    const e = expensesData[id];
    const div = document.createElement('div');
    div.innerHTML = `
      <div><strong>${e.category}</strong> — $${parseFloat(e.amount).toFixed(2)} on ${e.date}</div>
      <div>${e.description || ''}</div>
    `;
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => {
      expenseIdInput.value = id;
      amountInput.value = e.amount;
      categoryInput.value = e.category;
      dateInput.value = e.date;
      descriptionInput.value = e.description || '';
    };
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.onclick = () => {
      db.ref(`expenses/${currentUser.uid}/${id}`).remove();
    };
    div.appendChild(editBtn);
    div.appendChild(delBtn);
    expensesList.appendChild(div);
  }
}

expenseForm.onsubmit = e => {
  e.preventDefault();
  const amount = parseFloat(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;
  const description = descriptionInput.value.trim();

  if (!amount || amount <= 0) return alert('Enter valid amount');
  if (!category) return alert('Select category');
  if (!date) return alert('Select date');

  const id = expenseIdInput.value;
  const expense = { amount, category, date, description };

  if (id) {
    db.ref(`expenses/${currentUser.uid}/${id}`).update(expense);
  } else {
    db.ref(`expenses/${currentUser.uid}`).push(expense);
  }
  clearForm();
};

function clearForm() {
  expenseIdInput.value = '';
  amountInput.value = '';
  categoryInput.value = '';
  dateInput.value = '';
  descriptionInput.value = '';
}

// Chart.js
const ctx = document.getElementById('expenseChart').getContext('2d');
let expenseChart = null;

function renderChart() {
  // Считаем сумму по категориям
  const sums = {};
  Object.values(expensesData).forEach(e => {
    sums[e.category] = (sums[e.category] || 0) + parseFloat(e.amount);
  });

  const labels = Object.keys(sums);
  const data = Object.values(sums);

  if(expenseChart) expenseChart.destroy();

  expenseChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: [
          '#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

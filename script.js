// ================== DATA ==================

// array of objects for all the pizzas on the menu
const pizzas = [
  { id: 1, name: "Margherita",       price: 850,  image: "margherita.png" },
  { id: 2, name: "Pepperoni Feast",  price: 1150, image: "pepperoni.png" },
  { id: 3, name: "Chicken Tikka",    price: 1300, image: "chicken-tikka.png" },
  { id: 4, name: "Veggie Supreme",   price: 1050, image: "veggie-supreme.png" },
  { id: 5, name: "BBQ Fajita",       price: 1400, image: "bbq-fajita.png" },
  { id: 6, name: "Cheese Lover",     price: 1250, image: "cheese-lover.png" }
];

// cart array, each item looks like { id, name, price, qty }
let cart = [];

// login data array, each user looks like { username, password, orders }
let users = [];

// the user who is logged in right now (null means nobody)
let currentUser = null;

// ================== GRAB ELEMENTS ==================
const pizzaList    = document.getElementById("pizzaList");
const loginForm    = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loggedInBox  = document.getElementById("loggedInBox");
const welcomeText  = document.getElementById("welcomeText");
const logoutBtn    = document.getElementById("logoutBtn");
const loginMessage = document.getElementById("loginMessage");
const cartBox      = document.getElementById("cartBox");
const cartMessage  = document.getElementById("cartMessage");
const offersBox    = document.getElementById("offersBox");

// ================== SMALL HELPERS ==================

// makes numbers look nice like Rs 1,250
function formatPrice(amount) {
  return "Rs " + Math.round(amount).toLocaleString("en-US");
}

// shows a message under a panel, type is "error" or "success"
function showMessage(element, text, type) {
  element.textContent = text;
  element.className = "message " + type;
}

// ================== PIZZA MENU ==================

// builds all the pizza cards using innerHTML
function renderMenu() {
  let html = "";

  pizzas.forEach(function (pizza) {
    html += `
      <div class="pizza-card">
        <img src="${pizza.image}" alt="${pizza.name}">
        <h3>${pizza.name}</h3>
        <p class="price">${formatPrice(pizza.price)}</p>
        <button class="btn add-btn" data-id="${pizza.id}">Add to Cart</button>
      </div>
    `;
  });

  pizzaList.innerHTML = html;
}

// one click listener on the whole menu, checks if an Add to Cart button was clicked
pizzaList.addEventListener("click", function (event) {
  const button = event.target.closest(".add-btn");
  if (button) {
    addToCart(Number(button.dataset.id));
  }
});

// ================== CART ==================

function addToCart(pizzaId) {
  const pizza = pizzas.find(function (p) {
    return p.id === pizzaId;
  });

  // if the pizza is already in the cart just increase qty
  const inCart = cart.find(function (item) {
    return item.id === pizzaId;
  });

  if (inCart) {
    inCart.qty++;
  } else {
    cart.push({ id: pizza.id, name: pizza.name, price: pizza.price, qty: 1 });
  }

  cartMessage.textContent = "";
  renderCart();
  renderOffers();
}

function increaseQty(pizzaId) {
  const item = cart.find(function (i) {
    return i.id === pizzaId;
  });
  item.qty++;
  renderCart();
  renderOffers();
}

function removeFromCart(pizzaId) {
  // keep everything except the pizza we want to remove
  cart = cart.filter(function (item) {
    return item.id !== pizzaId;
  });
  renderCart();
  renderOffers();
}

// adds up price x qty for every item in the cart
function calculateSubtotal() {
  let total = 0;
  cart.forEach(function (item) {
    total += item.price * item.qty;
  });
  return total;
}

// works out which offers apply and how much money is saved
function calculateDiscounts(subtotal) {
  const result = { offer1: 0, offer2: 0, totalPercent: 0, amount: 0, finalAmount: subtotal };

  // offers only work after login
  if (currentUser === null) {
    return result;
  }

  // offer 1: 10% if total is greater than 3000
  if (subtotal > 3000) {
    result.offer1 = 10;
  }

  // offer 2: extra 5% if the user already placed 3 or more orders
  if (currentUser.orders >= 3) {
    result.offer2 = 5;
  }

  result.totalPercent = result.offer1 + result.offer2;
  result.amount = (subtotal * result.totalPercent) / 100;
  result.finalAmount = subtotal - result.amount;

  return result;
}

function renderCart() {
  if (cart.length === 0) {
    cartBox.innerHTML = `<p class="empty-text">Your cart is empty. Add some pizza! 🍕</p>`;
    return;
  }

  let html = "";

  // one row for every item in the cart
  cart.forEach(function (item) {
    html += `
      <div class="cart-item">
        <div class="info">
          <strong>${item.name}</strong>
          <span>${formatPrice(item.price)} each</span>
        </div>
        <div class="cart-controls">
          <span>Qty: ${item.qty}</span>
          <button class="small-btn plus-btn" data-id="${item.id}">+</button>
          <button class="small-btn remove remove-btn" data-id="${item.id}">x</button>
        </div>
      </div>
    `;
  });

  const subtotal = calculateSubtotal();
  const discounts = calculateDiscounts(subtotal);

  html += `<div class="summary">`;
  html += `<div class="row"><span>Total</span><span>${formatPrice(subtotal)}</span></div>`;

  if (discounts.offer1 > 0) {
    html += `<div class="row discount"><span>Offer 1 (${discounts.offer1}%)</span><span>${formatPrice(subtotal * discounts.offer1 / 100)} off</span></div>`;
  }
  if (discounts.offer2 > 0) {
    html += `<div class="row discount"><span>Offer 2 (${discounts.offer2}%)</span><span>${formatPrice(subtotal * discounts.offer2 / 100)} off</span></div>`;
  }
  if (discounts.totalPercent === 0) {
    html += `<div class="row"><span>Discount</span><span>None</span></div>`;
  }

  html += `<div class="row final"><span>Final Payable</span><span>${formatPrice(discounts.finalAmount)}</span></div>`;
  html += `</div>`;

  if (currentUser === null) {
    html += `<p class="hint">Login to unlock offers on your order.</p>`;
  }

  html += `<button class="btn btn-green" id="orderBtn">Place Order</button>`;

  cartBox.innerHTML = html;
}

// cart buttons get created by innerHTML so we listen on the parent box
cartBox.addEventListener("click", function (event) {
  const plus = event.target.closest(".plus-btn");
  const remove = event.target.closest(".remove-btn");
  const order = event.target.closest("#orderBtn");

  if (plus) {
    increaseQty(Number(plus.dataset.id));
  } else if (remove) {
    removeFromCart(Number(remove.dataset.id));
  } else if (order) {
    placeOrder();
  }
});

function placeOrder() {
  if (cart.length === 0) {
    showMessage(cartMessage, "Add a pizza first.", "error");
    return;
  }
  if (currentUser === null) {
    showMessage(cartMessage, "Please login before placing an order.", "error");
    return;
  }

  const subtotal = calculateSubtotal();
  const paid = calculateDiscounts(subtotal).finalAmount;

  // count this order for the user, this is what offer 2 depends on
  currentUser.orders++;
  cart = [];

  showMessage(cartMessage, "Order placed! You paid " + formatPrice(paid) + ". Total orders: " + currentUser.orders, "success");
  renderCart();
  renderOffers();
}

// ================== LOGIN ==================

function handleLogin(event) {
  event.preventDefault(); // stops the page from refreshing

  const name = usernameInput.value.trim();
  const pass = passwordInput.value.trim();

  if (name === "" || pass === "") {
    showMessage(loginMessage, "Please enter both user name and password.", "error");
    return;
  }

  // check if this user name is already stored in the array
  const existingUser = users.find(function (u) {
    return u.username === name;
  });

  if (existingUser) {
    if (existingUser.password !== pass) {
      showMessage(loginMessage, "Wrong password for this user name.", "error");
      return;
    }
    currentUser = existingUser;
  } else {
    // new user, store the login info in the array
    const newUser = { username: name, password: pass, orders: 0 };
    users.push(newUser);
    currentUser = newUser;
  }

  console.log("Stored login data:", users);

  showMessage(loginMessage, "Login successful!", "success");
  updateLoginPanel();
  renderCart();
  renderOffers();
}

function handleLogout() {
  currentUser = null;
  usernameInput.value = "";
  passwordInput.value = "";
  loginMessage.textContent = "";
  updateLoginPanel();
  renderCart();
  renderOffers();
}

// swaps between the login form and the "welcome" box
function updateLoginPanel() {
  if (currentUser) {
    loginForm.classList.add("hidden");
    loggedInBox.classList.remove("hidden");
    welcomeText.innerHTML = `Welcome, <strong>${currentUser.username}</strong>! <br>Orders placed so far: ${currentUser.orders}`;
  } else {
    loginForm.classList.remove("hidden");
    loggedInBox.classList.add("hidden");
  }
}

loginForm.addEventListener("submit", handleLogin);
logoutBtn.addEventListener("click", handleLogout);

// ================== OFFERS ==================

function renderOffers() {
  // not logged in, so the offers stay locked
  if (currentUser === null) {
    offersBox.innerHTML = `<p class="locked">🔒 Login to see the available offers.</p>`;
    return;
  }

  updateLoginPanel(); // keeps the orders count in the welcome text fresh

  const subtotal = calculateSubtotal();
  const offer1Active = subtotal > 3000;
  const offer2Active = currentUser.orders >= 3;

  let offer1Status = "Not active yet";
  if (offer1Active) {
    offer1Status = "Active on your cart";
  } else if (subtotal > 0) {
    offer1Status = "Add " + formatPrice(3001 - subtotal) + " more to unlock";
  }

  let offer2Status = "Orders placed: " + currentUser.orders + " of 3";
  if (offer2Active) {
    offer2Status = "Active, you have placed " + currentUser.orders + " orders";
  }

  offersBox.innerHTML = `
    <div class="offer-card ${offer1Active ? "active" : ""}">
      <h3>Offer 1: 10% Off</h3>
      <p>Get 10% off when your order total is greater than Rs 3,000.</p>
      <span class="badge">${offer1Status}</span>
    </div>
    <div class="offer-card ${offer2Active ? "active" : ""}">
      <h3>Offer 2: Extra 5% Off</h3>
      <p>Get an additional 5% off once you have placed 3 or more orders.</p>
      <span class="badge">${offer2Status}</span>
    </div>
  `;
}

// ================== START ==================
renderMenu();
renderCart();
renderOffers();

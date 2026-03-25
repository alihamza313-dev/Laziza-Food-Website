/* ============================================================
   LAZIZA FOOD - JavaScript (Cart + Search + UI)
   File: js/index.js
   
   Sections:
   1. State (Data Storage)
   2. DOM Selection (Finding HTML Elements)
   3. Initialization (Start Everything)
   4. Cart Logic
   5. Search Logic
   6. UI Helpers (Toast, Cart Panel)
   ============================================================ */


/* ============================================================
   1. STATE — Our "database" in memory
   WHY: We store the cart as an array. Every item in the array
   is an object with {id, name, price, img, quantity}.
   ============================================================ */
let cart = [];


/* ============================================================
   2. DOM SELECTION — Find HTML elements we need to control
   WHY: We grab references to elements ONCE at the top so
   we don't have to search the DOM repeatedly.
   ============================================================ */
const cartCountEl    = document.getElementById('cart-plus');    // Cart button in header
const tableBody      = document.getElementById('table-body');   // Cart table rows
const totalAmountEl  = document.getElementById('m-total-amount'); // Total price text
const searchBtn      = document.getElementById('search-btn');   // Search button
const searchBar      = document.getElementById('search-bar');   // Search bar div
const searchInput    = document.getElementById('search-input'); // Search text input
const closeSearchBtn = document.getElementById('close-search'); // X button in search
const cartPanel      = document.getElementById('cart-panel');   // Right cart panel
const toastEl        = document.getElementById('toast');        // Toast popup
const allCards       = document.querySelectorAll('.item-card'); // All food cards


/* ============================================================
   3. INITIALIZATION — Run when the page fully loads
   WHY: We wait for DOMContentLoaded so that all HTML elements
   exist before we try to attach events to them.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  // Attach click events to all heart icons
  const heartIcons = document.querySelectorAll('.add-to-cart');
  heartIcons.forEach(heart => {
    heart.addEventListener('click', (e) => {
      const card = e.target.closest('.item-card');
      const itemId = card.dataset.name;

      // CHECK: Is this item already in the cart?
      // WHY: We look at the heart icon's current class to decide ADD or REMOVE.
      // fa-heart-o = outline = NOT in cart → we should ADD
      // fa-heart   = filled  = already in cart → we should REMOVE
      const isAlreadyInCart = e.target.classList.contains('fa-heart');

      if (isAlreadyInCart) {
        // Heart is filled → user is un-clicking → REMOVE from cart
        toggleHeartStyle(e.target);
        removeItem(itemId);
      } else {
        // Heart is outline → user is clicking for first time → ADD to cart
        const itemData = {
          id:       itemId,
          name:     itemId,
          price:    parseFloat(card.dataset.price),
          img:      card.querySelector('img').src,
          quantity: 1
        };
        toggleHeartStyle(e.target);
        addToCart(itemData);
      }
    });
  });

  // Search button toggles the search bar
  searchBtn.addEventListener('click', () => {
    searchBar.classList.toggle('hidden');
    if (!searchBar.classList.contains('hidden')) {
      searchInput.focus(); // Auto-focus the input when shown
    }
  });

  // Close search bar
  closeSearchBtn.addEventListener('click', () => {
    searchBar.classList.add('hidden');
    searchInput.value = '';
    showAllCards(); // Clear any filtering
  });

  // Live search as user types
  searchInput.addEventListener('input', () => {
    filterCards(searchInput.value.trim().toLowerCase());
  });

});


/* ============================================================
   4. HEART ICON — Toggle between filled & outline
   WHY: We swap between fa-heart (filled) and fa-heart-o (outline)
   classes to give visual feedback when item is added/removed.
   ============================================================ */
function toggleHeartStyle(icon) {
  icon.classList.toggle('fa-heart');
  icon.classList.toggle('fa-heart-o');
  icon.classList.toggle('toggle-heart');
}


/* ============================================================
   5. CART LOGIC
   ============================================================ */

// ADD ITEM: If item exists, increase qty. If new, add it.
function addToCart(item) {
  const existing = cart.find(i => i.id === item.id);

  if (existing) {
    existing.quantity += 1;
    showToast(`${item.name} quantity updated!`);
  } else {
    cart.push(item);
    showToast(`${item.name} added to cart! 🎉`);
  }

  renderCart();
}

// CHANGE QUANTITY from the +/- buttons inside the cart table
window.changeQty = function(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.quantity += delta;

  // If quantity drops to 0 or below, fully remove the item
  if (item.quantity <= 0) {
    removeItem(id); // WHY: removeItem handles both cart removal AND heart reset
    return;         // Return early — removeItem already calls renderCart()
  }

  renderCart();
};

// REMOVE ITEM completely
// WHY: Named function so it's callable from heart click AND trash button in table.
function removeItem(id) {
  cart = cart.filter(i => i.id !== id);

  // Un-toggle the heart icon on the food card back to outline
  document.querySelectorAll('.item-card').forEach(card => {
    if (card.dataset.name === id) {
      const icon = card.querySelector('.fa-heart'); // Only select filled heart
      if (icon) toggleHeartStyle(icon);
    }
  });

  renderCart();
  showToast('Item removed from cart');
}
// Also expose to window so inline onclick in table can call it
window.removeItem = removeItem;


/* ============================================================
   6. RENDER CART — Updates the entire cart UI
   WHY: Every time cart changes, we call this to refresh
   the counter, table, and total. One function does everything.
   ============================================================ */
function renderCart() {
  // Update header counter
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCountEl) {
    cartCountEl.innerHTML = `<i class="fa fa-shopping-cart"></i> ${totalQty} Items`;
  }

  // Update cart table rows
  if (tableBody) {
    tableBody.innerHTML = '';

    if (cart.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; padding:20px; color:#9898b0;">
            <i class="fa fa-shopping-cart" style="font-size:24px; display:block; margin-bottom:8px;"></i>
            Your cart is empty
          </td>
        </tr>
      `;
    } else {
      cart.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>
            <img src="${item.img}" 
                 style="width:38px; height:38px; border-radius:50%; object-fit:cover;" 
                 alt="${item.name}">
          </td>
          <td style="font-size:12px; font-weight:500; max-width:60px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${item.name}
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:4px;">
              <button onclick="changeQty('${item.id}', -1)" title="Decrease">−</button>
              <span style="font-size:12px; font-weight:700; min-width:16px; text-align:center;">${item.quantity}</span>
              <button onclick="changeQty('${item.id}', 1)" title="Increase">+</button>
            </div>
          </td>
          <td style="font-weight:700; color:#e8183a; font-size:12px; white-space:nowrap;">
            $${(item.price * item.quantity).toFixed(2)}
          </td>
          <td>
            <button onclick="removeItem('${item.id}')" title="Remove" 
                    style="background:#fff0f3; color:#e8183a; border:1px solid #ffd0d8; width:24px; height:24px; border-radius:6px; font-size:13px;">
              ✕
            </button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }
  }

  // Update total amount
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if (totalAmountEl) {
    totalAmountEl.innerText = `Total: $${total.toFixed(2)}`;
  }
}


/* ============================================================
   7. CART PANEL TOGGLE — Show/Hide the cart panel
   WHY: Clicking the cart button shows the order summary.
   ============================================================ */
function toggleCartPanel() {
  if (!cartPanel) return;
  cartPanel.classList.toggle('hidden');

  // Auto-scroll to show the cart panel
  if (!cartPanel.classList.contains('hidden')) {
    cartPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Make toggleCartPanel available globally (used in HTML onclick)
window.toggleCartPanel = toggleCartPanel;


/* ============================================================
   8. SEARCH / FILTER
   WHY: As user types, we show only matching cards and hide the rest.
   ============================================================ */
function filterCards(query) {
  if (!query) {
    showAllCards();
    return;
  }

  allCards.forEach(card => {
    const name = card.dataset.name.toLowerCase();
    if (name.includes(query)) {
      card.style.display = '';    // Show matching card
    } else {
      card.style.display = 'none'; // Hide non-matching
    }
  });

  // Show/hide section headers if all cards in a section are hidden
  const sections = document.querySelectorAll('#burger, #pizza, #wrap, #beverage');
  sections.forEach(section => {
    const visibleCards = section.querySelectorAll('.item-card:not([style*="none"])');
    section.style.display = visibleCards.length === 0 ? 'none' : '';
  });
}

function showAllCards() {
  allCards.forEach(card => card.style.display = '');
  document.querySelectorAll('#burger, #pizza, #wrap, #beverage').forEach(s => s.style.display = '');
}


/* ============================================================
   9. TOAST NOTIFICATION — Brief popup message
   WHY: A toast gives instant feedback without interrupting
   the user. It shows for 2 seconds then fades away.
   ============================================================ */
let toastTimeout;

function showToast(message) {
  if (!toastEl) return;

  toastEl.classList.remove('hidden');
  toastEl.innerText = message;

  // Show the toast
  setTimeout(() => toastEl.classList.add('show'), 10);

  // Clear any previous timer so multiple clicks don't stack
  clearTimeout(toastTimeout);

  // Hide after 2.5 seconds
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2500);
}


/* for geolocation */

const addressBtn = document.querySelector('.address-btn');
const addressModal = document.getElementById('address-modal');
const addressText = addressBtn.querySelector('span') || addressBtn; // Target the text inside

// Toggle Modal
function toggleAddressModal() {
    addressModal.classList.toggle('hidden');
}

// 1. Get Location using Browser GPS
document.getElementById('get-location-btn').addEventListener('click', () => {
    if (navigator.geolocation) {
        addressBtn.innerText = "Locating...";
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
});

function showPosition(position) {
    // In a real app, you'd send lat/long to Google Maps API to get a street name.
    // For now, we simulate a successful find:
    const lat = position.coords.latitude.toFixed(2);
    const lon = position.coords.longitude.toFixed(2);
    
    updateAddressDisplay(`Sector 7, Lahore (Lat: ${lat})`);
    toggleAddressModal();
}

function showError(error) {
    alert("Unable to retrieve location. Please type it manually.");
    addressBtn.innerText = "Select Address";
}

// 2. Save Manual Address
function saveAddress() {
    const input = document.getElementById('manual-address').value;
    if (input.trim() !== "") {
        updateAddressDisplay(input);
        toggleAddressModal();
    } else {
        alert("Please enter an address.");
    }
}

function updateAddressDisplay(newAddress) {
    // Limit text length so it doesn't break the navbar
    const shortAddress = newAddress.length > 20 ? newAddress.substring(0, 18) + "..." : newAddress;
    addressBtn.innerHTML = `<i class="fa fa-map-marker"></i> ${shortAddress}`;
    
    // Professional touch: Save it so it stays even if they refresh!
    localStorage.setItem('userAddress', newAddress);
}

// Load saved address on startup
document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('userAddress');
    if (saved) updateAddressDisplay(saved);
});

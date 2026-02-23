const apiBaseUrl = window.API_BASE_URL || (window.location.port === "5000" ? "" : "http://localhost:5000");
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatCurrency(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "$0.00";
}

function resolveImageUrl(imagePath) {
  if (!imagePath) {
    return "https://via.placeholder.com/96?text=No+Image";
  }

  const normalizedValue = String(imagePath).trim().replace(/\\/g, "/");

  if (/^https?:\/\//i.test(normalizedValue) || normalizedValue.startsWith("data:")) {
    return normalizedValue;
  }

  const cleanedPath = normalizedValue.replace(/^\.?\//, "");
  const normalizedPath = `/${cleanedPath}`;
  const baseUrl = String(apiBaseUrl || "").replace(/\/$/, "");
  return `${baseUrl}${normalizedPath}`;
}

async function loadCart(options = {}) {
  const { showLoading = true } = options;
  const orderSummary = document.getElementById("orderSummary");
  const totalItemsEl = document.getElementById("totalItems");
  const totalPriceEl = document.getElementById("totalPrice");
  const messageEl = document.getElementById("msg");

  if (!orderSummary || !totalItemsEl || !totalPriceEl) {
    return;
  }

  orderSummary.style.transition = "opacity 220ms ease";
  if (showLoading) {
    orderSummary.innerHTML = '<p class="text-gray-500">Loading your cart...</p>';
  } else {
    orderSummary.style.opacity = "0.65";
  }
  if (messageEl) {
    messageEl.textContent = "";
  }

  try {
    const res = await fetch(`${apiBaseUrl}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error(`Failed to load cart (${res.status})`);
    }

    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];

    if (!items.length) {
      orderSummary.innerHTML = '<p class="text-gray-600">Your cart is empty.</p>';
      totalItemsEl.textContent = "0";
      totalPriceEl.textContent = formatCurrency(0);
      orderSummary.style.opacity = "1";
      return;
    }

    let total = 0;
    let totalItems = 0;

    const html = items.map((item) => {
      const itemId = item._id;
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.product?.price ?? item.price ?? 0) || 0;
      const lineTotal = price * quantity;
      const productId = item.product?._id;
      const canRemove = Boolean(productId);
      const canAdjustQty = Boolean(itemId);
      total += lineTotal;
      totalItems += quantity;
      const imageUrl = resolveImageUrl(item.product?.image);
      const name = item.product?.name || "Product";

      return `
        <article class="rounded-lg border border-gray-200 p-4">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="font-medium text-gray-900">${name}</p>
              <div class="mt-2 inline-flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  class="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-300 disabled:bg-gray-50"
                  onclick="${canAdjustQty ? `updateCheckoutItemQuantity('${itemId}', -1)` : "return false;"}"
                  ${canAdjustQty ? "" : "disabled"}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span class="px-3 py-1 text-sm font-semibold text-gray-800 border-x border-gray-200 min-w-10 text-center">${quantity}</span>
                <button
                  class="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-300 disabled:bg-gray-50"
                  onclick="${canAdjustQty ? `updateCheckoutItemQuantity('${itemId}', 1)` : "return false;"}"
                  ${canAdjustQty ? "" : "disabled"}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <p class="text-sm text-gray-700">Line total: ${formatCurrency(lineTotal)}</p>
              <button
                class="mt-2 text-xs text-red-600 hover:text-red-700 hover:underline disabled:text-gray-400 disabled:no-underline"
                onclick="${canRemove ? `removeFromCheckout('${productId}', this)` : "return false;"}"
                ${canRemove ? "" : "disabled"}
              >
                Remove
              </button>
            </div>
            <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
              <img src="${imageUrl}" alt="${name}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='https://via.placeholder.com/96?text=No+Image';">
            </div>
          </div>
        </article>
      `;
    }).join("");

    orderSummary.innerHTML = html;
    totalItemsEl.textContent = String(totalItems);
    totalPriceEl.textContent = formatCurrency(total);
    orderSummary.style.opacity = "1";
  } catch (error) {
    console.error("Checkout cart load failed:", error);
    orderSummary.innerHTML = '<p class="text-red-600">Could not load cart. Please refresh and try again.</p>';
    totalItemsEl.textContent = "0";
    totalPriceEl.textContent = formatCurrency(0);
    orderSummary.style.opacity = "1";
  }
}

async function updateCheckoutItemQuantity(itemId, change) {
  const messageEl = document.getElementById("msg");

  if (!itemId || !Number.isFinite(Number(change))) {
    if (messageEl) {
      messageEl.classList.remove("text-green-600");
      messageEl.classList.add("text-red-600");
      messageEl.textContent = "Unable to update quantity.";
    }
    return;
  }

  try {
    const res = await fetch(`${apiBaseUrl}/api/cart/update-item`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ itemId, change })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Failed to update quantity");
    }

    await loadCart({ showLoading: false });

    if (messageEl) {
      messageEl.classList.remove("text-red-600");
      messageEl.classList.add("text-green-600");
      messageEl.textContent = "Quantity updated.";
    }
  } catch (error) {
    console.error("Quantity update failed:", error);
    if (messageEl) {
      messageEl.classList.remove("text-green-600");
      messageEl.classList.add("text-red-600");
      messageEl.textContent = error.message || "Could not update quantity.";
    }
  }
}

async function removeFromCheckout(productId, triggerBtn) {
  const messageEl = document.getElementById("msg");

  if (!productId) {
    if (messageEl) {
      messageEl.classList.remove("text-green-600");
      messageEl.classList.add("text-red-600");
      messageEl.textContent = "Unable to remove this item.";
    }
    return;
  }

  const originalLabel = triggerBtn ? triggerBtn.textContent : "";
  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.textContent = "Removing...";
    triggerBtn.classList.add("opacity-60", "cursor-not-allowed");
  }

  try {
    await wait(1000);

    const res = await fetch(`${apiBaseUrl}/api/cart/remove/${productId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Failed to remove item");
    }

    await loadCart({ showLoading: false });

    if (messageEl) {
      messageEl.classList.remove("text-red-600");
      messageEl.classList.add("text-green-600");
      messageEl.textContent = "Item removed from checkout.";
    }
  } catch (error) {
    console.error("Remove item failed:", error);
    if (messageEl) {
      messageEl.classList.remove("text-green-600");
      messageEl.classList.add("text-red-600");
      messageEl.textContent = error.message || "Could not remove item.";
    }
  } finally {
    if (triggerBtn && document.body.contains(triggerBtn)) {
      triggerBtn.disabled = false;
      triggerBtn.textContent = originalLabel || "Remove";
      triggerBtn.classList.remove("opacity-60", "cursor-not-allowed");
    }
  }
}

async function placeOrder() {
  const placeBtn = document.querySelector('button[onclick="placeOrder()"]');
  const messageEl = document.getElementById("msg");

  if (!messageEl) {
    return;
  }

  if (placeBtn) {
    placeBtn.disabled = true;
    placeBtn.classList.add("opacity-60", "cursor-not-allowed");
  }

  messageEl.classList.remove("text-red-600");
  messageEl.classList.add("text-green-600");
  messageEl.textContent = "Placing your order...";

  try {
    const res = await fetch(`${apiBaseUrl}/api/orders/place`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to place order");
    }

    messageEl.textContent = "Order placed successfully.";

    setTimeout(() => {
      window.location.href = "orders.html";
    }, 1200);
  } catch (error) {
    console.error("Place order failed:", error);
    messageEl.classList.remove("text-green-600");
    messageEl.classList.add("text-red-600");
    messageEl.textContent = error.message || "Could not place order. Please try again.";
  } finally {
    if (placeBtn) {
      placeBtn.disabled = false;
      placeBtn.classList.remove("opacity-60", "cursor-not-allowed");
    }
  }
}

loadCart();

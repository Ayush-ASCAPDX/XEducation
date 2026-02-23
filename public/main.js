const API_BASE_URL = window.API_BASE_URL || "http://localhost:5000";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function removeFromCartBackend(productId, triggerBtn) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
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

    const res = await fetch(`${API_BASE_URL}/api/cart/remove/${productId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      console.error("Failed to remove item", res.status);
      throw new Error("Failed to remove item");
    }

    await loadCart();
    updateCartUI();
    showToast("Removed from cart");
  } catch (error) {
    console.error(error);
  } finally {
    if (triggerBtn && document.body.contains(triggerBtn)) {
      triggerBtn.disabled = false;
      triggerBtn.textContent = originalLabel || "Remove";
      triggerBtn.classList.remove("opacity-60", "cursor-not-allowed");
    }
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.innerText = message;
  toast.classList.remove("opacity-0", "translate-y-5");
  toast.classList.add("opacity-100", "translate-y-0");

  setTimeout(() => {
    toast.classList.remove("opacity-100", "translate-y-0");
    toast.classList.add("opacity-0", "translate-y-5");
  }, 2000);
}

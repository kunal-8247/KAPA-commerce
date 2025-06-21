(() => {
  const container = document.getElementById("productList");
  const loader = document.getElementById("productLoader");
  const cartCount = document.getElementById("cartCount");
  const popupForm = document.getElementById("popupForm");
  const cancelBtn = document.getElementById("cancelBtn");
  const interestForm = document.getElementById("interestForm");
  const cartPopup = document.getElementById("cartPopup");
  const cartItemsList = document.getElementById("cartItemsList");
  const closeCartPopup = document.getElementById("closeCartPopup");
  const cartBuyNowBtn = document.getElementById("cartBuyNowBtn");
  const cartTotalRow = document.getElementById("cartTotalRow");

  let cart = [];
  let cartForBuyNow = null;
  const productDetailModal = document.getElementById("productDetailModal");
  const detailBackBtn = document.getElementById("detailBackBtn");
  const detailSliderWrapper = document.getElementById("detailSliderWrapper");
  const detailProductName = document.getElementById("detailProductName");
  const detailDescription = document.getElementById("detailDescription");
  const detailQtyDisplay = document.getElementById("detailQtyDisplay");
  const detailAddToCartBtn = document.getElementById("detailAddToCartBtn");
  const detailBuyNowBtn = document.getElementById("detailBuyNowBtn");
  const detailMinusQty = document.getElementById("detailMinusQty");
  const detailPlusQty = document.getElementById("detailPlusQty");

  let currentDetailProduct = null;
  let detailQty = 1;
  const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbwiop-0vUy39Qjh18PRLqoKW09_aNZq1rW0MgtJl4rn1RoxTAgFyaz2SoycfEpbzyldpA/exec";

  function parseToArray(val) {
    if (!val) return [];
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return val.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
    return Array.isArray(val) ? val : [val];
  }

  detailBackBtn.innerHTML = "← Back";
  detailBackBtn.setAttribute("aria-label", "Back to products");

  popupForm.style.display = "none";

  function findCartIndex(id) {
    return cart.findIndex(item => item.id === id);
  }

  function updateCartCount() {
    const total = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.innerText = `🛒 (${total})`;
  }

  function renderCartPopup() {
    if (cart.length === 0) {
      cartItemsList.innerHTML = "<p style='text-align:center; color:#888; margin:14px 0;'>Your cart is empty.</p>";
      cartBuyNowBtn.style.display = "none";
      cartTotalRow.innerHTML = "";
    } else {
      cartItemsList.innerHTML = cart.map((item, idx) => `
        <div style="border-bottom:1px solid #eee; padding:8px 0; display:flex; justify-content:space-between; align-items:center; gap:5px;">
          <span style="max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</span>
          <div style="display:flex;align-items:center;gap:2px;">
            <button class="cartMinusBtn" data-idx="${idx}" aria-label="Decrease quantity" style="font-size:1rem;padding:2px 7px;">-</button>
            <span style="margin:0 7px; min-width:18px; display:inline-block; text-align:center;">${item.qty}</span>
            <button class="cartPlusBtn" data-idx="${idx}" aria-label="Increase quantity" style="font-size:1rem;padding:2px 7px;">+</button>
          </div>
          <span style="color:#5e548e; font-weight:500; margin-left:7px;">${item.price}</span>
          <button class="cartRemoveBtn" data-idx="${idx}" aria-label="Remove from cart" style="background:none;border:none;color:#e55b51;font-size:1.2rem;cursor:pointer;">&#10005;</button>
        </div>
      `).join("");
      let total = cart.reduce((sum, item) => {
        let priceNum = 0;
        if (typeof item.price === "number") priceNum = item.price;
        else {
          let match = (""+item.price).replace(/,/g,"").match(/(\d+(\.\d+)?)/);
          priceNum = match ? parseFloat(match[1]) : 0;
        }
        return sum + (priceNum * item.qty);
      }, 0);
      cartTotalRow.innerHTML = `<div class="cart-total-row"><span>Total:</span><span>₹${total.toFixed(2)}</span></div>`;
      cartBuyNowBtn.style.display = "block";

      setTimeout(() => {
        cartItemsList.querySelectorAll('.cartRemoveBtn').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = Number(btn.getAttribute('data-idx'));
            cart.splice(idx, 1);
            updateCartCount();
            renderCartPopup();
          });
        });
        cartItemsList.querySelectorAll('.cartPlusBtn').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = Number(btn.getAttribute('data-idx'));
            cart[idx].qty += 1;
            updateCartCount();
            renderCartPopup();
          });
        });
        cartItemsList.querySelectorAll('.cartMinusBtn').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = Number(btn.getAttribute('data-idx'));
            if (cart[idx].qty > 1) {
              cart[idx].qty -= 1;
            } else {
              cart.splice(idx, 1);
            }
            updateCartCount();
            renderCartPopup();
          });
        });
      }, 0);
    }
    cartPopup.style.display = "block";
  }

  cartCount.addEventListener("click", () => renderCartPopup());
  cartCount.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") renderCartPopup();
  });

  closeCartPopup.addEventListener("click", () => {
    cartPopup.style.display = "none";
  });

  window.addEventListener("mousedown", (e) => {
    if (cartPopup.style.display === "block" && !cartPopup.contains(e.target) && e.target !== cartCount) {
      cartPopup.style.display = "none";
    }
  });

  cartBuyNowBtn.onclick = () => {
    if (cart.length === 0) return;
    cartPopup.style.display = "none";
    popupForm.style.display = "flex";
    setTimeout(() => interestForm.querySelector("input").focus(), 180);
  };

  // FETCH PRODUCTS
  fetch(GOOGLE_SHEET_API_URL)
    .then(res => res.json())
    .then(products => {
      loader && loader.remove();
      if (!products.length) {
        container.innerHTML = "<p style='color:#e55b51'>No products available at the moment.</p>";
        return;
      }
      products.forEach((p, i) => {
        const images = parseToArray(p.images || p.image);
        const descriptions = parseToArray(p.descriptions || p.description);

        const card = document.createElement("div");
        card.className = "product-card";
        card.tabIndex = 0;

        card.addEventListener("click", (e) => {
          if (e.target.closest("button")) return;
          currentDetailProduct = p;
          detailQty = 1;
          detailQtyDisplay.textContent = "1";
          detailProductName.textContent = p.name;

          const descriptions = parseToArray(p.descriptions || p.description);
          detailDescription.innerHTML = descriptions.map(d => `<p>${d}</p>`).join("");

          const images = parseToArray(p.images || p.image);
          detailSliderWrapper.innerHTML = images.map((img, i) => `
            <div style="margin-bottom:10px;">
              <img src="${img}" alt="${p.name} Image ${i+1}" style="width:100%; border-radius:8px;" />
              ${descriptions[i] ? `<p style="font-size:0.9rem; text-align:center; color:#666;">${descriptions[i]}</p>` : ""}
            </div>
          `).join("");

          productDetailModal.style.display = "block";
        });

        // ... (omitted: slider init, quantity control, addToCartBtn event)
        // to save space, let me know if you want the rest pasted too!

        container.appendChild(card);
      });
    })
    .catch(err => {
      loader && loader.remove();
      container.innerHTML = "<p style='color:#e55b51'>Failed to load products. Please try again later.</p>";
      console.error("Error fetching products:", err);
    });

  // Detail modal logic
  detailBackBtn.onclick = () => {
    productDetailModal.style.display = "none";
  };
  detailMinusQty.onclick = () => {
    if (detailQty > 1) detailQty--;
    detailQtyDisplay.textContent = detailQty;
  };
  detailPlusQty.onclick = () => {
    detailQty++;
    detailQtyDisplay.textContent = detailQty;
  };
  detailAddToCartBtn.onclick = () => {
    if (!currentDetailProduct) return;
    const idx = findCartIndex(currentDetailProduct.id);
    const images = parseToArray(currentDetailProduct.images || currentDetailProduct.image);
    if (idx !== -1) {
      cart[idx].qty += detailQty;
    } else {
      cart.push({
        id: currentDetailProduct.id,
        name: currentDetailProduct.name,
        price: currentDetailProduct.price,
        image: images[0],
        qty: detailQty
      });
    }
    updateCartCount();
    alert("Item added to cart!");
    productDetailModal.style.display = "none";
  };
  detailBuyNowBtn.onclick = () => {
    if (!currentDetailProduct) return;
    cart = [{
      id: currentDetailProduct.id,
      name: currentDetailProduct.name,
      price: currentDetailProduct.price,
      image: parseToArray(currentDetailProduct.images || currentDetailProduct.image)[0],
      qty: detailQty
    }];
    updateCartCount();
    productDetailModal.style.display = "none";
    popupForm.style.display = "flex";
    setTimeout(() => interestForm.querySelector("input").focus(), 180);
  };

  // FORM
  cancelBtn.onclick = () => {
    popupForm.style.display = "none";
  };
  interestForm.onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById("custName").value.trim();
    const address = document.getElementById("custAddress").value.trim();
    const email = document.getElementById("custEmail").value.trim();
    const phone = document.getElementById("custPhone").value.trim();
    const pin = document.getElementById("custPin").value.trim();

    if (!/^\d{6}$/.test(pin)) {
      alert("Please enter a valid 6-digit PIN code.");
      return;
    }
    if (!address) {
      alert("Please enter your address.");
      return;
    }

    let total = cart.reduce((sum, item) => {
      let priceNum = 0;
      if (typeof item.price === "number") priceNum = item.price;
      else {
        let match = (""+item.price).replace(/,/g,"").match(/(\d+(\.\d+)?)/);
        priceNum = match ? parseFloat(match[1]) : 0;
      }
      return sum + (priceNum * item.qty);
    }, 0);

    const productLines = cart.map((p, i) => {
      let priceText = typeof p.price === "number" ? `₹${p.price}` : p.price;
      return `Product ${i+1}:\n🆔 ID: ${p.id}\n📦 Name: ${p.name}\n💰 Price: ${priceText}\nQty: ${p.qty}`;
    }).join('%0A%0A');

    const url = `https://wa.me/918977659800?text=Hello! I'm interested in these items:%0A%0A${productLines}%0A%0A🧾 Total: ₹${total.toFixed(2)}`;

    await fetch("https://script.google.com/macros/s/AKfycbyR6Xrd93DwH3xgE4g4nq3WERPBWgdHh3vwgQItEY_jPvn-MoVStNI8EGxJfeoRFGzi5w/exec", {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        address,
        email,
        phone,
        pin,
        productNames: cart.map(p => p.name).join(', '),
        productIds: cart.map(p => p.id).join(', '),
        productQtys: cart.map(p => p.qty).join(', '),
        productPrices: cart.map(p => typeof p.price === "number" ? p.price : ((""+p.price).replace(/,/g,"").match(/(\d+(\.\d+)?)/)?.[1] || "")).join(', '),
        total: total.toFixed(2),
        cart: JSON.stringify(cart)
      })
    });

    window.location.href = url;
    popupForm.style.display = "none";
    interestForm.reset();
    cart = [];
    updateCartCount();
  };

  window.addEventListener("keydown", (e) => {
    if (popupForm.style.display === "flex" && e.key === "Escape") {
      popupForm.style.display = "none";
    }
    if (cartPopup.style.display === "block" && e.key === "Escape") {
      cartPopup.style.display = "none";
    }
  });
})();

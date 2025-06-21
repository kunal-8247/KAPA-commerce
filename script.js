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
      try { return JSON.parse(val); }
      catch { return val.split(",").map(s => s.trim()).filter(Boolean); }
    }
    return Array.isArray(val) ? val : [val];
  }

  if (detailBackBtn) {
    detailBackBtn.innerHTML = "← Back";
    detailBackBtn.setAttribute("aria-label", "Back to products");
    detailBackBtn.onclick = () => {
      if (productDetailModal) productDetailModal.style.display = "none";
    };
  }

  if (popupForm) popupForm.style.display = "none";

  function findCartIndex(id) {
    return cart.findIndex(item => item.id === id);
  }

  function updateCartCount() {
    if (!cartCount) return;
    const total = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.innerText = `🛒 (${total})`;
  }

  function renderCartPopup() {
    if (!cartPopup || !cartItemsList || !cartTotalRow || !cartBuyNowBtn) return;
    if (cart.length === 0) {
      cartItemsList.innerHTML = "<p style='text-align:center; color:#888; margin:14px 0;'>Your cart is empty.</p>";
      cartBuyNowBtn.style.display = "none";
      cartTotalRow.innerHTML = "";
    } else {
      cartItemsList.innerHTML = cart.map((item, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding:8px 0;">
          <span style="max-width:120px; overflow:hidden; white-space:nowrap;">${item.name}</span>
          <div style="display:flex; align-items:center; gap:5px;">
            <button class="cartMinusBtn" data-idx="${idx}">-</button>
            <span>${item.qty}</span>
            <button class="cartPlusBtn" data-idx="${idx}">+</button>
          </div>
          <span>${item.price}</span>
          <button class="cartRemoveBtn" data-idx="${idx}">&#10005;</button>
        </div>
      `).join("");
      let total = cart.reduce((sum, item) => {
        let priceNum = typeof item.price === "number" ? item.price : 
          parseFloat((item.price+"").replace(/,/g, "").match(/(\d+(\.\d+)?)/)?.[1] || 0);
        return sum + (priceNum * item.qty);
      }, 0);
      cartTotalRow.innerHTML = `<div style="display:flex; justify-content:space-between; margin-top:8px;"><strong>Total:</strong><strong>₹${total.toFixed(2)}</strong></div>`;
      cartBuyNowBtn.style.display = "block";

      setTimeout(() => {
        cartItemsList.querySelectorAll('.cartRemoveBtn').forEach(btn => {
          btn.onclick = () => {
            const idx = +btn.dataset.idx;
            cart.splice(idx, 1);
            updateCartCount();
            renderCartPopup();
          };
        });
        cartItemsList.querySelectorAll('.cartPlusBtn').forEach(btn => {
          btn.onclick = () => {
            const idx = +btn.dataset.idx;
            cart[idx].qty++;
            updateCartCount();
            renderCartPopup();
          };
        });
        cartItemsList.querySelectorAll('.cartMinusBtn').forEach(btn => {
          btn.onclick = () => {
            const idx = +btn.dataset.idx;
            if (cart[idx].qty > 1) cart[idx].qty--;
            else cart.splice(idx, 1);
            updateCartCount();
            renderCartPopup();
          };
        });
      }, 0);
    }
    cartPopup.style.display = "block";
  }

  if (cartCount) {
    cartCount.onclick = renderCartPopup;
    cartCount.onkeydown = e => { if (e.key === "Enter" || e.key === " ") renderCartPopup(); };
  }

  if (closeCartPopup) closeCartPopup.onclick = () => cartPopup.style.display = "none";
  window.addEventListener("mousedown", e => {
    if (cartPopup?.style.display === "block" && !cartPopup.contains(e.target) && e.target !== cartCount) {
      cartPopup.style.display = "none";
    }
  });
  if (cartBuyNowBtn) cartBuyNowBtn.onclick = () => {
    if (cart.length === 0) return;
    cartPopup.style.display = "none";
    popupForm.style.display = "flex";
    setTimeout(() => interestForm?.querySelector("input")?.focus(), 180);
  };

  const loaderRemoved = () => loader && loader.remove();
  fetch(GOOGLE_SHEET_API_URL)
    .then(res => res.json())
    .then(products => {
      loaderRemoved();
      if (!products.length) {
        container.innerHTML = "<p style='color:#e55b51'>No products available at the moment.</p>";
        return;
      }
      products.forEach(p => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.tabIndex = 0;
        card.onclick = e => {
          if (e.target.closest("button")) return;
          currentDetailProduct = p;
          detailQty = 1;
          if (detailQtyDisplay) detailQtyDisplay.textContent = "1";
          if (detailProductName) detailProductName.textContent = p.name;
          if (detailDescription) {
            const arrDesc = parseToArray(p.descriptions || p.description);
            detailDescription.innerHTML = arrDesc.map(d => `<p>${d}</p>`).join("");
          }
          if (detailSliderWrapper) {
            const imgs = parseToArray(p.images || p.image);
            const arrDesc = parseToArray(p.descriptions || p.description);
            detailSliderWrapper.innerHTML = imgs.map((img, i) => `
              <div style="margin-bottom:10px;">
                <img src="${img}" alt="${p.name}" style="width:100%; border-radius:8px;" />
                ${arrDesc[i] ? `<p>${arrDesc[i]}</p>` : ""}
              </div>
            `).join("");
          }
          if (productDetailModal) productDetailModal.style.display = "block";
        };
        container?.appendChild(card);
      });
    })
    .catch(err => {
      loaderRemoved();
      container.innerHTML = "<p style='color:#e55b51'>Failed to load products. Please try again later.</p>";
      console.error("Error fetching products:", err);
    });

  if (detailMinusQty) detailMinusQty.onclick = () => {
    if (detailQty > 1) detailQty--;
    detailQtyDisplay && (detailQtyDisplay.textContent = detailQty);
  };
  if (detailPlusQty) detailPlusQty.onclick = () => {
    detailQty++;
    detailQtyDisplay && (detailQtyDisplay.textContent = detailQty);
  };
  if (detailAddToCartBtn) detailAddToCartBtn.onclick = () => {
    if (!currentDetailProduct) return;
    const idx = findCartIndex(currentDetailProduct.id);
    const images = parseToArray(currentDetailProduct.images || currentDetailProduct.image);
    if (idx !== -1) cart[idx].qty += detailQty;
    else cart.push({ id: currentDetailProduct.id, name: currentDetailProduct.name, price: currentDetailProduct.price, image: images[0], qty: detailQty });
    updateCartCount();
    alert("Item added to cart!");
    productDetailModal && (productDetailModal.style.display = "none");
  };
  if (detailBuyNowBtn) detailBuyNowBtn.onclick = () => {
    if (!currentDetailProduct) return;
    const images = parseToArray(currentDetailProduct.images || currentDetailProduct.image);
    cart = [{ id: currentDetailProduct.id, name: currentDetailProduct.name, price: currentDetailProduct.price, image: images[0], qty: detailQty }];
    updateCartCount();
    productDetailModal && (productDetailModal.style.display = "none");
    popupForm.style.display = "flex";
    setTimeout(() => interestForm?.querySelector("input")?.focus(), 180);
  };

  if (cancelBtn) cancelBtn.onclick = () => popupForm.style.display = "none";
  if (interestForm) interestForm.onsubmit = async e => {
    e.preventDefault();
    const name = document.getElementById("custName")?.value.trim() || "";
    const address = document.getElementById("custAddress")?.value.trim() || "";
    const email = document.getElementById("custEmail")?.value.trim() || "";
    const phone = document.getElementById("custPhone")?.value.trim() || "";
    const pin = document.getElementById("custPin")?.value.trim() || "";

    if (!/^\d{6}$/.test(pin)) return alert("Please enter a valid 6-digit PIN code.");
    if (!address) return alert("Please enter your address.");

    const total = cart.reduce((sum, p) => {
      const priceNum = typeof p.price === "number" ? p.price : parseFloat((p.price + "").replace(/,/g, "").match(/(\d+(\.\d+)?)/)?.[1] || 0);
      return sum + priceNum * p.qty;
    }, 0);

    const productLines = cart.map((p, i) => {
      const priceText = typeof p.price === "number" ? `₹${p.price}` : p.price;
      return `Product ${i+1}:\n🆔 ID: ${p.id}\n📦 Name: ${p.name}\n💰 Price: ${priceText}\nQty: ${p.qty}`;
    }).join("%0A%0A");

    const url = `https://wa.me/918977659800?text=Hello! I'm interested in these items:%0A%0A${productLines}%0A%0A🧾 Total: ₹${total.toFixed(2)}`;

    await fetch("https://script.google.com/macros/s/AKfycbyR6Xrd93DwH3xgE4g4nq3WERPBWgdHh3vwgQItEY_jPvn-MoVStNI8EGxJfeoRFGzi5w/exec", {
      method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, address, email, phone, pin,
        productNames: cart.map(p => p.name).join(", "),
        productIds: cart.map(p => p.id).join(", "),
        productQtys: cart.map(p => p.qty).join(", "),
        productPrices: cart.map(p => {
          const num = typeof p.price === "number" ? p.price : parseFloat((p.price+"").replace(/,/g, "").match(/(\d+(\.\d+)?)/)?.[1]||0);
          return num;
        }).join(", "),
        total: total.toFixed(2),
        cart: JSON.stringify(cart),
      })
    });
    window.location.href = url;
    popupForm.style.display = "none";
    interestForm.reset();
    cart = [];
    updateCartCount();
  };

  window.addEventListener("keydown", e => {
    if ((popupForm?.style.display === "flex" || cartPopup?.style.display === "block") && e.key === "Escape") {
      if (popupForm) popupForm.style.display = "none";
      if (cartPopup) cartPopup.style.display = "none";
    }
  });

})();

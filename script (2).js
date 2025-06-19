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
const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbwiop-0vUy39Qjh18PRLqoKW09_aNZq1rW0MgtJl4rn1RoxTAgFyaz2SoycfEpbzyldpA/exec";  function parseToArray(val) {
    if (!val) return [];
    if (typeof val === "string") {
      try { return JSON.parse(val); }
      catch { return val.split(",").map(s => s.trim()).filter(Boolean); }
    }
    return Array.isArray(val) ? val : [val];
  }

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
          btn.addEventListener('click', (e) => {
            const idx = Number(btn.getAttribute('data-idx'));
            cart.splice(idx, 1);
            updateCartCount();
            renderCartPopup();
          });
        });
        cartItemsList.querySelectorAll('.cartPlusBtn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const idx = Number(btn.getAttribute('data-idx'));
            cart[idx].qty += 1;
            updateCartCount();
            renderCartPopup();
          });
        });
        cartItemsList.querySelectorAll('.cartMinusBtn').forEach(btn => {
          btn.addEventListener('click', (e) => {
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

  cartCount.addEventListener("click", (e) => {
    renderCartPopup();
  });
  cartCount.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " " || e.keyCode === 13) {
      renderCartPopup();
    }
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
        const hasMultiple = images.length > 1;
        let sliderImagesHtml = '';
        for (let j = 0; j < images.length; j++) {
          sliderImagesHtml += `
            <div class="slider-image-single">
              <img src="${images[j]}" alt="${p.name} ${descriptions[j] ? '- '+descriptions[j] : ''}" />
              <div class="slider-description">${descriptions[j] || ''}</div>
            </div>
          `;
        }
        const sliderId = `slider-${i}-${Date.now()}`;
        card.innerHTML = `
          <div class="product-image-slider" id="${sliderId}">
            ${hasMultiple ? `<button class="slider-nav-btn slider-prev" style="display:none" aria-label="Previous image">&#8592;</button>` : ''}
            <div class="slider-images-wrapper">
              ${sliderImagesHtml}
            </div>
            ${hasMultiple ? `<button class="slider-nav-btn slider-next" aria-label="Next image">&#8594;</button>` : ''}
            <div class="slider-dots"${hasMultiple ? '' : ' style="display:none;"'}>
              ${images.map((_,idx)=>
                `<button class="slider-dot${idx===0?' active':''}" data-idx="${idx}" aria-label="Go to image ${idx+1}"></button>`).join('')}
            </div>
          </div>
          <h3>${p.name}</h3>
          <p>Price: <b>${p.price}</b></p>
          <div style="margin-bottom: 12px;">
            <button type="button" class="minusQty" aria-label="Decrease quantity" style="font-size:1.2rem;padding:2px 10px;">-</button>
            <span class="qtyDisplay" style="margin: 0 10px; font-size:1.1rem;">1</span>
            <button type="button" class="plusQty" aria-label="Increase quantity" style="font-size:1.2rem;padding:2px 10px;">+</button>
          </div>
          <button type="button" class="addToCartBtn" aria-label="Add ${p.name} to cart">Add to Cart</button>
        `;

        setTimeout(() => {
          const slider = card.querySelector(`#${sliderId}`);
          if (!slider) return;
          const wrapper = slider.querySelector('.slider-images-wrapper');
          const prevBtn = slider.querySelector('.slider-prev');
          const nextBtn = slider.querySelector('.slider-next');
          const dots = Array.from(slider.querySelectorAll('.slider-dot'));
          let idx = 0;
          function show(idxToShow) {
            idx = idxToShow;
            wrapper.style.transform = `translateX(-${230*idx}px)`;
            dots.forEach((d,di)=>d.classList.toggle('active', di===idx));
            if (prevBtn) prevBtn.style.display = idx === 0 ? 'none':'flex';
            if (nextBtn) nextBtn.style.display = idx === images.length-1 ? 'none':'flex';
          }
          if (hasMultiple) {
            prevBtn && prevBtn.addEventListener('click', ()=> show(Math.max(idx-1,0)));
            nextBtn && nextBtn.addEventListener('click', ()=> show(Math.min(idx+1,images.length-1)));
            dots.forEach((d,di)=>d.addEventListener('click', ()=>show(di)));
          }
        }, 0);

        let qty = 1;
        const minusBtn = card.querySelector('.minusQty');
        const plusBtn = card.querySelector('.plusQty');
        const qtyDisplay = card.querySelector('.qtyDisplay');
        minusBtn.addEventListener('click', ()=>{
          if(qty > 1) qty--;
          qtyDisplay.textContent = qty;
        });
        plusBtn.addEventListener('click', ()=>{
          qty++;
          qtyDisplay.textContent = qty;
        });

        const addToCartBtn = card.querySelector('.addToCartBtn');
        addToCartBtn.addEventListener("click", () => {
          const idx = findCartIndex(p.id);
          if (idx !== -1) {
            cart[idx].qty += qty;
          } else {
            cart.push({ id: p.id, name: p.name, price: p.price, image: images[0], qty });
          }
          updateCartCount();
          addToCartBtn.innerText = "Added!";
          addToCartBtn.disabled = true;
          setTimeout(()=>{
            addToCartBtn.innerText = "Add to Cart";
            addToCartBtn.disabled = false;
          }, 1200);
          qty = 1;
          qtyDisplay.textContent = qty;
        });

        container.appendChild(card);
      });
    })
    .catch(err => {
      loader && loader.remove();
      container.innerHTML = "<p style='color:#e55b51'>Failed to load products. Please try again later.</p>";
      console.error("Error fetching products:", err);
    });

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

    // Flatten cart data for Google Sheets
    const productNames = cart.map(p => p.name).join(', ');
    const productIds = cart.map(p => p.id).join(', ');
    const productQtys = cart.map(p => p.qty).join(', ');
    const productPrices = cart.map(p => (typeof p.price === "number" ? p.price : ((""+p.price).replace(/,/g,"").match(/(\d+(\.\d+)?)/)?.[1] || ""))).join(', ');

    const productLines = cart.map((p, i) => {
      let priceText = typeof p.price === "number" ? `₹${p.price}` : p.price;
      return `Product ${i+1}:\n🆔 ID: ${p.id}\n📦 Name: ${p.name}\n💰 Price: ${priceText}\nQty: ${p.qty}`;
    }).join('%0A%0A');

    // WhatsApp message: only products and total, not user details
    const url = `https://wa.me/918977659800?text=Hello! I'm interested in these items:%0A%0A${productLines}%0A%0A🧾 Total: ₹${total.toFixed(2)}`;

    // Send a single POST request with all user details and the entire cart array, FLATTENED for Google Sheets
    await fetch("https://script.google.com/macros/s/AKfycbyR6Xrd93DwH3xgE4g4nq3WERPBWgdHh3vwgQItEY_jPvn-MoVStNI8EGxJfeoRFGzi5w/exec", {      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        address,
        email,
        phone,
        pin,
        productNames,
        productIds,
        productQtys,
        productPrices,
        total: total.toFixed(2),
        // For reference, include the full cart JSON (optional)
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
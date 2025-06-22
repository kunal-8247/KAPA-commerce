(() => {
  const container = document.getElementById("productCategories");
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

  // --- Product view modal setup ---
  let productViewModal = document.createElement('div');
  productViewModal.id = "productViewModal";
  productViewModal.style.cssText = `
    display:none; 
    position:fixed; 
    top:0; left:0; 
    width:100vw; height:100vh; 
    background:rgba(0,0,0,0.45); 
    z-index:9999; 
    align-items:center; 
    justify-content:center;
  `;
  productViewModal.innerHTML = `
    <div id="productViewContent">
      <button id="closeProductView" type="button" aria-label="Close" style="position:absolute;top:12px;right:16px;font-size:2rem;background:none;border:none;cursor:pointer;z-index:3;">&times;</button>
      <div id="productViewBody"></div>
    </div>
    <style>
      #productViewContent {
        background:#fff;
        border-radius:14px;
        max-width:1100px;
        min-width:0;
        width:90vw;
        max-height:95vh;
        box-shadow:0 2px 36px #0005;
        overflow:auto;
        padding:36px 10vw 28px 10vw;
        position:relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      @media (max-width: 900px) {
        #productViewContent {
          padding:24px 10px 20px 10px;
          width:98vw;
          max-width:99vw;
        }
      }
      @media (max-width: 600px) {
        #productViewContent {
          min-width:0;
          width:100vw;
          max-width:100vw;
          padding:10px 0 24px 0;
          border-radius:0;
        }
        #productViewBody h2 {
          font-size:1.1rem;
        }
      }
      @media (max-width: 400px) {
        #productViewContent {
          padding:0;
        }
      }
      #productViewBody img {
        width:100%;
        max-width:420px;
        height:auto;
        max-height:48vw;
        object-fit:contain;
        border-radius:10px;
        box-shadow:0 2px 14px #0003;
      }
      @media (max-width: 600px) {
        #productViewBody img {
          max-width:95vw;
          max-height:50vw;
        }
      }
      @media (max-width:400px) {
        #productViewBody img {
          max-width:98vw;
        }
      }
      #productViewBody .pv-desc {
        margin-top:12px;
        color:#444;
        font-size:1.08rem;
        max-width:700px;
        text-align:center;
        word-break:break-word;
      }
      @media (max-width: 600px) {
        #productViewBody .pv-desc {
          font-size:1rem;
          max-width:95vw;
        }
      }
      #productViewBody .pv-nav-btn {
        font-size:1.5rem;
        padding:8px 12px;
        background:#eee;
        border:none;
        border-radius:50%;
        position:absolute;
        top:50%;
        transform:translateY(-50%);
        cursor:pointer;
        z-index:2;
      }
      #productViewBody .pv-nav-btn:active {
        background:#ccc;
      }
      #productViewBody .pv-nav-btn.pv-prev {
        left:-48px;
      }
      #productViewBody .pv-nav-btn.pv-next {
        right:-48px;
      }
      @media (max-width:700px) {
        #productViewBody .pv-nav-btn.pv-prev {left:-10px;}
        #productViewBody .pv-nav-btn.pv-next {right:-10px;}
      }
      #productViewBody .pv-qty-row {
        margin-bottom: 24px;
        display:flex;
        align-items:center;
        gap:23px;
      }
      #productViewBody .pv-btn-row {
        display:flex;
        gap:24px;
        flex-wrap:wrap;
        margin-bottom:12px;
      }
      #productViewBody .pv-btn-row button {
        padding:8px 40px;
        font-size:1.08rem;
        border-radius:8px;
        border:none;
        cursor:pointer;
        margin-bottom:4px;
      }
      #productViewBody .pv-btn-row #pvAddToCart {
        background:#5e548e;
        color:#fff;
      }
      #productViewBody .pv-btn-row #pvBuyNow {
        background:#e55b51;
        color:#fff;
      }
      @media (max-width: 600px) {
        #productViewBody .pv-btn-row button {
          width:100%;
          min-width:0;
          padding:10px 0;
        }
        #productViewBody .pv-btn-row {
          flex-direction:column;
          gap:10px;
        }
      }
      #productViewBody .pv-qty-row button {
        font-size:1.3rem;
        padding:2px 18px;
      }
      #productViewBody .pv-qty-row span {
        margin: 0 12px;
        font-size:1.1rem;
      }
      @media (max-width: 350px) {
        #productViewContent, #productViewBody {
          min-width:0;
          width:100vw;
          max-width:100vw;
          overflow-x:auto;
        }
      }
    </style>
  `;
  document.body.appendChild(productViewModal);

  let cart = [];
  let cartForBuyNow = null;

  // Correct API URLs as per your mapping
  const PRODUCT_API_URL = "https://script.google.com/macros/s/AKfycbwiop-0vUy39Qjh18PRLqoKW09_aNZq1rW0MgtJl4rn1RoxTAgFyaz2SoycfEpbzyldpA/exec";
  const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbwTNnPO7YkA-QdA4uQBTAMsDgW0crnFGnK1L0xuyaPn2axoyV1O3gXkjPitXmJ4Z89_9A/exec";

  function parseToArray(val) {
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
    if (
      productViewModal.style.display === "flex" &&
      !document.getElementById("productViewContent").contains(e.target)
    ) {
      productViewModal.style.display = "none";
    }
  });

  cartBuyNowBtn.onclick = () => {
    if (cart.length === 0) return;
    cartPopup.style.display = "none";
    cartForBuyNow = null;
    popupForm.style.display = "flex";
    setTimeout(() => interestForm.querySelector("input").focus(), 180);
  };

  document.getElementById("closeProductView").onclick = () => {
    productViewModal.style.display = "none";
  };

  // ---- MAIN PRODUCT FETCH & CATEGORY RENDER ----

  fetch(PRODUCT_API_URL)
    .then(res => res.json())
    .then(products => {
      loader && loader.remove();
      if (!products.length) {
        container.innerHTML = "<p style='color:#e55b51'>No products available at the moment.</p>";
        return;
      }

      // Categorize products by ID suffix
      const resinProducts = products.filter(p => p.id && p.id.endsWith("RS"));
      const watchProducts = products.filter(p => p.id && p.id.endsWith("WT"));
      const chocolateProducts = products.filter(p => p.id && p.id.endsWith("CH"));
      const jewelleryProducts = products.filter(p => p.id && p.id.endsWith("JW"));
      const neonProducts = products.filter(p => p.id && p.id.endsWith("NL"));
      const otherProducts = products.filter(p =>
        (!p.id || (!p.id.endsWith("RS") && !p.id.endsWith("WT") && !p.id.endsWith("CH") && !p.id.endsWith("JW") && !p.id.endsWith("NL")))
      );

      const categories = [
        { name: "Resin Work", products: resinProducts },
        { name: "Watches", products: watchProducts },
        { name: "Chocolates", products: chocolateProducts },
        { name: "Jewellery", products: jewelleryProducts },
        { name: "Neon Lights", products: neonProducts },
        { name: "Other Gifts", products: otherProducts }
      ];

      // Helper to create a category section
      function createCategorySection(title, prodList) {
        if (!prodList.length) return "";
        const section = document.createElement("div");
        section.className = "product-category-section";
        section.innerHTML = `
          <div class="product-category-title">${title}</div>
          <div class="products-container"></div>
        `;
        const prodContainer = section.querySelector(".products-container");
        prodList.forEach((p, i) => {
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
                <img src="${images[j]}" alt="${p.name}" />
              </div>
            `;
          }
          const sliderId = `slider-${title.replace(/\s/g, '')}-${i}-${Date.now()}`;
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

          // Append the card to DOM first
          prodContainer.appendChild(card);

          // Now setup slider logic
          const slider = card.querySelector(`#${sliderId}`);
          if (slider) {
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
          }

          // Quantity controls
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

          // -- PRODUCT VIEW MODAL --
          function openProductViewModal() {
            let imgIdx = 0;
            let modalQty = 1;
            function modalSliderHtml() {
              return `
                <div style="display:flex;flex-direction:column;align-items:center;">
                  <div style="position:relative;max-width:480px;width:100%;">
                    ${images.length > 1 ? `<button type="button" class="pv-nav-btn pv-prev" id="pvPrev" aria-label="Previous image" style="${imgIdx===0?'display:none;':''}">&#8592;</button>` : ''}
                    <img src="${images[imgIdx]}" alt="${p.name}">
                    ${images.length > 1 ? `<button type="button" class="pv-nav-btn pv-next" id="pvNext" aria-label="Next image" style="${imgIdx===images.length-1?'display:none;':''}">&#8594;</button>` : ''}
                  </div>
                  <div class="pv-desc">
                    ${descriptions[imgIdx] || ''}
                  </div>
                  <div style="margin-top:22px; text-align:left;max-width:700px;">
                    <h2 style="margin-bottom:10px;">${p.name}</h2>
                    <div style="font-size:1.25rem; margin-bottom:12px;"><b>Price:</b> <span style="color:#5e548e;font-weight:600;">${p.price}</span></div>
                    ${p.moreDetails ? `<div style="margin-bottom:14px;"><b>Details:</b> ${p.moreDetails}</div>` : ''}
                    <div class="pv-qty-row">
                      <button type="button" id="pvMinusQty" aria-label="Decrease quantity">-</button>
                      <span id="pvQtyDisplay">${modalQty}</span>
                      <button type="button" id="pvPlusQty" aria-label="Increase quantity">+</button>
                    </div>
                    <div class="pv-btn-row">
                      <button id="pvAddToCart">Add to Cart</button>
                      <button id="pvBuyNow">Buy Now</button>
                    </div>
                  </div>
                </div>
              `;
            }
            function renderModalContent() {
              document.getElementById("productViewBody").innerHTML = modalSliderHtml();
              // Next/Prev listeners
              if (images.length > 1) {
                let prevBtn = document.getElementById("pvPrev");
                let nextBtn = document.getElementById("pvNext");
                prevBtn && (prevBtn.onclick =()=>{ if(imgIdx>0){ imgIdx--; renderModalContent();}});
                nextBtn && (nextBtn.onclick =()=>{ if(imgIdx<images.length-1){ imgIdx++; renderModalContent();}});
              }
              // Qty listeners
              document.getElementById("pvMinusQty").onclick = () => {
                if(modalQty>1){modalQty--;document.getElementById("pvQtyDisplay").textContent=modalQty;}
              };
              document.getElementById("pvPlusQty").onclick = () => {
                modalQty++;document.getElementById("pvQtyDisplay").textContent=modalQty;
              };
              // Add to Cart
              document.getElementById("pvAddToCart").onclick = () => {
                const idx = findCartIndex(p.id);
                if (idx !== -1) {
                  cart[idx].qty += modalQty;
                } else {
                  cart.push({ id: p.id, name: p.name, price: p.price, image: images[0], qty: modalQty });
                }
                updateCartCount();
                document.getElementById("pvAddToCart").innerText = "Added!";
                document.getElementById("pvAddToCart").disabled = true;
                setTimeout(()=>{
                  document.getElementById("pvAddToCart").innerText = "Add to Cart";
                  document.getElementById("pvAddToCart").disabled = false;
                }, 1200);
                modalQty = 1;
                document.getElementById("pvQtyDisplay").textContent=modalQty;
              };
              // Buy Now
              document.getElementById("pvBuyNow").onclick = () => {
                cartForBuyNow = {
                  id: p.id, name: p.name, price: p.price, image: images[0], qty: modalQty
                };
                productViewModal.style.display = "none";
                popupForm.style.display = "flex";
                setTimeout(() => interestForm.querySelector("input").focus(), 180);
              };
            }
            renderModalContent();
            productViewModal.style.display = "flex";
          }
          card.addEventListener('click', function(e){
            if (e.target.closest('.addToCartBtn') || e.target.closest('.minusQty') || e.target.closest('.plusQty')) return;
            openProductViewModal();
          });
          card.addEventListener('keydown', function(e){
            if (e.key === "Enter" || e.key === " " || e.keyCode === 13) {
              openProductViewModal();
            }
          });
        });
        return section;
      }

      // Clear any previous content
      container.innerHTML = "";

      categories.forEach(cat => {
        if (cat.products && cat.products.length) {
          container.appendChild(createCategorySection(cat.name, cat.products));
        }
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

    // Always show full cart in WhatsApp message
    let cartTotal = cart.reduce((sum, item) => {
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

    const whatsappUrlAfterForm = `https://wa.me/918977659800?text=Hello! I'm interested in these items:%0A%0A${productLines}%0A%0A🧾 Total: ₹${cartTotal.toFixed(2)}`;

    // For Google Sheets, only send single product if cartForBuyNow is set (else whole cart)
    const sendCart = cartForBuyNow ? [cartForBuyNow] : cart;
    let totalForSheet = sendCart.reduce((sum, item) => {
      let priceNum = 0;
      if (typeof item.price === "number") priceNum = item.price;
      else {
        let match = (""+item.price).replace(/,/g,"").match(/(\d+(\.\d+)?)/);
        priceNum = match ? parseFloat(match[1]) : 0;
      }
      return sum + (priceNum * item.qty);
    }, 0);

    // Google Sheets flatten
    const productNames = sendCart.map(p => p.name).join(', ');
    const productIds = sendCart.map(p => p.id).join(', ');
    const productQtys = sendCart.map(p => p.qty).join(', ');
    const productPrices = sendCart.map(p => (typeof p.price === "number" ? p.price : ((""+p.price).replace(/,/g,"").match(/(\d+(\.\d+)?)/)?.[1] || ""))).join(', ');

    await fetch(GOOGLE_SHEET_API_URL, {      
      method: "POST",
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
        total: totalForSheet.toFixed(2),
        cart: JSON.stringify(sendCart)
      })
    });

    // DIRECTLY REDIRECT TO WHATSAPP
    window.location.href = whatsappUrlAfterForm;
    popupForm.style.display = "none";
    interestForm.reset();
    if (!cartForBuyNow) {
      cart = [];
      updateCartCount();
    }
    cartForBuyNow = null;
  };

  window.addEventListener("keydown", (e) => {
    if (popupForm.style.display === "flex" && e.key === "Escape") {
      popupForm.style.display = "none";
    }
    if (cartPopup.style.display === "block" && e.key === "Escape") {
      cartPopup.style.display = "none";
    }
    if (productViewModal.style.display === "flex" && e.key === "Escape") {
      productViewModal.style.display = "none";
    }
  });
})();

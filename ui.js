/* ======================================================================
   CODE DÙNG CHUNG: header, menu, giỏ hàng, footer (không cần sửa)
   ====================================================================== */
/* =====================================================================
   PHẦN DÙNG CHUNG CHO MỌI TRANG: dải logo, header, menu, menu danh mục lớn,
   giỏ hàng, nút nổi (Zalo / gọi / chat), đối tác, footer.
   Thường không cần sửa file này - hãy sửa data.js
   ===================================================================== */
(function () {
  "use strict";

  /* thông tin công ty đã sửa trong khu vực quản trị (nếu có) */
  try { const o = JSON.parse(localStorage.getItem("site_override") || "null"); if (o) Object.assign(SITE, o); } catch (e) { /* bỏ qua */ }

  /* ---------- tiện ích ---------- */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = n => (n > 0 ? n.toLocaleString("en-US") + "đ" : "Liên hệ");
  const img = (src, alt, holder) => (src ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy">` : holder);
  const isDesktop = () => window.matchMedia("(min-width: 901px)").matches;

  const ICON = {
    search: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    cart:   '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18l-2 11H5L3 9Z"/><path d="m8 9 3-5m5 5-3-5"/></svg>',
    grid:   '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>'
  };


  /* ---------- thông báo nhỏ ---------- */
  function toast(msg) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ---------- thẻ sản phẩm (dùng ở nhiều trang) ---------- */
  function productPriceInfo(product) {
    const variants = Array.isArray(product.variants) ? product.variants.filter(variant => variant && variant.name) : [];
    if (!variants.length) return { price: Number(product.price) || 0, oldPrice: Number(product.oldPrice) || 0, from: false };
    const lowest = variants.reduce((current, variant) => Number(variant.price) < Number(current.price) ? variant : current);
    return { price: Number(lowest.price) || 0, oldPrice: Number(lowest.oldPrice) || 0, from: true };
  }
  const categorySubcategories = categoryId => {
    const category = CATEGORIES.find(item => item.id === categoryId);
    return category ? category.groups.flatMap(group => group.items).filter(item => item.id) : [];
  };
  function productCard(p) {
    const pricing = productPriceInfo(p);
    const off = pricing.oldPrice > pricing.price && pricing.price > 0 ? Math.round((1 - pricing.price / pricing.oldPrice) * 100) : 0;
    const mainImage = Array.isArray(p.images) ? (p.images.find(Boolean) || p.image || "") : (p.image || "");
    return `
    <article class="product">
      <button type="button" class="product__edit" data-edit="${p.id}">Sửa</button>
      ${off ? `<span class="product__badge">Giảm ${off}%</span>` : ""}
      <a href="#/san-pham?id=${p.id}" class="product__img" aria-label="${esc(p.name)}">
        ${img(mainImage, p.name, "<span>ẢNH SẢN PHẨM</span>")}
      </a>
      <div class="product__line">${esc(p.line || "")}</div>
      <h3 class="product__name">${esc(p.name)}</h3>
      ${p.description ? `<p class="product__desc">${esc(p.description)}</p>` : ""}
      <div class="product__price">${pricing.from ? "Từ " : ""}${money(pricing.price)}</div>
      <button class="product__add" data-add="${p.id}">Thêm vào giỏ</button>
    </article>`;
  }

  /* =====================================================================
     HEADER
     ===================================================================== */
  const MENU = [
    { key: "home",       label: "TRANG CHỦ",       href: "#/" },
    { key: "about",      label: "VỀ CHÚNG TÔI",    href: "#/gioi-thieu", sub: [["Giới thiệu công ty", "#/gioi-thieu"], ["Đối tác", "#/gioi-thieu"]] },
    { key: "tin-tuc",    label: "TIN TỨC",         href: "#/tin-tuc",    sub: [["Tin công ty", "#/tin-tuc"], ["Kiến thức kỹ thuật", "#/tin-tuc"]] },
    { key: "khuyen-mai", label: "KHUYẾN MÃI 🔥",    href: "#/khuyen-mai" },
    { key: "tuyen-dung", label: "TUYỂN DỤNG",      href: "#/tuyen-dung" },
    { key: "lien-he",    label: "LIÊN HỆ",         href: "#/lien-he" }
  ];

  function buildHeader() {
    const brands = TOP_BRANDS.map(b => `<span class="strip__logo">${img(b.image, b.name, esc(b.name))}</span>`).join("");
    const logo = SITE.logo
      ? `<img src="${esc(SITE.logo)}" alt="${esc(SITE.name)}">`
      : `<span class="logo__mark">⚡</span><span class="logo__text"><b data-site="name">${esc(SITE.name)}</b><small>${esc(SITE.slogan)}</small></span>`;

    const menu = MENU.map(m => `
      <li class="${m.sub ? "has-sub" : ""}">
        <a href="${m.href}" data-key="${m.key}">${m.label}${m.sub ? '<i class="chev chev--sm"></i>' : ""}</a>
        ${m.sub ? `<ul class="sub">${m.sub.map(s => `<li><a href="${s[1]}">${s[0]}</a></li>`).join("")}</ul>` : ""}
      </li>`).join("");

    const megaList = CATEGORIES.map((c, i) => `
      <li><a class="mega__item${i === 0 ? " active" : ""}" data-cat="${c.id}" href="#/san-pham?cat=${c.id}">
        <span class="ico">${img(c.icon, c.name, "▣")}</span><span class="nm">${esc(c.name)}</span><i class="chev chev--r"></i>
      </a></li>`).join("");

    $("#site-header").innerHTML = `
    <div class="site-header">
      <div class="strip"><div class="container strip__inner">
        <span class="strip__horn">📣</span>
        <div class="strip__logos">${brands}</div>
        <div class="strip__promo"><b>${esc(SITE.topPromo.title)}</b><small>${esc(SITE.topPromo.sub)}</small></div>
        <span class="strip__burst">SALE!</span>
      </div></div>

      <div class="container head">
        <a href="#/" class="logo">${logo}</a>
        <form class="search" id="searchForm">
          <input type="text" name="q" id="searchInput" placeholder="Nhập từ khóa tìm kiếm" aria-label="Tìm kiếm">
          <button type="submit" aria-label="Tìm kiếm">${ICON.search}</button>
        </form>
        <button type="button" class="btn-blue btn-blue--sm" id="loginBtn">Đăng nhập</button>
        <button type="button" class="btn-blue" id="cartBtn">Giỏ hàng ${ICON.cart}<span class="cart__count" id="cartCount">0</span></button>
        <button type="button" class="burger" id="burger" aria-label="Mở menu">☰</button>
      </div>

      <nav class="nav" id="nav"><div class="container nav__inner">
        <button type="button" class="catbtn" id="catBtn">${ICON.grid}<span>Danh mục sản phẩm</span><i class="chev"></i></button>
        <ul class="menu">${menu}</ul>

        <div class="mega" id="mega">
          <ul class="mega__list">${megaList}</ul>
          <div class="mega__panel" id="megaPanel"></div>
          <div class="mega__foot"><span class="mega__phone">📞</span> Tư vấn &amp; báo giá <a href="#" data-site="hotlineLink"><b data-site="hotline">${esc(SITE.hotline)}</b></a></div>
        </div>
      </div></nav>
    </div>
    <div class="mega-overlay" id="megaOverlay"></div>`;
  }

  /* ---------- menu danh mục lớn ---------- */
  let openedByHover = false;

  function renderMegaPanel(id) {
    const c = CATEGORIES.find(x => x.id === id) || CATEGORIES[0];
    $$(".mega__item").forEach(a => a.classList.toggle("active", a.dataset.cat === c.id));
    const all = `#/san-pham?cat=${c.id}`;
    $("#megaPanel").innerHTML = `
      <div class="mp__head"><h3>${esc(c.name)}</h3><a class="pill" href="${all}">Xem tất cả <i class="chev chev--r chev--sm"></i></a></div>
      ${c.groups.map(g => `
        <div class="mp__group">
          <div class="mp__gh"><b>${esc(g.title)}</b><a href="${all}">Xem tất cả <i class="chev chev--r chev--sm"></i></a></div>
          <div class="mp__grid">
            ${g.items.map(it => {
              const href = it.link || (it.id ? `#/san-pham?cat=${c.id}&subcat=${it.id}` : all);
              return `<a class="mp__item" href="${esc(href)}"><span class="mp__img">${img(it.image, it.name, "▣")}</span><span>${esc(it.name)}</span></a>`;
            }).join("")}
          </div>
        </div>`).join("")}`;
  }
  function openMega(id, byHover) {
    renderMegaPanel(id || CATEGORIES[0].id);
    openedByHover = !!byHover;
    $("#mega").classList.add("open");
    $("#megaOverlay").classList.add("show");
    $("#catBtn").classList.add("open");
  }
  function closeMega() {
    $("#mega").classList.remove("open");
    $("#megaOverlay").classList.remove("show");
    $("#catBtn").classList.remove("open");
  }
  function bindMega() {
    $("#catBtn").addEventListener("click", () => ($("#mega").classList.contains("open") ? closeMega() : openMega(null, false)));
    $("#megaOverlay").addEventListener("click", closeMega);
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeMega(); });

    $$(".mega__item").forEach(a => {
      a.addEventListener("mouseenter", () => { if (isDesktop()) renderMegaPanel(a.dataset.cat); });
      a.addEventListener("click", e => { if (!isDesktop()) { e.preventDefault(); renderMegaPanel(a.dataset.cat); } });
    });
    $("#mega").addEventListener("mouseleave", () => { if (openedByHover && isDesktop()) closeMega(); });

    // danh sách bên trái banner ở trang chủ: rê chuột vào là mở menu lớn
    document.addEventListener("mouseover", e => {
      const it = e.target.closest(".side-item");
      if (it && isDesktop()) openMega(it.dataset.cat, true);
    });

    // menu điện thoại
    $("#burger").addEventListener("click", () => $("#nav").classList.toggle("open"));
  }

  /* =====================================================================
     GIỎ HÀNG
     ===================================================================== */
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem("cart") || "[]"); } catch (e) { cart = []; }
  const saveCart = () => { try { localStorage.setItem("cart", JSON.stringify(cart)); } catch (e) { /* bỏ qua */ } };
  const cartUnitPrice = item => {
    const variant = item.variantId && item.p.variants && item.p.variants.find(option => String(option.id) === String(item.variantId));
    if (variant) return Number(variant.price) || 0;
    return item.unitPrice != null ? Number(item.unitPrice) || 0 : Number(item.p.price) || 0;
  };

  function renderCart() {
    const items = cart.map((c, index) => ({ ...c, index, p: PRODUCTS.find(p => p.id === c.id) })).filter(c => c.p);
    $("#cartCount").textContent = items.reduce((a, c) => a + c.qty, 0);
    const total = items.reduce((a, c) => a + c.qty * cartUnitPrice(c), 0);
    $("#cartTotal").textContent = total > 0 ? money(total) : "Liên hệ";
    $("#drawerBody").innerHTML = items.length ? items.map(c => {
      const thumb = Array.isArray(c.p.images) ? (c.p.images.find(Boolean) || c.p.image || "") : (c.p.image || "");
      return `
      <div class="ci">
        <div class="ci__img">${img(thumb, c.p.name, "ẢNH")}</div>
        <div>
          <div class="ci__name">${esc(c.p.name)}${c.variantName ? `<br><small>${esc(c.variantName)}</small>` : ""}</div>
          <div class="ci__price">${money(cartUnitPrice(c))}</div>
          <div class="ci__qty"><button data-dec="${c.index}">−</button><span>${c.qty}</span><button data-inc="${c.index}">+</button></div>
        </div>
        <button class="ci__del" data-del="${c.index}" aria-label="Xóa">✕</button>
      </div>`;
    }).join("") : '<p class="drawer__empty">Giỏ hàng đang trống</p>';
  }
  function addToCart(id, variantId) {
    const product = PRODUCTS.find(item => item.id === id);
    const variants = product && Array.isArray(product.variants) ? product.variants.filter(variant => variant && variant.name) : [];
    const selected = variantId
      ? variants.find(variant => String(variant.id) === String(variantId))
      : (variants.length ? variants.reduce((lowest, variant) => Number(variant.price) < Number(lowest.price) ? variant : lowest) : null);
    const selectedId = selected ? String(selected.id) : "";
    const f = cart.find(item => item.id === id && String(item.variantId || "") === selectedId);
    if (f) f.qty++;
    else cart.push({ id, qty: 1, variantId: selectedId, variantName: selected ? selected.name : "", unitPrice: selected ? Number(selected.price) || 0 : Number(product && product.price) || 0 });
    saveCart(); renderCart(); toast("Đã thêm vào giỏ hàng");
  }
  function openDrawer(open) {
    $("#drawer").classList.toggle("show", open);
    $("#drawerOverlay").classList.toggle("show", open);
  }
  function buildCart() {
    const box = document.createElement("div");
    box.innerHTML = `
      <div class="drawer-overlay" id="drawerOverlay"></div>
      <aside class="drawer" id="drawer" aria-label="Giỏ hàng">
        <div class="drawer__head"><h3>Giỏ hàng</h3><button type="button" id="drawerClose" aria-label="Đóng">✕</button></div>
        <div class="drawer__body" id="drawerBody"></div>
        <div class="drawer__foot">
          <div class="drawer__total"><span>Tạm tính</span><b id="cartTotal">0đ</b></div>
          <button type="button" class="btn-blue btn-blue--block" id="checkoutBtn">Gửi yêu cầu báo giá</button>
        </div>
      </aside>
      <div class="toast" id="toast"></div>`;
    document.body.appendChild(box);

    $("#cartBtn").addEventListener("click", () => openDrawer(true));
    $("#drawerClose").addEventListener("click", () => openDrawer(false));
    $("#drawerOverlay").addEventListener("click", () => openDrawer(false));
    $("#loginBtn").addEventListener("click", () => { location.hash = "#/admin"; });

    // gửi giỏ hàng sang trang liên hệ dưới dạng yêu cầu báo giá
    $("#checkoutBtn").addEventListener("click", () => {
      const items = cart.map(c => ({ ...c, p: PRODUCTS.find(p => p.id === c.id) })).filter(c => c.p);
      if (!items.length) return toast("Giỏ hàng đang trống");
      const text = "Tôi muốn nhận báo giá các sản phẩm sau:\n" + items.map(c => `- ${c.p.name}${c.variantName ? ` - ${c.variantName}` : ""} (${money(cartUnitPrice(c))}, SL: ${c.qty})`).join("\n");
      try { sessionStorage.setItem("quoteText", text); } catch (e) { /* bỏ qua */ }
      location.hash = "#/lien-he";
    });

    document.addEventListener("click", e => {
      const add = e.target.closest("[data-add]");
      if (add) return addToCart(Number(add.dataset.add), add.dataset.variant || "");
      const inc = e.target.closest("[data-inc]");
      if (inc) { cart[Number(inc.dataset.inc)].qty++; saveCart(); return renderCart(); }
      const dec = e.target.closest("[data-dec]");
      if (dec) {
        const index = Number(dec.dataset.dec), item = cart[index];
        item.qty--; if (item.qty <= 0) cart.splice(index, 1);
        saveCart(); return renderCart();
      }
      const del = e.target.closest("[data-del]");
      if (del) { cart.splice(Number(del.dataset.del), 1); saveCart(); renderCart(); }
    });
    renderCart();
  }

  /* =====================================================================
     ĐỐI TÁC + FOOTER + NÚT NỔI
     ===================================================================== */
  function buildFooter() {
    const partners = PARTNERS.map(p => `<div class="pcar__item">${img(p.image, p.name, esc(p.name))}</div>`).join("");
    const cats = CATEGORIES.slice(0, 6).map(c => `<li><a href="#/san-pham?cat=${c.id}">${esc(c.name)}</a></li>`).join("");

    $("#site-footer").innerHTML = `
    <section class="container partners" id="doi-tac">
      <h2>Đối tác của chúng tôi</h2>
      <div class="pcar">
        <button type="button" class="pcar__nav prev" id="pPrev" aria-label="Trước">‹</button>
        <div class="pcar__track" id="pTrack">${partners}</div>
        <button type="button" class="pcar__nav next" id="pNext" aria-label="Sau">›</button>
        <div class="pcar__dots" id="pDots"></div>
      </div>
    </section>

    <footer class="footer">
      <div class="container footer__grid">
        <div>
          <h4 data-site="name">${esc(SITE.name)}</h4>
          <p>📍 <span data-site="address">${esc(SITE.address)}</span></p>
          <p>📞 <span data-site="hotline">${esc(SITE.hotline)}</span></p>
          <p>✉️ <span data-site="email">${esc(SITE.email)}</span></p>
          <p>🏢 MST: <span data-site="taxCode">${esc(SITE.taxCode)}</span></p>
        </div>
        <div>
          <h4>Hỗ trợ khách hàng</h4>
          <ul>
            <li><a href="#/lien-he">Hướng dẫn mua hàng</a></li>
            <li><a href="#/lien-he">Chính sách vận chuyển</a></li>
            <li><a href="#/lien-he">Chính sách đổi trả</a></li>
            <li><a href="#/lien-he">Chính sách bảo hành</a></li>
            <li><a href="#/lien-he">Chính sách thanh toán</a></li>
          </ul>
        </div>
        <div><h4>Danh mục</h4><ul>${cats}</ul></div>
        <div>
          <h4>Kết nối</h4>
          <ul>
            <li><a href="${esc(SITE.social.facebook)}">Facebook</a></li>
            <li><a href="${esc(SITE.social.zalo)}">Zalo</a></li>
            <li><a href="${esc(SITE.social.youtube)}">YouTube</a></li>
            <li><a href="${esc(SITE.social.tiktok)}">TikTok</a></li>
          </ul>
        </div>
      </div>
      <div class="footer__bottom"><div class="container">© ${new Date().getFullYear()} <span data-site="name">${esc(SITE.name)}</span>. Bảo lưu mọi quyền.</div></div>
    </footer>

    <div class="float-left">
      <a class="pill-float pill-float--zalo" href="${esc(SITE.zalo)}" target="_blank" rel="noopener"><span class="pill-float__ic">Zalo</span><b>Liên hệ Zalo</b></a>
      <a class="pill-float pill-float--call" data-site="hotlineLink" href="#"><span class="pill-float__ic">📞</span><b data-site="hotline">${esc(SITE.hotline)}</b></a>
    </div>

    <div class="chat">
      <div class="chat__bubble" id="chatBubble"><button type="button" id="chatClose" aria-label="Đóng">✕</button>${esc(SITE.chatWelcome)}</div>
      <a class="chat__bar" href="${esc(SITE.zalo)}" target="_blank" rel="noopener">Đang online<i>1</i></a>
    </div>
    <button type="button" class="totop" id="toTop" aria-label="Lên đầu trang">↑</button>`;

    $("#chatClose").addEventListener("click", () => $("#chatBubble").remove());
    const toTop = $("#toTop");
    window.addEventListener("scroll", () => toTop.classList.toggle("show", window.scrollY > 400));
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

    /* carousel đối tác */
    const track = $("#pTrack"), dots = $("#pDots");
    function buildDots() {
      const pages = Math.max(1, Math.round(track.scrollWidth / track.clientWidth));
      dots.innerHTML = Array.from({ length: pages }, (_, i) => `<button type="button" aria-label="Trang ${i + 1}"></button>`).join("");
      $$("button", dots).forEach((b, i) => b.addEventListener("click", () => track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" })));
      markDot();
    }
    function markDot() {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      $$("button", dots).forEach((b, k) => b.classList.toggle("active", k === i));
    }
    $("#pPrev").addEventListener("click", () => track.scrollBy({ left: -track.clientWidth, behavior: "smooth" }));
    $("#pNext").addEventListener("click", () => track.scrollBy({ left: track.clientWidth, behavior: "smooth" }));
    track.addEventListener("scroll", markDot);
    window.addEventListener("resize", buildDots);
    buildDots();
  }

  /* ---------- áp dụng thông tin công ty vào các thẻ data-site ---------- */
  function applySite() {
    $$("[data-site]").forEach(el => {
      const k = el.dataset.site;
      if (k === "hotlineLink") el.href = "tel:" + SITE.hotline.replace(/\s/g, "");
      else if (k === "emailLink") el.href = "mailto:" + SITE.email;
      else if (SITE[k] !== undefined) el.textContent = SITE[k];
    });
    document.title = document.title.replace("TÊN CÔNG TY", SITE.name);
  }

  function setActive(page) { $$(".menu>li>a").forEach(a => a.classList.toggle("active", a.dataset.key === page)); }

  /* ---------- khởi chạy ---------- */
  buildHeader();
  buildCart();
  buildFooter();
  bindMega();
  applySite();

  // tìm kiếm: chuyển sang trang sản phẩm kèm từ khóa
  $("#searchForm").addEventListener("submit", e => {
    e.preventDefault();
    const v = $("#searchInput").value.trim();
    location.hash = "#/san-pham" + (v ? "?q=" + encodeURIComponent(v) : "");
  });

  document.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse" || !(e.target instanceof Element)) return;
    const frame = e.target.closest(".prod-detail__main");
    const image = frame && $("img", frame);
    if (!image) return;
    const bounds = frame.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, (e.clientX - bounds.left) / bounds.width * 100));
    const y = Math.max(0, Math.min(100, (e.clientY - bounds.top) / bounds.height * 100));
    image.style.setProperty("--zoom-x", `${x}%`);
    image.style.setProperty("--zoom-y", `${y}%`);
  });
  document.addEventListener("pointerout", e => {
    if (!(e.target instanceof Element)) return;
    const frame = e.target.closest(".prod-detail__main");
    if (!frame || (e.relatedTarget instanceof Node && frame.contains(e.relatedTarget))) return;
    const image = $("img", frame);
    if (image) {
      image.style.removeProperty("--zoom-x");
      image.style.removeProperty("--zoom-y");
    }
  });

  window.UI = { $, $$, esc, money, img, toast, productCard, productPriceInfo, categorySubcategories, applySite, setActive, closeMega, closeDrawer: () => openDrawer(false), renderCart };
})();

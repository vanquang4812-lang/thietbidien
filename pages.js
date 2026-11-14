/* ======================================================================
   CODE TỪNG TRANG (không cần sửa)
   ====================================================================== */
/* =====================================================================
   NỘI DUNG RIÊNG TỪNG TRANG (tự nhận biết trang qua thuộc tính data-page)
   Dữ liệu lấy từ data.js
   ===================================================================== */
(function () {
  "use strict";
  const { $, $$, esc, money, img, toast, productCard, categorySubcategories } = window.UI;

  /* ---------- TRANG CHỦ ---------- */
  function initHome() {
    // danh sách danh mục bên trái banner
    $("#sideList").innerHTML = CATEGORIES.map(c => `
      <li><a class="side-item" data-cat="${c.id}" href="#/san-pham?cat=${c.id}">
        <span class="ico">${img(c.icon, c.name, "▣")}</span><span class="nm">${esc(c.name)}</span><i class="chev chev--r"></i>
      </a></li>`).join("");

    // slider
    const slider = $("#slider");
    slider.innerHTML = BANNERS.map((b, i) => `
      <a class="slide${i === 0 ? " active" : ""}" href="${esc(b.link || "#")}">
        ${b.image ? `<img src="${esc(b.image)}" alt="${esc(b.title)}">`
                  : `<div class="slide__ph"><b>${esc(b.title)}</b><span>${esc(b.sub)}</span></div>`}
      </a>`).join("") + `
      <button type="button" class="slider__nav prev" aria-label="Trước">‹</button>
      <button type="button" class="slider__nav next" aria-label="Sau">›</button>
      <div class="slider__dots">${BANNERS.map(() => "<button type='button'></button>").join("")}</div>`;
    const slides = $$(".slide", slider), dots = $$(".slider__dots button", slider);
    let idx = 0;
    const go = i => {
      idx = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle("active", k === idx));
      dots.forEach((d, k) => d.classList.toggle("active", k === idx));
    };
    const auto = () => { clearInterval(window.__st); window.__st = setInterval(() => go(idx + 1), 5000); };
    $(".prev", slider).addEventListener("click", () => { go(idx - 1); auto(); });
    $(".next", slider).addEventListener("click", () => { go(idx + 1); auto(); });
    dots.forEach((d, k) => d.addEventListener("click", () => { go(k); auto(); }));
    go(0); auto();

    // 3 ô chính sách
    $("#policies").innerHTML = POLICIES.map(p => `
      <div class="policy" style="color:${esc(p.color)}">
        <div class="policy__ic">${img(p.image, p.title, p.icon)}</div>
        <div><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div>
      </div>`).join("");

    // hàng ô xanh
    $("#tiles").innerHTML = HOME_TILES.map(t => `
      <a class="tile" href="#/san-pham?cat=${esc(t.cat)}">
        <b>${esc(t.name)}</b><span class="tile__img">${img(t.image, t.name, "ẢNH")}</span>
      </a>`).join("");

    // các khối sản phẩm theo danh mục
    $("#homeSections").innerHTML = HOME_SECTIONS.map(s => {
      const list = PRODUCTS.filter(p => p.cat === s.cat).slice(0, 8);
      return `
      <section class="container sec">
        <a class="sec__banner" href="#/san-pham?cat=${esc(s.cat)}">
          ${s.banner ? `<img src="${esc(s.banner)}" alt="${esc(s.title)}">` : `<b>${esc(s.title)}</b><small>Banner khoảng 1180 x 110 px</small>`}
        </a>
        <div class="product-grid">${list.map(productCard).join("") || '<p class="empty">Chưa có sản phẩm</p>'}</div>
        <div class="sec__more"><a href="#/san-pham?cat=${esc(s.cat)}">Xem tất cả ›</a></div>
      </section>`;
    }).join("");
  }

  /* ---------- TRANG SẢN PHẨM ---------- */
  function initProducts() {
    const params = window.ROUTE.params;
    const cat = params.get("cat") || "all";
    const subcat = params.get("subcat") || "";
    const q = (params.get("q") || "").trim().toLowerCase();
    const productId = Number(params.get("id"));
    const current = CATEGORIES.find(c => c.id === cat);

    if (productId && PRODUCTS.some(p => p.id === productId)) {
      const product = PRODUCTS.find(p => p.id === productId);
      const images = Array.isArray(product.images) && product.images.length ? product.images : [product.image || ""];
      const galleryImages = images.filter(Boolean);
      const variants = Array.isArray(product.variants) ? product.variants.filter(variant => variant && variant.name) : [];
      const selectedVariant = variants.length ? variants.reduce((lowest, variant) => Number(variant.price) < Number(lowest.price) ? variant : lowest) : null;
      const initialPrice = selectedVariant ? Number(selectedVariant.price) || 0 : Number(product.price) || 0;
      const initialOldPrice = selectedVariant ? Number(selectedVariant.oldPrice) || 0 : Number(product.oldPrice) || 0;
      const productCategory = CATEGORIES.find(category => category.id === product.cat);
      const productSubcategory = categorySubcategories(product.cat).find(item => item.id === product.subcat);
      const categoryLabel = [productCategory ? productCategory.name : product.cat, productSubcategory && productSubcategory.name].filter(Boolean).join(" / ");
      const discount = initialOldPrice > initialPrice && initialPrice > 0 ? Math.round((1 - initialPrice / initialOldPrice) * 100) : 0;
      $("#prodTitle").hidden = true;
      $("#prodCount").textContent = `Mã sản phẩm: ${product.id} • ${productCategory ? productCategory.name : product.cat}`;
      $("#prodCount").hidden = true;
      $("#chips").hidden = true;
      $("#prodGrid").innerHTML = `
        <article class="prod-detail">
          <div class="prod-detail__gallery">
            ${galleryImages.length ? `<div class="prod-detail__main"><img id="productMainImage" src="${esc(galleryImages[0])}" alt="${esc(product.name)}" class="prod-detail__image"></div>` : '<div class="prod-detail__empty">Chưa có ảnh sản phẩm</div>'}
            ${galleryImages.length > 1 ? `<div class="prod-detail__thumbs">${galleryImages.map((src, index) => `<button type="button" class="prod-detail__thumb${index === 0 ? " active" : ""}" data-product-image="${index}" aria-label="Xem ảnh ${index + 1}"><img src="${esc(src)}" alt=""></button>`).join("")}</div>` : ""}
          </div>
          <div class="prod-detail__content">
            <nav class="prod-detail__crumbs" aria-label="Đường dẫn"><a href="#/">Trang chủ</a><span>/</span><a href="#/san-pham?cat=${esc(product.cat)}">${esc(categoryLabel)}</a><span>/</span><span>${esc(product.name)}</span></nav>
            <div class="prod-detail__meta"><span>${esc(product.line || categoryLabel)}</span><span>Mã sản phẩm: ${esc(product.id)}</span></div>
            <h2>${esc(product.name)}</h2>
            ${variants.length ? `<label class="prod-detail__variant">Phân loại sản phẩm<select id="productVariant">${variants.map(variant => `<option value="${esc(variant.id)}"${variant.id === selectedVariant.id ? " selected" : ""}>${esc(variant.name)} · ${money(Number(variant.price) || 0)}</option>`).join("")}</select></label>` : ""}
            <div class="prod-detail__price"><strong class="product__price" id="productPrice">${money(initialPrice)}</strong><del class="prod-detail__old-price" id="productOldPrice"${initialOldPrice > initialPrice ? "" : " hidden"}>${money(initialOldPrice)}</del><span class="prod-detail__discount" id="productDiscount"${discount ? "" : " hidden"}>-${discount}%</span></div>
            <div class="prod-detail__actions">
              <button class="product__add" data-add="${esc(product.id)}" data-variant="${selectedVariant ? esc(selectedVariant.id) : ""}">Thêm vào giỏ hàng</button>
              <a class="btn-blue btn-blue--sm" href="#/lien-he">Liên hệ báo giá</a>
            </div>
            <section class="prod-detail__section">
              <h3>Thông tin sản phẩm</h3>
              <p class="product__desc product__desc--detail">${esc(product.description || "Chưa có mô tả sản phẩm.")}</p>
            </section>
          </div>
        </article>`;
      const mainImage = $("#productMainImage");
      if (mainImage) {
        $$("#prodGrid [data-product-image]").forEach(button => button.addEventListener("click", () => {
          mainImage.src = galleryImages[Number(button.dataset.productImage)];
          $$("#prodGrid .prod-detail__thumb").forEach(thumb => thumb.classList.toggle("active", thumb === button));
        }));
      }
      const variantSelect = $("#productVariant");
      if (variantSelect) variantSelect.addEventListener("change", () => {
        const variant = variants.find(option => String(option.id) === variantSelect.value);
        if (!variant) return;
        const price = Number(variant.price) || 0, oldPrice = Number(variant.oldPrice) || 0;
        const discountRate = oldPrice > price && price > 0 ? Math.round((1 - price / oldPrice) * 100) : 0;
        $("#productPrice").textContent = money(price);
        $("#productOldPrice").textContent = money(oldPrice);
        $("#productOldPrice").hidden = !(oldPrice > price && price > 0);
        $("#productDiscount").textContent = discountRate ? `-${discountRate}%` : "";
        $("#productDiscount").hidden = !discountRate;
        $("#prodGrid [data-add]").dataset.variant = String(variant.id);
      });
      return;
    }

    const currentSubcategory = categorySubcategories(cat).find(item => item.id === subcat);
    $("#prodTitle").textContent = q ? `Kết quả tìm kiếm: "${params.get("q")}"` : (currentSubcategory ? currentSubcategory.name : (current ? current.name : "Tất cả sản phẩm"));
    $("#chips").innerHTML =
      `<a href="#/san-pham" class="${cat === "all" ? "active" : ""}">Tất cả</a>` +
      CATEGORIES.map(c => `<a href="#/san-pham?cat=${c.id}" class="${c.id === cat && !subcat ? "active" : ""}">${esc(c.name)}</a>`).join("") +
      categorySubcategories(cat).map(item => `<a href="#/san-pham?cat=${cat}&subcat=${item.id}" class="${item.id === subcat ? "active" : ""}">${esc(item.name)}</a>`).join("");

    const list = PRODUCTS.filter(p =>
      (cat === "all" || p.cat === cat) &&
      (!subcat || p.subcat === subcat) &&
      (!q || (p.name + " " + (p.line || "") + " " + (p.description || "")).toLowerCase().includes(q)))
      .sort((a, b) => Number(b.id) - Number(a.id));
    $("#prodCount").textContent = `${list.length} sản phẩm`;
    $("#prodGrid").innerHTML = list.length ? list.map(productCard).join("") : '<p class="empty">Không tìm thấy sản phẩm phù hợp.</p>';
  }

  /* ---------- KHUYẾN MÃI / TIN TỨC ---------- */
  function initPosts(type) {
    const MONTH = d => d.getMonth() + 1;
    const list = POSTS.filter(p => p.type === type);
    $("#postList").innerHTML = list.length ? list.map(p => {
      const d = new Date(p.date);
      return `
      <article class="post">
        <div class="post__head">
          <div class="post__cat">${esc(p.cat)}</div>
          <h2 class="post__title"><a href="#">${esc(p.title)}</a></h2>
          <div class="post__meta">Đăng vào <a href="#">THÁNG ${MONTH(d)} ${d.getDate()}, ${d.getFullYear()}</a> bởi <a href="#">${esc(p.author)}</a></div>
        </div>
        <div class="post__body">
          <div class="post__img">
            <div class="post__date">${String(d.getDate()).padStart(2, "0")}<small>Th${MONTH(d)}</small></div>
            ${img(p.image, p.title, "ẢNH BÀI VIẾT")}
          </div>
          <div class="post__text"><p>${esc(p.excerpt)}</p><a class="btn-outline" href="#">Tiếp tục đọc →</a></div>
        </div>
        <div class="post__foot"><span>Đăng trong <a href="#">${esc(p.cat)}</a></span><a href="#/lien-he">Để lại bình luận</a></div>
      </article>`;
    }).join("") : '<p class="empty">Chưa có bài viết.</p>';
  }

  /* ---------- TUYỂN DỤNG ---------- */
  function initJobs() {
    const uniq = k => [...new Set(JOBS.map(j => j[k]))];
    const fields = [["position", "Vị trí tuyển dụng"], ["experience", "Yêu cầu kinh nghiệm"], ["degree", "Bằng cấp"], ["location", "Nơi làm việc"], ["level", "Cấp bậc"]];

    $("#filters").innerHTML =
      `<div class="fs"><input type="text" id="jobSearch" placeholder="Tìm kiếm"><span>🔍</span></div>` +
      fields.map(([k, label]) => `<select data-k="${k}"><option value="">Tất cả ${label}</option>${uniq(k).map(v => `<option>${esc(v)}</option>`).join("")}</select>`).join("");

    function render() {
      const kw = $("#jobSearch").value.trim().toLowerCase();
      const sel = $$("#filters select").map(s => [s.dataset.k, s.value]).filter(x => x[1]);
      const list = JOBS.filter(j => (!kw || j.title.toLowerCase().includes(kw)) && sel.every(([k, v]) => j[k] === v));
      $("#jobGrid").innerHTML = list.length ? list.map(j => `
        <article class="job">
          <h2>${esc(j.title)}</h2>
          <ul>
            <li><i>💼</i>${esc(j.position)}</li>
            <li><i>🕘</i>${esc(j.experience)}</li>
            <li><i>🎓</i>${esc(j.degree)}</li>
            <li><i>📍</i>${esc(j.location)}</li>
            <li><i>👤</i>${esc(j.level)}</li>
          </ul>
          <a class="more" href="${esc(j.link || "#/lien-he")}">Xem chi tiết →</a>
        </article>`).join("") : '<p class="empty" style="grid-column:1/-1">Không có vị trí phù hợp.</p>';
    }
    $("#filters").addEventListener("input", render);
    $("#filters").addEventListener("change", render);
    render();
  }

  /* ---------- LIÊN HỆ ---------- */
  function initContact() {
    $("#mapBox").innerHTML = SITE.mapEmbed
      ? `<iframe src="${esc(SITE.mapEmbed)}" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>`
      : "BẢN ĐỒ GOOGLE MAPS<br><small>Dán link nhúng vào mapEmbed trong data.js</small>";

    // nhận nội dung báo giá từ giỏ hàng (nếu có)
    try {
      const t = sessionStorage.getItem("quoteText");
      if (t) { $("#cMsg").value = t; sessionStorage.removeItem("quoteText"); }
    } catch (e) { /* bỏ qua */ }

    // chưa có máy chủ: gửi liên hệ bằng cách mở ứng dụng email của khách
    $("#contactForm").addEventListener("submit", e => {
      e.preventDefault();
      const name = $("#cName").value.trim(), mail = $("#cMail").value.trim(), msg = $("#cMsg").value.trim();
      const subject = encodeURIComponent("Liên hệ từ website - " + name);
      const body = encodeURIComponent(`Họ tên: ${name}\nEmail: ${mail}\n\n${msg}`);
      location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
      toast("Đang mở ứng dụng email để gửi...");
    });
  }

  /* ---------- chạy theo trang ---------- */
  const map = {
    "home": initHome,
    "san-pham": initProducts,
    "khuyen-mai": () => initPosts("khuyen-mai"),
    "tin-tuc": () => initPosts("tin-tuc"),
    "tuyen-dung": initJobs,
    "lien-he": initContact
  };
  window.renderPage = page => { clearInterval(window.__st); if (map[page]) map[page](); };
})();

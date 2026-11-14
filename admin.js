/* ======================================================================
   KHU VỰC QUẢN TRỊ: đăng nhập, sản phẩm, tải ảnh, thông tin công ty, sao lưu
   ====================================================================== */
(function () {
  "use strict";
  const { $, $$, esc, money, toast, productPriceInfo, categorySubcategories } = window.UI;
  const cloudEnabled = Boolean(CLOUD.supabaseUrl && CLOUD.publishableKey);
  const cloud = cloudEnabled && window.supabase && window.supabase.createClient
    ? window.supabase.createClient(CLOUD.supabaseUrl, CLOUD.publishableKey)
    : null;

  /* ---------- SHA-256 (tự viết, chạy được cả khi mở file trực tiếp) ---------- */
  const K = [], H0 = [];
  for (let n = 2, c = 0; c < 64; n++) {
    let prime = true;
    for (let i = 2; i * i <= n; i++) if (n % i === 0) { prime = false; break; }
    if (prime) { if (c < 8) H0[c] = (Math.pow(n, 1 / 2) % 1 * 4294967296) | 0; K[c] = (Math.pow(n, 1 / 3) % 1 * 4294967296) | 0; c++; }
  }
  function sha256(msg) {
    const rr = (v, a) => (v >>> a) | (v << (32 - a));
    const bytes = [...new TextEncoder().encode(msg)];
    const bits = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const hi = Math.floor(bits / 4294967296), lo = bits >>> 0;
    for (let i = 3; i >= 0; i--) bytes.push((hi >>> (i * 8)) & 255);
    for (let i = 3; i >= 0; i--) bytes.push((lo >>> (i * 8)) & 255);
    const h = H0.slice();
    for (let o = 0; o < bytes.length; o += 64) {
      const w = new Array(64);
      for (let i = 0; i < 16; i++) w[i] = (bytes[o + i * 4] << 24) | (bytes[o + i * 4 + 1] << 16) | (bytes[o + i * 4 + 2] << 8) | bytes[o + i * 4 + 3];
      for (let i = 16; i < 64; i++) {
        const s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i++) {
        const t1 = (hh + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
        const t2 = ((rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      [a, b, c, d, e, f, g, hh].forEach((v, i) => { h[i] = (h[i] + v) | 0; });
    }
    return h.map(x => (x >>> 0).toString(16).padStart(8, "0")).join("");
  }
  window.Admin = { sha256 };
  const hashPass = p => sha256(ADMIN.salt + ":" + p);
  let passMem = null;   // dự phòng khi trình duyệt chặn localStorage
  const safeStorage = name => { try { return window[name]; } catch (e) { return null; } };
  const readSavedHash = () => {
    const entries = [
      passMem,
      (() => { try { return window.__admin_pass || null; } catch (e) { return null; } })(),
      (() => { try { return localStorage.getItem("admin_pass"); } catch (e) { return null; } })(),
      (() => { try { return sessionStorage.getItem("admin_pass"); } catch (e) { return null; } })(),
      ADMIN.passHash
    ].filter(Boolean);
    return entries[0] || ADMIN.passHash;
  };
  const persistSavedHash = hash => {
    passMem = hash;
    try { window.__admin_pass = hash; } catch (e) { /* bỏ qua */ }
    ["localStorage", "sessionStorage"].forEach(name => {
      try {
        const store = safeStorage(name);
        if (store) store.setItem("admin_pass", hash);
      } catch (e) { /* bỏ qua */ }
    });
  };
  const currentHash = () => readSavedHash();

  /* ---------- lưu trữ sản phẩm bằng IndexedDB ---------- */
  let dbp = null;
  const openDB = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open("shopdb", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("kv");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const idb = {
    async get(k) { const db = await openDB(); return new Promise((res, rej) => { const q = db.transaction("kv", "readonly").objectStore("kv").get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
    async set(k, v) { const db = await openDB(); return new Promise((res, rej) => { const t = db.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k); t.oncomplete = () => res(); t.onerror = t.onabort = () => rej(t.error); }); },
    async del(k) { const db = await openDB(); return new Promise((res, rej) => { const t = db.transaction("kv", "readwrite"); t.objectStore("kv").delete(k); t.oncomplete = () => res(); t.onerror = t.onabort = () => rej(t.error); }); }
  };
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
  let storageOK = true;
  let authMem = false;
  let cloudAdminEmail = "";
  let cloudErrorMessage = "";
  async function cloudIsAdmin(userId) {
    if (!cloud) return false;
    const { data, error } = await cloud.from("site_admins").select("user_id").eq("user_id", userId).maybeSingle();
    return !error && !!data;
  }
  function showStorageWarn() {
    const r = $("#adminRoot");
    if (r && !$("#admWarn")) r.insertAdjacentHTML("afterbegin", '<p class="adm-warn" id="admWarn"><b>Trình duyệt đang chặn lưu trữ dữ liệu.</b> Mọi thay đổi chỉ giữ đến khi bạn tải lại hoặc đóng trang. Để lưu lâu dài, hãy mở file website.html trực tiếp bằng Chrome hoặc Edge từ thư mục trên máy (bấm đúp vào file), và dùng mục Sao lưu để tải dữ liệu về.</p>');
  }
  function normalizeProduct(p) {
    const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
    const fallback = p.image ? [p.image] : [];
    const finalImages = [...new Set([...images, ...fallback].map(v => String(v).trim()).filter(Boolean))];
    return {
      ...p,
      description: p.description || "",
      images: finalImages,
      image: finalImages[0] || p.image || ""
    };
  }

  async function uploadProductImage(src, productId, index) {
    if (!src.startsWith("data:")) return src;
    const blob = await (await fetch(src)).blob();
    const extension = blob.type === "image/png" ? "png" : "jpg";
    const token = window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2);
    const path = `${productId}/${token}-${index}.${extension}`;
    const bucket = cloud.storage.from(CLOUD.productBucket);
    const { data, error } = await bucket.upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: true });
    if (error) throw error;
    return bucket.getPublicUrl(data.path).data.publicUrl;
  }

  async function saveProducts() {
    let data = JSON.parse(JSON.stringify(PRODUCTS.map(normalizeProduct)));
    if (cloudEnabled) {
      if (!cloud || !isAuth()) { toast("Hãy đăng nhập quản trị để lưu sản phẩm lên website."); return false; }
      try {
        data = await Promise.all(data.map(async product => {
          product.images = await Promise.all(product.images.map((src, index) => uploadProductImage(src, product.id, index)));
          product.image = product.images[0] || "";
          return product;
        }));
        const { error } = await cloud.from("product_catalog").upsert({ id: "main", products: data, updated_at: new Date().toISOString() });
        if (error) throw error;
        PRODUCTS.splice(0, PRODUCTS.length, ...data.map(normalizeProduct));
        cloudErrorMessage = "";
        try { localStorage.setItem("site_products", JSON.stringify(data)); } catch (e) { /* cloud vẫn là bản chính */ }
        try { await idb.set("products", data); } catch (e) { /* cloud vẫn là bản chính */ }
        return true;
      } catch (error) {
        cloudErrorMessage = error.message || "Không thể đồng bộ dữ liệu cloud.";
        toast("Chưa lưu được lên website: " + cloudErrorMessage);
        return false;
      }
    }
    try { localStorage.setItem("site_products", JSON.stringify(data)); } catch (e) { /* bỏ qua */ }
    try { await withTimeout(idb.set("products", data), 4000); return true; }
    catch (e) { storageOK = false; showStorageWarn(); toast("Trình duyệt chặn lưu trữ: thay đổi chỉ giữ đến khi tải lại trang"); return true; }
  }

  window.AdminReady = (async () => {
    let localProducts = [];
    try {
      const stored = (() => {
        try { return JSON.parse(localStorage.getItem("site_products") || "null"); } catch (e) { return null; }
      })();
      if (Array.isArray(stored) && stored.length) localProducts = stored.map(normalizeProduct);
      else {
        const saved = await withTimeout(idb.get("products"), 2000);
        if (Array.isArray(saved)) localProducts = saved.map(normalizeProduct);
      }
      PRODUCTS.splice(0, PRODUCTS.length, ...localProducts);
    } catch (e) { if (!cloudEnabled) storageOK = false; /* cloud vẫn có thể là nguồn dữ liệu chính */ }

    if (cloudEnabled) {
      try {
        if (!cloud) throw new Error("Không tải được thư viện Supabase. Kiểm tra kết nối Internet.");
        const { data: catalog, error } = await cloud.from("product_catalog").select("products").eq("id", "main").maybeSingle();
        if (error) throw error;
        const cloudProducts = catalog && Array.isArray(catalog.products)
          ? catalog.products.map(normalizeProduct)
          : [];
        if (cloudProducts.length || !localProducts.length) PRODUCTS.splice(0, PRODUCTS.length, ...cloudProducts);
        else PRODUCTS.splice(0, PRODUCTS.length, ...localProducts);
        const { data: sessionData } = await cloud.auth.getSession();
        const user = sessionData.session && sessionData.session.user;
        if (user && await cloudIsAdmin(user.id)) {
          authMem = true;
          cloudAdminEmail = user.email || "";
          if (!cloudProducts.length && localProducts.length) await saveProducts();
        } else if (user) {
          await cloud.auth.signOut();
        }
      } catch (e) {
        cloudErrorMessage = e.message || "Không kết nối được Supabase.";
      }
    }
    window.__ready = true;
    syncAuthUI();
    window.UI.renderCart();
  })();

  /* ---------- đăng nhập ---------- */
  function isAuth() {
    if (cloudEnabled) return authMem;
    try {
      if (sessionStorage.getItem("admin_ok") === "1" || localStorage.getItem("admin_ok") === "1") return true;
    } catch (e) { /* bỏ qua */ }
    try { if (window.__admin_auth) return true; } catch (e) { /* bỏ qua */ }
    return authMem;
  }
  function setAuth(v) {
    authMem = v;
    if (!cloudEnabled) {
      try { window.__admin_auth = !!v; } catch (e) { /* bỏ qua */ }
      try { v ? sessionStorage.setItem("admin_ok", "1") : sessionStorage.removeItem("admin_ok"); } catch (e) { /* bỏ qua */ }
      try { v ? localStorage.setItem("admin_ok", "1") : localStorage.removeItem("admin_ok"); } catch (e) { /* bỏ qua */ }
    }
    syncAuthUI();
  }
  function syncAuthUI() {
    document.body.classList.toggle("is-admin", isAuth());
    const b = $("#loginBtn"); if (b) b.textContent = isAuth() ? "Quản trị" : "Đăng nhập";
    let bar = $("#admBar");
    if (isAuth() && !bar) {
      bar = document.createElement("div"); bar.id = "admBar"; bar.className = "admbar";
      bar.innerHTML = `<div class="container admbar__in"><span>Đang đăng nhập quản trị</span>
        <button type="button" data-act="add">+ Thêm sản phẩm</button>
        <a href="#/admin">Trang quản trị</a>
        <button type="button" data-act="pw">Đổi mật khẩu</button>
        <button type="button" data-act="out">Đăng xuất</button></div>`;
      document.body.insertBefore(bar, document.body.firstChild);
    } else if (!isAuth() && bar) bar.remove();
  }
  async function logout() {
    if (cloudEnabled && cloud) await cloud.auth.signOut();
    cloudAdminEmail = "";
    setAuth(false); toast("Đã đăng xuất"); if (window.ROUTE && window.ROUTE.page === "admin") renderAdmin();
  }

  /* ---------- tiện ích ---------- */
  const num = v => Math.max(0, parseInt(String(v).replace(/[^\d]/g, ""), 10) || 0);
  const formatPrice = value => String(value ?? "").replace(/[^\d]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  function bindPriceInput(input) {
    input.addEventListener("input", () => {
      const caret = input.selectionStart ?? input.value.length;
      const digitsBeforeCaret = input.value.slice(0, caret).replace(/[^\d]/g, "").length;
      input.value = formatPrice(input.value);
      let nextCaret = 0, digitCount = 0;
      while (nextCaret < input.value.length && digitCount < digitsBeforeCaret) {
        if (/\d/.test(input.value[nextCaret])) digitCount++;
        nextCaret++;
      }
      input.setSelectionRange(nextCaret, nextCaret);
    });
  }
  function download(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: type || "application/json" }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function fileToDataURL(file, maxSize, quality) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onerror = () => rej(new Error("read"));
      fr.onload = () => {
        const im = new Image();
        im.onerror = () => rej(new Error("img"));
        im.onload = () => {
          const sc = Math.min(1, maxSize / Math.max(im.width, im.height));
          const c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(im.width * sc)); c.height = Math.max(1, Math.round(im.height * sc));
          const ctx = c.getContext("2d"), png = file.type === "image/png";
          if (!png) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); }
          ctx.drawImage(im, 0, 0, c.width, c.height);
          res(c.toDataURL(png ? "image/png" : "image/jpeg", quality));
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  const catName = id => (CATEGORIES.find(c => c.id === id) || {}).name || id;
  const thumb = src => src ? `<img src="${esc(src)}" alt="">` : "–";

  /* ---------- form thêm / sửa sản phẩm ---------- */
  function closeModal() { const m = $("#admModal"); if (m) m.remove(); }
  function afterChange() {
    if (window.ROUTE && window.ROUTE.page === "admin") { if (state.tab === "products") renderRows(); }
    else { const y = window.scrollY; window.refreshRoute(); window.scrollTo(0, y); }
    window.UI.renderCart();
  }
  function normalizeProductImages(list) {
    return [...new Set((list || []).map(value => String(value).trim()).filter(Boolean))];
  }
  function productFormHTML(product, isNew) {
    return `
    <form class="adm-modal" id="pForm" novalidate>
      <h2>${isNew ? "Thêm sản phẩm" : "Sửa sản phẩm #" + product.id}</h2>
      <label>Tên sản phẩm *<input id="f_name" type="text" value="${esc(product.name)}"></label>
      <div class="adm-row">
        <label>Danh mục *<select id="f_cat">${CATEGORIES.map(c => `<option value="${c.id}"${c.id === product.cat ? " selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label>
        <label>Dòng chữ nhỏ (nhóm / hãng)<input id="f_line" type="text" value="${esc(product.line || "")}"></label>
      </div>
      <label id="f_subcat_wrap" hidden>Danh mục con *<select id="f_subcat"></select></label>
      <div class="adm-row">
        <label>Giá bán (đồng, 0 = Liên hệ)<input id="f_price" type="text" inputmode="numeric" value="${formatPrice(product.price || 0)}"></label>
        <label>Giá gốc (0 = không giảm giá)<input id="f_old" type="text" inputmode="numeric" value="${formatPrice(product.oldPrice || 0)}"></label>
      </div>
      <section class="adm-variant-set">
        <div class="adm-variant-set__head"><div><h3>Phân loại và giá</h3><p>Không bắt buộc. Thêm một dòng cho mỗi loại sản phẩm.</p></div><button type="button" class="btn-ghost" id="f_addVariant">+ Thêm phân loại</button></div>
        <div class="adm-variants" id="f_variants"></div>
      </section>
      <label>Mô tả sản phẩm<textarea id="f_desc" rows="4">${esc(product.description || "")}</textarea></label>
      <div class="adm-img">
        <div class="adm-prev" id="f_prev"></div>
        <div>
          <label class="adm-file">Tải nhiều ảnh từ máy<input id="f_files" type="file" accept="image/*" multiple></label>
          <label>hoặc dán đường dẫn ảnh (nhiều link cách nhau bởi dấu phẩy)<input id="f_path" type="text" placeholder="images/anh1.jpg, images/anh2.jpg"></label>
          <button type="button" class="btn-ghost" id="f_clear">Xóa tất cả ảnh</button>
        </div>
      </div>
      <p class="adm-err" id="f_err"></p>
      <div class="adm-actions">
        ${isNew ? "" : '<button type="button" class="btn-danger" id="f_del">Xóa sản phẩm</button>'}
        <span class="sp"></span>
        <button type="button" class="btn-ghost" id="f_cancel">Hủy</button>
        <button type="submit" class="btn-blue">Lưu</button>
      </div>
    </form>`;
  }
  function renderProductImagePreview(modal, images) {
    const list = normalizeProductImages(images);
    $("#f_prev", modal).innerHTML = list.length
        ? list.map(src => `<img src="${esc(src)}" alt="" style="width:48%;height:80px;object-fit:cover;border-radius:8px;margin:4px;display:inline-block;">`).join("")
        : "<span>Chưa có ảnh</span>";
    $("#f_path", modal).value = list.join(", ");
  }
  function renderProductVariantRows(modal, variants) {
    $("#f_variants", modal).innerHTML = variants.map((variant, index) => `
        <div class="adm-variant-row" data-variant-id="${esc(variant.id)}">
          <label>Loại ${index + 1}<input type="text" data-variant-name value="${esc(variant.name)}" placeholder="Ví dụ: 7 inch"></label>
          <label>Giá bán<input type="text" inputmode="numeric" data-variant-price value="${esc(formatPrice(variant.price))}" placeholder="0 = liên hệ"></label>
          <label>Giá gốc<input type="text" inputmode="numeric" data-variant-old-price value="${esc(formatPrice(variant.oldPrice))}" placeholder="Không bắt buộc"></label>
          <button type="button" class="btn-danger" data-remove-variant aria-label="Xóa loại ${index + 1}">Xóa</button>
        </div>`).join("");
    $$("[data-variant-price], [data-variant-old-price]", $("#f_variants", modal)).forEach(bindPriceInput);
  }
  function readProductVariantRows(modal) {
    return $$("#f_variants .adm-variant-row", modal).map(row => ({
      id: row.dataset.variantId,
      name: $("[data-variant-name]", row).value,
      price: $("[data-variant-price]", row).value,
      oldPrice: $("[data-variant-old-price]", row).value
    }));
  }
  function bindProductImageControls(modal, formState) {
    const paint = () => renderProductImagePreview(modal, formState.images);
    $("#f_clear", modal).addEventListener("click", () => { formState.images = []; $("#f_files", modal).value = ""; paint(); });
    $("#f_path", modal).addEventListener("input", e => { formState.images = normalizeProductImages(e.target.value.split(/[\n,;]/)); paint(); });
    $("#f_files", modal).addEventListener("change", async e => {
      const files = [...(e.target.files || [])];
      if (!files.length) return;
      try {
        const picked = await Promise.all(files.map(file => fileToDataURL(file, 1200, 0.85)));
        formState.images = normalizeProductImages([...formState.images, ...picked]);
        paint();
      } catch (err) { $("#f_err", modal).textContent = "Không đọc được một hoặc nhiều ảnh này. Hãy thử file JPG/PNG khác."; }
    });
    paint();
  }
  function bindProductVariantControls(modal, formState) {
    const render = () => renderProductVariantRows(modal, formState.variants);
    const read = () => readProductVariantRows(modal);
    $("#f_addVariant", modal).addEventListener("click", () => {
      formState.variants = read();
      formState.variants.push({ id: `variant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: "", price: "", oldPrice: "" });
      render();
    });
    $("#f_variants", modal).addEventListener("click", e => {
      const remove = e.target.closest("[data-remove-variant]");
      if (!remove) return;
      const idToRemove = remove.closest(".adm-variant-row").dataset.variantId;
      formState.variants = read().filter(variant => variant.id !== idToRemove);
      render();
    });
    render();
    return read;
  }
  function readProductFormData(modal, images, variantRows) {
    const name = $("#f_name", modal).value.trim();
    if (!name) { $("#f_err", modal).textContent = "Vui lòng nhập tên sản phẩm."; $("#f_name", modal).focus(); return null; }
    const subcategories = categorySubcategories($("#f_cat", modal).value);
    if (subcategories.length && !$("#f_subcat", modal).value) {
      $("#f_err", modal).textContent = "Vui lòng chọn danh mục con cho sản phẩm.";
      $("#f_subcat", modal).focus();
      return null;
    }
    const incompleteVariant = variantRows.find(variant => !variant.name.trim() || variant.price.trim() === "");
    if (incompleteVariant) { $("#f_err", modal).textContent = "Vui lòng nhập tên loại và giá bán cho từng phân loại."; return null; }
    const finalVariants = variantRows.map(variant => ({
      id: variant.id,
      name: variant.name.trim(),
      price: num(variant.price),
      oldPrice: num(variant.oldPrice)
    }));
    const startingVariant = finalVariants.length ? finalVariants.reduce((lowest, variant) => variant.price < lowest.price ? variant : lowest) : null;
    const finalImages = normalizeProductImages(images);
    return {
      cat: $("#f_cat", modal).value,
      subcat: $("#f_subcat", modal).value,
      line: $("#f_line", modal).value.trim(),
      name,
      description: $("#f_desc", modal).value.trim(),
      price: startingVariant ? startingVariant.price : num($("#f_price", modal).value),
      oldPrice: startingVariant ? startingVariant.oldPrice : num($("#f_old", modal).value),
      variants: finalVariants,
      image: finalImages[0] || "",
      images: finalImages
    };
  }
  function bindProductDelete(modal, product) {
    const button = $("#f_del", modal);
    if (!button) return;
    button.addEventListener("click", async () => {
      if (!confirm("Xóa sản phẩm này? Không thể hoàn tác.")) return;
      const index = PRODUCTS.indexOf(product);
      PRODUCTS.splice(index, 1);
      if (!await saveProducts()) { PRODUCTS.splice(index, 0, product); return; }
      closeModal(); toast("Đã xóa sản phẩm"); afterChange();
    });
  }
  function bindProductFormSubmit(modal, product, isNew, formState, readVariants) {
    $("#pForm", modal).addEventListener("submit", async e => {
      e.preventDefault();
      const data = readProductFormData(modal, formState.images, readVariants());
      if (!data) return;
      const previous = isNew ? null : { ...product };
      if (isNew) {
        data.id = PRODUCTS.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
        PRODUCTS.unshift(data);
      } else Object.assign(product, data);
      if (await saveProducts()) {
        closeModal(); toast(isNew ? "Đã thêm sản phẩm" : "Đã lưu thay đổi"); afterChange();
      } else if (isNew) {
        PRODUCTS.splice(PRODUCTS.indexOf(data), 1);
      } else {
        Object.assign(product, previous);
      }
    });
  }
  function openForm(id) {
    closeModal();
    const isNew = id == null;
    const product = isNew ? { cat: CATEGORIES[0].id, line: "", name: "", description: "", price: 0, oldPrice: 0, image: "", images: [""] } : PRODUCTS.find(item => item.id === id);
    if (!product) return;
    const formState = {
      images: Array.isArray(product.images) ? product.images.filter(Boolean).slice() : (product.image ? [product.image] : []),
      variants: Array.isArray(product.variants) ? product.variants.map((variant, index) => ({
        id: String(variant.id || `variant-${index + 1}`),
        name: String(variant.name || ""),
        price: variant.price ?? "",
        oldPrice: variant.oldPrice ?? ""
      })) : []
    };
    const modal = document.createElement("div");
    modal.className = "adm-ov"; modal.id = "admModal";
    modal.innerHTML = productFormHTML(product, isNew);
    document.body.appendChild(modal);
    const categorySelect = $("#f_cat", modal);
    const subcategoryWrap = $("#f_subcat_wrap", modal);
    const renderSubcategories = selectedId => {
      const options = categorySubcategories(categorySelect.value);
      subcategoryWrap.hidden = options.length === 0;
      $("#f_subcat", modal).innerHTML = `<option value="">Chọn danh mục con</option>` +
        options.map(item => `<option value="${esc(item.id)}"${item.id === selectedId ? " selected" : ""}>${esc(item.name)}</option>`).join("");
      $("#f_subcat", modal).required = options.length > 0;
    };
    renderSubcategories(product.subcat || "");
    categorySelect.addEventListener("change", () => renderSubcategories(""));
    bindProductImageControls(modal, formState);
    const readVariants = bindProductVariantControls(modal, formState);
    bindPriceInput($("#f_price", modal));
    bindPriceInput($("#f_old", modal));
    modal.addEventListener("mousedown", e => { if (e.target === modal) closeModal(); });
    $("#f_cancel", modal).addEventListener("click", closeModal);
    bindProductDelete(modal, product);
    bindProductFormSubmit(modal, product, isNew, formState, readVariants);
    $("#f_name", modal).focus();
  }

  /* ---------- trang quản trị ---------- */
  const state = { tab: "products", q: "", cat: "all", page: 1 };
  const PAGE_SIZE = 15;

  function renderAdmin() {
    clearInterval(window.__st);
    const root = $("#adminRoot");
    if (!root) return;
    isAuth() ? renderDash(root) : renderLogin(root);
    if (!storageOK) showStorageWarn();
  }

  function renderLogin(root) {
    root.innerHTML = `
    <div class="adm-login">
      <h1>Đăng nhập quản trị</h1>
      ${cloudEnabled ? `<p class="adm-note">Dùng email và mật khẩu tài khoản quản trị đã tạo trong Supabase.${cloudErrorMessage ? " " + esc(cloudErrorMessage) : ""}</p>` : ""}
      <form id="admLogin">
        <label>${cloudEnabled ? "Email quản trị" : "Tên đăng nhập"}<input id="aUser" type="${cloudEnabled ? "email" : "text"}" autocomplete="username" required></label>
        <label>Mật khẩu<input id="aPass" type="password" autocomplete="current-password"></label>
        <p class="adm-err" id="aErr"></p>
        <button type="submit" class="btn-blue btn-blue--block">Đăng nhập</button>
      </form>
    </div>`;
    $("#aUser").focus();
    $("#admLogin").addEventListener("submit", async e => {
      e.preventDefault();
      const user = $("#aUser").value.trim();
      const pass = $("#aPass").value;
      if (cloudEnabled) {
        if (!cloud) { $("#aErr").textContent = "Chưa tải được dịch vụ đăng nhập. Hãy kiểm tra kết nối Internet."; return; }
        const { data, error } = await cloud.auth.signInWithPassword({ email: user, password: pass });
        if (error || !data.user) { $("#aErr").textContent = "Email hoặc mật khẩu không đúng."; $("#aPass").value = ""; return; }
        if (!await cloudIsAdmin(data.user.id)) {
          await cloud.auth.signOut();
          $("#aErr").textContent = "Tài khoản này chưa được cấp quyền quản trị.";
          return;
        }
        authMem = true;
        cloudAdminEmail = data.user.email || user;
        setAuth(true);
        const { data: catalog, error: catalogError } = await cloud.from("product_catalog").select("products").eq("id", "main").maybeSingle();
        if (!catalogError && !catalog && PRODUCTS.length && !await saveProducts()) {
          $("#aErr").textContent = "Đăng nhập được nhưng chưa đưa được sản phẩm lên cloud. Hãy kiểm tra cấu hình Supabase.";
          setAuth(false); await cloud.auth.signOut(); return;
        }
        toast("Đăng nhập thành công"); renderAdmin(); return;
      }
      const enteredHash = hashPass(pass);
      const ok = user === ADMIN.user && enteredHash === currentHash();
      if (!ok) { $("#aErr").textContent = "Sai tên đăng nhập hoặc mật khẩu."; $("#aPass").value = ""; return; }
      if (enteredHash !== currentHash()) persistSavedHash(enteredHash);
      setAuth(true); toast("Đăng nhập thành công"); renderAdmin();
    });
  }

  function renderDash(root) {
    root.innerHTML = `
    <div class="adm-top">
      <h1>Quản trị website</h1>
      <div class="adm-top__r"><span>Xin chào, <b>${esc(cloudEnabled ? (cloudAdminEmail || "quản trị") : ADMIN.user)}</b></span><a class="btn-ghost" href="#/">Xem website</a><button type="button" class="btn-ghost" id="aPw">Đổi mật khẩu</button><button type="button" class="btn-ghost" id="aOut">Đăng xuất</button></div>
    </div>
    <p class="adm-note">${cloudEnabled ? (cloudErrorMessage ? "Cloud chưa đồng bộ: " + esc(cloudErrorMessage) : "Sản phẩm được lưu trên cloud và hiển thị cho mọi khách truy cập.") : "Dữ liệu đang lưu trên trình duyệt này. Hãy cấu hình Supabase trước khi xuất bản để mọi người cùng xem sản phẩm."}</p>
    <div class="adm-tabs" id="aTabs">
      ${[["products", "Sản phẩm"], ["site", "Thông tin công ty"], ["backup", "Sao lưu và khôi phục"], ["account", "Tài khoản"]]
        .map(([k, l]) => `<button type="button" data-tab="${k}" class="${state.tab === k ? "active" : ""}">${l}</button>`).join("")}
    </div>
    <div id="admBody"></div>`;
    $("#aOut").addEventListener("click", logout);
    $("#aPw").addEventListener("click", openPwModal);
    $("#aTabs").addEventListener("click", e => {
      const b = e.target.closest("[data-tab]"); if (!b) return;
      state.tab = b.dataset.tab;
      $$("#aTabs button").forEach(x => x.classList.toggle("active", x === b));
      showTab();
    });
    showTab();
  }
  function showTab() { ({ products: tabProducts, site: tabSite, backup: tabBackup, account: tabAccount })[state.tab](); }

  /* --- tab sản phẩm --- */
  function filtered() {
    const q = state.q.trim().toLowerCase();
    return PRODUCTS.filter(p => (state.cat === "all" || p.cat === state.cat) && (!q || (p.name + " " + (p.line || "")).toLowerCase().includes(q)));
  }
  function renderRows() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    const rows = list.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
    $("#pCount").textContent = `${list.length} sản phẩm`;
    $("#pBody").innerHTML = rows.length ? rows.map(p => {
      const pricing = productPriceInfo(p);
      return `
      <tr>
        <td><span class="adm-thumb">${thumb(p.image)}</span></td>
        <td>${p.id}</td>
        <td><b>${esc(p.name)}</b><br><small>${esc(p.line || "")}</small></td>
        <td>${esc(catName(p.cat))}${p.subcat ? `<br><small>${esc((categorySubcategories(p.cat).find(item => item.id === p.subcat) || {}).name || p.subcat)}</small>` : ""}</td>
        <td>${pricing.from ? "Từ " : ""}${esc(money(pricing.price))}</td>
        <td>${pricing.oldPrice ? esc(money(pricing.oldPrice)) : "–"}</td>
        <td class="adm-ops"><button type="button" data-pe="${p.id}">Sửa</button><button type="button" class="danger" data-pd="${p.id}">Xóa</button></td>
      </tr>`;
    }).join("") : '<tr><td colspan="7" class="adm-empty">Không có sản phẩm phù hợp.</td></tr>';
    $("#pPager").innerHTML = pages > 1
      ? `<button type="button" data-pg="-1" ${state.page <= 1 ? "disabled" : ""}>‹ Trước</button><span>Trang ${state.page} / ${pages}</span><button type="button" data-pg="1" ${state.page >= pages ? "disabled" : ""}>Sau ›</button>` : "";
  }
  function tabProducts() {
    $("#admBody").innerHTML = `
      <div class="adm-bar">
        <input id="pq" type="search" placeholder="Tìm sản phẩm..." value="${esc(state.q)}">
        <select id="pc"><option value="all">Tất cả danh mục</option>${CATEGORIES.map(c => `<option value="${c.id}"${state.cat === c.id ? " selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
        <button type="button" class="btn-blue" id="pAdd">+ Thêm sản phẩm</button>
      </div>
      <div class="adm-count" id="pCount"></div>
      <div class="adm-wrap"><table class="adm-table">
        <thead><tr><th>Ảnh</th><th>ID</th><th>Sản phẩm</th><th>Danh mục</th><th>Giá bán</th><th>Giá gốc</th><th></th></tr></thead>
        <tbody id="pBody"></tbody></table></div>
      <div class="adm-pager" id="pPager"></div>`;
    renderRows();
    $("#pq").addEventListener("input", e => { state.q = e.target.value; state.page = 1; renderRows(); });
    $("#pc").addEventListener("change", e => { state.cat = e.target.value; state.page = 1; renderRows(); });
    $("#pAdd").addEventListener("click", () => openForm(null));
    $("#admBody").addEventListener("click", async e => {
      const pe = e.target.closest("[data-pe]"); if (pe) return openForm(Number(pe.dataset.pe));
      const pd = e.target.closest("[data-pd]");
      if (pd) {
        const p = PRODUCTS.find(x => x.id === Number(pd.dataset.pd));
        if (p && confirm("Xóa sản phẩm \"" + p.name + "\"? Không thể hoàn tác.")) {
          const index = PRODUCTS.indexOf(p);
          PRODUCTS.splice(index, 1);
          if (await saveProducts()) { toast("Đã xóa sản phẩm"); renderRows(); }
          else PRODUCTS.splice(index, 0, p);
        }
        return;
      }
      const pg = e.target.closest("[data-pg]"); if (pg) { state.page += Number(pg.dataset.pg); renderRows(); }
    });
  }

  /* --- tab thông tin công ty --- */
  function tabSite() {
    const FIELDS = [["name", "Tên công ty"], ["slogan", "Slogan"], ["hotline", "Hotline"], ["email", "Email"], ["address", "Địa chỉ trụ sở chính"],
      ["taxCode", "Mã số thuế"], ["zalo", "Link Zalo (dạng https://zalo.me/số-điện-thoại)"], ["office2Title", "Tiêu đề văn phòng thứ hai"],
      ["office2Address", "Địa chỉ văn phòng thứ hai"], ["mapEmbed", "Bản đồ Google Maps (dán link nhúng hoặc cả đoạn iframe)"], ["chatWelcome", "Lời chào trong khung chat"]];
    let logo = SITE.logo || "";
    $("#admBody").innerHTML = `
      <form class="adm-form" id="sForm">
        <div class="adm-grid">
          ${FIELDS.map(([k, l]) => `<label>${l}<input id="s_${k}" type="text" value="${esc(SITE[k] || "")}"></label>`).join("")}
          <label>Dòng khuyến mãi trên cùng (tiêu đề)<input id="s_pt" type="text" value="${esc(SITE.topPromo.title)}"></label>
          <label>Dòng khuyến mãi trên cùng (dòng nhỏ)<input id="s_ps" type="text" value="${esc(SITE.topPromo.sub)}"></label>
        </div>
        <div class="adm-img">
          <div class="adm-prev adm-prev--logo" id="s_prev"></div>
          <div><label class="adm-file">Tải logo từ máy<input id="s_file" type="file" accept="image/*"></label>
          <button type="button" class="btn-ghost" id="s_clear">Xóa logo</button></div>
        </div>
        <p class="adm-err" id="s_err"></p>
        <div class="adm-actions"><span class="sp"></span><button type="submit" class="btn-blue">Lưu thông tin</button></div>
      </form>`;
    const paint = () => { $("#s_prev").innerHTML = logo ? `<img src="${esc(logo)}" alt="">` : "<span>Chưa có logo</span>"; };
    paint();
    $("#s_clear").addEventListener("click", () => { logo = ""; $("#s_file").value = ""; paint(); });
    $("#s_file").addEventListener("change", async e => {
      const f = e.target.files[0]; if (!f) return;
      try { logo = await fileToDataURL(f, 240, 0.9); paint(); } catch (err) { $("#s_err").textContent = "Không đọc được ảnh này."; }
    });
    $("#sForm").addEventListener("submit", e => {
      e.preventDefault();
      const o = {};
      FIELDS.forEach(([k]) => { o[k] = $("#s_" + k).value.trim(); });
      const m = o.mapEmbed.match(/src="([^"]+)"/); if (m) o.mapEmbed = m[1];
      o.topPromo = { title: $("#s_pt").value.trim(), sub: $("#s_ps").value.trim() };
      o.logo = logo;
      try { localStorage.setItem("site_override", JSON.stringify(o)); }
      catch (err) { $("#s_err").textContent = "Không lưu được (logo quá lớn hoặc trình duyệt chặn lưu trữ)."; return; }
      toast("Đã lưu. Đang áp dụng..."); setTimeout(() => location.reload(), 600);
    });
  }

  /* --- tab sao lưu --- */
  function tabBackup() {
    $("#admBody").innerHTML = `
      <div class="adm-cards">
        <div class="adm-card"><h3>Tải dữ liệu về máy</h3><p>Lưu toàn bộ sản phẩm (kèm ảnh) và thông tin công ty vào một file để cất giữ hoặc chuyển sang máy khác.</p>
          <button type="button" class="btn-blue" id="bExp">Tải file sao lưu</button></div>
        <div class="adm-card"><h3>Khôi phục từ file sao lưu</h3><p>Chọn file sao lưu đã tải trước đó. Dữ liệu hiện tại sẽ bị thay thế.</p>
          <label class="adm-file">Chọn file .json<input id="bImp" type="file" accept="application/json,.json"></label></div>
        <div class="adm-card"><h3>Quay về dữ liệu mẫu</h3><p>Xóa mọi thay đổi bạn đã lưu trên trình duyệt này và dùng lại dữ liệu có sẵn trong file.</p>
          <button type="button" class="btn-danger" id="bReset">Xóa thay đổi</button></div>
      </div><p class="adm-err" id="b_err"></p>`;
    $("#bExp").addEventListener("click", () => {
      let site = null; try { site = JSON.parse(localStorage.getItem("site_override") || "null"); } catch (e) { /* bỏ qua */ }
      download("sao-luu-website-" + new Date().toISOString().slice(0, 10) + ".json",
        JSON.stringify({ app: "website-admin", version: 1, exportedAt: new Date().toISOString(), products: PRODUCTS, site }));
      toast("Đã tải file sao lưu");
    });
    $("#bImp").addEventListener("change", e => {
      const f = e.target.files[0]; if (!f) return;
      const fr = new FileReader();
      fr.onload = async () => {
        try {
          const d = JSON.parse(fr.result);
          if (!d || d.app !== "website-admin" || !Array.isArray(d.products) || d.products.some(p => typeof p.id !== "number" || !p.name)) throw new Error("bad");
          if (!confirm("Khôi phục " + d.products.length + " sản phẩm từ file này? Dữ liệu hiện tại sẽ bị thay thế.")) return;
          const previous = PRODUCTS.slice();
          PRODUCTS.splice(0, PRODUCTS.length, ...d.products.map(normalizeProduct));
          if (cloudEnabled) {
            if (!await saveProducts()) { PRODUCTS.splice(0, PRODUCTS.length, ...previous); throw new Error("cloud"); }
          } else {
            await idb.set("products", d.products);
          }
          if (d.site) localStorage.setItem("site_override", JSON.stringify(d.site)); else localStorage.removeItem("site_override");
          toast("Đã khôi phục. Đang áp dụng..."); setTimeout(() => location.reload(), 600);
        } catch (err) { $("#b_err").textContent = err.message === "cloud" ? "Không thể đồng bộ bản sao lưu lên website." : "File này không phải file sao lưu hợp lệ của website."; }
      };
      fr.readAsText(f);
    });
    $("#bReset").addEventListener("click", async () => {
      if (!confirm("Xóa mọi sản phẩm và thông tin bạn đã chỉnh, quay về dữ liệu mẫu? Không thể hoàn tác (hãy tải file sao lưu trước).")) return;
      const previous = PRODUCTS.slice();
      try {
        if (cloudEnabled) {
          PRODUCTS.length = 0;
          if (!await saveProducts()) { PRODUCTS.splice(0, PRODUCTS.length, ...previous); return; }
        } else {
          await idb.del("products");
        }
        localStorage.removeItem("site_override");
      } catch (e) { PRODUCTS.splice(0, PRODUCTS.length, ...previous); toast("Không thể xóa dữ liệu."); return; }
      toast("Đã xóa thay đổi. Đang áp dụng..."); setTimeout(() => location.reload(), 600);
    });
  }

  /* --- đổi mật khẩu (dùng ở tab Tài khoản và cửa sổ nhỏ) --- */
  function pwFormHTML(withClose) {
    return `<form class="adm-pwform" novalidate>
      ${cloudEnabled ? "" : '<label>Mật khẩu hiện tại<input name="cur" type="password" autocomplete="current-password"></label>'}
      <label>Mật khẩu mới (từ 6 ký tự)<input name="n1" type="password" autocomplete="new-password"></label>
      <label>Nhập lại mật khẩu mới<input name="n2" type="password" autocomplete="new-password"></label>
      <p class="adm-err" data-role="err"></p>
      <div class="pw-result" data-role="res" hidden></div>
      <div class="adm-actions"><span class="sp"></span>${withClose ? '<button type="button" class="btn-ghost" data-role="close">Đóng</button>' : ""}<button type="submit" class="btn-blue">Lưu mật khẩu mới</button></div>
    </form>`;
  }
  function bindPwForm(form) {
    const err = form.querySelector('[data-role=err]'), res = form.querySelector('[data-role=res]');
    const close = form.querySelector('[data-role=close]'); if (close) close.addEventListener("click", closeModal);
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const cur = form.elements.cur ? form.elements.cur.value : "", n1 = form.elements.n1.value, n2 = form.elements.n2.value;
      res.hidden = true;
      if (cloudEnabled) {
        if (n1.length < 6) { err.textContent = "Mật khẩu mới phải từ 6 ký tự."; return; }
        if (n1 !== n2) { err.textContent = "Hai lần nhập mật khẩu mới chưa khớp."; return; }
        const { error } = await cloud.auth.updateUser({ password: n1 });
        if (error) { err.textContent = "Không đổi được mật khẩu: " + error.message; return; }
        err.textContent = ""; form.reset(); res.hidden = false;
        res.innerHTML = '<p class="pw-ok"><b>Đã đổi mật khẩu quản trị.</b> Mật khẩu mới được áp dụng cho tài khoản Supabase.</p>';
        toast("Đã đổi mật khẩu"); return;
      }
      if (hashPass(cur) !== currentHash()) { err.textContent = "Mật khẩu hiện tại không đúng."; return; }
      if (n1.length < 6) { err.textContent = "Mật khẩu mới phải từ 6 ký tự."; return; }
      if (n1 !== n2) { err.textContent = "Hai lần nhập mật khẩu mới chưa khớp."; return; }
      const hash = hashPass(n1);
      persistSavedHash(hash);
      let saved = true;
      try { localStorage.setItem("admin_pass", hash); } catch (x) { saved = false; }
      err.textContent = ""; form.reset();
      const line = 'const ADMIN = { user: "' + ADMIN.user + '", salt: "' + ADMIN.salt + '", passHash: "' + hash + '" };';
      res.hidden = false;
      res.innerHTML = `<p class="pw-ok"><b>Đã đổi mật khẩu.</b> ${saved ? "Có hiệu lực ngay trên trình duyệt này, bạn không cần làm gì thêm." : "Trình duyệt đang chặn lưu trữ nên mật khẩu mới chỉ giữ đến khi tải lại trang."}</p>
        <details><summary>Muốn dùng mật khẩu này trên mọi máy / mọi trình duyệt?</summary>
          <p>Mở file <code>website.html</code>, tìm dòng bắt đầu bằng <code>const ADMIN</code> (khoảng dòng 43), thay cả dòng đó bằng dòng bên dưới rồi lưu file:</p>
          <textarea readonly rows="3">${esc(line)}</textarea>
          <button type="button" class="btn-ghost" data-role="copy">Sao chép dòng này</button>
        </details>`;
      res.querySelector('[data-role=copy]').addEventListener("click", ev => {
        const ta = res.querySelector("textarea"); ta.select();
        const done = () => { ev.target.textContent = "Đã sao chép"; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(line).then(done, () => { document.execCommand("copy"); done(); });
        else { document.execCommand("copy"); done(); }
      });
      toast("Đã đổi mật khẩu");
    });
  }
  function tabAccount() {
    $("#admBody").innerHTML = `<div class="adm-form adm-form--narrow"><h3>Đổi mật khẩu</h3>${pwFormHTML(false)}</div>`;
    bindPwForm($("#admBody form"));
  }
  function openPwModal() {
    closeModal();
    const ov = document.createElement("div");
    ov.className = "adm-ov"; ov.id = "admModal";
    ov.innerHTML = `<div class="adm-modal adm-modal--sm"><h2>Đổi mật khẩu</h2>${pwFormHTML(true)}</div>`;
    document.body.appendChild(ov);
    ov.addEventListener("mousedown", e => { if (e.target === ov) closeModal(); });
    bindPwForm($("form", ov));
    const currentInput = $("input[name=cur]", ov) || $("input[name=n1]", ov);
    if (currentInput) currentInput.focus();
  }

  /* ---------- sự kiện chung ---------- */
  document.addEventListener("click", e => {
    const ed = e.target.closest("[data-edit]");
    if (ed && isAuth()) { e.preventDefault(); return openForm(Number(ed.dataset.edit)); }
    const act = e.target.closest("#admBar [data-act]");
    if (act) { const a = act.dataset.act; if (a === "add") openForm(null); else if (a === "pw") openPwModal(); else logout(); }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

  const baseRender = window.renderPage;
  window.renderPage = page => { if (page === "admin") renderAdmin(); else baseRender(page); syncAuthUI(); };
})();

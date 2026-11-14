/* ======================================================================
   BỘ ĐIỀU HƯỚNG GIỮA CÁC TRANG + NỘI DUNG KHUNG TỪNG TRANG
   ====================================================================== */

(function () {
  "use strict";
  const { $, applySite, setActive, closeMega, closeDrawer } = window.UI;
  const VIEWS = {"home": "<main>\n  <section class=\"container hero\">\n    <aside class=\"side\"><ul class=\"side-list\" id=\"sideList\"></ul></aside>\n    <div class=\"slider\" id=\"slider\"></div>\n  </section>\n  <section class=\"container policies\" id=\"policies\"></section>\n  <section class=\"container tiles\" id=\"tiles\"></section>\n  <div id=\"homeSections\"></div>\n</main>", "san-pham": "<main class=\"container\">\n  <h1 class=\"page-title\" id=\"prodTitle\">Sản phẩm</h1>\n  <p class=\"page-sub\" id=\"prodCount\"></p>\n  <div class=\"chips\" id=\"chips\"></div>\n  <div class=\"product-grid\" id=\"prodGrid\"></div>\n</main>", "khuyen-mai": "<main class=\"container posts\" id=\"postList\"></main>", "tin-tuc": "<main class=\"container posts\" id=\"postList\"></main>", "tuyen-dung": "<main class=\"container jobs\">\n  <h1>Tuyển dụng</h1>\n  <div class=\"filters\" id=\"filters\"></div>\n  <div class=\"job-grid\" id=\"jobGrid\"></div>\n</main>", "lien-he": "<main class=\"container\">\n  <div class=\"map\" id=\"mapBox\"></div>\n  <div class=\"contact\">\n    <div class=\"contact__info\">\n      <h2 data-site=\"name\">TÊN CÔNG TY</h2>\n      <p><b>TRỤ SỞ CHÍNH:</b><br>Địa chỉ: <span data-site=\"address\">Địa chỉ</span></p>\n      <p>➤ <b>Điện thoại:</b> <a href=\"#\" data-site=\"hotlineLink\"><span data-site=\"hotline\">0900 000 000</span></a></p>\n      <p>➤ <b>Email:</b> <a href=\"#\" data-site=\"emailLink\"><span data-site=\"email\">info@example.com</span></a></p>\n      <p><b data-site=\"office2Title\">VĂN PHÒNG ĐẠI DIỆN</b><br>Địa chỉ: <span data-site=\"office2Address\">Địa chỉ</span></p>\n    </div>\n    <form class=\"contact__form\" id=\"contactForm\">\n      <h2>Liên hệ <b>Với chúng tôi</b></h2>\n      <label for=\"cName\">Họ và tên *</label>\n      <input id=\"cName\" type=\"text\" required>\n      <label for=\"cMail\">Địa chỉ email *</label>\n      <input id=\"cMail\" type=\"email\" required>\n      <label for=\"cMsg\">Nội dung *</label>\n      <textarea id=\"cMsg\" required></textarea>\n      <button type=\"submit\" class=\"btn-send\">Gửi liên hệ</button>\n    </form>\n  </div>\n</main>", "gioi-thieu": "<main class=\"container\">\n  <section class=\"about\">\n    <div class=\"about__img\"><span>ẢNH GIỚI THIỆU<br>(thay sau)</span></div>\n    <div>\n      <small>VỀ CHÚNG TÔI</small>\n      <h1>Giới thiệu về <span data-site=\"name\">TÊN CÔNG TY</span></h1>\n      <p>Đoạn giới thiệu công ty - sửa sau. Nêu số năm kinh nghiệm, lĩnh vực hoạt động, các hãng đại diện phân phối và cam kết với khách hàng.</p>\n      <p>Đoạn thứ hai - sửa sau: tầm nhìn, sứ mệnh, giá trị cốt lõi.</p>\n      <div class=\"stats\">\n        <div><b>10+</b><span>Năm kinh nghiệm</span></div>\n        <div><b>5.000+</b><span>Sản phẩm</span></div>\n        <div><b>2.000+</b><span>Khách hàng</span></div>\n      </div>\n    </div>\n  </section>\n</main>", "admin": "<main class=\"container admin\" id=\"adminRoot\"></main>"};
  const TITLES = {"home": "Trang chủ", "san-pham": "Sản phẩm", "khuyen-mai": "Khuyến mãi", "tin-tuc": "Tin tức", "tuyen-dung": "Tuyển dụng", "lien-he": "Liên hệ", "gioi-thieu": "Giới thiệu", "admin": "Quản trị"};
  const NAVKEY = { "gioi-thieu": "about" };
  let rendered = false;

  function route() {
    if (!window.__ready) return;
    const h = location.hash;
    if (rendered && ((h && !h.startsWith("#/")) || (!h && location.href.endsWith("#")))) return;   // bỏ qua các liên kết "#" trống
    const path = h.startsWith("#/") ? h.slice(2) : "";
    const qi = path.indexOf("?");
    const name = (qi < 0 ? path : path.slice(0, qi)).replace(/\/$/, "") || "home";
    const page = VIEWS[name] ? name : "home";
    window.ROUTE = { page, params: new URLSearchParams(qi < 0 ? "" : path.slice(qi + 1)) };
    document.body.dataset.page = page;
    $("#view").innerHTML = VIEWS[page];
    applySite();
    window.renderPage(page);
    setActive(NAVKEY[page] || page);
    closeMega();
    closeDrawer();
    $("#nav").classList.remove("open");
    $("#searchInput").value = page === "san-pham" ? (window.ROUTE.params.get("q") || "") : "";
    document.title = TITLES[page] + " - " + SITE.name;
    window.scrollTo(0, 0);
    rendered = true;
  }
  window.addEventListener("error", e => {
    const v = document.getElementById("view");
    if (v && !v.innerHTML.trim()) v.innerHTML = '<main class="container"><p class="empty">Trang gặp lỗi: ' + String(e.message).replace(/</g, "&lt;") + '. Hãy chụp màn hình dòng này gửi cho người hỗ trợ.</p></main>';
  });
  window.refreshRoute = route;
  window.addEventListener("hashchange", route);
  (window.AdminReady || Promise.resolve()).then(() => { window.__ready = true; route(); });
})();

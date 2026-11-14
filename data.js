/* =====================================================================
   FILE DỮ LIỆU - BẠN CHỈ CẦN SỬA FILE NÀY ĐỂ THAY NỘI DUNG CẢ WEBSITE
   - Ảnh: điền đường dẫn (vd "images/sp1.jpg"). Để "" thì hiện khung giữ chỗ.
   - Nên tạo thư mục "images" cạnh các file html rồi bỏ ảnh vào.
   ===================================================================== */

/* ===================== THÔNG TIN CÔNG TY ===================== */
const SITE = {
  name: "TÊN CÔNG TY",                       // tên hiển thị ở logo, footer
  slogan: "Slogan - sửa sau",
  logo: "",                                  // vd "images/logo.png" (để "" dùng logo giữ chỗ)
  hotline: "038 348 1918",
  email: "vanquang4812@gmail.com",
  address: "Địa chỉ trụ sở chính - sửa sau",
  office2Title: "VĂN PHÒNG ĐẠI DIỆN",
  office2Address: "Địa chỉ văn phòng đại diện - sửa sau",
  taxCode: "0000000000",
  zalo: "https://zalo.me/0900000000",
  mapEmbed: "",                              // dán link nhúng Google Maps (phần src="...") vào đây
  chatWelcome: "Chào mừng quý khách đã đến với website. Nếu quý khách có bất kỳ thắc mắc nào, vui lòng liên hệ tại đây để được chúng tôi tư vấn hỗ trợ.",
  topPromo: { title: "GIÁ SỐC HÔM NAY", sub: "GIẢM ĐẾN 50%" },
  social: { facebook: "#", zalo: "#", youtube: "#", tiktok: "#" }
};

/* ===================== TÀI KHOẢN QUẢN TRỊ =====================
   Đăng nhập tại nút "Đăng nhập" ở đầu trang. Mật khẩu ban đầu: Admin@2026
   HÃY ĐỔI NGAY trong Quản trị > Tài khoản. Chỉ lưu mã băm (không ghi mật khẩu thật trong file).
   LƯU Ý: đây là khóa phía trình duyệt, đủ để tránh bấm nhầm, KHÔNG phải bảo mật thật sự. */
const ADMIN = { user: "admin", salt: "shop-v1", passHash: "a84839bf418b5465e7ea08f60e893096850cd26355378897deaac3c034e7e5d0" };

/* ===================== LƯU TRỮ DÙNG CHUNG (SUPABASE) =====================
  Điền Project URL và Publishable/anon key trong Supabase Project Settings > API.
  Chỉ dùng khóa public; tuyệt đối không đặt service_role key trong website. */
const CLOUD = { supabaseUrl: "https://ygwvvymwffmyuektrkip.supabase.co", publishableKey: "sb_publishable_e0XUwmbwGRSbjE31sQCUvg_elAxIQtK", productBucket: "product-images" };

/* ===================== DẢI LOGO HÃNG TRÊN CÙNG ===================== */
const TOP_BRANDS = [
  { name: "LOGO 1", image: "" }, { name: "LOGO 2", image: "" }, { name: "LOGO 3", image: "" },
  { name: "LOGO 4", image: "" }, { name: "LOGO 5", image: "" }, { name: "LOGO 6", image: "" },
  { name: "LOGO 7", image: "" }, { name: "LOGO 8", image: "" }
];

/* ===================== DANH MỤC SẢN PHẨM + MENU LỚN =====================
   icon: ảnh nhỏ cạnh tên danh mục | groups: các nhóm trong menu lớn
   Mỗi item: { name, image, link }; item có id là danh mục con để lọc sản phẩm. */
const mkItems = (n, label = "Dòng sản phẩm") =>
  Array.from({ length: n }, (_, i) => ({ name: `${label} ${i + 1}`, image: "", link: "" }));

const CATEGORIES = [
  { id: "plc",     name: "Bộ lập trình PLC",   icon: "", groups: [{ title: "NHÓM HÃNG A", items: mkItems(9) }, { title: "NHÓM HÃNG B", items: mkItems(7) }] },
  { id: "hmi",     name: "Màn hình HMI",       icon: "", groups: [{ title: "NHÓM HÃNG A", items: mkItems(6) }, { title: "NHÓM HÃNG B", items: mkItems(5) }] },
  { id: "bientan", name: "Biến tần",           icon: "", groups: [{ title: "NHÓM HÃNG A", items: mkItems(7) }, { title: "NHÓM HÃNG B", items: mkItems(7) }] },
  { id: "servo",   name: "Động cơ servo",      icon: "", groups: [{ title: "NHÓM HÃNG A", items: mkItems(7) }] },
  { id: "nguon",   name: "Bộ nguồn",           icon: "", groups: [{ title: "NHÓM HÃNG A", items: mkItems(7) }, { title: "NHÓM HÃNG B", items: mkItems(4) }] },
  { id: "dongcat", name: "Thiết bị đóng cắt",  icon: "", groups: [{ title: "NHÓM HÃNG A", items: mkItems(7) }, { title: "NHÓM HÃNG B", items: mkItems(6) }] },
  { id: "cambien", name: "Cảm biến",           icon: "", groups: [{ title: "CẢM BIẾN CÔNG NGHIỆP", items: mkItems(9) }, { title: "CẢM BIẾN MÔI TRƯỜNG", items: mkItems(7) }] },
  { id: "congtac", name: "Công tắc",           icon: "", groups: [{ title: "NHÓM HÃNG A", items: mkItems(7) }] },
  { id: "doluong", name: "Thiết bị đo lường",  icon: "", groups: [{ title: "NHÓM HÃNG A", items: mkItems(8) }, { title: "NHÓM HÃNG B", items: mkItems(5) }] },
  { id: "khac",    name: "Thiết bị khác",      icon: "", groups: [{ title: "NHÓM KHÁC", items: mkItems(6) }] },
  { id: "linh-kien", name: "Linh kiện điện tử", icon: "", groups: [{
    title: "LINH KIỆN & PHỤ KIỆN",
    items: [
      { id: "hop-dung", name: "Hộp đựng linh kiện điện tử", image: "", link: "" },
      { id: "led", name: "LED các loại", image: "", link: "" },
      { id: "cong-tac-nut-nhan", name: "Công tắc - nút nhấn", image: "", link: "" },
      { id: "dong-co-robot", name: "Động cơ - phụ kiện robot", image: "", link: "" },
      { id: "day-jack-header", name: "Dây - jack - jump - header", image: "", link: "" },
      { id: "dong-ho-do", name: "Đồng hồ đo - thiết bị đo", image: "", link: "" },
      { id: "plc-module-ic", name: "PLC - module - IC - kit vi điều khiển", image: "", link: "" },
      { id: "cam-bien-module", name: "Cảm biến - module", image: "", link: "" },
      { id: "dung-cu-tien-ich", name: "Dụng cụ & thiết bị tiện ích", image: "", link: "" },
      { id: "mach-nap", name: "Mạch nạp code vi điều khiển", image: "", link: "" },
      { id: "pin-sac", name: "Pin - đế pin - sạc dự phòng - bảo vệ pin", image: "", link: "" }
    ]
  }] }
];

/* ===================== BANNER TRANG CHỦ (khoảng 980 x 490) ===================== */
const BANNERS = [
  { image: "", title: "BANNER 1", sub: "Thay ảnh bằng cách điền đường dẫn vào BANNERS trong data.js", link: "#/san-pham" },
  { image: "", title: "BANNER 2", sub: "Kích thước gợi ý: 980 x 490 px", link: "#/khuyen-mai" },
  { image: "", title: "BANNER 3", sub: "Sửa nội dung chữ ở đây", link: "#/san-pham" }
];

/* ===================== 3 Ô CHÍNH SÁCH DƯỚI BANNER ===================== */
const POLICIES = [
  { title: "Hỗ trợ 24/7",             text: "Hỗ trợ khách hàng mọi ngày trong tuần, bất cứ lúc nào",     color: "#e5393f", icon: "🎧", image: "" },
  { title: "Chính sách chất lượng",   text: "Hoàn 100% nếu sản phẩm không đạt tiêu chuẩn",               color: "#15803d", icon: "✅", image: "" },
  { title: "Quan điểm kinh doanh",    text: "Khách hàng quyết định sự tồn tại và phát triển của công ty", color: "#1d4ed8", icon: "🤝", image: "" }
];

/* ===================== HÀNG Ô XANH DƯỚI POLICY (9 ô) ===================== */
const HOME_TILES = [
  { name: "Bộ lập trình PLC",     cat: "plc",     image: "" },
  { name: "Cảm biến áp suất",     cat: "cambien", image: "" },
  { name: "Cảm biến khí",         cat: "cambien", image: "" },
  { name: "Công tắc chênh áp",    cat: "congtac", image: "" },
  { name: "Biến tần",             cat: "bientan", image: "" },
  { name: "Phần mềm",             cat: "khac",    image: "" },
  { name: "Màn hình HMI",         cat: "hmi",     image: "" },
  { name: "Bộ nguồn",             cat: "nguon",   image: "" },
  { name: "Thiết bị đo năng lượng", cat: "doluong", image: "" },
  { name: "Linh kiện điện tử", cat: "linh-kien", image: "" }
];

/* ===================== SẢN PHẨM =====================
   Dữ liệu mẫu được tạo tự động. Muốn nhập tay: thay đoạn tạo bằng danh sách
   { id, cat, line, name, price, oldPrice, image }  (price 0 = "Liên hệ", oldPrice 0 = không giảm) */
const PRODUCTS = [];
(function () {
  let pid = 1;
  [["plc", "Nhóm sản phẩm PLC", 12], ["bientan", "Nhóm sản phẩm biến tần", 8],
   ["cambien", "Nhóm sản phẩm cảm biến", 8], ["hmi", "Nhóm sản phẩm HMI", 8],
   ["nguon", "Nhóm sản phẩm bộ nguồn", 4], ["dongcat", "Nhóm thiết bị đóng cắt", 4]]
  .forEach(([cat, line, n]) => {
    for (let i = 1; i <= n; i++, pid++) {
      const price = pid % 9 === 0 ? 0 : (1 + (pid * 7) % 50) * 120000;
      const oldPrice = price && pid % 3 !== 0 ? Math.round(price * (1.15 + (pid % 5) * 0.08) / 1000) * 1000 : 0;
      PRODUCTS.push({
        id: pid, cat, line,
        name: `MÃ-SP-${String(pid).padStart(3, "0")} – Tên sản phẩm mẫu, mô tả ngắn sản phẩm`,
        description: "Mô tả sản phẩm mẫu cho website. Bạn có thể sửa nội dung này trong phần quản trị để mô tả chi tiết hơn về tính năng, tiêu chí kỹ thuật và ứng dụng thực tế.",
        price, oldPrice, image: "",
        images: [""]
      });
    }
  });
})();

/* ===================== CÁC KHỐI SẢN PHẨM Ở TRANG CHỦ =====================
   banner: ảnh dải ngang phía trên khối (khoảng 1180 x 110) */
const HOME_SECTIONS = [
  { cat: "plc",     title: "BỘ LẬP TRÌNH PLC", banner: "" },
  { cat: "bientan", title: "BIẾN TẦN",          banner: "" },
  { cat: "cambien", title: "CẢM BIẾN",          banner: "" },
  { cat: "hmi",     title: "MÀN HÌNH HMI",      banner: "" }
];

/* ===================== BÀI VIẾT (type: "khuyen-mai" hoặc "tin-tuc") ===================== */
const POSTS = [
  { type: "khuyen-mai", cat: "Khuyến mãi", title: "TIÊU ĐỀ KHUYẾN MÃI 1 – SỬA SAU", date: "2026-10-10", author: "TÊN TÁC GIẢ",
    excerpt: "Mô tả ngắn chương trình khuyến mãi: mức giảm, điều kiện áp dụng, thời gian áp dụng. Sửa sau cho phù hợp nội dung thực tế [...]", image: "" },
  { type: "khuyen-mai", cat: "Khuyến mãi", title: "TIÊU ĐỀ KHUYẾN MÃI 2 – SỬA SAU", date: "2026-09-09", author: "TÊN TÁC GIẢ",
    excerpt: "Mô tả ngắn chương trình khuyến mãi: mức giảm, điều kiện áp dụng, thời gian áp dụng. Sửa sau cho phù hợp nội dung thực tế [...]", image: "" },
  { type: "khuyen-mai", cat: "Khuyến mãi", title: "TIÊU ĐỀ KHUYẾN MÃI 3 – SỬA SAU", date: "2026-08-08", author: "TÊN TÁC GIẢ",
    excerpt: "Mô tả ngắn chương trình khuyến mãi: mức giảm, điều kiện áp dụng, thời gian áp dụng. Sửa sau cho phù hợp nội dung thực tế [...]", image: "" },
  { type: "tin-tuc", cat: "Tin tức", title: "Tiêu đề tin tức 1 - sửa sau", date: "2026-08-21", author: "TÊN TÁC GIẢ",
    excerpt: "Mô tả ngắn của bài viết. Sửa sau cho phù hợp với nội dung thực tế của doanh nghiệp [...]", image: "" },
  { type: "tin-tuc", cat: "Tin tức", title: "Tiêu đề tin tức 2 - sửa sau", date: "2026-05-12", author: "TÊN TÁC GIẢ",
    excerpt: "Mô tả ngắn của bài viết. Sửa sau cho phù hợp với nội dung thực tế của doanh nghiệp [...]", image: "" },
  { type: "tin-tuc", cat: "Tin tức", title: "Tiêu đề tin tức 3 - sửa sau", date: "2026-03-02", author: "TÊN TÁC GIẢ",
    excerpt: "Mô tả ngắn của bài viết. Sửa sau cho phù hợp với nội dung thực tế của doanh nghiệp [...]", image: "" }
];

/* ===================== TUYỂN DỤNG ===================== */
const JOBS = [
  { title: "TUYỂN DỤNG NHÂN VIÊN KINH DOANH", position: "Kỹ sư bán hàng",   experience: "Không cần kinh nghiệm", degree: "Cao đẳng, Đại học", location: "Hồ Chí Minh", level: "Nhân viên", link: "#/lien-he" },
  { title: "THÔNG BÁO TUYỂN NHÂN VIÊN HỖ TRỢ KỸ THUẬT", position: "Kỹ sư", experience: "Không cần kinh nghiệm", degree: "Cao đẳng, Đại học", location: "Hồ Chí Minh", level: "Nhân viên", link: "#/lien-he" },
  { title: "TUYỂN DỤNG NHÂN VIÊN KINH DOANH", position: "Kỹ sư bán hàng",   experience: "Dưới 1 năm, Từ 1 đến 3 năm", degree: "Cao đẳng, Đại học", location: "Hà Nội", level: "Nhân viên", link: "#/lien-he" },
  { title: "TUYỂN DỤNG NHÂN VIÊN KỸ THUẬT", position: "Kỹ sư",             experience: "Dưới 1 năm", degree: "Cao đẳng, Đại học", location: "Hồ Chí Minh", level: "Nhân viên", link: "#/lien-he" }
];

/* ===================== ĐỐI TÁC (cuối trang) ===================== */
const PARTNERS = [
  { name: "ĐỐI TÁC 1", image: "" }, { name: "ĐỐI TÁC 2", image: "" }, { name: "ĐỐI TÁC 3", image: "" },
  { name: "ĐỐI TÁC 4", image: "" }, { name: "ĐỐI TÁC 5", image: "" }, { name: "ĐỐI TÁC 6", image: "" },
  { name: "ĐỐI TÁC 7", image: "" }, { name: "ĐỐI TÁC 8", image: "" }, { name: "ĐỐI TÁC 9", image: "" },
  { name: "ĐỐI TÁC 10", image: "" }
];

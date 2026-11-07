# Xuất bản website miễn phí và chia sẻ sản phẩm

Website dùng GitHub Pages để có địa chỉ HTTPS miễn phí; Supabase lưu danh mục và ảnh dùng chung. `website.html` vẫn chạy độc lập nếu chưa điền cấu hình cloud.

## 1. Tạo cơ sở dữ liệu Supabase

1. Tạo một project Supabase.
2. Mở **SQL Editor**, dán và chạy toàn bộ nội dung trong `SUPABASE_SETUP.sql`.
3. Mở **Authentication > Users**, tạo tài khoản quản trị bằng email và mật khẩu.
4. Sao chép User ID của tài khoản vừa tạo. Trong SQL Editor chạy lệnh dưới đây, thay UUID bằng User ID đó:

```sql
insert into public.site_admins (user_id) values ('AUTH-USER-UUID');
```

5. Trong **Project Settings > API**, sao chép Project URL và Publishable key (hoặc anon key cũ). Mở `website.html`, tìm `const CLOUD` và điền hai giá trị vào `supabaseUrl` và `publishableKey`.

Chỉ dùng Publishable/anon key trong HTML công khai. Không bao giờ đưa `service_role` key vào website hoặc repository.

## 2. Chuyển sản phẩm đang lưu trên máy

Dữ liệu trong `file:///` nằm riêng trên trình duyệt hiện tại. Trước khi chuyển sang website đã xuất bản:

1. Mở bản `website.html` hiện tại trên máy đang có sản phẩm.
2. Vào **Quản trị > Sao lưu và khôi phục > Tải file sao lưu**.
3. Sau khi xuất bản website, mở `https://TEN-TEN-MIEN/website.html#/admin`, đăng nhập tài khoản Supabase quản trị.
4. Vào **Sao lưu và khôi phục > Chọn file .json** và chọn file vừa tải. Sản phẩm và ảnh sẽ được đưa lên cloud để mọi người xem.

## 3. Xuất bản bằng GitHub Pages

1. Tạo một repository công khai trên GitHub.
2. Tải lên `index.html`, `website.html`, `SUPABASE_SETUP.sql` và `HUONG_DAN_XUAT_BAN.md`. Nếu website dùng ảnh theo đường dẫn tương đối trong thư mục, tải cả thư mục ảnh lên cùng vị trí.
3. Trong repository, mở **Settings > Pages**. Chọn **Deploy from a branch**, nhánh `main`, thư mục `/(root)`, rồi lưu.
4. Sau khi GitHub Pages báo xuất bản xong, mở URL GitHub Pages. `index.html` sẽ chuyển tiếp vào website và giữ nguyên đường dẫn sản phẩm trong hash.
5. Gửi URL HTTPS đó qua Zalo. Không gửi đường dẫn `file:///`.

## Phạm vi đồng bộ

Danh sách sản phẩm và ảnh được chia sẻ qua Supabase. Thông tin công ty trong tab quản trị hiện vẫn lưu trên trình duyệt; sửa thông tin ở tab đó chưa tự đồng bộ cho khách.

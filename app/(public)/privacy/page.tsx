import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách bảo mật",
  description: "Chính sách bảo mật của Tôi là người Sài Gòn - Cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-vietnam-blue-800">Chính sách bảo mật</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none text-vietnam-blue-700 leading-relaxed">
          <p>Cập nhật lần cuối: 25/02/2026</p>

          <p>
            Chào mừng bạn đến với &quot;Tôi là người Sài Gòn&quot; (&quot;chúng tôi&quot;, &quot;của chúng tôi&quot;). 
            Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin 
            cá nhân của bạn khi bạn truy cập và sử dụng trang web toilanguoisaigon.com.
          </p>

          <h3 className="text-vietnam-red-600">1. Thu thập thông tin</h3>
          <p>Chúng tôi thu thập các loại thông tin sau:</p>
          <ul>
            <li><strong>Thông tin tài khoản:</strong> Khi bạn đăng ký, chúng tôi thu thập tên, địa chỉ email và ảnh đại diện (nếu đăng nhập qua Google).</li>
            <li><strong>Nội dung người dùng:</strong> Đánh giá, bình luận, địa điểm bạn gửi và các nội dung bạn tạo trên nền tảng.</li>
            <li><strong>Dữ liệu sử dụng:</strong> Thông tin về cách bạn tương tác với trang web, bao gồm các trang đã truy cập, thời gian truy cập và thiết bị sử dụng.</li>
            <li><strong>Danh sách yêu thích:</strong> Các địa điểm bạn lưu vào sổ tay cá nhân.</li>
          </ul>

          <h3 className="text-vietnam-red-600">2. Sử dụng thông tin</h3>
          <p>Thông tin của bạn được sử dụng cho các mục đích sau:</p>
          <ul>
            <li>Cung cấp, duy trì và cải thiện dịch vụ của chúng tôi.</li>
            <li>Cá nhân hóa trải nghiệm người dùng (gợi ý địa điểm, hiển thị nội dung phù hợp).</li>
            <li>Quản lý tài khoản và hỗ trợ người dùng.</li>
            <li>Vận hành hệ thống XP và bảng xếp hạng cộng đồng.</li>
            <li>Gửi thông báo quan trọng về dịch vụ (nếu cần thiết).</li>
            <li>Phân tích và cải thiện hiệu suất trang web.</li>
          </ul>

          <h3 className="text-vietnam-red-600">3. Chia sẻ thông tin</h3>
          <p>
            Chúng tôi <strong>không bán</strong> thông tin cá nhân của bạn cho bên thứ ba. Thông tin chỉ được 
            chia sẻ trong các trường hợp sau:
          </p>
          <ul>
            <li><strong>Hiển thị công khai:</strong> Tên hiển thị, ảnh đại diện, đánh giá và xếp hạng XP được hiển thị công khai trên nền tảng.</li>
            <li><strong>Nhà cung cấp dịch vụ:</strong> Chúng tôi sử dụng Supabase để lưu trữ dữ liệu và Google để xác thực tài khoản.</li>
            <li><strong>Yêu cầu pháp lý:</strong> Khi được yêu cầu bởi cơ quan có thẩm quyền theo quy định pháp luật Việt Nam.</li>
          </ul>

          <h3 className="text-vietnam-red-600">4. Cookie và công nghệ theo dõi</h3>
          <p>Chúng tôi sử dụng cookie cho các mục đích sau:</p>
          <ul>
            <li><strong>Cookie thiết yếu:</strong> Duy trì phiên đăng nhập và bảo mật tài khoản.</li>
            <li><strong>Cookie chức năng:</strong> Ghi nhớ tùy chọn của bạn (bộ lọc tìm kiếm, cài đặt).</li>
          </ul>
          <p>Bạn có thể tắt cookie trong cài đặt trình duyệt, tuy nhiên một số chức năng có thể bị ảnh hưởng.</p>

          <h3 className="text-vietnam-red-600">5. Bảo mật dữ liệu</h3>
          <p>
            Chúng tôi áp dụng các biện pháp bảo mật hợp lý để bảo vệ thông tin cá nhân của bạn, bao gồm:
          </p>
          <ul>
            <li>Mã hóa dữ liệu truyền tải qua HTTPS/SSL.</li>
            <li>Xác thực an toàn thông qua Supabase Auth.</li>
            <li>Phân quyền truy cập dữ liệu (Row Level Security).</li>
          </ul>
          <p>
            Tuy nhiên, không có phương thức truyền tải qua Internet hay lưu trữ điện tử nào là hoàn toàn an toàn. 
            Chúng tôi không thể đảm bảo tuyệt đối sự an toàn của dữ liệu.
          </p>

          <h3 className="text-vietnam-red-600">6. Quyền của bạn</h3>
          <p>Bạn có các quyền sau đối với thông tin cá nhân của mình:</p>
          <ul>
            <li><strong>Truy cập:</strong> Xem thông tin cá nhân trong trang hồ sơ.</li>
            <li><strong>Chỉnh sửa:</strong> Cập nhật tên, ảnh đại diện và tiểu sử.</li>
            <li><strong>Xóa:</strong> Xóa đánh giá và nội dung đã đăng. Liên hệ chúng tôi để yêu cầu xóa tài khoản.</li>
            <li><strong>Xuất dữ liệu:</strong> Liên hệ chúng tôi để nhận bản sao dữ liệu cá nhân.</li>
          </ul>

          <h3 className="text-vietnam-red-600">7. Trẻ em</h3>
          <p>
            Dịch vụ của chúng tôi không dành cho trẻ em dưới 13 tuổi. Chúng tôi không cố ý thu thập 
            thông tin từ trẻ em dưới 13 tuổi. Nếu phát hiện, chúng tôi sẽ xóa thông tin đó ngay lập tức.
          </p>

          <h3 className="text-vietnam-red-600">8. Thay đổi chính sách</h3>
          <p>
            Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. Mọi thay đổi sẽ được thông báo 
            trên trang này cùng ngày cập nhật mới. Việc tiếp tục sử dụng dịch vụ sau khi thay đổi đồng nghĩa 
            với việc bạn chấp nhận chính sách mới.
          </p>

          <h3 className="text-vietnam-red-600">9. Liên hệ</h3>
          <p>
            Nếu bạn có câu hỏi về chính sách bảo mật này, vui lòng liên hệ chúng tôi qua email:{" "}
            <a href="mailto:toilanguoisaigonofficial@gmail.com" className="text-vietnam-red-600 hover:underline">
              toilanguoisaigonofficial@gmail.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

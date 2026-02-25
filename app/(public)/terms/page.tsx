import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng",
  description: "Điều khoản sử dụng của Tôi là người Sài Gòn - Các quy định và điều kiện khi sử dụng nền tảng.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-vietnam-blue-800">Điều khoản sử dụng</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none text-vietnam-blue-700 leading-relaxed">
          <p>Cập nhật lần cuối: 25/02/2026</p>

          <p>
            Vui lòng đọc kỹ các điều khoản sử dụng này trước khi sử dụng trang web &quot;Tôi là người Sài Gòn&quot; 
            (toilanguoisaigon.com). Bằng việc truy cập và sử dụng trang web, bạn đồng ý tuân thủ và bị ràng buộc 
            bởi các điều khoản sau đây.
          </p>

          <h3 className="text-vietnam-red-600">1. Chấp nhận điều khoản</h3>
          <p>
            Bằng cách truy cập và sử dụng trang web &quot;Tôi là người Sài Gòn&quot;, bạn đồng ý tuân thủ 
            các điều khoản và điều kiện này. Nếu bạn không đồng ý với bất kỳ phần nào, vui lòng không sử dụng 
            dịch vụ của chúng tôi.
          </p>

          <h3 className="text-vietnam-red-600">2. Tài khoản người dùng</h3>
          <ul>
            <li>Bạn cần đăng ký tài khoản để sử dụng một số tính năng (viết đánh giá, lưu địa điểm, đóng góp nội dung).</li>
            <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình.</li>
            <li>Mỗi người chỉ được sở hữu một tài khoản.</li>
            <li>Chúng tôi có quyền vô hiệu hóa tài khoản vi phạm điều khoản.</li>
          </ul>

          <h3 className="text-vietnam-red-600">3. Nội dung người dùng</h3>
          <p>Khi đăng tải nội dung (đánh giá, bình luận, hình ảnh, gợi ý địa điểm), bạn cam kết:</p>
          <ul>
            <li>Nội dung là trung thực, chính xác dựa trên trải nghiệm thực tế của bạn.</li>
            <li>Không đăng tải nội dung vi phạm pháp luật, xúc phạm, quấy rối, phân biệt đối xử hoặc spam.</li>
            <li>Không đăng tải nội dung vi phạm quyền sở hữu trí tuệ của bên thứ ba.</li>
            <li>Không lạm dụng hệ thống đánh giá để quảng cáo hoặc phá hoại.</li>
          </ul>
          <p>
            Bạn giữ quyền sở hữu đối với nội dung bạn đăng tải, nhưng cấp cho chúng tôi quyền sử dụng, 
            hiển thị và phân phối nội dung đó trên nền tảng.
          </p>

          <h3 className="text-vietnam-red-600">4. Hệ thống XP và Bảng xếp hạng</h3>
          <ul>
            <li>XP (điểm kinh nghiệm) được tích lũy thông qua các hoạt động đóng góp trên nền tảng.</li>
            <li>Nghiêm cấm mọi hành vi gian lận để tăng XP (spam đánh giá, tạo tài khoản ảo...).</li>
            <li>Chúng tôi có quyền điều chỉnh hoặc thu hồi XP nếu phát hiện vi phạm.</li>
          </ul>

          <h3 className="text-vietnam-red-600">5. Quyền sở hữu trí tuệ</h3>
          <p>
            Tất cả nội dung trên trang web này (bao gồm logo, thiết kế, bộ sưu tập, bài viết blog của đội ngũ) 
            là tài sản của &quot;Tôi là người Sài Gòn&quot; và được bảo vệ bởi luật bản quyền Việt Nam. 
            Bạn không được sao chép, phân phối hoặc sử dụng cho mục đích thương mại mà không có sự đồng ý bằng văn bản.
          </p>

          <h3 className="text-vietnam-red-600">6. Thông tin địa điểm</h3>
          <ul>
            <li>Thông tin về địa điểm (giờ mở cửa, giá cả, địa chỉ) mang tính tham khảo.</li>
            <li>Chúng tôi không chịu trách nhiệm về tính chính xác tuyệt đối của thông tin.</li>
            <li>Người dùng nên xác nhận trực tiếp với địa điểm trước khi đến.</li>
            <li>Đánh giá và nhận xét thể hiện quan điểm cá nhân của người viết, không phải của chúng tôi.</li>
          </ul>

          <h3 className="text-vietnam-red-600">7. Hành vi bị cấm</h3>
          <p>Khi sử dụng dịch vụ, bạn không được:</p>
          <ul>
            <li>Sử dụng bot, crawler hoặc phương tiện tự động để truy cập trang web.</li>
            <li>Can thiệp vào hoạt động bình thường của trang web.</li>
            <li>Thu thập thông tin cá nhân của người dùng khác mà không có sự đồng ý.</li>
            <li>Mạo danh người khác hoặc cung cấp thông tin sai lệch.</li>
            <li>Sử dụng trang web cho mục đích quảng cáo không được phép.</li>
          </ul>

          <h3 className="text-vietnam-red-600">8. Giới hạn trách nhiệm</h3>
          <p>
            Dịch vụ được cung cấp &quot;nguyên trạng&quot; (as-is). Chúng tôi không đảm bảo dịch vụ sẽ 
            hoạt động liên tục, không có lỗi. Chúng tôi không chịu trách nhiệm về bất kỳ thiệt hại nào 
            phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ.
          </p>

          <h3 className="text-vietnam-red-600">9. Chấm dứt</h3>
          <p>
            Chúng tôi có quyền tạm ngưng hoặc chấm dứt quyền truy cập của bạn vào dịch vụ bất cứ lúc nào, 
            có hoặc không có lý do, đặc biệt nếu bạn vi phạm các điều khoản này.
          </p>

          <h3 className="text-vietnam-red-600">10. Luật áp dụng</h3>
          <p>
            Các điều khoản này được điều chỉnh bởi pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. 
            Mọi tranh chấp phát sinh sẽ được giải quyết tại tòa án có thẩm quyền tại Thành phố Hồ Chí Minh.
          </p>

          <h3 className="text-vietnam-red-600">11. Thay đổi điều khoản</h3>
          <p>
            Chúng tôi có quyền cập nhật các điều khoản này theo thời gian. Thay đổi sẽ có hiệu lực ngay khi 
            đăng tải trên trang web. Việc tiếp tục sử dụng dịch vụ đồng nghĩa với việc bạn chấp nhận 
            các điều khoản mới.
          </p>

          <h3 className="text-vietnam-red-600">12. Liên hệ</h3>
          <p>
            Nếu bạn có câu hỏi về các điều khoản này, vui lòng liên hệ:{" "}
            <a href="mailto:toilanguoisaigonofficial@gmail.com" className="text-vietnam-red-600 hover:underline">
              toilanguoisaigonofficial@gmail.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Về chúng tôi",
  description: "Tìm hiểu về Tôi là người Sài Gòn - Nền tảng khám phá ẩm thực và văn hóa Sài Gòn, được xây dựng bởi những người trẻ yêu thành phố.",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-vietnam-blue-800">Về chúng tôi</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none text-vietnam-blue-700 leading-relaxed">
          <p>Chào mừng bạn đến với &quot;Tôi là người Sài Gòn&quot;!</p>
          <p>Chúng tôi là một nhóm những người trẻ yêu Sài Gòn, đam mê ẩm thực và văn hóa của thành phố này. Sứ mệnh của chúng tôi là tạo ra một nền tảng toàn diện, nơi mọi người có thể khám phá, chia sẻ và kết nối qua những trải nghiệm ẩm thực và văn hóa độc đáo.</p>
          <p>Dự án này được bắt đầu từ mong muốn lưu giữ và lan tỏa những giá trị, những &quot;chất&quot; riêng của Sài Gòn - từ những quán ăn vỉa hè lâu đời đến những nhà hàng sang trọng, từ những quán cà phê ẩn mình trong hẻm nhỏ đến những không gian văn hóa sôi động.</p>
          <h3 className="text-vietnam-red-600">Sứ mệnh của chúng tôi</h3>
          <ul>
            <li><strong>Khám phá:</strong> Giúp bạn tìm thấy những địa điểm tuyệt vời, phù hợp với sở thích và nhu cầu của mình.</li>
            <li><strong>Kết nối:</strong> Xây dựng một cộng đồng những người yêu Sài Gòn, nơi mọi người có thể chia sẻ kinh nghiệm và đánh giá.</li>
            <li><strong>Lưu giữ:</strong> Ghi lại những câu chuyện, những giá trị văn hóa ẩm thực đang thay đổi từng ngày của thành phố.</li>
          </ul>
          <p>Cảm ơn bạn đã đồng hành cùng chúng tôi trên hành trình này. Hãy cùng nhau khám phá và làm cho Sài Gòn trở nên tuyệt vời hơn!</p>
        </CardContent>
      </Card>
    </div>
  );
}

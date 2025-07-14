import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-vietnam-blue-800">Chính sách bảo mật</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none text-vietnam-blue-700 leading-relaxed">
            <p>Cập nhật lần cuối: 24/07/2024</p>
            <h3 className="text-vietnam-red-600">1. Thu thập thông tin</h3>
            <p>Chúng tôi thu thập thông tin bạn cung cấp khi đăng ký tài khoản, chẳng hạn như tên, email. Chúng tôi cũng có thể thu thập thông tin về cách bạn sử dụng trang web của chúng tôi.</p>
            <h3 className="text-vietnam-red-600">2. Sử dụng thông tin</h3>
            <p>Thông tin của bạn được sử dụng để cá nhân hóa trải nghiệm, cung cấp dịch vụ, và liên lạc với bạn. Chúng tôi cam kết không chia sẻ thông tin cá nhân của bạn với bên thứ ba mà không có sự đồng ý của bạn.</p>
            <h3 className="text-vietnam-red-600">3. Cookie</h3>
            <p>Chúng tôi sử dụng cookie để cải thiện trải nghiệm người dùng. Bạn có thể tắt cookie trong cài đặt trình duyệt của mình.</p>
            <p>[...]</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
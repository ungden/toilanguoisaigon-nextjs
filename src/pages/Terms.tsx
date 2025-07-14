import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-vietnam-blue-800">Điều khoản sử dụng</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none text-vietnam-blue-700 leading-relaxed">
            <p>Cập nhật lần cuối: 24/07/2024</p>
            <h3 className="text-vietnam-red-600">1. Chấp nhận điều khoản</h3>
            <p>Bằng cách truy cập và sử dụng trang web "Tôi là người Sài Gòn", bạn đồng ý tuân thủ các điều khoản và điều kiện này. Nếu bạn không đồng ý, vui lòng không sử dụng dịch vụ của chúng tôi.</p>
            <h3 className="text-vietnam-red-600">2. Nội dung người dùng</h3>
            <p>Bạn chịu trách nhiệm về mọi nội dung (bình luận, đánh giá, hình ảnh) mà bạn đăng tải. Bạn không được đăng tải nội dung bất hợp pháp, xúc phạm, hoặc vi phạm quyền của bên thứ ba.</p>
            <h3 className="text-vietnam-red-600">3. Quyền sở hữu trí tuệ</h3>
            <p>Tất cả nội dung trên trang web này, bao gồm logo, thiết kế, và văn bản, là tài sản của "Tôi là người Sài Gòn" và được bảo vệ bởi luật bản quyền.</p>
            <p>[...]</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default TermsPage;
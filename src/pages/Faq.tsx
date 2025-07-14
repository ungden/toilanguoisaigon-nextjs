import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FaqPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-vietnam-blue-800">Câu hỏi thường gặp (FAQ)</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Làm thế nào để tôi thêm một địa điểm mới?</AccordionTrigger>
                <AccordionContent>
                  Hiện tại, chức năng thêm địa điểm mới được quản lý bởi đội ngũ của chúng tôi để đảm bảo chất lượng. Tuy nhiên, bạn có thể gửi gợi ý cho chúng tôi qua trang Liên hệ.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Làm sao để viết đánh giá cho một địa điểm?</AccordionTrigger>
                <AccordionContent>
                  Bạn cần đăng nhập vào tài khoản của mình, truy cập trang chi tiết của địa điểm và sử dụng biểu mẫu đánh giá ở đó.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Thông tin trên trang web có chính xác không?</AccordionTrigger>
                <AccordionContent>
                  Chúng tôi cố gắng hết sức để giữ cho thông tin luôn được cập nhật và chính xác. Tuy nhiên, thông tin như giờ mở cửa có thể thay đổi. Chúng tôi khuyến khích bạn xác nhận lại với địa điểm trước khi đến.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default FaqPage;
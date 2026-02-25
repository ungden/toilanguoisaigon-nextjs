"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "Làm thế nào để tôi thêm một địa điểm mới?",
    answer:
      'Bạn có thể gửi gợi ý địa điểm mới bằng cách đăng nhập và truy cập mục "Đóng góp địa điểm" trong menu tài khoản. Đội ngũ của chúng tôi sẽ xem xét và phê duyệt địa điểm để đảm bảo chất lượng.',
  },
  {
    question: "Làm sao để viết đánh giá cho một địa điểm?",
    answer:
      "Bạn cần đăng nhập vào tài khoản, truy cập trang chi tiết của địa điểm và chọn tab \"Đánh giá\". Tại đó bạn có thể chấm sao và viết nhận xét về trải nghiệm của mình.",
  },
  {
    question: "Thông tin trên trang web có chính xác không?",
    answer:
      "Chúng tôi cố gắng hết sức để giữ cho thông tin luôn được cập nhật và chính xác. Tuy nhiên, thông tin như giờ mở cửa, giá cả có thể thay đổi. Chúng tôi khuyến khích bạn xác nhận lại với địa điểm trước khi đến.",
  },
  {
    question: "XP là gì? Làm sao để kiếm XP?",
    answer:
      "XP (điểm kinh nghiệm) là hệ thống tích điểm khi bạn đóng góp cho cộng đồng. Bạn có thể kiếm XP bằng cách viết đánh giá, gửi gợi ý địa điểm mới, và tham gia các hoạt động trên nền tảng. XP giúp bạn lên cấp và xuất hiện trên bảng xếp hạng.",
  },
  {
    question: "Bảng xếp hạng hoạt động như thế nào?",
    answer:
      "Bảng xếp hạng hiển thị những thành viên có điểm XP cao nhất trong cộng đồng. Bạn có thể xem bảng xếp hạng tại mục \"Bảng xếp hạng\" trên thanh menu. Vị trí được cập nhật theo thời gian thực.",
  },
  {
    question: "Sổ tay của tôi là gì?",
    answer:
      'Sổ tay là nơi bạn lưu lại những địa điểm yêu thích. Khi xem chi tiết một địa điểm, nhấn nút "Lưu" để thêm vào sổ tay. Bạn có thể truy cập sổ tay bất cứ lúc nào từ menu tài khoản.',
  },
  {
    question: "Tôi có thể chỉnh sửa hoặc xóa đánh giá của mình không?",
    answer:
      'Có, bạn có thể quản lý tất cả đánh giá đã viết trong trang "Trang cá nhân". Tại đó bạn có thể chỉnh sửa nội dung hoặc xóa đánh giá.',
  },
  {
    question: "Bộ sưu tập là gì?",
    answer:
      "Bộ sưu tập là danh sách các địa điểm được tuyển chọn theo chủ đề cụ thể, ví dụ: \"Michelin Sài Gòn 2025\", \"Quán cà phê cho dân công sở\", v.v. Các bộ sưu tập được đội ngũ biên tập tạo và cập nhật thường xuyên.",
  },
  {
    question: "Tôi có thể đăng nhập bằng cách nào?",
    answer:
      "Bạn có thể đăng nhập bằng email/mật khẩu hoặc đăng nhập nhanh bằng tài khoản Google. Cả hai cách đều an toàn và bảo mật.",
  },
  {
    question: "Làm sao để liên hệ nếu tôi là chủ quán/cơ sở?",
    answer:
      'Nếu bạn là chủ quán hoặc chủ cơ sở kinh doanh và muốn xác nhận, cập nhật thông tin hoặc hợp tác, vui lòng liên hệ qua email toilanguoisaigonofficial@gmail.com hoặc trang "Liên hệ".',
  },
  {
    question: "Trang web có thu phí không?",
    answer:
      "Hoàn toàn miễn phí! Tất cả tính năng trên Tôi là người Sài Gòn đều miễn phí cho người dùng, bao gồm tìm kiếm, đánh giá, lưu địa điểm và tham gia cộng đồng.",
  },
  {
    question: "Đánh giá có bị kiểm duyệt không?",
    answer:
      "Đánh giá được hiển thị ngay sau khi gửi. Tuy nhiên, đội ngũ quản trị có quyền xóa các đánh giá vi phạm quy định (spam, nội dung không phù hợp, quảng cáo). Chúng tôi khuyến khích đánh giá trung thực và mang tính xây dựng.",
  },
  {
    question: "Tôi phát hiện thông tin sai, phải làm sao?",
    answer:
      'Nếu bạn phát hiện thông tin không chính xác về một địa điểm (địa chỉ sai, đã đóng cửa, v.v.), vui lòng liên hệ chúng tôi qua trang "Liên hệ" hoặc email. Chúng tôi sẽ kiểm tra và cập nhật trong thời gian sớm nhất.',
  },
  {
    question: "Tôi có thể yêu cầu xóa tài khoản không?",
    answer:
      "Có, bạn có quyền yêu cầu xóa tài khoản và toàn bộ dữ liệu cá nhân. Vui lòng gửi yêu cầu qua email toilanguoisaigonofficial@gmail.com. Chúng tôi sẽ xử lý trong vòng 7 ngày làm việc.",
  },
];

const FaqPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-vietnam-blue-800">Câu hỏi thường gặp (FAQ)</CardTitle>
          <p className="text-vietnam-blue-600 mt-2">
            Tìm câu trả lời cho những thắc mắc phổ biến về Tôi là người Sài Gòn.
          </p>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="text-vietnam-blue-700 leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default FaqPage;

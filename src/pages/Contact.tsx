import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const ContactPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-vietnam-blue-800">Liên hệ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-muted-foreground">Chúng tôi rất mong nhận được phản hồi từ bạn. Vui lòng điền vào biểu mẫu bên dưới hoặc liên hệ qua email.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-vietnam-red-600">Thông tin liên hệ</h3>
                <p className="mb-2"><strong>Email:</strong> <a href="mailto:contact@toilanguoisaigon.com" className="text-vietnam-red-600 hover:underline">contact@toilanguoisaigon.com</a></p>
                <p className="mb-2"><strong>Địa chỉ:</strong> Quận 1, Thành phố Hồ Chí Minh, Việt Nam</p>
                <p>Chúng tôi sẽ phản hồi trong vòng 24-48 giờ làm việc.</p>
              </div>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="name">Tên của bạn</Label>
                  <Input id="name" placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="email@example.com" />
                </div>
                <div>
                  <Label htmlFor="message">Nội dung</Label>
                  <Textarea id="message" placeholder="Nội dung tin nhắn của bạn..." />
                </div>
                <Button type="submit" className="btn-vietnam">Gửi tin nhắn</Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
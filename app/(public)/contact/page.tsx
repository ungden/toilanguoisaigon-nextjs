"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).trim();
    const email = (formData.get("email") as string).trim();
    const message = (formData.get("message") as string).trim();

    if (!name || !email || !message) {
      showError("Vui lòng điền đầy đủ thông tin.");
      setIsSubmitting(false);
      return;
    }

    if (message.length < 10) {
      showError("Nội dung tin nhắn phải có ít nhất 10 ký tự.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.from("contact_messages").insert({
        name,
        email,
        message,
      });

      if (error) {
        // If table doesn't exist, fall back to mailto
        window.location.href = `mailto:toilanguoisaigonofficial@gmail.com?subject=Liên hệ từ ${encodeURIComponent(name)}&body=${encodeURIComponent(`Tên: ${name}\nEmail: ${email}\n\n${message}`)}`;
        return;
      }

      setSubmitted(true);
      showSuccess("Tin nhắn đã được gửi thành công! Chúng tôi sẽ phản hồi trong vòng 24-48 giờ.");
    } catch {
      // Fallback to mailto
      window.location.href = `mailto:toilanguoisaigonofficial@gmail.com?subject=Liên hệ từ ${encodeURIComponent(name)}&body=${encodeURIComponent(`Tên: ${name}\nEmail: ${email}\n\n${message}`)}`;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-vietnam-blue-800">Liên hệ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-muted-foreground">Chúng tôi rất mong nhận được phản hồi từ bạn. Vui lòng điền vào biểu mẫu bên dưới hoặc liên hệ qua email.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-vietnam-red-600">Thông tin liên hệ</h3>
              <p className="mb-2"><strong>Email:</strong> <a href="mailto:toilanguoisaigonofficial@gmail.com" className="text-vietnam-red-600 hover:underline">toilanguoisaigonofficial@gmail.com</a></p>
              <p className="mb-2"><strong>Địa chỉ:</strong> Quận 1, Thành phố Hồ Chí Minh, Việt Nam</p>
              <p className="mb-6">Chúng tôi sẽ phản hồi trong vòng 24-48 giờ làm việc.</p>

              <h3 className="text-xl font-semibold mb-4 text-vietnam-red-600">Chủ quán / Đối tác</h3>
              <p className="text-vietnam-blue-700">
                Nếu bạn là chủ quán hoặc muốn hợp tác, vui lòng ghi rõ trong tin nhắn để chúng tôi có thể 
                hỗ trợ tốt nhất.
              </p>
            </div>
            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <div className="text-4xl mb-4">&#10003;</div>
                <h3 className="text-xl font-semibold text-vietnam-blue-800 mb-2">
                  Đã gửi thành công!
                </h3>
                <p className="text-vietnam-blue-600">
                  Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.
                </p>
                <Button
                  className="mt-4 btn-vietnam"
                  onClick={() => setSubmitted(false)}
                >
                  Gửi tin nhắn khác
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <Label htmlFor="name">Tên của bạn</Label>
                  <Input id="name" name="name" placeholder="Nguyễn Văn A" required />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="email@example.com" required />
                </div>
                <div>
                  <Label htmlFor="message">Nội dung</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Nội dung tin nhắn của bạn..."
                    className="min-h-[120px]"
                    required
                  />
                </div>
                <Button type="submit" className="btn-vietnam" disabled={isSubmitting}>
                  {isSubmitting ? "Đang gửi..." : "Gửi tin nhắn"}
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactPage;

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ReportDialogProps {
  locationId: string;
  locationName: string;
  locationAddress: string;
  locationDistrict: string;
  children: React.ReactNode;
}

export function ReportDialog({ 
  locationId, 
  locationName, 
  locationAddress, 
  locationDistrict, 
  children 
}: ReportDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để báo lỗi.");
      return;
    }
    
    if (!reason) {
      toast.error("Vui lòng chọn lý do báo lỗi.");
      return;
    }

    if (!details.trim()) {
      toast.error("Vui lòng nhập chi tiết lỗi để admin dễ dàng xác minh.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Use location_submissions table as a makeshift report table
      // Prefix notes with [REPORT] so admins know what it is
      const reportNote = `[BÁO LỖI - ID: ${locationId}]\nLý do: ${reason}\nChi tiết: ${details}`;
      
      const { error } = await supabase.from("location_submissions").insert({
        user_id: user.id,
        name: locationName,
        address: locationAddress,
        district: locationDistrict,
        description: "Báo cáo lỗi cho địa điểm đã tồn tại.",
        notes: reportNote,
        status: "pending",
      });

      if (error) throw error;
      
      toast.success("Cảm ơn bạn đã báo lỗi! Admin sẽ xác minh sớm nhất.");
      setOpen(false);
      setReason("");
      setDetails("");
    } catch (error) {
      console.error(error);
      toast.error("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-vietnam-red-600">
            <AlertTriangle className="h-5 w-5" />
            Báo lỗi địa điểm
          </DialogTitle>
          <DialogDescription>
            Giúp cộng đồng cập nhật thông tin mới nhất cho <strong>{locationName}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-vietnam-blue-800">Lý do báo lỗi</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn vấn đề bạn gặp phải..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Quán đã đóng cửa vĩnh viễn">Quán đã đóng cửa vĩnh viễn</SelectItem>
                <SelectItem value="Sai thông tin giá / mức giá">Sai thông tin giá / mức giá</SelectItem>
                <SelectItem value="Sai địa chỉ / quán dời đi">Sai địa chỉ / quán dời đi</SelectItem>
                <SelectItem value="Sai giờ mở cửa">Sai giờ mở cửa</SelectItem>
                <SelectItem value="Tên quán không chính xác">Tên quán không chính xác</SelectItem>
                <SelectItem value="Khác">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-vietnam-blue-800">Chi tiết thêm</label>
            <Textarea 
              placeholder="Vui lòng cung cấp thêm thông tin giúp admin dễ dàng kiểm chứng (ví dụ: link thông báo đóng cửa trên Facebook quán, giờ mở cửa mới...)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button className="btn-vietnam bg-red-600 hover:bg-red-700" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang gửi...</>
            ) : (
              "Gửi báo lỗi"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCw } from "lucide-react";

export default function AdminError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <AlertCircle className="h-16 w-16 text-red-600 mx-auto" />
        <h2 className="text-2xl font-bold">Đã xảy ra lỗi</h2>
        <p className="text-muted-foreground">
          Có sự cố trong trang quản trị. Vui lòng thử lại.
        </p>
        <Button onClick={reset} variant="default">
          <RotateCw className="h-4 w-4 mr-2" />
          Thử lại
        </Button>
      </div>
    </div>
  );
}

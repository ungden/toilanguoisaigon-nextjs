"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCw, Home } from "lucide-react";
import Link from "next/link";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <AlertCircle className="h-16 w-16 text-vietnam-red-600 mx-auto" />
        <h2 className="text-2xl font-bold text-vietnam-blue-800">
          Đã xảy ra lỗi
        </h2>
        <p className="text-vietnam-blue-600">
          Xin lỗi, đã có sự cố xảy ra. Vui lòng thử lại hoặc quay về trang chủ.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="btn-vietnam">
            <RotateCw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
          <Button asChild variant="outline" className="border-vietnam-blue-600 text-vietnam-blue-600">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Về trang chủ
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

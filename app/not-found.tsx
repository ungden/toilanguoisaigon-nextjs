import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trang không tồn tại",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-vietnam-red-50 to-vietnam-blue-50 p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-8xl font-bold text-vietnam-red-600">404</h1>
        <h2 className="text-2xl font-semibold text-vietnam-blue-800">
          Trang không tồn tại
        </h2>
        <p className="text-vietnam-blue-600">
          Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <Link
          href="/"
          className="inline-block btn-vietnam"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}

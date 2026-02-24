import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-vietnam-red-50 to-vietnam-blue-50 p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-8xl font-bold text-vietnam-red-600">404</h1>
        <h2 className="text-2xl font-semibold text-vietnam-blue-800">
          Trang khong ton tai
        </h2>
        <p className="text-vietnam-blue-600">
          Xin loi, trang ban dang tim kiem khong ton tai hoac da bi di chuyen.
        </p>
        <Link
          href="/"
          className="inline-block btn-vietnam"
        >
          Ve trang chu
        </Link>
      </div>
    </div>
  );
}

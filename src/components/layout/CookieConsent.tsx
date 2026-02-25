"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "tlnsg_cookie_consent";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay so it doesn't flash on load
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5 duration-300">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white dark:bg-gray-900 border border-vietnam-red-200 rounded-xl shadow-lg p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1 text-sm text-vietnam-blue-700 dark:text-gray-300">
            <p>
              Chúng tôi sử dụng cookie để duy trì phiên đăng nhập và cải thiện trải nghiệm của bạn.
              Xem thêm tại{" "}
              <Link href="/privacy" className="text-vietnam-red-600 hover:underline font-medium">
                Chính sách bảo mật
              </Link>
              .
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={handleDecline}>
              Từ chối
            </Button>
            <Button size="sm" className="btn-vietnam" onClick={handleAccept}>
              Đồng ý
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

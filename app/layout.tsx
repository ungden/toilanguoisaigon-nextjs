import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "@/components/providers";
import { WebsiteJsonLd } from "@/components/seo/JsonLd";
import { FALLBACK_IMAGES } from "@/utils/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tôi là người Sài Gòn - Khám phá ẩm thực & văn hóa Sài Gòn",
    template: "%s | Tôi là người Sài Gòn",
  },
  description:
    "Nền tảng khám phá ẩm thực và văn hóa Sài Gòn. Tìm kiếm nhà hàng, quán ăn, quán cà phê tuyệt vời nhất TP.HCM với đánh giá từ cộng đồng.",
  metadataBase: new URL("https://www.toilanguoisaigon.com"),
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://www.toilanguoisaigon.com/",
    siteName: "Tôi là người Sài Gòn",
    title: "Tôi là người Sài Gòn - Khám phá ẩm thực & văn hóa Sài Gòn",
    description:
      "Nền tảng khám phá ẩm thực và văn hóa Sài Gòn. Tìm kiếm nhà hàng, quán ăn, quán cà phê tuyệt vời nhất TP.HCM với đánh giá từ cộng đồng.",
    images: [
      {
        url: FALLBACK_IMAGES.og,
        width: 1200,
        height: 630,
        alt: "Khám phá ẩm thực Sài Gòn",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tôi là người Sài Gòn - Khám phá ẩm thực & văn hóa Sài Gòn",
    description:
      "Nền tảng khám phá ẩm thực và văn hóa Sài Gòn. Tìm kiếm nhà hàng, quán ăn, quán cà phê tuyệt vời nhất TP.HCM với đánh giá từ cộng đồng.",
    images: [FALLBACK_IMAGES.og],
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⭐</text></svg>",
  },
  alternates: {
    canonical: "https://www.toilanguoisaigon.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <WebsiteJsonLd />
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

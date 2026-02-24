import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Toi la nguoi Sai Gon - Kham pha am thuc & van hoa",
    template: "%s | Toi la nguoi Sai Gon",
  },
  description:
    "Nen tang kham pha am thuc va van hoa Sai Gon, noi ket noi nhung nguoi yeu thich kham pha voi nhung dia diem doc dao va day chat luong trong thanh pho.",
  metadataBase: new URL("https://www.toilanguoisaigon.com"),
  openGraph: {
    type: "website",
    url: "https://www.toilanguoisaigon.com/",
    title: "Toi la nguoi Sai Gon - Kham pha am thuc & van hoa",
    description:
      "Nen tang kham pha am thuc va van hoa Sai Gon, noi ket noi nhung nguoi yeu thich kham pha voi nhung dia diem doc dao va day chat luong trong thanh pho.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Toi la nguoi Sai Gon - Kham pha am thuc & van hoa",
    description:
      "Nen tang kham pha am thuc va van hoa Sai Gon, noi ket noi nhung nguoi yeu thich kham pha voi nhung dia diem doc dao va day chat luong trong thanh pho.",
    images: [
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=1200&auto=format&fit=crop",
    ],
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⭐</text></svg>",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

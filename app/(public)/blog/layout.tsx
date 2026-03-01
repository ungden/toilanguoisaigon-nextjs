import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog ẩm thực Sài Gòn — Hướng dẫn, Review & Văn hóa ăn uống",
  description:
    "Khám phá Sài Gòn qua những bài viết chuyên sâu về ẩm thực, văn hóa ăn uống, gợi ý quán ngon và mẹo hay từ cộng đồng.",
  openGraph: {
    title: "Blog ẩm thực Sài Gòn — Tôi Là Người Sài Gòn",
    description:
      "Hướng dẫn ăn uống, review quán ngon, văn hóa ẩm thực và mẹo hay cho dân yêu ẩm thực Sài Gòn.",
    type: "website",
    url: "https://www.toilanguoisaigon.com/blog",
  },
  alternates: {
    canonical: "https://www.toilanguoisaigon.com/blog",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

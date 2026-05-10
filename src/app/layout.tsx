import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/fact/providers";

export const metadata: Metadata = {
  title: "FACT - منصة المحاسبة الفلاحية الرقمية",
  description: "النموذج الرقمي المقترح لرقمنة المحاسبة الفلاحية كآلية لتحسين حوكمة المستغلات الصغيرة في الجزائر",
  keywords: ["FACT", "محاسبة فلاحية", "حوكمة", "مستغلات فلاحية", "الجزائر", "رقمنة"],
  authors: [{ name: "FACT Platform" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-[Tajawal] antialiased bg-background text-foreground">
        <Providers>
          {children}
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harlo | AI chatbot for business websites",
  description: "Train a calm, capable AI chatbot on your website and business knowledge."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

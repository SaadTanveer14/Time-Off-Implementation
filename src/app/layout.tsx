import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Time Off · ExampleHR",
  description: "Request, approve, and track time off — without leaving ExampleHR.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#FAFAF7] text-[#0F0B1E]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

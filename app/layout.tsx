import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Sentence Splitter for AI",
  description:
    "Split English text into AI-friendly sentences with JSON output using regex."
};

type RootLayoutProps = {
  children: React.ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en" className={inter.variable}>
    <body className="flex min-h-screen flex-col">
      {children}
    </body>
  </html>
);

export default RootLayout;

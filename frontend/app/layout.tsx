import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Conversation & Sales Suite — Turn Conversations into Customers 24/7",
  description: "Unified AI-powered customer engagement platform with specialized Customer Support, Sales, and Appointment booking agents.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased bg-[#071329] text-slate-800">
        {children}
      </body>
    </html>
  );
}

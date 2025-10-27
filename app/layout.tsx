import type { Metadata } from "next";
import '@ant-design/v5-patch-for-react-19';
import ConditionalLayout from '@/components/AppLayout';
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Aictr Center - AI创意平台",
  description: "Aictr Center AI创意平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className="antialiased bg-blue-50">
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
      </body>
    </html>
  );
}
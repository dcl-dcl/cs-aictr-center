import type { Metadata } from "next";
import '@ant-design/v5-patch-for-react-19';
import Navbar from '@/components/Navbar';
import LayoutWrapper from '@/components/LayoutWrapper';
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "CS Demo Center - AI创意平台",
  description: "CS Demo Center AI创意平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <html lang="zh">
      <body className="antialiased bg-blue-50">
        <div className="h-screen flex flex-col relative">
          <Navbar />
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </div>
      </body>
    </html>
  );
}
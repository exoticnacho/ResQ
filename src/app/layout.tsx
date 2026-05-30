import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";

export const metadata: Metadata = {
  title: "ResQ — Rescue Made Simple",
  description: "5-Star Premium Food Rescue Marketplace for sustainable living.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F4F7FB",
};

import { UserProgressProvider } from '@/context/UserProgressContext';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <UserProgressProvider>
            <AppLayoutWrapper>
              {children}
            </AppLayoutWrapper>
          </UserProgressProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

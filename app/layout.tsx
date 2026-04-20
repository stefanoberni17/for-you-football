import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Outfit } from "next/font/google";
import BottomTabBar from "@/components/BottomTabBar";
import GlobalCheckinWrapper from "@/components/GlobalCheckinWrapper";
import GlobalMeditationWrapper from "@/components/GlobalMeditationWrapper";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "For You Football",
  description: "Il mental training che ti aiuta a giocare con più lucidità, fiducia e libertà",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "For You Football",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1A9660",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={outfit.className}>
      <body className="pb-tabbar">
        <ServiceWorkerRegistration />
        <GlobalCheckinWrapper>
          <GlobalMeditationWrapper>
            {children}
            <BottomTabBar />
          </GlobalMeditationWrapper>
        </GlobalCheckinWrapper>
      </body>
    </html>
  );
}

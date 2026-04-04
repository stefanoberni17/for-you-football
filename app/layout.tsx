import type { Metadata } from "next";
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
  themeColor: "#1A9660",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "For You Football",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={outfit.className}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="pb-20">
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

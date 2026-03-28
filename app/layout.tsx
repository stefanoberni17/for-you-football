import type { Metadata } from "next";
import "./globals.css";
import { Outfit } from "next/font/google";
import BottomTabBar from "@/components/BottomTabBar";
import GlobalCheckinWrapper from "@/components/GlobalCheckinWrapper";
import GlobalMeditationWrapper from "@/components/GlobalMeditationWrapper";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "For You Football",
  description: "Il mental training che ti aiuta a giocare con più lucidità, fiducia e libertà",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={outfit.className}>
      <body className="pb-20">
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

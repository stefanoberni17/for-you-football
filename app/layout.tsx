import type { Metadata } from "next";
import "./globals.css";
import { DM_Sans } from "next/font/google";
import BottomTabBar from "@/components/BottomTabBar";
import GlobalMeditationWrapper from "@/components/GlobalMeditationWrapper";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
    <html lang="it" className={dmSans.className}>
      <body className="pb-20">
        <GlobalMeditationWrapper>
          {children}
          <BottomTabBar />
        </GlobalMeditationWrapper>
      </body>
    </html>
  );
}
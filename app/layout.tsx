import type { Metadata, Viewport } from "next";
import "./globals.css";
import localFont from "next/font/local";
import BottomTabBar from "@/components/BottomTabBar";
import GlobalCheckinWrapper from "@/components/GlobalCheckinWrapper";
import GlobalMeditationWrapper from "@/components/GlobalMeditationWrapper";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import PaywallGuard from "@/components/PaywallGuard";
import ConsentReacceptSheet from "@/components/ConsentReacceptSheet";
import AppResume from "@/components/AppResume";

// Brand (Notion, "Brief Landing Page → Brand & stile visivo"): Outfit per tutto (700 titoli,
// 400/500 UI), Crimson Pro corsivo SOLO per le citazioni (mantra, frasi firma). Review 16/9:
// prima Outfit era caricato ma body { font-family: Arial } in globals.css lo annullava.
// Dal 4/11 i file stanno nel repo (app/fonts, licenza OFL): la build non scarica più niente da Google Fonts
// (il 3/11 una risposta diversa di Google aveva fermato la CI). Font variabili: un file per tutti i pesi.
const outfit = localFont({
  src: "./fonts/outfit-latin-wght.woff2",
  display: "swap",
  weight: "100 900",
  style: "normal",
  variable: "--font-outfit",
});
const crimson = localFont({
  src: "./fonts/crimson-pro-latin-wght-italic.woff2",
  display: "swap",
  weight: "200 900",
  style: "italic",
  variable: "--font-crimson",
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
  // Tema dark: status bar/chrome iOS coerente con bg-app (#0d1310)
  themeColor: "#0d1310",
  // NOTA: NON impostare interactiveWidget — su PWA iOS faceva spostare la
  // BottomTabBar in modo persistente (anche senza keyboard attiva).
  // La chat usa 100dvh (h-dvh-screen utility) che gestisce gia la keyboard.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${outfit.variable} ${crimson.variable}`}>
      {/* Body senza pb-tabbar: ogni page lo applica gia sul <main>. Body con
          pb-tabbar + main height:100vh (es. /chat) avrebbe body > 100vh ->
          la pagina poteva scrollare e iOS PWA auto-scrollava al mount. */}
      <body>
        <ServiceWorkerRegistration />
        <PaywallGuard />
        <ConsentReacceptSheet />
        <AppResume />
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

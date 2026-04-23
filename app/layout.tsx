import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loopit — Make Playables",
  description: "Finally, everyone builds the future of play, not just watches it.",
  manifest: "/manifest.webmanifest",
  applicationName: "Loopit",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Loopit",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon-192.svg" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full overflow-hidden bg-black text-white">
        {children}
      </body>
    </html>
  );
}

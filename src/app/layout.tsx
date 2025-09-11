import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FC Mierda - Official Website",
  icons: {
    icon: "/FCMierda-team-logo.png",
  },
  description: "Welcome to the official website of FC Mierda. Get the latest game recaps, results, and more.",
  keywords: ["football", "soccer", "FC Mierda", "team", "Rotterdam football team", "Powerleague"],
  authors: [{ name: "FC Mierda", url: "https://fc-mierda.nl" }],
  openGraph: {
    title: "FC Mierda - Official Website",
    description: "Follow FC Mierda for the latest news, fixtures, and results. We're the slightly below average football team from Rotterdam playing in the Powerleague.",
    url: "https://fcmierda.nl",
    siteName: "FC Mierda",
    images: [
      {
        url: "https://fc-mierda.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "FC Mierda Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  themeColor: "#006400",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

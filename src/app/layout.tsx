import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { MainLayout } from "@/components/MainLayout";
import { AuthProvider } from "@/context/AuthContext";
import { LoginModalProvider } from "@/context/LoginModalContext";
import { CommandMenuProvider } from "@/context/CommandMenuContext";
import { ThemeProvider } from "@/components/theme-provider";
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from 'sonner';
import { GoogleAnalytics } from '@next/third-parties/google';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#f59e0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://albionkit.com'),
  title: {
    default: "AlbionKit - The Ultimate Albion Online Companion",
    template: "%s | AlbionKit",
  },
  description: "Master Albion Online with AlbionKit. Features include a powerful Build Database, Market Flipper, PvP Intel, Crafting Calculator, and real-time Kill Feeds.",
  keywords: ["Albion Online", "Albion Builds", "Market Flipper", "PvP Intel", "Crafting Calculator", "Albion Tools", "Albion Database", "MMORPG", "Albion Online Market", "Albion Online PvP"],
  authors: [{ name: "AlbionKit Team" }],
  creator: "AlbionKit",
  publisher: "AlbionKit",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AlbionKit",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://albionkit.com',
    siteName: 'AlbionKit',
    title: 'AlbionKit - The Ultimate Albion Online Companion',
    description: 'Master Albion Online with AlbionKit. Features include a powerful Build Database, Market Flipper, PvP Intel, Crafting Calculator, and real-time Kill Feeds.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AlbionKit Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AlbionKit - The Ultimate Albion Online Companion',
    description: 'Master Albion Online with AlbionKit. Features include a powerful Build Database, Market Flipper, PvP Intel, Crafting Calculator, and real-time Kill Feeds.',
    images: ['/og-image.jpg'],
    creator: '@Albion_Kit',
  },
  verification: {
    google: 'google-site-verification-code', // User needs to provide this
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AlbionKit',
  url: 'https://albionkit.com',
  logo: 'https://albionkit.com/logo.png', // Ensure this exists
  sameAs: [
    'https://twitter.com/Albion_Kit',
    'https://github.com/albionkit',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{ __html: `(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "vou0rm1qq5");` }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <LoginModalProvider>
              <MainLayout>
                {children}
              </MainLayout>
              <Toaster />
            </LoginModalProvider>
          </AuthProvider>
        </ThemeProvider>
        {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { MainLayout } from "@/components/MainLayout";
import { AuthProvider } from "@/context/AuthContext";
import { LoginModalProvider } from "@/context/LoginModalContext";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from 'sonner';
import { GoogleAnalytics } from '@next/third-parties/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, getLocale } from 'next-intl/server';

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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');

  return {
    metadataBase: new URL('https://albionkit.com'),
    title: {
      default: t('title'),
      template: t('template'),
    },
    description: t('description'),
    keywords: t('keywords').split(', '),
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
      url: 'https://albionkit.com',
      siteName: 'AlbionKit',
      title: t('title'),
      description: t('description'),
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
      title: t('title'),
      description: t('description'),
      images: ['/og-image.jpg'],
      creator: '@Albion_Kit',
    },
  };
}

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get locale from cookies (set by language switcher)
  // Default to English if no cookie
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  
  const messages = (await import(`@/../messages/${locale}.json`)).default;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300`}
      >
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PSSQCVHK"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <script
          dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PSSQCVHK');` }}
        />
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
        <NextIntlClientProvider messages={messages} locale={locale}>
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
        </NextIntlClientProvider>
        {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
      </body>
    </html>
  );
}

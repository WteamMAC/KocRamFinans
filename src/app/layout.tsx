import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { trTR } from "@clerk/localizations";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Koç Ram Finans - Geleceğinizi Güvence Altına Alın",
  description: "Finansal durumunuzu takip edin ve geleceğinizi planlayın.",
};

import { ThemeProvider } from "@/components/theme-provider";
import { CurrencyProvider } from "@/context/currency-context";
import { getExchangeRatesAction } from "@/app/actions/market";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialRates = await getExchangeRatesAction();
  let initialCurrency = "TRY";
  try {
    const { userId } = await auth();
    if (userId) {
      const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
      if (user && user.currency) {
        initialCurrency = user.currency;
      }
    } else {
      const cookieStore = await cookies();
      const cookieVal = cookieStore.get("koç_ram_display_currency")?.value;
      if (cookieVal) {
        initialCurrency = cookieVal;
      }
    }
  } catch (e) {}

  return (
    <ClerkProvider 
      afterSignOutUrl="/"
      localization={trTR}
      appearance={{
        layout: {
          socialButtonsVariant: "blockButton",
          logoPlacement: "inside",
          shimmer: true,
        },
        variables: {
          colorPrimary: "#8c5000",
          borderRadius: "0.5rem",
          fontFamily: "var(--font-inter), var(--font-outfit), sans-serif",
        },
        elements: {
          card: "shadow-ambient-high border border-border/20 rounded-2xl bg-card text-card-foreground",
          headerTitle: "text-primary font-bold text-2xl tracking-tight font-heading",
          headerSubtitle: "text-muted-foreground font-medium",
          socialButtonsBlockButton: "border-border/30 hover:bg-muted transition-all bg-card text-foreground",
          formButtonPrimary: "bg-gradient-to-r from-[#f18d02] to-[#8C5000] hover:brightness-110 active:scale-95 transition-all text-white shadow-lg shadow-[#8C5000]/20 disabled:opacity-70 disabled:brightness-90",
          footerActionLink: "text-primary hover:text-primary/90 font-bold",
          identityPreviewText: "text-primary font-bold",
          formFieldInput: "border-border/30 focus:border-[#f18d02] focus:ring-2 focus:ring-[#f18d02]/20 transition-all rounded-xl bg-background text-foreground",
          formFieldLabel: "text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-1",
        }
      }}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <html
        lang="tr"
        suppressHydrationWarning
        className={`${outfit.variable} ${inter.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <CurrencyProvider initialRates={initialRates || undefined} initialCurrency={initialCurrency}>
              {children}
            </CurrencyProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

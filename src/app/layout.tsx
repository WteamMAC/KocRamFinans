import type { Metadata } from "next";
import { Montserrat, Work_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { trTR } from "@clerk/localizations";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Koç Ram Finans - Geleceğinizi Güvence Altına Alın",
  description: "Finansal durumunuzu takip edin ve geleceğinizi planlayın.",
};

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          fontFamily: "var(--font-work-sans), var(--font-montserrat), sans-serif",
        },
        elements: {
          card: "shadow-ambient-high border border-border/20 rounded-2xl bg-card text-card-foreground",
          headerTitle: "text-primary font-bold text-2xl tracking-tight font-heading",
          headerSubtitle: "text-muted-foreground font-medium",
          socialButtonsBlockButton: "border-border/30 hover:bg-muted transition-all bg-card text-foreground",
          formButtonPrimary: "bg-primary hover:bg-primary/90 transition-all shadow-ambient-medium text-primary-foreground",
          footerActionLink: "text-primary hover:text-primary/90 font-bold",
          identityPreviewText: "text-primary font-bold",
          formFieldInput: "border-border/30 focus:border-primary focus:ring-primary/20 transition-all rounded-lg bg-background text-foreground",
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
        className={`${montserrat.variable} ${workSans.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

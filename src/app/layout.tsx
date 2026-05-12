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
  description: "Dostane ve profesyonel finansal koçluk asistanınız",
};

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
          colorText: "#191c1d",
          colorBackground: "#ffffff",
          colorInputBackground: "#f8f9fa",
          colorInputText: "#191c1d",
          borderRadius: "0.5rem",
          fontFamily: "var(--font-work-sans), var(--font-montserrat), sans-serif",
        },
        elements: {
          card: "shadow-ambient-high border border-[#dbc2b0]/20 rounded-2xl",
          headerTitle: "text-[#8c5000] font-bold text-2xl tracking-tight font-heading",
          headerSubtitle: "text-[#554336] font-medium",
          socialButtonsBlockButton: "border-[#dbc2b0]/30 hover:bg-[#f8f9fa] transition-all",
          formButtonPrimary: "bg-[#8c5000] hover:bg-[#f18d02] transition-all shadow-ambient-medium",
          footerActionLink: "text-[#8c5000] hover:text-[#f18d02] font-bold",
          identityPreviewText: "text-[#8c5000] font-bold",
          formFieldInput: "border-[#dbc2b0]/30 focus:border-[#f18d02] focus:ring-[#f18d02]/20 transition-all rounded-lg",
          formFieldLabel: "text-[12px] font-bold text-[#554336] uppercase tracking-widest mb-1",
        }
      }}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <html
        lang="tr"
        className={`${montserrat.variable} ${workSans.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col font-sans">{children}</body>
      </html>
    </ClerkProvider>
  );
}

import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { trTR } from "@clerk/localizations";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Koç Ai - Sovereign Intelligence",
  description: "Yapay zeka destekli profesyonel finans asistanınız",
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
          colorPrimary: "#001b44",
          colorText: "#1a1c1a",
          colorBackground: "#ffffff",
          colorInputBackground: "#faf9f6",
          colorInputText: "#1a1c1a",
          borderRadius: "1.25rem",
          fontFamily: "var(--font-plus-jakarta-sans), var(--font-inter), sans-serif",
        },
        elements: {
          card: "shadow-2xl border border-[#c4c6d2]/20",
          headerTitle: "text-[#001b44] font-bold text-2xl tracking-tight",
          headerSubtitle: "text-[#434750] font-medium",
          socialButtonsBlockButton: "border-[#c4c6d2]/30 hover:bg-[#faf9f6] transition-all",
          formButtonPrimary: "bg-[#001b44] hover:bg-[#002f6c] transition-all shadow-lg shadow-[#001b44]/10",
          footerActionLink: "text-[#735c00] hover:text-[#001b44] font-bold",
          identityPreviewText: "text-[#001b44] font-bold",
          formFieldInput: "border-[#c4c6d2]/30 focus:border-[#fed65b] focus:ring-[#fed65b]/20 transition-all",
          formFieldLabel: "text-[10px] font-bold text-[#747781] uppercase tracking-widest",
        }
      }}
    >
      <html
        lang="tr"
        className={`${inter.variable} ${plusJakartaSans.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col font-sans">{children}</body>
      </html>
    </ClerkProvider>
  );
}

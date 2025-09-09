import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

const title = "ME HOT 100";
const description = "My Top 100 songs of the last week.";

export const metadata: Metadata = {
  title: title,
  description: description,
  openGraph: {
    url: "https://jeremyquinto.com",
    title: title,
    description: description,
  },
  twitter: {
    card: "summary_large_image",
    title: title,
    description: description,
  },
  category: "technology",
  authors: [{ name: "Jeremy Quinto" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="pt-[100px] flex flex-col min-h-[100dvh] max-w-[100dvw] overflow-x-hidden relative">
            <Navbar />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

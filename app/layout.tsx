import type { Metadata, Viewport } from "next";
import "@fontsource/inter-tight/300.css";
import "@fontsource/inter-tight/400.css";
import "@fontsource/inter-tight/500.css";
import "@fontsource/inter-tight/600.css";
import "@fontsource/inter-tight/700.css";
import "@fontsource/inter-tight/800.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@/styles/base.css";
import "@/styles/ui.css";
import "@/styles/sections.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "PRISMAL — A World Built to Survive",
  description: "PRISMAL is an original science-fiction universe currently in development. A transmedia IP built world first.",
  openGraph: {
    title: "PRISMAL — A World Built to Survive",
    description: "An original science-fiction universe currently in development.",
    images: [{ url: "/assets/capital-1200.webp", width: 1200, height: 800 }],
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('motion');",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

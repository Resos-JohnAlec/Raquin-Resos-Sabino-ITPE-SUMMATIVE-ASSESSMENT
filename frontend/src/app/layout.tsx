import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-HAS | Enterprise IT Helpdesk",
  description: "AI-Powered Enterprise Helpdesk and Workflow Automation System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 font-mono antialiased selection:bg-cyan-900 selection:text-cyan-100">
        {children}
      </body>
    </html>
  );
}

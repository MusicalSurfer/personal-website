import "./globals.css";

export const metadata = {
  title: "Grady Software Solutions",
  description: "Thoughtful website design, custom software development, and ongoing management with Daniel Grady. Built around your business, wherever you work.",
  applicationName: "Grady Software Solutions",
  openGraph: {
    title: "Grady Software Solutions",
    description: "Websites and software, built around your business. Design, development, and ongoing care with Daniel Grady.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Grady Software Solutions",
    description: "Thoughtful websites, custom software, and ongoing care with Daniel Grady.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

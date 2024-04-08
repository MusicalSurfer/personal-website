import { Inter } from "next/font/google";
import "./globals.css";
import { ActiveProvider } from "./context";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Grady Software Solutions",
  description: "Personal Website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ActiveProvider>
          {children}
        </ActiveProvider>
      </body>
    </html>
  );
}

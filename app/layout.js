import "./globals.css";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";

export const metadata = {
  title: "HostelHub – UMaT Student Hostels",
  description: "Find verified hostels near UMaT campus",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-50">
        {children}
      </body>
    </html>
  );
}
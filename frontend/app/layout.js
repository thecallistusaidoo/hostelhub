// app/layout.js
import { AuthProvider } from "./lib/auth";

export const metadata = {
  title: "HostelHub — UMaT Student Hostels",
  description: "Find verified hostels near UMaT campus, Tarkwa. Compare prices, amenities, and book your room.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/tailwind.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet"/>
      </head>
      <body className="min-h-screen flex flex-col bg-gray-50">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
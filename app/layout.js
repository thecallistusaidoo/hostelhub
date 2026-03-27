import "./globals.css";

export const metadata = {
  title: "HostelHub - UMaT",
  description: "Find and list hostels around UMaT campus",
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
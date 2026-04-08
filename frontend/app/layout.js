import "./globals.css";

export const metadata = {
  title: "HostelHub — UMaT Student Hostels",
  description: "Find verified hostels near UMaT campus, Tarkwa. Compare prices, amenities, and book your room.",
};

// Script injected before React hydrates to prevent dark mode flash
const themeScript = `
(function(){
  var saved = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var isDark = saved ? saved === 'dark' : prefersDark;
  if (isDark) document.documentElement.classList.add('dark');
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap" rel="stylesheet"/>
        {/* Prevents flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }}/>
      </head>
      <body className="min-h-screen flex flex-col transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
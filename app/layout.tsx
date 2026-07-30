import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Трекер',
  description: 'Трекер калорий и веса',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Трекер',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0a0b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.svg" />
      </head>
      <body className="min-h-full antialiased" style={{ background: '#0a0a0b' }}>
        {children}
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(function (reg) { reg.update(); });
            // A new worker taking control means the old one was serving stale
            // HTML/CSS — reload once so the page matches the deployed build.
            var reloaded = false;
            navigator.serviceWorker.addEventListener('controllerchange', function () {
              if (reloaded) return;
              reloaded = true;
              window.location.reload();
            });
          }`}
        </Script>
      </body>
    </html>
  );
}

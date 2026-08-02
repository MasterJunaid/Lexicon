import type { Metadata, Viewport } from 'next';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import BottomNav from '@/components/BottomNav';
import ServiceWorker from '@/components/ServiceWorker';
import { THEMES } from '@/lib/themes';

export const metadata: Metadata = {
  title: 'Lexicon',
  description: 'A vocabulary practice app for words worth deploying.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Lexicon',
  appleWebApp: {
    capable: true,
    title: 'Lexicon',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#F5F1E8',
};

/**
 * Applies the stored theme before first paint so switching to Ink or Deep
 * Winter doesn't flash cream on launch.
 */
const themeBootstrap = `
(function(){
  try {
    var themes = ${JSON.stringify(
      Object.fromEntries(THEMES.map((t) => [t.id, { vars: t.vars, dark: t.dark }]))
    )};
    var raw = localStorage.getItem('lexicon.state.v1');
    var id = raw ? (JSON.parse(raw).settings || {}).theme : null;
    var theme = themes[id] || themes.editorial;
    var root = document.documentElement;
    for (var key in theme.vars) root.style.setProperty(key, theme.vars[key]);
    root.dataset.theme = id || 'editorial';
    root.style.colorScheme = theme.dark ? 'dark' : 'light';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme.vars['--bg']);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Root layout applies to every route, so the pages/_document warning doesn't apply.
            Each theme also declares a full local fallback stack, so the app is legible offline. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Playfair+Display:wght@400;500;600&family=Libre+Caslon+Text:wght@400;700&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <StoreProvider>
          <div className="min-h-[100dvh]">{children}</div>
          <BottomNav />
          <ServiceWorker />
        </StoreProvider>
      </body>
    </html>
  );
}

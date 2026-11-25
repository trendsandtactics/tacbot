// src/app/layout.tsx
import { ToastProvider } from '@/components/providers/toast-provider';
import './globals.css';

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Filter out false-positive hydration errors caused by browser extensions (ColorZilla, Bitwarden, etc.)
              (function() {
                if (typeof window !== 'undefined') {
                  const origError = console.error;
                  console.error = function(...args) {
                    const str = args.map(function(a) {
                      return typeof a === 'string' ? a : (a && a.message) || '';
                    }).join(' ');
                    if (str.indexOf('bis_skin_checked') !== -1 || (str.indexOf('hydration-mismatch') !== -1 && str.indexOf('bis_skin_checked') !== -1)) {
                      return;
                    }
                    origError.apply(console, args);
                  };

                  if (typeof MutationObserver !== 'undefined') {
                    const observer = new MutationObserver(function(mutations) {
                      for (let i = 0; i < mutations.length; i++) {
                        const m = mutations[i];
                        if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked' && m.target && m.target.removeAttribute) {
                          m.target.removeAttribute('bis_skin_checked');
                        }
                      }
                    });
                    observer.observe(document.documentElement, {
                      attributes: true,
                      subtree: true,
                      attributeFilter: ['bis_skin_checked']
                    });
                  }
                }
              })();
            `
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className='font-sans'
        style={{
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}
      >
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}

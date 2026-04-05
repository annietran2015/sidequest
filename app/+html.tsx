import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,400&family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            @font-face {
              font-family: 'Fraunces_400Regular';
              src: url('https://fonts.gstatic.com/s/fraunces/v31/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uZmS6kTqOu-g.woff2') format('woff2');
            }
            @font-face {
              font-family: 'Fraunces_700Bold';
              src: url('https://fonts.gstatic.com/s/fraunces/v31/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uZmS6kTqOu-g.woff2') format('woff2');
              font-weight: 700;
            }
            @font-face {
              font-family: 'DMSans_400Regular';
              src: url('https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAkJxhTmf3ZGMZpg.woff2') format('woff2');
            }
            @font-face {
              font-family: 'DMSans_500Medium';
              src: url('https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAkJxhTmf3ZGMZpg.woff2') format('woff2');
              font-weight: 500;
            }
            @font-face {
              font-family: 'DMSans_600SemiBold';
              src: url('https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAkJxhTmf3ZGMZpg.woff2') format('woff2');
              font-weight: 600;
            }
            @font-face {
              font-family: 'DMSans_700Bold';
              src: url('https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAkJxhTmf3ZGMZpg.woff2') format('woff2');
              font-weight: 700;
            }
          `
        }} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}

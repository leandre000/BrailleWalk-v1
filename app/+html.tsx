import { ScrollViewStyleReset } from 'expo-router/html';
import { ReactNode } from 'react';

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        
        <ScrollViewStyleReset />
        
        <style dangerouslySetInnerHTML={{
          __html: `
            body {
              margin: 0;
              padding: 0;
            }
            #root {
              display: flex;
              flex: 1;
              height: 100vh;
              width: 100vw;
            }
          `
        }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
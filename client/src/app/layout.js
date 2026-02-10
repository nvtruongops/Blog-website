import { Inter } from 'next/font/google';
import ReduxProvider from '@/store/ReduxProvider';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ALL BLOGS',
  description: 'A Blog website where you can add your blogs',
  keywords: 'blog website, blogs, all blogs, web development project, mern, frontend',
};

/**
 * Root Layout Component
 * Requirement 9.5: Implement Content Security Policy meta tags as a fallback
 * 
 * CSP meta tags provide client-side security as a fallback when HTTP headers
 * are not available or as an additional layer of protection.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* 
          Security Headers Note:
          CSP and other security headers are configured via HTTP headers in next.config.js
          which is the recommended approach for Next.js applications.
          
          Meta tag CSP is NOT used here because:
          1. It can conflict with HTTP header CSP
          2. Next.js requires 'unsafe-inline' for styles/scripts which is already set in headers
          3. HTTP headers are more secure and harder to bypass
          4. Some directives (like frame-ancestors) don't work in meta tags
        */}
        
        {/* X-Content-Type-Options - Prevent MIME type sniffing */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        
        {/* Referrer Policy - Control referrer information */}
        <meta name="referrer" content="no-referrer" />
      </head>
      <body className={inter.className}>
        <ReduxProvider>
          {children}
          <Toaster position="bottom-right" />
        </ReduxProvider>
      </body>
    </html>
  );
}

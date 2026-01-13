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
  // Get backend URL for CSP connect-src directive
  // Trim to remove any whitespace or \r\n characters from Vercel env
  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || '').trim();
  
  return (
    <html lang="en">
      <head>
        {/* 
          Content Security Policy Meta Tags - Requirement 9.5
          These provide fallback CSP protection on the client side.
          Note: Some directives like frame-ancestors cannot be set via meta tags.
        */}
        <meta
          httpEquiv="Content-Security-Policy"
          content={`
            default-src 'self';
            script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com;
            style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
            img-src 'self' data: blob: https: http:;
            font-src 'self' https://fonts.gstatic.com;
            connect-src 'self' ${backendUrl} https://accounts.google.com https://www.googleapis.com https://res.cloudinary.com;
            frame-src 'self' https://accounts.google.com;
            object-src 'none';
            base-uri 'self';
            form-action 'self';
            upgrade-insecure-requests;
          `.replace(/\s+/g, ' ').trim()}
        />
        
        {/* X-Content-Type-Options - Prevent MIME type sniffing */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        
        {/* 
          Note: X-Frame-Options cannot be set via meta tag - it must be set via HTTP header.
          This is already configured in backend/middleware/security.js via Helmet.
        */}
        
        {/* Referrer Policy - Control referrer information */}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
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

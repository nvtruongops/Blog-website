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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>
          {children}
          <Toaster position="bottom-right" />
        </ReduxProvider>
      </body>
    </html>
  );
}

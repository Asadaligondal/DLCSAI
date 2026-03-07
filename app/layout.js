import { Inter } from 'next/font/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'IEP Genius — AI-Powered IEP Writer',
  description: 'Write audit-safe IEPs in minutes, not hours.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar
          newestOnTop
          closeOnClick
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover
          toastClassName="!rounded-xl !shadow-lg !border !border-slate-200/60 !font-sans"
          bodyClassName="!text-sm !font-medium"
        />
      </body>
    </html>
  );
}

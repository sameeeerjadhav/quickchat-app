// frontend/app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './providers/ThemeProvider';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import MobileNav from './components/MobileNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'QuickChat',
  description: 'Real-time messaging app',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-black transition-colors duration-200`}>
        <ThemeProvider>
          <SocketProvider>
            <NotificationProvider>
              <main className="min-h-screen pb-16 md:pb-0"> {/* Add padding bottom for mobile nav */}
                {children}
              </main>
              <MobileNav />
              <ToastContainer
                position="top-right"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
                toastClassName="!bg-white dark:!bg-slate-800 !text-slate-900 dark:!text-white !rounded-lg !shadow-lg !border !border-slate-100 dark:!border-slate-700"
                progressClassName="!bg-blue-500"
              />
            </NotificationProvider>
          </SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
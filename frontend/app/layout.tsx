// frontend/app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './providers/ThemeProvider';
import { SocketProvider } from './context/SocketContext'; // Add this
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'QuickChat',
  description: 'Real-time messaging app',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <SocketProvider> {/* Wrap with SocketProvider */}
            {children}
            <ToastContainer />
          </SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
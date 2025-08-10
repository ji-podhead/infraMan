'use client';

'use client';


import { Inter } from 'next/font/google';
import Navbar from '@/components/layout/Navbar'; // Import the Navbar component
import { Provider, useDispatch, useSelector } from 'react-redux'; // Import Provider, useDispatch, useSelector
import { store, RootState } from '@/store/store'; // Import your Redux store and RootState
import { fetchServers, fetchServerStats, Server } from '@/store/serversSlice'; // Import fetchServers and fetchServerStats
import { useEffect } from 'react'; // Import useEffect
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { Sidebar } from '@/components/layout/Sidebar'; // Import Sidebar
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea

const inter = Inter({ subsets: ['latin'] });
const metadata = {
  title: 'Server Dashboard', // Updated title
  description: 'Monitor and manage your servers', // Updated description
};

// Component to handle data fetching and provide context
function AppContent({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const servers = useSelector((state: RootState) => (state as RootState).servers.servers);
  const selectedServerId = useSelector((state: RootState) => (state as RootState).servers.selectedServerId);

  // Fetch servers on initial load
  useEffect(() => {
    dispatch(fetchServers() as any); // Dispatch as any due to thunk typing
  }, [dispatch]);

  // Fetch stats for selected server periodically
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (selectedServerId) {
      const selectedServer = servers.find((s: Server) => s.id === selectedServerId);
      if (selectedServer) {
        // Initial fetch
        dispatch(fetchServerStats(selectedServer) as any);
        // Set up interval for periodic fetching (e.g., every 10 seconds)
        intervalId = setInterval(() => {
          dispatch(fetchServerStats(selectedServer) as any);
        }, 10000); // Fetch every 10 seconds
      }
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [dispatch, selectedServerId, servers]);

  return (
    <div className="flex flex-col flex-grow h-[calc(100vh-64px)]"> {/* Main content area below Navbar */}
      {children}
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className='bg-black w-10 h-10 text-red-700'>aaaa</div>
        <Provider store={store}> {/* Wrap with Redux Provider */}
          <div className="flex flex-col bg-blue-800 h-screen w-full">
          <Navbar /> {/* Render the Navbar component */}
          <div className="h-full w-full  flex flex-col border border-2 border-black bg-red-700"> {/* Flex container for sidebar and main content */}
            <Sidebar /> {/* Render the Sidebar component */}
            <ScrollArea class="w-full h-full bg-slate-400"> {/* Main scrollable content area */}
              <div className='bg-red-700 w-10 h-10 '>aaaaaaaaaaa</div><AppContent>{children}</AppContent> {/* Wrap children with AppContent */}
            </ScrollArea>
          </div>
          </div>
          <Toaster /> {/* Add Toaster for displaying toasts */}
        </Provider>
      </body>
    </html>
  );
}

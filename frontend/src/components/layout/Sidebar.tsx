import React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { setSelectedServer } from '@/store/serversSlice';
import type { Server } from '@/store/serversSlice';

export function Sidebar() {
  const dispatch = useDispatch<AppDispatch>();
  const servers = useSelector((state: RootState) => state.servers.servers);
  const selectedServerId = useSelector((state: RootState) => state.servers.selectedServerId);

  const handleSelectServer = (id: number) => {
    dispatch(setSelectedServer(id));
  };

  return (
    <div className="w-[20%] bg-gray-900 p-4 border-r border-gray-700 h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-6 text-white">Servers</h2>
      
      <div className="mb-4 px-2"> {/* Add padding around the button */}
        <Link href="/settings" className="block">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Add Server</Button>
        </Link>
      </div>

      <ScrollArea className="flex-grow pr-2"> {/* Add right padding for scrollbar */}
        <nav className="space-y-2">
          {servers.map((server: Server) => (
            <Button
              key={server.id}
              variant={selectedServerId === server.id ? "default" : "ghost"}
              className={`w-full justify-start text-left px-4 py-2 rounded-md transition-colors duration-200 
                ${selectedServerId === server.id 
                  ? 'bg-blue-700 text-white shadow-md hover:bg-blue-800' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              onClick={() => handleSelectServer(server.id)}
            >
              <span className="truncate">{server.name}</span>
            </Button>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}

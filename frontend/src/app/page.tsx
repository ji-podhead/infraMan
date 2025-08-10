'use client';

import { useEffect, useCallback, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchServers, fetchServerStats, setSelectedServer, updateServerInStore } from '@/store/serversSlice';
import type { Server } from '@/store/serversSlice'; // Import Server interface as a type

import { DetailView } from "@/components/detail_view";
import { DetailEdit } from "@/components/detail_edit";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { servers, stats, loading, error, selectedServerId } = useSelector((state: RootState) => state.servers);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [serverToEdit, setServerToEdit] = useState<Server | null>(null);

  useEffect(() => {
    dispatch(fetchServers());
  }, [dispatch]);

  useEffect(() => {
    if (selectedServerId !== null) {
      const selectedServer = servers.find(s => s.id === selectedServerId);
      if (selectedServer) {
        dispatch(fetchServerStats(selectedServer));
        const interval = setInterval(() => {
          dispatch(fetchServerStats(selectedServer));
        }, 5000);
        return () => clearInterval(interval);
      }
    }
  }, [selectedServerId, servers, dispatch]);

  const handleSelectServer = (id: number) => {
    dispatch(setSelectedServer(id));
  };

  const handleEditServer = (server: Server) => {
    setServerToEdit(server);
    setIsEditDialogOpen(true);
  };

  const handleSaveEditedServer = async (updatedServer: Server) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servers/${updatedServer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedServer),
      });
      if (!response.ok) {
        throw new Error(`Failed to update server: ${response.statusText}`);
      }
      const data: Server = await response.json();
      dispatch(updateServerInStore(data)); // Update Redux store
    } catch (err: any) {
      // setError(err.message); // Error handling can be done via Redux state if preferred
      console.error('Error updating server:', err);
    }
  };

  const selectedServer = servers.find(server => server.id === selectedServerId);

  if (loading === 'pending' && servers.length === 0) return <div className="container mx-auto p-4">Loading servers...</div>;
  if (error) return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="flex-1 p-4 md:p-10 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Server Dashboard</h1>
          <p className="text-gray-400">Monitor your server resources and active users</p>
        </div>
        <Link href="/users">
          <Button variant="outline" className="bg-gray-700 text-white hover:bg-gray-600">User Management</Button>
        </Link>
      </div>

      {loading === 'pending' && servers.length > 0 && (
        <div className="mb-6 text-center text-gray-500">Loading server stats...</div>
      )}

      {servers.length === 0 && loading === 'succeeded' && !error && (
        <div className="text-center py-10">
          <p className="text-lg text-gray-400">No servers added yet.</p>
          <Link href="/settings" className="mt-4 inline-block">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Add Your First Server</Button>
          </Link>
        </div>
      )}

      {selectedServer ? (
        <DetailView
          server={selectedServer}
          stats={stats[selectedServer.id] || null}
          onEdit={handleEditServer}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          Select a server from the sidebar to view details.
        </div>
      )}

      <DetailEdit
        server={serverToEdit}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleSaveEditedServer}
      />
    </div>
  );
}

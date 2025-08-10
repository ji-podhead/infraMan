'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // For navigation
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog"; // For editing modal
import { DetailEdit } from "@/components/detail_edit"; // Import DetailEdit component

interface GpuStats {
  name: string;
  utilization_gpu: number;
  memory_used: number;
  memory_total: number;
  fan_speed?: number;
  temperature_gpu?: number;
  power_draw?: number;
  power_limit?: number;
  pci_bus_id?: string;
}

interface ActiveUser {
  username: string;
  tty?: string;
  from_host?: string;
  login_time?: string;
  idle_time?: string;
  what?: string;
}

interface SystemStats {
  cpu_percent: number;
  memory_percent: number;
  gpu_stats: GpuStats[];
  active_users: ActiveUser[];
}

interface Server {
  id: number;
  name: string;
  ip_address: string;
  ssh_user: string;
  ssh_password?: string; // Password might be sensitive, handle with care
  system_stats?: SystemStats; // Optional field to store fetched stats
}

export default function SettingsPage() {
  const router = useRouter();
  const [servers, setServers] = useState<Server[]>([]);
  const [newServer, setNewServer] = useState<Omit<Server, 'id'>>({
    name: '',
    ip_address: '',
    ssh_user: '',
    ssh_password: '',
  });
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        // Assuming /api/servers proxies to the backend's /servers/ endpoint
        const response = await fetch('/api/servers');
        if (!response.ok) {
          throw new Error(`Failed to fetch servers: ${response.statusText}`);
        }
        const initialServers: Server[] = await response.json();
        
        // Fetch system stats for each server
        const serversWithStats = await Promise.all(
          initialServers.map(async (server) => {
            try {
              const statsResponse = await fetch(`/api/servers/${server.id}/stats`);
              if (!statsResponse.ok) {
                console.warn(`Failed to fetch stats for server ${server.id}: ${statsResponse.statusText}`);
                return server; // Return server without stats if fetch fails
              }
              const statsData: SystemStats = await statsResponse.json();
              return { ...server, system_stats: statsData };
            } catch (statsErr) {
              console.error(`Error fetching stats for server ${server.id}:`, statsErr);
              return server; // Return server without stats on error
            }
          })
        );
        setServers(serversWithStats);
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching servers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchServers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewServer((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Assuming /api/servers proxies to the backend's POST /servers/ endpoint
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newServer),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || response.statusText);
      }
      const createdServer: Server = await response.json();
      setServers((prev) => [...prev, createdServer]);
      setNewServer({ name: '', ip_address: '', ssh_user: '', ssh_password: '' }); // Reset form
    } catch (err: any) {
      setError(err.message);
      console.error("Error adding server:", err);
    }
  };

  const handleEditServer = (server: Server) => {
    // Set the server to be edited, including its password if available
    setEditingServer(server);
  };

  const handleUpdateServer = async (updatedServer: Server) => {
    try {
      // Assuming /api/servers/{id} proxies to the backend's PUT /servers/{id} endpoint
      const response = await fetch(`/api/servers/${updatedServer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedServer),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || response.statusText);
      }
      const fetchedUpdatedServer: Server = await response.json();
      setServers((prev) => prev.map(s => s.id === fetchedUpdatedServer.id ? fetchedUpdatedServer : s));
      setEditingServer(null); // Close modal
    } catch (err: any) {
      setError(err.message);
      console.error("Error updating server:", err);
    }
  };

  const handleDeleteServer = async (serverId: number) => {
    if (!window.confirm("Are you sure you want to delete this server? This action cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch(`/api/servers/${serverId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || response.statusText);
      }
      setServers((prev) => prev.filter(s => s.id !== serverId));
    } catch (err: any) {
      setError(err.message);
      console.error("Error deleting server:", err);
    }
  };

  if (loading) return <div className="flex-1 p-4 text-gray-500">Loading settings...</div>;
  if (error) return <div className="flex-1 p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="flex-1 p-4 md:p-10 overflow-y-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">Server Settings</h1>

      <Card className="mb-8 bg-gray-800 text-white border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl">Add New Server</CardTitle>
          <CardDescription className="text-gray-400">Enter the details for a new server.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddServer} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-300">Server Name</Label>
              <Input
                id="name"
                name="name"
                value={newServer.name}
                onChange={handleInputChange}
                required
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="ip_address" className="text-gray-300">IP Address</Label>
              <Input
                id="ip_address"
                name="ip_address"
                value={newServer.ip_address}
                onChange={handleInputChange}
                required
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="ssh_user" className="text-gray-300">SSH User</Label>
              <Input
                id="ssh_user"
                name="ssh_user"
                value={newServer.ssh_user}
                onChange={handleInputChange}
                required
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="ssh_password" className="text-gray-300">SSH Password</Label>
              <Input
                id="ssh_password"
                name="ssh_password"
                type="password"
                value={newServer.ssh_password}
                onChange={handleInputChange}
                required
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Add Server</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 text-white border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl">Existing Servers</CardTitle>
          <CardDescription className="text-gray-400">Manage your registered servers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="border rounded-md border-gray-700">
            <TableCaption className="text-gray-400">List of registered servers.</TableCaption>
            <TableHeader>
              <TableRow className="hover:bg-gray-700">
                <TableHead className="text-gray-300">Name</TableHead>
                <TableHead className="text-gray-300">IP Address</TableHead>
                <TableHead className="text-gray-300">SSH User</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servers.map((server) => (
                <React.Fragment key={server.id}>
                  <TableRow className="hover:bg-gray-700">
                    <TableCell className="font-medium">{server.name}</TableCell>
                    <TableCell>{server.ip_address}</TableCell>
                    <TableCell>{server.ssh_user}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="mr-2 bg-yellow-600 hover:bg-yellow-700 text-white" onClick={() => handleEditServer(server)}>Edit</Button>
                        </DialogTrigger>
                      </Dialog>
                      <DetailEdit
                        server={editingServer}
                        isOpen={!!editingServer}
                        onClose={() => setEditingServer(null)}
                        onSave={handleUpdateServer}
                      />
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteServer(server.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                  {server.system_stats && server.system_stats.gpu_stats && server.system_stats.gpu_stats.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-2 px-4 bg-gray-700 text-gray-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          {server.system_stats.gpu_stats.map((gpu: GpuStats, index: number) => (
                            <Card key={index} className="p-3 bg-gray-600 text-white border-gray-500">
                              <CardTitle className="text-md mb-2">{gpu.name} (GPU {index})</CardTitle>
                              <p><strong>Utilization:</strong> {gpu.utilization_gpu}%</p>
                              <p><strong>Memory:</strong> {gpu.memory_used}MiB / {gpu.memory_total}MiB</p>
                              {gpu.temperature_gpu !== undefined && <p><strong>Temp:</strong> {gpu.temperature_gpu}°C</p>}
                              {gpu.fan_speed !== undefined && <p><strong>Fan:</strong> {gpu.fan_speed}%</p>}
                              {gpu.power_draw !== undefined && gpu.power_limit !== undefined && <p><strong>Power:</strong> {gpu.power_draw}W / {gpu.power_limit}W</p>}
                            {gpu.pci_bus_id && <p><strong>Bus ID:</strong> {gpu.pci_bus_id}</p>}
                          </Card>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {server.system_stats && server.system_stats.active_users && server.system_stats.active_users.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-2 px-4 bg-gray-700 text-gray-300">
                      <h4 className="text-md font-semibold mb-2">Active Users:</h4>
                      <ul className="list-disc list-inside">
                        {server.system_stats.active_users.map((user, index) => (
                          <li key={`${user.username}-${user.tty || index}`}>
                            {user.username}
                            {user.tty && ` (TTY: ${user.tty})`}
                            {user.from_host && ` from ${user.from_host}`}
                            {user.login_time && ` logged in at ${user.login_time}`}
                            {user.idle_time && ` idle for ${user.idle_time}`}
                            {user.what && ` (${user.what})`}
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                  </TableRow>
                )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

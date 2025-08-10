import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Server {
  id: number;
  name: string;
  ip_address: string;
  ssh_user: string;
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
  gpu_stats: {
    name: string;
    utilization_gpu: number;
    memory_used: number;
    memory_total: number;
  }[];
  active_users: ActiveUser[];
}

interface DetailViewProps {
  server: Server | null;
  stats: SystemStats | null;
  onEdit: (server: Server) => void;
}

const getCockpitUrl = (ip: string) => `https://${ip}:9090`;

export function DetailView({ server, stats, onEdit }: DetailViewProps) {
  if (!server) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Please select a server from the sidebar.
      </div>
    );
  }

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-semibold">{server.name}</CardTitle>
            <CardDescription className="text-gray-600">{server.ip_address}</CardDescription>
          </div>
          <Button variant="outline" onClick={() => onEdit(server)}>
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        {stats ? (
          <div className="space-y-4">
            {/* Resource Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-base">CPU Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">{stats.cpu_percent}%</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-base">Memory Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">{stats.memory_percent}%</p>
                </CardContent>
              </Card>
            </div>

            {/* GPU Stats */}
            {stats.gpu_stats && stats.gpu_stats.length > 0 && (
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-base">GPU Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.gpu_stats.map((gpu, index) => (
                    <div key={index} className="mb-3 last:mb-0 pb-3 last:pb-0 border-b last:border-b-0 last:border-gray-200">
                      <p className="font-semibold text-sm">{gpu.name}</p>
                      <p className="text-sm text-gray-700">Utilization: {gpu.utilization_gpu}%</p>
                      <p className="text-sm text-gray-700">Memory: {gpu.memory_used} / {gpu.memory_total} MB</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Active Users Table */}
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-base">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.active_users && stats.active_users.length > 0 ? (
                  <Table className="border rounded-md">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left">User</TableHead>
                        <TableHead className="text-left">Login Info</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.active_users.map((user: ActiveUser, index: number) => (
                        <TableRow key={user.username + index}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>
                            {user.login_time} {user.from_host ? `from ${user.from_host}` : ''}
                            {user.idle_time ? ` (idle ${user.idle_time})` : ''}
                            {user.what ? ` (${user.what})` : ''}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-gray-500">No active users</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-gray-500">Loading server stats...</p>
        )}
      </CardContent>
      <CardFooter>
        <a
          href={getCockpitUrl(server.ip_address)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Open Cockpit
        </a>
      </CardFooter>
    </Card>
  );
}

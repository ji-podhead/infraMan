'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const DrivesPage: React.FC = () => {
  const selectedServerId = useSelector((state: RootState) => state.servers.selectedServerId);
  const serverStats = useSelector((state: RootState) =>
    selectedServerId ? state.servers.stats[selectedServerId] : null
  );

  const diskPartitions = serverStats?.disk_partitions || [];

  if (!selectedServerId) {
    return (
      <div className="p-4 text-center text-gray-500">
        Please select a server to view drive information.
      </div>
    );
  }

  if (!serverStats) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading drive information...
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-10 overflow-y-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">Drive Information for Server {selectedServerId}</h1>
      
      {diskPartitions.length === 0 ? (
        <p className="text-gray-400">No disk partitions found for this server.</p>
      ) : (
        <Card className="bg-gray-800 text-white border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl">Disk Partitions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-gray-700">
                  <TableHead className="text-gray-300">Name</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Mountpoint</TableHead>
                  <TableHead className="text-gray-300">Size</TableHead>
                  <TableHead className="text-gray-300">Used</TableHead>
                  <TableHead className="text-gray-300">Available</TableHead>
                  <TableHead className="text-gray-300">Use %</TableHead>
                  <TableHead className="text-gray-300">Filesystem</TableHead>
                  <TableHead className="text-gray-300">LUKS</TableHead>
                  <TableHead className="text-gray-300">LVM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diskPartitions.map((disk, index) => (
                  <TableRow key={index} className="hover:bg-gray-700">
                    <TableCell className="font-medium">{disk.name}</TableCell>
                    <TableCell>{disk.type}</TableCell>
                    <TableCell>{disk.mountpoint || 'N/A'}</TableCell>
                    <TableCell>{disk.size || 'N/A'}</TableCell>
                    <TableCell>{disk.used || 'N/A'}</TableCell>
                    <TableCell>{disk.available || 'N/A'}</TableCell>
                    <TableCell>
                      {disk.use_percent ? (
                        <Badge variant={parseInt(disk.use_percent) > 80 ? 'destructive' : 'default'}>
                          {disk.use_percent}
                        </Badge>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>{disk.fstype || 'N/A'}</TableCell>
                    <TableCell>{disk.luks ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{disk.lvm ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DrivesPage;

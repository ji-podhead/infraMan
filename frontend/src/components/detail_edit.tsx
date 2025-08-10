import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Server {
  id: number;
  name: string;
  ip_address: string;
  ssh_user: string;
}

interface DetailEditProps {
  server: Server | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (server: Server) => void;
}

export function DetailEdit({ server, isOpen, onClose, onSave }: DetailEditProps) {
  const [editedServer, setEditedServer] = useState<Server | null>(null);

  useEffect(() => {
    setEditedServer(server);
  }, [server]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setEditedServer((prev) => {
      if (!prev) return null;
      return { ...prev, [id]: value };
    });
  };

  const handleSave = () => {
    if (editedServer) {
      onSave(editedServer);
    }
    onClose();
  };

  if (!editedServer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Server</DialogTitle>
          <DialogDescription>
            Make changes to your server here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={editedServer.name}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ip_address" className="text-right">
              IP Address
            </Label>
            <Input
              id="ip_address"
              value={editedServer.ip_address}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ssh_user" className="text-right">
              SSH User
            </Label>
            <Input
              id="ssh_user"
              value={editedServer.ssh_user}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

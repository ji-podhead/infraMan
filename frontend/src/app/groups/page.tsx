'use client';

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchGroups, createGroup, updateGroup, deleteGroup, Group, GroupCreatePayload, GroupUpdatePayload } from '@/store/usersGroupsSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const GroupsPage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { toast } = useToast();

  const selectedServerId = useSelector((state: RootState) => state.servers.selectedServerId);
  const { groups, loading, error } = useSelector((state: RootState) => state.usersGroups);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupGid, setNewGroupGid] = useState<number | undefined>(undefined);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupGid, setEditGroupGid] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (selectedServerId) {
      dispatch(fetchGroups(selectedServerId));
    }
  }, [dispatch, selectedServerId]);

  const handleCreateGroup = async () => {
    if (!selectedServerId || !newGroupName.trim()) {
      toast({
        title: 'Error',
        description: 'Server not selected or group name is empty.',
        variant: 'destructive',
      });
      return;
    }

    const groupData: GroupCreatePayload = { name: newGroupName.trim() };
    if (newGroupGid !== undefined) {
      groupData.gid = newGroupGid;
    }

    try {
      await dispatch(createGroup({ serverId: selectedServerId, groupData })).unwrap();
      toast({
        title: 'Success',
        description: `Group '${newGroupName}' created successfully.`,
      });
      setNewGroupName('');
      setNewGroupGid(undefined);
      setIsCreateDialogOpen(false);
    } catch (err: any) {
      toast({
        title: 'Error creating group',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleEditGroup = (group: Group) => {
    setCurrentGroup(group);
    setEditGroupName(group.name);
    setEditGroupGid(group.id); // GID is the ID in our model
    setIsEditDialogOpen(true);
  };

  const handleUpdateGroup = async () => {
    if (!selectedServerId || !currentGroup || !editGroupName.trim()) {
      toast({
        title: 'Error',
        description: 'Server not selected, no group selected, or group name is empty.',
        variant: 'destructive',
      });
      return;
    }

    const groupData: GroupUpdatePayload = { name: editGroupName.trim() };
    if (editGroupGid !== undefined && editGroupGid !== currentGroup.id) {
      groupData.gid = editGroupGid;
    }

    try {
      await dispatch(updateGroup({ serverId: selectedServerId, groupName: currentGroup.name, groupData })).unwrap();
      toast({
        title: 'Success',
        description: `Group '${currentGroup.name}' updated successfully.`,
      });
      setIsEditDialogOpen(false);
      setCurrentGroup(null);
    } catch (err: any) {
      toast({
        title: 'Error updating group',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGroup = async (groupName: string) => {
    if (!selectedServerId) {
      toast({
        title: 'Error',
        description: 'Server not selected.',
        variant: 'destructive',
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete group '${groupName}'? This action cannot be undone.`)) {
      try {
        await dispatch(deleteGroup({ serverId: selectedServerId, groupName })).unwrap();
        toast({
          title: 'Success',
          description: `Group '${groupName}' deleted successfully.`,
        });
      } catch (err: any) {
        toast({
          title: 'Error deleting group',
          description: err.message || 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
    }
  };

  if (!selectedServerId) {
    return (
      <div className="p-4 text-center text-gray-500">
        Please select a server to manage groups.
      </div>
    );
  }

  if (loading === 'pending') {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading groups...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-10 overflow-y-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">Group Management for Server {selectedServerId}</h1>
      
      <Button onClick={() => setIsCreateDialogOpen(true)} className="mb-4 bg-blue-600 hover:bg-blue-700 text-white">
        Create New Group
      </Button>

      {groups.length === 0 ? (
        <p className="text-gray-400">No groups found for this server.</p>
      ) : (
        <Card className="bg-gray-800 text-white border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl">Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-gray-700">
                  <TableHead className="text-gray-300">Name</TableHead>
                  <TableHead className="text-gray-300">GID</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.id} className="hover:bg-gray-700">
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{group.id}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="mr-2 bg-yellow-600 hover:bg-yellow-700 text-white" onClick={() => handleEditGroup(group)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteGroup(group.name)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Group Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Group</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newGroupName" className="text-right text-gray-300">
                Group Name
              </Label>
              <Input
                id="newGroupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="col-span-3 bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newGroupGid" className="text-right text-gray-300">
                GID (Optional)
              </Label>
              <Input
                id="newGroupGid"
                type="number"
                value={newGroupGid === undefined ? '' : newGroupGid}
                onChange={(e) => setNewGroupGid(e.target.value ? parseInt(e.target.value) : undefined)}
                className="col-span-3 bg-gray-700 text-white border-gray-600"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="bg-gray-600 hover:bg-gray-700 text-white">Cancel</Button>
            <Button onClick={handleCreateGroup} className="bg-blue-600 hover:bg-blue-700 text-white">Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Group: {currentGroup?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editGroupName" className="text-right text-gray-300">
                Group Name
              </Label>
              <Input
                id="editGroupName"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                className="col-span-3 bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editGroupGid" className="text-right text-gray-300">
                GID
              </Label>
              <Input
                id="editGroupGid"
                type="number"
                value={editGroupGid === undefined ? '' : editGroupGid}
                onChange={(e) => setEditGroupGid(e.target.value ? parseInt(e.target.value) : undefined)}
                className="col-span-3 bg-gray-700 text-white border-gray-600"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="bg-gray-600 hover:bg-gray-700 text-white">Cancel</Button>
            <Button onClick={handleUpdateGroup} className="bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupsPage;


import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Group, UserCreatePayload, UserUpdatePayload } from '@/store/usersGroupsSlice'; // Import interfaces from Redux slice
import { MultiSelect } from './multi-select'; // Assuming you have a multi-select component

interface UserViewProps {
  users: User[];
  groups: Group[];
  onAddUser: (user: UserCreatePayload) => void;
  onEditUser: (username: string, userData: UserUpdatePayload) => void;
  onDeleteUser: (username: string) => void;
}

export function UserView({ users, groups, onAddUser, onEditUser, onDeleteUser }: UserViewProps) {
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // State for Add User form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [newSelectedGroupNames, setNewSelectedGroupNames] = useState<string[]>([]);

  // State for Edit User form
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState(''); // Optional: for changing password
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editSelectedGroupNames, setEditSelectedGroupNames] = useState<string[]>([]);

  // Reset add user form when dialog opens/closes
  useEffect(() => {
    if (!isAddUserDialogOpen) {
      setNewUsername('');
      setNewPassword('');
      setNewIsAdmin(false);
      setNewSelectedGroupNames([]);
    }
  }, [isAddUserDialogOpen]);

  // Populate edit user form when dialog opens
  useEffect(() => {
    if (isEditUserDialogOpen && currentUser) {
      setEditUsername(currentUser.username);
      setEditIsAdmin(currentUser.is_admin);
      setEditSelectedGroupNames(currentUser.roles);
      setEditPassword(''); // Clear password field for security
    }
  }, [isEditUserDialogOpen, currentUser]);


  const handleAddUserSubmit = () => {
    if (newUsername.trim() === '') return;
    const userData: UserCreatePayload = {
      username: newUsername.trim(),
      password: newPassword,
      is_admin: newIsAdmin,
      group_names: newSelectedGroupNames,
    };
    onAddUser(userData);
    setIsAddUserDialogOpen(false);
  };

  const handleEditUserClick = (user: User) => {
    setCurrentUser(user);
    setIsEditUserDialogOpen(true);
  };

  const handleEditUserSubmit = () => {
    if (!currentUser || editUsername.trim() === '') return;

    const updatedUserData: UserUpdatePayload = {
      username: editUsername.trim(),
      is_admin: editIsAdmin,
      group_names: editSelectedGroupNames,
    };

    if (editPassword) {
      updatedUserData.password = editPassword;
    }

    onEditUser(currentUser.username, updatedUserData);
    setIsEditUserDialogOpen(false);
    setCurrentUser(null);
  };

  const allGroupOptions = groups.map(group => ({ label: group.name, value: group.name }));

  return (
    <Card className="shadow-lg h-full flex flex-col bg-gray-800 text-white border-gray-700">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-xl font-semibold">User Management</CardTitle>
        <Button onClick={() => setIsAddUserDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">Add User</Button>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        {users.length > 0 ? (
          <Table className="border rounded-md border-gray-700">
            <TableHeader>
              <TableRow className="hover:bg-gray-700">
                <TableHead className="text-left text-gray-300">ID</TableHead>
                <TableHead className="text-left text-gray-300">Username</TableHead>
                <TableHead className="text-left text-gray-300">Admin</TableHead>
                <TableHead className="text-left text-gray-300">Roles (Names)</TableHead>
                <TableHead className="text-left text-gray-300">Group IDs</TableHead>
                <TableHead className="text-right text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-700">
                  <TableCell>{user.id}</TableCell>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.is_admin ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{user.roles.join(', ')}</TableCell>
                  <TableCell>{user.group_ids.join(', ')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2 bg-yellow-600 hover:bg-yellow-700 text-white" onClick={() => handleEditUserClick(user)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => onDeleteUser(user.username)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-gray-400">No users found.</p>
        )}
      </CardContent>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add New User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new user account on the selected server.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newUsername" className="text-right text-gray-300">
                Username
              </Label>
              <Input
                id="newUsername"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="col-span-3 bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newPassword" className="text-right text-gray-300">
                Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="col-span-3 bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newIsAdmin" className="text-right text-gray-300">
                Admin
              </Label>
              <Checkbox
                id="newIsAdmin"
                checked={newIsAdmin}
                onCheckedChange={(checked) => setNewIsAdmin(checked as boolean)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newRoles" className="text-right text-gray-300">
                Groups
              </Label>
              <MultiSelect
                options={allGroupOptions}
                selectedValues={newSelectedGroupNames}
                onValueChange={setNewSelectedGroupNames}
                placeholder="Select groups"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)} className="bg-gray-600 hover:bg-gray-700 text-white">Cancel</Button>
            <Button onClick={handleAddUserSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit User: {currentUser?.username}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update user details on the selected server.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editUsername" className="text-right text-gray-300">
                Username
              </Label>
              <Input
                id="editUsername"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="col-span-3 bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editPassword" className="text-right text-gray-300">
                New Password (Optional)
              </Label>
              <Input
                id="editPassword"
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="col-span-3 bg-gray-700 text-white border-gray-600"
                placeholder="Leave blank to keep current password"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editIsAdmin" className="text-right text-gray-300">
                Admin
              </Label>
              <Checkbox
                id="editIsAdmin"
                checked={editIsAdmin}
                onCheckedChange={(checked) => setEditIsAdmin(checked as boolean)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editRoles" className="text-right text-gray-300">
                Groups
              </Label>
              <MultiSelect
                options={allGroupOptions}
                selectedValues={editSelectedGroupNames}
                onValueChange={setEditSelectedGroupNames}
                placeholder="Select groups"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)} className="bg-gray-600 hover:bg-gray-700 text-white">Cancel</Button>
            <Button onClick={handleEditUserSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

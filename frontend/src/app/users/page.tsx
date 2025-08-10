'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchServers, setSelectedServer } from '@/store/serversSlice'; // Import fetchServers and setSelectedServer
import { fetchUsers, createUser, updateUser, deleteUser, fetchGroups, User, Group, UserCreatePayload, UserUpdatePayload } from '@/store/usersGroupsSlice'; // Import all user/group related thunks and interfaces
import type { Server } from '@/store/serversSlice'; // Import Server interface

import { UserView } from "@/components/user_view";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast'; // Import useToast

export default function UserManagementPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();

  const { servers, loading: serversLoading, error: serversError, selectedServerId } = useSelector((state: RootState) => state.servers);
  const { users, groups, loading: usersGroupsLoading, error: usersGroupsError } = useSelector((state: RootState) => state.usersGroups);

  useEffect(() => {
    // Fetch servers on initial load
    dispatch(fetchServers() as any); // Ensure servers are loaded for sidebar
  }, [dispatch]);

  useEffect(() => {
    if (selectedServerId !== null) {
      dispatch(fetchUsers(selectedServerId));
      dispatch(fetchGroups(selectedServerId));
    }
  }, [selectedServerId, dispatch]);

  const handleSelectServer = (id: number) => {
    dispatch(setSelectedServer(id));
  };

  const handleAddUser = async (newUser: UserCreatePayload) => {
    if (!selectedServerId) {
      toast({
        title: 'Error',
        description: 'Please select a server first.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await dispatch(createUser({ serverId: selectedServerId, userData: newUser })).unwrap();
      toast({
        title: 'Success',
        description: `User '${newUser.username}' created successfully.`,
      });
    } catch (err: any) {
      toast({
        title: 'Error creating user',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = async (username: string, updatedUserData: UserUpdatePayload) => {
    if (!selectedServerId) {
      toast({
        title: 'Error',
        description: 'Please select a server first.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await dispatch(updateUser({ serverId: selectedServerId, username, userData: updatedUserData })).unwrap();
      toast({
        title: 'Success',
        description: `User '${username}' updated successfully.`,
      });
    } catch (err: any) {
      toast({
        title: 'Error updating user',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!selectedServerId) {
      toast({
        title: 'Error',
        description: 'Please select a server first.',
        variant: 'destructive',
      });
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user ${username}? This action cannot be undone.`)) {
      return;
    }
    try {
      await dispatch(deleteUser({ serverId: selectedServerId, username })).unwrap();
      toast({
        title: 'Success',
        description: `User '${username}' deleted successfully.`,
      });
    } catch (err: any) {
      toast({
        title: 'Error deleting user',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  if (serversLoading === 'pending' && servers.length === 0) return <div className="container mx-auto p-4 text-gray-500">Loading servers...</div>;
  if (serversError) return <div className="container mx-auto p-4 text-red-500">Error loading servers: {serversError}</div>;
  if (usersGroupsError) return <div className="container mx-auto p-4 text-red-500">Error loading users/groups: {usersGroupsError}</div>;

  return (
    <div className="flex-1 p-4 md:p-10 overflow-y-auto"> {/* This div is now the main content area */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400">Manage users and their roles on selected servers</p>
        </div>
        <Link href="/">
          <Button variant="outline" className="bg-gray-700 text-white hover:bg-gray-600">Back to Dashboard</Button>
        </Link>
      </div>

      {selectedServerId === null ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          Select a server from the sidebar to manage users.
        </div>
      ) : usersGroupsLoading === 'pending' ? (
        <div className="mb-6 text-center text-gray-500">Loading users and groups...</div>
      ) : (
        <UserView
          users={users}
          groups={groups}
          onAddUser={handleAddUser}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
        />
      )}
    </div>
  );
}

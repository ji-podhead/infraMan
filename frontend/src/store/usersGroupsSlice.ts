import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Interfaces for User and Group
export interface User {
  id: number; // UID from getent passwd
  username: string;
  is_admin: boolean;
  roles: string[]; // Group names the user belongs to
  group_ids: number[]; // GIDs of groups the user belongs to
}

export interface Group {
  id: number; // GID from getent group
  name: string;
}

// Interfaces for API Payloads
export interface UserCreatePayload {
  username: string;
  password: string;
  is_admin?: boolean;
  group_names?: string[];
}

export interface UserUpdatePayload {
  username?: string;
  password?: string;
  is_admin?: boolean;
  group_names?: string[];
}

export interface GroupCreatePayload {
  name: string;
  gid?: number;
}

export interface GroupUpdatePayload {
  name?: string;
  gid?: number;
}

interface UsersGroupsState {
  users: User[];
  groups: Group[];
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: UsersGroupsState = {
  users: [],
  groups: [],
  loading: 'idle',
  error: null,
};

// Async Thunks for Users
export const fetchUsers = createAsyncThunk(
  'usersGroups/fetchUsers',
  async (serverId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servers/${serverId}/users/`);
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      const data: User[] = await response.json();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const createUser = createAsyncThunk(
  'usersGroups/createUser',
  async ({ serverId, userData }: { serverId: number; userData: UserCreatePayload }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servers/${serverId}/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to create user: ${response.statusText}`);
      }
      const data: User = await response.json();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateUser = createAsyncThunk(
  'usersGroups/updateUser',
  async ({ serverId, username, userData }: { serverId: number; username: string; userData: UserUpdatePayload }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servers/${serverId}/users/${username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to update user: ${response.statusText}`);
      }
      const data: User = await response.json();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'usersGroups/deleteUser',
  async ({ serverId, username }: { serverId: number; username: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servers/${serverId}/users/${username}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to delete user: ${response.statusText}`);
      }
      return username; // Return the username to identify which user was deleted
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// Async Thunks for Groups
export const fetchGroups = createAsyncThunk(
  'usersGroups/fetchGroups',
  async (serverId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servers/${serverId}/groups/`);
      if (!response.ok) {
        throw new Error(`Failed to fetch groups: ${response.statusText}`);
      }
      const data: Group[] = await response.json();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const createGroup = createAsyncThunk(
  'usersGroups/createGroup',
  async ({ serverId, groupData }: { serverId: number; groupData: GroupCreatePayload }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servers/${serverId}/groups/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to create group: ${response.statusText}`);
      }
      const data: Group = await response.json();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateGroup = createAsyncThunk(
  'usersGroups/updateGroup',
  async ({ serverId, groupName, groupData }: { serverId: number; groupName: string; groupData: GroupUpdatePayload }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servers/${serverId}/groups/${groupName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to update group: ${response.statusText}`);
      }
      const data: Group = await response.json();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteGroup = createAsyncThunk(
  'usersGroups/deleteGroup',
  async ({ serverId, groupName }: { serverId: number; groupName: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servers/${serverId}/groups/${groupName}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to delete group: ${response.statusText}`);
      }
      return groupName; // Return the group name to identify which group was deleted
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);


const usersGroupsSlice = createSlice({
  name: 'usersGroups',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.loading = 'succeeded';
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      })
      // Create User
      .addCase(createUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.users.push(action.payload);
      })
      // Update User
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      // Delete User
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<string>) => {
        state.users = state.users.filter(user => user.username !== action.payload);
      })
      // Fetch Groups
      .addCase(fetchGroups.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action: PayloadAction<Group[]>) => {
        state.loading = 'succeeded';
        state.groups = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      })
      // Create Group
      .addCase(createGroup.fulfilled, (state, action: PayloadAction<Group>) => {
        state.groups.push(action.payload);
      })
      // Update Group
      .addCase(updateGroup.fulfilled, (state, action: PayloadAction<Group>) => {
        const index = state.groups.findIndex(group => group.id === action.payload.id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
      })
      // Delete Group
      .addCase(deleteGroup.fulfilled, (state, action: PayloadAction<string>) => {
        state.groups = state.groups.filter(group => group.name !== action.payload);
      });
  },
});

export default usersGroupsSlice.reducer;

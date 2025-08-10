import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Server { // Export the Server interface
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

interface DiskPartition {
  name: string;
  mountpoint?: string;
  size?: string;
  used?: string;
  available?: string;
  use_percent?: string;
  fstype?: string;
  uuid?: string;
  model?: string;
  serial?: string;
  tran?: string;
  type?: string;
  pkname?: string;
  maj_min?: string;
  rm?: boolean;
  ro?: boolean;
  hotplug?: boolean;
  kname?: string;
  label?: string;
  partuuid?: string;
  parttype?: string;
  wwn?: string;
  state?: string;
  vendor?: string;
  rev?: string;
  subsystems?: string;
  luks?: boolean;
  luks_unlocked?: boolean;
  lvm?: boolean;
}

interface SystemStats {
  cpu_percent: number;
  memory_percent: number;
  gpu_stats: {
    name: string;
    utilization_gpu: number;
    memory_used: number;
    memory_total: number;
    fan_speed?: number;
    temperature_gpu?: number;
    power_draw?: number;
    power_limit?: number;
    pci_bus_id?: string;
  }[];
  active_users: ActiveUser[];
  disk_partitions: DiskPartition[];
}

interface ServersState {
  servers: Server[];
  stats: Record<number, SystemStats>;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  selectedServerId: number | null;
}

const initialState: ServersState = {
  servers: [],
  stats: {},
  loading: 'idle',
  error: null,
  selectedServerId: null,
};

// Async Thunk for fetching servers
export const fetchServers = createAsyncThunk(
  'servers/fetchServers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servers`);
      if (!response.ok) {
        throw new Error(`Failed to fetch servers: ${response.statusText}`);
      }
      const data: Server[] = await response.json();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// Async Thunk for fetching server stats
export const fetchServerStats = createAsyncThunk(
  'servers/fetchServerStats',
  async (server: Server, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servers/${server.id}/stats`);
      if (!response.ok) {
        throw new Error(`Failed to fetch stats for ${server.name}: ${response.statusText}`);
      }
      const data: SystemStats = await response.json();
      return { serverId: server.id, stats: data };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const serversSlice = createSlice({
  name: 'servers',
  initialState,
  reducers: {
    setSelectedServer: (state, action: PayloadAction<number | null>) => {
      state.selectedServerId = action.payload;
    },
    // Reducer to update a server after editing (optimistic update or after successful API call)
    updateServerInStore: (state, action: PayloadAction<Server>) => {
      const index = state.servers.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.servers[index] = action.payload;
      }
    },
    // Reducer to add a new server to the store
    addServerToStore: (state, action: PayloadAction<Server>) => {
      state.servers.push(action.payload);
    },
    // Reducer to remove a server from the store
    removeServerFromStore: (state, action: PayloadAction<number>) => {
      state.servers = state.servers.filter(server => server.id !== action.payload);
      if (state.selectedServerId === action.payload) {
        state.selectedServerId = state.servers.length > 0 ? state.servers[0].id : null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServers.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchServers.fulfilled, (state, action: PayloadAction<Server[]>) => {
        state.loading = 'succeeded';
        state.servers = action.payload;
        if (state.selectedServerId === null && action.payload.length > 0) {
          state.selectedServerId = action.payload[0].id;
        } else if (action.payload.length === 0) {
          state.selectedServerId = null;
        }
      })
      .addCase(fetchServers.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      })
      .addCase(fetchServerStats.fulfilled, (state, action: PayloadAction<{ serverId: number; stats: SystemStats }>) => {
        state.stats[action.payload.serverId] = action.payload.stats;
      })
      .addCase(fetchServerStats.rejected, (state, action) => {
        // Handle individual stat fetch errors without failing the whole server list
        console.error(`Failed to fetch stats for a server: ${action.payload}`);
      });
  },
});

export const { setSelectedServer, updateServerInStore, addServerToStore, removeServerFromStore } = serversSlice.actions;

export default serversSlice.reducer;

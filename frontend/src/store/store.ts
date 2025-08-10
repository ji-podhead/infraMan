import { configureStore } from '@reduxjs/toolkit';
import serversReducer from './serversSlice';
import usersGroupsReducer from './usersGroupsSlice'; // Import the new slice

export const store = configureStore({
  reducer: {
    servers: serversReducer,
    usersGroups: usersGroupsReducer, // Add the new slice to the store
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

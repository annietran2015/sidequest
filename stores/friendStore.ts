import { create } from 'zustand';
import type { Friendship, Profile } from '@/types';

export interface FriendWithProfile extends Friendship {
  friend: Profile; // The other person in the friendship
}

interface FriendState {
  friends: FriendWithProfile[];
  pendingRequests: FriendWithProfile[]; // Incoming requests where user is addressee
  setFriends: (friends: FriendWithProfile[]) => void;
  setPendingRequests: (requests: FriendWithProfile[]) => void;
  addFriend: (friend: FriendWithProfile) => void;
  removeFriend: (friendshipId: string) => void;
  acceptRequest: (friendshipId: string, updatedFriendship: FriendWithProfile) => void;
  declineRequest: (friendshipId: string) => void;
}

export const useFriendStore = create<FriendState>((set) => ({
  friends: [],
  pendingRequests: [],

  setFriends: (friends) => {
    set({ friends });
  },

  setPendingRequests: (requests) => {
    set({ pendingRequests: requests });
  },

  addFriend: (friend) => {
    set((state) => ({
      friends: [...state.friends, friend],
    }));
  },

  removeFriend: (friendshipId) => {
    set((state) => ({
      friends: state.friends.filter((f) => f.id !== friendshipId),
    }));
  },

  acceptRequest: (friendshipId, updatedFriendship) => {
    set((state) => ({
      pendingRequests: state.pendingRequests.filter((r) => r.id !== friendshipId),
      friends: [...state.friends, updatedFriendship],
    }));
  },

  declineRequest: (friendshipId) => {
    set((state) => ({
      pendingRequests: state.pendingRequests.filter((r) => r.id !== friendshipId),
    }));
  },
}));

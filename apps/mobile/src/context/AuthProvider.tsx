import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { User } from '../types';

interface ClerkUserType {
  id: string;
  primaryEmailAddress?: { emailAddress: string };
  firstName: string | null;
  lastName: string | null;
  imageUrl?: string;
}

interface AuthContextType {
  isLoading: boolean;
  isSignedIn: boolean;
  user: User | null;
  clerkUser: ClerkUserType | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, signOut: clerkSignOut } = useAuth();
  const { user: clerkUser } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);

  // Query user from Convex
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  );

  // Mutation to upsert user
  const upsertUser = useMutation(api.users.upsertUser);

  // Sync Clerk user with Convex
  useEffect(() => {
    async function syncUser() {
      if (!isLoaded || !isSignedIn || !clerkUser) {
        setIsInitialized(true);
        return;
      }

      try {
        await upsertUser({
          clerkId: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          avatar: clerkUser.imageUrl,
        });
      } catch (error) {
        console.error('Failed to sync user with Convex:', error);
      }
      setIsInitialized(true);
    }

    syncUser();
  }, [isLoaded, isSignedIn, clerkUser, upsertUser]);

  const handleSignOut = async () => {
    try {
      await clerkSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isLoading = !isLoaded || !isInitialized || (isSignedIn && convexUser === undefined);

  const clerkUserData: ClerkUserType | null = clerkUser ? {
    id: clerkUser.id,
    primaryEmailAddress: clerkUser.primaryEmailAddress ? { emailAddress: clerkUser.primaryEmailAddress.emailAddress } : undefined,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    imageUrl: clerkUser.imageUrl,
  } : null;

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isSignedIn: isSignedIn ?? false,
        user: convexUser ?? null,
        clerkUser: clerkUserData,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAppAuth must be used within an AuthProvider');
  }
  return context;
}

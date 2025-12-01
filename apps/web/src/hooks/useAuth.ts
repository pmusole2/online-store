"use client";

import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useEffect, useState } from "react";

export function useAuth() {
  const { isLoaded, isSignedIn, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);

  // Query user from Convex
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
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
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
          firstName: clerkUser.firstName || "",
          lastName: clerkUser.lastName || "",
          avatar: clerkUser.imageUrl,
        });
      } catch (error) {
        console.error("Failed to sync user with Convex:", error);
      }
      setIsInitialized(true);
    }

    syncUser();
  }, [isLoaded, isSignedIn, clerkUser, upsertUser]);

  const handleSignOut = async () => {
    try {
      await clerkSignOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const isLoading =
    !isLoaded || !isInitialized || (isSignedIn && convexUser === undefined);

  return {
    isLoading,
    isSignedIn: isSignedIn ?? false,
    user: convexUser ?? null,
    clerkUser: clerkUser ?? null,
    signOut: handleSignOut,
  };
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { ApiError, clientApi } from "@/lib/client-api";
import type { Resource, User } from "@/types/api";

type SessionValue = {
  user: User | null;
  isLoading: boolean;
  favoriteIds: Set<number>;
  toggleFavorite: (propertyId: number) => void;
  requireLogin: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

/** Knows who is logged in (shared cookie with Property Admin) and which listings they saved. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { message } = App.useApp();

  const me = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return (await clientApi<Resource<User>>("auth/me")).data;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }

        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const favorites = useQuery({
    queryKey: ["favorite-ids"],
    queryFn: () => clientApi<{ data: number[] }>("portal/favorites", { query: { ids_only: 1 } }).then((response) => response.data),
    enabled: Boolean(me.data),
    staleTime: 60 * 1000,
  });

  const favoriteIds = useMemo(() => new Set(favorites.data ?? []), [favorites.data]);

  const requireLogin = useCallback(() => {
    router.push(`/login?next=${encodeURIComponent(pathname + window.location.search)}`);
  }, [router, pathname]);

  const toggle = useMutation({
    mutationFn: ({ propertyId, saved }: { propertyId: number; saved: boolean }) =>
      saved
        ? clientApi(`portal/favorites/${propertyId}`, { method: "DELETE" })
        : clientApi("portal/favorites", { method: "POST", body: { property_id: propertyId } }),
    onMutate: async ({ propertyId, saved }) => {
      await queryClient.cancelQueries({ queryKey: ["favorite-ids"] });
      const previous = queryClient.getQueryData<number[]>(["favorite-ids"]) ?? [];
      queryClient.setQueryData<number[]>(["favorite-ids"], saved ? previous.filter((id) => id !== propertyId) : [...previous, propertyId]);

      return { previous };
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(["favorite-ids"], context?.previous);
      message.error(error instanceof Error ? error.message : "Could not update your favourites.");
    },
    onSuccess: (_data, { saved }) => {
      message.success(saved ? "Removed from favourites" : "Saved to favourites");
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const { mutate } = toggle;

  const toggleFavorite = useCallback(
    (propertyId: number) => {
      if (!me.data) {
        requireLogin();

        return;
      }

      mutate({ propertyId, saved: favoriteIds.has(propertyId) });
    },
    [me.data, requireLogin, mutate, favoriteIds],
  );

  const value = useMemo(
    () => ({ user: me.data ?? null, isLoading: me.isLoading, favoriteIds, toggleFavorite, requireLogin }),
    [me.data, me.isLoading, favoriteIds, toggleFavorite, requireLogin],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used inside SessionProvider.");
  }

  return context;
}

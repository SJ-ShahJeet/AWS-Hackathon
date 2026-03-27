"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { API_BASE } from "@/lib/api";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/store/auth";

type HybridAuthContextValue = {
  auth0Enabled: boolean;
  auth0Loading: boolean;
  login: () => Promise<void>;
  logout: () => void;
};

const HybridAuthContext = createContext<HybridAuthContextValue>({
  auth0Enabled: false,
  auth0Loading: false,
  login: async () => undefined,
  logout: () => undefined,
});

export function useHybridAuth() {
  return useContext(HybridAuthContext);
}

function AuthHydrator() {
  const hydrate = useAuth((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return null;
}

function Auth0SessionSync({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, getAccessTokenSilently, loginWithRedirect, logout } = useAuth0();
  const setAuth0Session = useAuth((s) => s.setAuth0Session);
  const clearAuth = useAuth((s) => s.clearAuth);
  const mode = useAuth((s) => s.mode);
  const setAuthLoading = useAuth((s) => s.setAuthLoading);
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;

  useEffect(() => {
    setAuthLoading(isLoading);
  }, [isLoading, setAuthLoading]);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      if (!isAuthenticated) {
        if (mode === "auth0") clearAuth();
        return;
      }

      setAuthLoading(true);
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: audience ? { audience } : undefined,
        });
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error("Failed to sync Auth0 session");
        }
        const data = await res.json();
        if (!cancelled) setAuth0Session(data.user, token);
      } catch {
        if (!cancelled) clearAuth();
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }

    void sync();

    return () => {
      cancelled = true;
    };
  }, [
    audience,
    clearAuth,
    getAccessTokenSilently,
    isAuthenticated,
    mode,
    setAuth0Session,
    setAuthLoading,
  ]);

  const value = useMemo<HybridAuthContextValue>(
    () => ({
      auth0Enabled: true,
      auth0Loading: isLoading,
      login: async () => {
        await loginWithRedirect();
      },
      logout: () => {
        clearAuth();
        logout({
          logoutParams: {
            returnTo: window.location.origin,
          },
        });
      },
    }),
    [clearAuth, isLoading, loginWithRedirect, logout]
  );

  return (
    <HybridAuthContext.Provider value={value}>
      {children}
    </HybridAuthContext.Provider>
  );
}

function BaseProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthHydrator />
      {children}
      <Toaster />
    </>
  );
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30000,
      },
    },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const auth0ClientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
  const auth0Audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;
  const auth0Enabled = Boolean(auth0Domain && auth0ClientId);

  if (!auth0Enabled) {
    return (
      <QueryClientProvider client={queryClient}>
        <HybridAuthContext.Provider
          value={{
            auth0Enabled: false,
            auth0Loading: false,
            login: async () => undefined,
            logout: () => {
              useAuth.getState().clearAuth();
            },
          }}
        >
          <BaseProviders>{children}</BaseProviders>
        </HybridAuthContext.Provider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Auth0Provider
        domain={auth0Domain!}
        clientId={auth0ClientId!}
        authorizationParams={{
          redirect_uri: typeof window !== "undefined" ? window.location.origin : undefined,
          audience: auth0Audience || undefined,
          scope: "openid profile email",
        }}
      >
        <Auth0SessionSync>
          <BaseProviders>{children}</BaseProviders>
        </Auth0SessionSync>
      </Auth0Provider>
    </QueryClientProvider>
  );
}

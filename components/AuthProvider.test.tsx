import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth, AuthProvider } from "./AuthProvider";
import type { ReactNode } from "react";

// Mock Supabase client for AuthProvider tests
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
    },
  }),
}));

describe("AuthProvider & useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it("provides safe fallback when rendered outside AuthProvider", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.hasProvider).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("loads initial session when mounted inside AuthProvider", async () => {
    const fakeUser = { id: "u-123", email: "test@example.com" } as any;
    const fakeSession = { user: fakeUser } as any;

    mockGetSession.mockResolvedValueOnce({
      data: { session: fakeSession },
      error: null,
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {});

    expect(result.current.hasProvider).toBe(true);
    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.session).toEqual(fakeSession);
    expect(result.current.loading).toBe(false);
  });

  it("calls signInWithPassword on signInWithEmail", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "u-1" }, session: {} },
      error: null,
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response: any;
    await act(async () => {
      response = await result.current.signInWithEmail("user@example.com", "secret123");
    });

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret123",
    });
    expect(response.error).toBeNull();
  });

  it("calls signOut on signOut method", async () => {
    mockSignOut.mockResolvedValueOnce({ error: null });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response: any;
    await act(async () => {
      response = await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalled();
    expect(response.error).toBeNull();
    expect(result.current.user).toBeNull();
  });
});

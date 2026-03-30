import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockSignIn = vi.mocked(signInAction);
const mockSignUp = vi.mocked(signUpAction);
const mockGetAnonWorkData = vi.mocked(getAnonWorkData);
const mockClearAnonWork = vi.mocked(clearAnonWork);
const mockGetProjects = vi.mocked(getProjects);
const mockCreateProject = vi.mocked(createProject);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "new-project-id", name: "New Design", messages: [], data: {}, userId: "user-1", createdAt: new Date(), updatedAt: new Date() });
});

afterEach(() => {
  cleanup();
});

// --- initial state ---

test("exposes signIn, signUp, and isLoading", () => {
  const { result } = renderHook(() => useAuth());

  expect(typeof result.current.signIn).toBe("function");
  expect(typeof result.current.signUp).toBe("function");
  expect(result.current.isLoading).toBe(false);
});

test("isLoading starts as false", () => {
  const { result } = renderHook(() => useAuth());
  expect(result.current.isLoading).toBe(false);
});

// --- signIn happy paths ---

test("signIn returns result on success", async () => {
  mockSignIn.mockResolvedValue({ success: true });
  mockGetProjects.mockResolvedValue([{ id: "proj-1", name: "My Project", messages: [], data: {}, userId: "user-1", createdAt: new Date(), updatedAt: new Date() }]);

  const { result } = renderHook(() => useAuth());

  let returnValue: unknown;
  await act(async () => {
    returnValue = await result.current.signIn("user@example.com", "password123");
  });

  expect(returnValue).toEqual({ success: true });
});

test("signIn calls signIn action with provided credentials", async () => {
  mockSignIn.mockResolvedValue({ success: true });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "secret");
  });

  expect(mockSignIn).toHaveBeenCalledWith("user@example.com", "secret");
});

test("signIn redirects to existing project after success", async () => {
  mockSignIn.mockResolvedValue({ success: true });
  mockGetProjects.mockResolvedValue([
    { id: "proj-1", name: "First Project", messages: [], data: {}, userId: "user-1", createdAt: new Date(), updatedAt: new Date() },
    { id: "proj-2", name: "Second Project", messages: [], data: {}, userId: "user-1", createdAt: new Date(), updatedAt: new Date() },
  ]);

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  expect(mockPush).toHaveBeenCalledWith("/proj-1");
});

test("signIn creates a new project and redirects when user has no projects", async () => {
  mockSignIn.mockResolvedValue({ success: true });
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "created-id", name: "New Design", messages: [], data: {}, userId: "user-1", createdAt: new Date(), updatedAt: new Date() });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  expect(mockCreateProject).toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/created-id");
});

test("signIn saves anonymous work as a project and redirects to it", async () => {
  mockSignIn.mockResolvedValue({ success: true });
  mockGetAnonWorkData.mockReturnValue({
    messages: [{ role: "user", content: "Make a button" }],
    fileSystemData: { "/App.tsx": "export default () => <button />" },
  });
  mockCreateProject.mockResolvedValue({ id: "anon-project-id", name: "Design from ...", messages: [], data: {}, userId: "user-1", createdAt: new Date(), updatedAt: new Date() });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  expect(mockCreateProject).toHaveBeenCalledWith(
    expect.objectContaining({
      messages: [{ role: "user", content: "Make a button" }],
      data: { "/App.tsx": "export default () => <button />" },
    })
  );
  expect(mockClearAnonWork).toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/anon-project-id");
});

test("signIn skips anonymous work when messages array is empty", async () => {
  mockSignIn.mockResolvedValue({ success: true });
  mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
  mockGetProjects.mockResolvedValue([{ id: "proj-1", name: "My Project", messages: [], data: {}, userId: "user-1", createdAt: new Date(), updatedAt: new Date() }]);

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  expect(mockCreateProject).not.toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/proj-1");
});

// --- signIn error state ---

test("signIn returns error result without navigating on failure", async () => {
  mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });

  const { result } = renderHook(() => useAuth());

  let returnValue: unknown;
  await act(async () => {
    returnValue = await result.current.signIn("bad@example.com", "wrongpassword");
  });

  expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
  expect(mockPush).not.toHaveBeenCalled();
  expect(mockGetProjects).not.toHaveBeenCalled();
});

// --- isLoading transitions ---

test("isLoading is true while signIn is in progress and false after", async () => {
  let resolveSignIn!: (value: { success: boolean }) => void;
  const pendingSignIn = new Promise<{ success: boolean }>((resolve) => {
    resolveSignIn = resolve;
  });
  mockSignIn.mockReturnValue(pendingSignIn);
  mockGetProjects.mockResolvedValue([]);

  const { result } = renderHook(() => useAuth());

  let signInPromise: Promise<unknown>;
  act(() => {
    signInPromise = result.current.signIn("user@example.com", "password");
  });

  expect(result.current.isLoading).toBe(true);

  await act(async () => {
    resolveSignIn({ success: true });
    await signInPromise;
  });

  expect(result.current.isLoading).toBe(false);
});

test("isLoading is false after a failed signIn", async () => {
  mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("bad@example.com", "wrong");
  });

  expect(result.current.isLoading).toBe(false);
});

// --- signUp happy paths ---

test("signUp returns result on success", async () => {
  mockSignUp.mockResolvedValue({ success: true });
  mockGetProjects.mockResolvedValue([]);

  const { result } = renderHook(() => useAuth());

  let returnValue: unknown;
  await act(async () => {
    returnValue = await result.current.signUp("new@example.com", "password123");
  });

  expect(returnValue).toEqual({ success: true });
});

test("signUp calls signUp action with provided credentials", async () => {
  mockSignUp.mockResolvedValue({ success: true });
  mockGetProjects.mockResolvedValue([]);

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signUp("new@example.com", "mypassword");
  });

  expect(mockSignUp).toHaveBeenCalledWith("new@example.com", "mypassword");
});

test("signUp redirects to new project when no existing projects", async () => {
  mockSignUp.mockResolvedValue({ success: true });
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "fresh-id", name: "New Design", messages: [], data: {}, userId: "user-1", createdAt: new Date(), updatedAt: new Date() });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signUp("new@example.com", "password");
  });

  expect(mockPush).toHaveBeenCalledWith("/fresh-id");
});

test("signUp saves anonymous work after successful registration", async () => {
  mockSignUp.mockResolvedValue({ success: true });
  mockGetAnonWorkData.mockReturnValue({
    messages: [{ role: "user", content: "Make a form" }],
    fileSystemData: { "/Form.tsx": "export default () => <form />" },
  });
  mockCreateProject.mockResolvedValue({ id: "anon-signup-id", name: "Design from ...", messages: [], data: {}, userId: "user-1", createdAt: new Date(), updatedAt: new Date() });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signUp("new@example.com", "password");
  });

  expect(mockCreateProject).toHaveBeenCalledWith(
    expect.objectContaining({
      messages: [{ role: "user", content: "Make a form" }],
    })
  );
  expect(mockClearAnonWork).toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/anon-signup-id");
});

// --- signUp error state ---

test("signUp returns error result without navigating on failure", async () => {
  mockSignUp.mockResolvedValue({ success: false, error: "Email already taken" });

  const { result } = renderHook(() => useAuth());

  let returnValue: unknown;
  await act(async () => {
    returnValue = await result.current.signUp("taken@example.com", "password");
  });

  expect(returnValue).toEqual({ success: false, error: "Email already taken" });
  expect(mockPush).not.toHaveBeenCalled();
});

test("isLoading is false after a failed signUp", async () => {
  mockSignUp.mockResolvedValue({ success: false, error: "Server error" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signUp("user@example.com", "password");
  });

  expect(result.current.isLoading).toBe(false);
});

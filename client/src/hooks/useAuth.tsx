import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}

export function logout() {
  return fetch('/auth/logout', {
    method: 'POST',
    credentials: 'include',
  }).then(() => {
    // Redirect to login page
    window.location.href = '/login';
  });
}
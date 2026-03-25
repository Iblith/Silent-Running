'use client'
// lib/auth-context.tsx
// React context that holds the current authenticated user.
// Provided by app/(app)/layout.tsx so all sub-pages can read auth state.

import React, { createContext, useContext } from 'react'

export interface AuthUser {
  id: string
  username: string
  role: 'gm' | 'player'
}

interface AuthContextValue {
  user: AuthUser | null
}

export const AuthContext = createContext<AuthContextValue>({ user: null })

export function useAuth() {
  return useContext(AuthContext)
}

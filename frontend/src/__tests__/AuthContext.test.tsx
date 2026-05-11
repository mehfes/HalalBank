import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import type { ReactNode } from 'react'

vi.mock('../services/api', () => ({
  api: {
    auth: {
      login: vi.fn(({ email }: { email: string }) =>
        Promise.resolve({ id: 1, email, firstName: 'Test', lastName: 'User', role: 'Customer' })
      ),
    },
  },
}))

function renderAuthHook() {
  return renderHook(() => useAuth(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    ),
  })
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should start with null user', () => {
    const { result } = renderAuthHook()
    expect(result.current.user).toBeNull()
  })

  it('should set role to Admin for admin@test.com with no customerId', async () => {
    const { result } = renderAuthHook()

    await act(async () => result.current.login('admin@test.com', 'admin123'))

    expect(result.current.user).toEqual({ email: 'admin@test.com', role: 'Admin' })
  })

  it('should set role to Customer with customerId from API', async () => {
    const { result } = renderAuthHook()

    await act(async () => result.current.login('user@example.com', 'password123'))

    expect(result.current.user).toEqual({ email: 'user@example.com', role: 'Customer', customerId: 1, firstName: 'Test', lastName: 'User' })
  })

  it('should persist user to localStorage after login', async () => {
    const { result } = renderAuthHook()

    await act(async () => result.current.login('admin@test.com', 'admin123'))

    const stored = JSON.parse(localStorage.getItem('halalbank_user')!)
    expect(stored).toEqual({ email: 'admin@test.com', role: 'Admin' })
  })

  it('should persist Customer with customerId to localStorage', async () => {
    const { result } = renderAuthHook()

    await act(async () => result.current.login('user@test.com', 'password123'))

    const stored = JSON.parse(localStorage.getItem('halalbank_user')!)
    expect(stored).toEqual({ email: 'user@test.com', role: 'Customer', customerId: 1, firstName: 'Test', lastName: 'User' })
  })

  it('should clear user on logout', async () => {
    const { result } = renderAuthHook()

    await act(async () => result.current.login('user@test.com', 'password123'))
    expect(result.current.user).not.toBeNull()

    act(() => result.current.logout())
    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('halalbank_user')).toBeNull()
  })
})

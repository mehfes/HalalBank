import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import type { ReactNode } from 'react'

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
  })

  it('should start with null user', () => {
    const { result } = renderAuthHook()
    expect(result.current.user).toBeNull()
  })

  it('should set role to Admin for admin@test.com with no customerId', () => {
    const { result } = renderAuthHook()

    act(() => result.current.login('admin@test.com'))

    expect(result.current.user).toEqual({ email: 'admin@test.com', role: 'Admin' })
  })

  it('should set role to Customer with customerId=1 for any other email', () => {
    const { result } = renderAuthHook()

    act(() => result.current.login('user@example.com'))

    expect(result.current.user).toEqual({ email: 'user@example.com', role: 'Customer', customerId: 1 })
  })

  it('should persist user to localStorage after login', () => {
    const { result } = renderAuthHook()

    act(() => result.current.login('admin@test.com'))

    const stored = JSON.parse(localStorage.getItem('halalbank_user')!)
    expect(stored).toEqual({ email: 'admin@test.com', role: 'Admin' })
  })

  it('should persist Customer with customerId to localStorage', () => {
    const { result } = renderAuthHook()

    act(() => result.current.login('user@test.com'))

    const stored = JSON.parse(localStorage.getItem('halalbank_user')!)
    expect(stored).toEqual({ email: 'user@test.com', role: 'Customer', customerId: 1 })
  })

  it('should clear user on logout', () => {
    const { result } = renderAuthHook()

    act(() => result.current.login('user@test.com'))
    expect(result.current.user).not.toBeNull()

    act(() => result.current.logout())
    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('halalbank_user')).toBeNull()
  })
})

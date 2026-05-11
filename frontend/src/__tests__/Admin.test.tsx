import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import Admin from '../pages/Admin'

vi.mock('../services/api', () => {
  const subs = [
    { id: 1, customerId: 1, subscriptionNumber: 'SUB-001', providerName: 'Netflix', category: 'Streaming', price: 15.99, billingCycle: 'Monthly', nextPaymentDate: '2026-06-15T00:00:00Z', status: 'Active' },
    { id: 2, customerId: 2, subscriptionNumber: 'SUB-002', providerName: 'Spotify', category: 'Music', price: 9.99, billingCycle: 'Monthly', nextPaymentDate: '2026-06-20T00:00:00Z', status: 'Active' },
  ]
  return {
    api: {
      subscriptions: {
        getAll: vi.fn(() => Promise.resolve(subs)),
        update: vi.fn(() => Promise.resolve()),
        delete: vi.fn(() => Promise.resolve()),
      },
      paymentTask: { processOverdue: vi.fn(() => Promise.resolve({ checkedCount: 0, paidCount: 0, failedCount: 0, skippedCount: 0, details: [] })) },
    },
  }
})

function renderAdmin() {
  localStorage.setItem('halalbank_user', JSON.stringify({ email: 'admin@test.com', role: 'Admin' }))

  return render(
    <MemoryRouter>
      <AuthProvider>
        <Admin />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Admin Page', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should show All Subscriptions heading', async () => {
    renderAdmin()

    await waitFor(() => {
      expect(screen.getByText('All Subscriptions')).toBeDefined()
    })
  })

  it('should display all subscriptions in the table', async () => {
    renderAdmin()

    await waitFor(() => {
      expect(screen.getByText('Netflix')).toBeDefined()
    })

    expect(screen.getByText('Spotify')).toBeDefined()
    expect(screen.getByText('SUB-001')).toBeDefined()
    expect(screen.getByText('SUB-002')).toBeDefined()
  })

  it('should show Admin Panel heading', async () => {
    renderAdmin()

    await waitFor(() => {
      expect(screen.getByText('Admin Panel')).toBeDefined()
    })
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { api } from '../services/api'
import Discover from '../pages/Discover'

vi.mock('../services/api', () => {
  const plans = [
    { id: 1, name: 'Netflix Premium', category: 'Streaming', defaultPrice: 15.99, defaultBillingCycle: 'Monthly' },
    { id: 2, name: 'Spotify', category: 'Music', defaultPrice: 9.99, defaultBillingCycle: 'Monthly' },
  ]
  return {
    api: {
      subscriptionPlans: { getAll: vi.fn(() => Promise.resolve(plans)) },
      subscriptions: { create: vi.fn(() => Promise.resolve({ id: 10 })) },
    },
  }
})

function renderDiscover(customerEmail = 'user@test.com') {
  localStorage.setItem('halalbank_user', JSON.stringify({ email: customerEmail, role: 'Customer', customerId: 1 }))

  return render(
    <MemoryRouter>
      <AuthProvider>
        <Discover />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Discover Page', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should show loading state initially', () => {
    renderDiscover()
    expect(screen.getByText('Loading plans...')).toBeDefined()
  })

  it('should render plan cards after loading', async () => {
    renderDiscover()

    await waitFor(() => {
      expect(screen.getByText('Netflix Premium')).toBeDefined()
    })

    expect(screen.getByText('Spotify')).toBeDefined()
    expect(screen.getByText('Streaming')).toBeDefined()
    expect(screen.getByText('Music')).toBeDefined()
    expect(screen.getByText('$15.99')).toBeDefined()
    expect(screen.getByText('$9.99')).toBeDefined()
  })

  it('should have Subscribe buttons enabled for Customer', async () => {
    renderDiscover()

    await waitFor(() => {
      const buttons = screen.getAllByText('Subscribe')
      expect(buttons.length).toBe(2)
      buttons.forEach(btn => expect((btn as HTMLButtonElement).disabled).toBe(false))
    })
  })

  it('should call subscriptions.create with customerId and plan data on Subscribe', async () => {
    renderDiscover()

    await waitFor(() => screen.getByText('Netflix Premium'))

    const subscribeButtons = screen.getAllByText('Subscribe')
    await userEvent.click(subscribeButtons[0])

    await waitFor(() => {
      expect(vi.mocked(api.subscriptions.create).mock.calls.length).toBe(1)
      const callArgs = vi.mocked(api.subscriptions.create).mock.calls[0][0]
      expect(callArgs.customerId).toBe(1)
      expect(callArgs.providerName).toBe('Netflix Premium')
      expect(callArgs.category).toBe('Streaming')
      expect(callArgs.price).toBe(15.99)
      expect(callArgs.billingCycle).toBe('Monthly')
    })
  })

  it('should show toast after successful subscribe', async () => {
    renderDiscover()

    await waitFor(() => screen.getByText('Netflix Premium'))

    const subscribeButtons = screen.getAllByText('Subscribe')
    await userEvent.click(subscribeButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Subscribed to Netflix Premium!')).toBeDefined()
    })
  })
})

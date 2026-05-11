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
      subscriptionPlans: {
        getAll: vi.fn(() => Promise.resolve(plans)),
        delete: vi.fn(() => Promise.resolve()),
        create: vi.fn(() => Promise.resolve({ id: 5 })),
      },
      subscriptions: { create: vi.fn(() => Promise.resolve({ id: 10 })) },
    },
  }
})

function renderDiscoverAsCustomer() {
  localStorage.setItem('halalbank_user', JSON.stringify({ email: 'user@test.com', role: 'Customer', customerId: 1 }))
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Discover />
      </AuthProvider>
    </MemoryRouter>
  )
}

function renderDiscoverAsAdmin() {
  localStorage.setItem('halalbank_user', JSON.stringify({ email: 'admin@test.com', role: 'Admin' }))
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Discover />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Discover Page - Customer', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should show loading state initially', () => {
    renderDiscoverAsCustomer()
    expect(screen.getByText('Loading plans...')).toBeDefined()
  })

  it('should render plan cards after loading', async () => {
    renderDiscoverAsCustomer()

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
    renderDiscoverAsCustomer()

    await waitFor(() => {
      const buttons = screen.getAllByText('Subscribe')
      expect(buttons.length).toBe(2)
      buttons.forEach(btn => expect((btn as HTMLButtonElement).disabled).toBe(false))
    })
  })

  it('should call subscriptions.create with customerId and plan data on Subscribe', async () => {
    renderDiscoverAsCustomer()

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
    renderDiscoverAsCustomer()

    await waitFor(() => screen.getByText('Netflix Premium'))

    const subscribeButtons = screen.getAllByText('Subscribe')
    await userEvent.click(subscribeButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Subscribed to Netflix Premium!')).toBeDefined()
    })
  })

  it('should NOT show Create New Plan button for Customer', async () => {
    renderDiscoverAsCustomer()

    await waitFor(() => {
      expect(screen.getByText('Netflix Premium')).toBeDefined()
    })

    expect(screen.queryByText('Create New Plan')).toBeNull()
  })

  it('should NOT show Delete buttons for Customer', async () => {
    renderDiscoverAsCustomer()

    await waitFor(() => {
      expect(screen.getByText('Netflix Premium')).toBeDefined()
    })

    expect(screen.queryAllByText('Delete').length).toBe(0)
  })
})

describe('Discover Page - Admin', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should show loading state initially', () => {
    renderDiscoverAsAdmin()
    expect(screen.getByText('Loading plans...')).toBeDefined()
  })

  it('should render plan cards after loading', async () => {
    renderDiscoverAsAdmin()

    await waitFor(() => {
      expect(screen.getByText('Netflix Premium')).toBeDefined()
    })

    expect(screen.getByText('Spotify')).toBeDefined()
  })

  it('should show Delete buttons instead of Subscribe for Admin', async () => {
    renderDiscoverAsAdmin()

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Delete')
      expect(deleteButtons.length).toBe(2)
    })

    expect(screen.queryByText('Subscribe')).toBeNull()
  })

  it('should show Create New Plan button for Admin', async () => {
    renderDiscoverAsAdmin()

    await waitFor(() => {
      expect(screen.getByText('Netflix Premium')).toBeDefined()
    })

    expect(screen.getByText('Create New Plan')).toBeDefined()
  })

  it('should show form fields after clicking Create New Plan', async () => {
    renderDiscoverAsAdmin()

    await waitFor(() => screen.getByText('Netflix Premium'))

    await userEvent.click(screen.getByText('Create New Plan'))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Provider Name')).toBeDefined()
    })

    expect(screen.getByPlaceholderText('Category')).toBeDefined()
    expect(screen.getByPlaceholderText('Price')).toBeDefined()
    expect(screen.getByText('Add Plan')).toBeDefined()
  })

  it('should call plans.create when Admin adds a new plan', async () => {
    renderDiscoverAsAdmin()

    await waitFor(() => screen.getByText('Netflix Premium'))

    await userEvent.click(screen.getByText('Create New Plan'))

    await waitFor(() => screen.getByPlaceholderText('Provider Name'))

    await userEvent.type(screen.getByPlaceholderText('Provider Name'), 'New Plan')
    await userEvent.type(screen.getByPlaceholderText('Category'), 'Health')
    await userEvent.type(screen.getByPlaceholderText('Price'), '29.99')
    await userEvent.click(screen.getByText('Add Plan'))

    await waitFor(() => {
      expect(vi.mocked(api.subscriptionPlans.create).mock.calls.length).toBe(1)
      const callArgs = vi.mocked(api.subscriptionPlans.create).mock.calls[0][0]
      expect(callArgs.name).toBe('New Plan')
      expect(callArgs.category).toBe('Health')
      expect(callArgs.defaultPrice).toBe(29.99)
      expect(callArgs.defaultBillingCycle).toBe('Monthly')
    })
  })

  it('should call plans.delete when Admin clicks Delete', async () => {
    renderDiscoverAsAdmin()

    await waitFor(() => {
      expect(screen.getAllByText('Delete').length).toBe(2)
    })

    await userEvent.click(screen.getAllByText('Delete')[0])

    await waitFor(() => {
      expect(vi.mocked(api.subscriptionPlans.delete).mock.calls.length).toBe(1)
      expect(vi.mocked(api.subscriptionPlans.delete).mock.calls[0][0]).toBe(1)
    })
  })

  it('should show toast after successful delete', async () => {
    renderDiscoverAsAdmin()

    await waitFor(() => {
      expect(screen.getAllByText('Delete').length).toBe(2)
    })

    await userEvent.click(screen.getAllByText('Delete')[0])

    await waitFor(() => {
      expect(screen.getByText('Plan deleted')).toBeDefined()
    })
  })
})

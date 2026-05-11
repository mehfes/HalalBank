import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { api } from '../services/api'
import Admin from '../pages/Admin'

vi.mock('../services/api', () => {
  const subs = [
    { id: 1, customerId: 1, subscriptionNumber: 'SUB-001', providerName: 'Netflix', category: 'Streaming', price: 15.99, billingCycle: 'Monthly', nextPaymentDate: '2026-06-15T00:00:00Z', status: 'Active' },
    { id: 2, customerId: 2, subscriptionNumber: 'SUB-002', providerName: 'Spotify', category: 'Music', price: 9.99, billingCycle: 'Monthly', nextPaymentDate: '2026-06-20T00:00:00Z', status: 'Active' },
  ]
  const plans = [
    { id: 1, name: 'Netflix Premium', category: 'Streaming', defaultPrice: 15.99, defaultBillingCycle: 'Monthly' },
  ]
  return {
    api: {
      subscriptions: { getAll: vi.fn(() => Promise.resolve(subs)) },
      subscriptionPlans: {
        getAll: vi.fn(() => Promise.resolve(plans)),
        create: vi.fn(() => Promise.resolve({ id: 5 })),
        update: vi.fn(() => Promise.resolve()),
        delete: vi.fn(() => Promise.resolve()),
      },
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

  it('should show All Users Overview tab by default', async () => {
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

  it('should switch to Manage Plans tab and load plans', async () => {
    renderAdmin()

    const managePlansTab = screen.getByText('Manage Plans')
    await userEvent.click(managePlansTab)

    await waitFor(() => {
      expect(screen.getByText('Plan Catalog')).toBeDefined()
    })

    expect(screen.getByText('Netflix Premium')).toBeDefined()
    expect(screen.getByText('Streaming')).toBeDefined()
    expect(screen.getByText('$15.99')).toBeDefined()
  })

  it('should show Add New Plan form in Manage Plans tab', async () => {
    renderAdmin()

    await userEvent.click(screen.getByText('Manage Plans'))

    await waitFor(() => {
      expect(screen.getByText('Add New Plan')).toBeDefined()
    })

    expect(screen.getByPlaceholderText('Name')).toBeDefined()
    expect(screen.getByPlaceholderText('Category')).toBeDefined()
    expect(screen.getByPlaceholderText('Price')).toBeDefined()
  })

  it('should call plans.create when adding a new plan', async () => {
    renderAdmin()

    await userEvent.click(screen.getByText('Manage Plans'))

    await waitFor(() => screen.getByText('Plan Catalog'))

    await userEvent.type(screen.getByPlaceholderText('Name'), 'New Plan')
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

  it('should switch to edit mode when Edit button is clicked', async () => {
    renderAdmin()

    await userEvent.click(screen.getByText('Manage Plans'))

    await waitFor(() => screen.getByText('Netflix Premium'))

    await userEvent.click(screen.getByText('Edit'))

    await waitFor(() => {
      expect(screen.getByText('Edit Plan')).toBeDefined()
      expect(screen.getByDisplayValue('Netflix Premium')).toBeDefined()
    })
  })

  it('should call plans.update when editing a plan', async () => {
    renderAdmin()

    await userEvent.click(screen.getByText('Manage Plans'))

    await waitFor(() => screen.getByText('Netflix Premium'))

    await userEvent.click(screen.getByText('Edit'))

    await waitFor(() => screen.getByDisplayValue('Netflix Premium'))

    const nameInput = screen.getByDisplayValue('Netflix Premium')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Netflix Ultra')

    await userEvent.click(screen.getByText('Update Plan'))

    await waitFor(() => {
      expect(vi.mocked(api.subscriptionPlans.update).mock.calls.length).toBe(1)
    })
  })

  it('should call plans.delete when Delete button is clicked', async () => {
    renderAdmin()

    await userEvent.click(screen.getByText('Manage Plans'))

    await waitFor(() => screen.getByText('Netflix Premium'))

    await userEvent.click(screen.getByText('Delete'))

    await waitFor(() => {
      expect(vi.mocked(api.subscriptionPlans.delete).mock.calls.length).toBe(1)
      expect(vi.mocked(api.subscriptionPlans.delete).mock.calls[0][0]).toBe(1)
    })
  })
})

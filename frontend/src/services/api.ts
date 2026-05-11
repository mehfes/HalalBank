const API_BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }
  return response.json()
}

export const api = {
  customers: {
    getAll: () => request<any[]>('/customers'),
    getById: (id: number) => request<any>(`/customers/${id}`),
    create: (data: any) => request<any>('/customers', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: number) => request<void>(`/customers/${id}`, { method: 'DELETE' }),
  },
  subscriptions: {
    getAll: () => request<any[]>('/subscriptions'),
    getById: (id: number) => request<any>(`/subscriptions/${id}`),
    getByCustomerId: (customerId: number) => request<any[]>(`/subscriptions/by-customer/${customerId}`),
    create: (data: any) => request<any>('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request<void>(`/subscriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<void>(`/subscriptions/${id}`, { method: 'DELETE' }),
  },
  payments: {
    getAll: () => request<any[]>('/payments'),
    getById: (id: number) => request<any>(`/payments/${id}`),
    getBySubscriptionId: (subscriptionId: number) => request<any[]>(`/payments/by-subscription/${subscriptionId}`),
    queryDebt: (subscriptionId: number) => request<any>(`/payments/query-debt/${subscriptionId}`, { method: 'POST' }),
    pay: (data: any) => request<any>('/payments/pay', { method: 'POST', body: JSON.stringify(data) }),
  },
  subscriptionPlans: {
    getAll: () => request<any[]>('/subscriptionplans'),
    getById: (id: number) => request<any>(`/subscriptionplans/${id}`),
    create: (data: any) => request<any>('/subscriptionplans', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request<void>(`/subscriptionplans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<void>(`/subscriptionplans/${id}`, { method: 'DELETE' }),
  },
  dashboard: {
    get: () => request<{ totalActiveSubscriptions: number; upcomingPayments: any[] }>('/dashboard'),
  },
  paymentTask: {
    processOverdue: () => request<any>('/payment-task/process-overdue', { method: 'POST' }),
  },
}

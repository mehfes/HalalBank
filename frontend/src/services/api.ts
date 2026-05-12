const API_BASE = import.meta.env.VITE_API_URL || '/api'

function getAuthHeaders(): Record<string, string> {
  const stored = localStorage.getItem('halalbank_user')
  if (!stored) return {}
  const user = JSON.parse(stored)
  if (user?.token) {
    return { 'Authorization': `Bearer ${user.token}` }
  }
  return {}
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...getAuthHeaders() }
  const response = await fetch(`${API_BASE}${url}`, {
    headers,
    ...options,
  })
  if (response.status === 401) {
    localStorage.removeItem('halalbank_user')
    window.location.href = '/login'
    throw new Error('Session expired. Please login again.')
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }
  if (response.status === 204) return undefined as T
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
    processSubscription: (subscriptionId: number) =>
      request<any>(`/payment-task/process-subscription/${subscriptionId}`, { method: 'POST' }),
    sendOverdueEmails: () => request<any>('/payment-task/send-overdue-emails', { method: 'POST' }),
  },
  auth: {
    login: (data: { email: string; password: string }) =>
      request<{ id: number; email: string; firstName: string; lastName: string; role: string; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: { firstName: string; lastName: string; email: string; password: string }) =>
      request<{ id: number; email: string; firstName: string; lastName: string; role: string; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    googleLogin: (data: { idToken: string }) =>
      request<{ id: number; email: string; firstName: string; lastName: string; role: string; token: string }>('/auth/google-login', { method: 'POST', body: JSON.stringify(data) }),
    forgotPassword: (data: { email: string }) =>
      request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
  },
}

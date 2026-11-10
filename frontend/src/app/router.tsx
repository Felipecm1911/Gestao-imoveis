import { createBrowserRouter, Navigate } from 'react-router'
import { ContractDetailPage } from '@/features/contracts/ContractDetailPage'
import { ContractFormPage } from '@/features/contracts/ContractFormPage'
import { ContractsPage } from '@/features/contracts/ContractsPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { OwnerFormPage } from '@/features/owners/OwnerFormPage'
import { OwnersPage } from '@/features/owners/OwnersPage'
import { PropertiesPage } from '@/features/properties/PropertiesPage'
import { PropertyDetailPage } from '@/features/properties/PropertyDetailPage'
import { PropertyFormPage } from '@/features/properties/PropertyFormPage'
import { TenantFormPage } from '@/features/tenants/TenantFormPage'
import { TenantsPage } from '@/features/tenants/TenantsPage'
import { UsersPage } from '@/features/users/UsersPage'
import { AppLayout } from './AppLayout'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/app/dashboard" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'properties', element: <PropertiesPage /> },
      { path: 'properties/new', element: <PropertyFormPage /> },
      { path: 'properties/:id', element: <PropertyDetailPage /> },
      { path: 'properties/:id/edit', element: <PropertyFormPage key="edit" /> },
      { path: 'owners', element: <OwnersPage /> },
      { path: 'owners/new', element: <OwnerFormPage /> },
      { path: 'owners/:id/edit', element: <OwnerFormPage key="edit" /> },
      { path: 'tenants', element: <TenantsPage /> },
      { path: 'tenants/new', element: <TenantFormPage /> },
      { path: 'tenants/:id/edit', element: <TenantFormPage key="edit" /> },
      { path: 'contracts', element: <ContractsPage /> },
      { path: 'contracts/new', element: <ContractFormPage /> },
      { path: 'contracts/:id', element: <ContractDetailPage /> },
      { path: 'contracts/:id/edit', element: <ContractFormPage key="edit" /> },
      { path: 'users', element: <UsersPage /> },
    ],
  },
  { path: '*', element: <p className="p-6">Página não encontrada.</p> },
])

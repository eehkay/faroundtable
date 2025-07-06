import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { isAdmin, isManager } from '@/lib/permissions'
import VehicleManagementClient from './VehicleManagementClient'

export const metadata: Metadata = {
  title: 'Vehicle Management | Admin',
  description: 'Manage vehicle inventory',
}

export default async function VehicleManagementPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || (!isAdmin(session.user.role) && !isManager(session.user.role))) {
    redirect('/dashboard')
  }

  return <VehicleManagementClient />
}
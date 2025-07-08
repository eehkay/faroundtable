import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import { TransferWithRelations } from '@/types/supabase'
import TransferDetailClient from './TransferDetailClient'

export const metadata: Metadata = {
  title: 'Transfer Details | Round Table',
  description: 'View transfer details and updates',
}

async function getTransferDetails(id: string): Promise<TransferWithRelations | null> {
  const { data, error } = await supabaseAdmin
    .from('transfers')
    .select(`
      *,
      vehicle:vehicles!vehicle_id (
        *,
        location:dealership_locations!location_id (*),
        original_location:dealership_locations!original_location_id (*)
      ),
      from_location:dealership_locations!from_location_id (*),
      to_location:dealership_locations!to_location_id (*),
      requested_by:users!requested_by_id (*),
      approved_by:users!approved_by_id (*),
      rejected_by:users!rejected_by_id (*),
      cancelled_by:users!cancelled_by_id (*),
      updated_by:users!updated_by_id (*),
      transfer_updates (
        *,
        user:users!user_id (*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching transfer details:', error)
    return null
  }

  return data as TransferWithRelations
}

export default async function TransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return null
  }

  const { id } = await params
  const transfer = await getTransferDetails(id)
  
  if (!transfer) {
    notFound()
  }

  // Fetch related activities
  const { data: activities } = await supabaseAdmin
    .from('activities')
    .select(`
      *,
      user:users!user_id (*)
    `)
    .eq('vehicle_id', transfer.vehicle_id)
    .order('created_at', { ascending: false })

  return (
    <TransferDetailClient 
      transfer={transfer} 
      activities={activities || []}
      currentUser={session.user}
    />
  )
}
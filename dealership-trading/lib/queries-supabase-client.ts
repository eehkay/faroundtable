// Client-side Supabase queries
// These are safe to use in client components

import { supabase } from './supabase-client'

// Get vehicle activity
export async function getVehicleActivity(vehicleId: string) {
  const { data, error } = await supabase
    .from('activities')
    .select(`
      id,
      action,
      details,
      metadata,
      created_at,
      user:user_id(
        name,
        email,
        image_url
      )
    `)
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching activity:', error)
    return []
  }

  // Transform to match existing format
  return data?.map((activity: any) => ({
    _id: activity.id,
    action: activity.action,
    details: activity.details,
    metadata: activity.metadata,
    createdAt: activity.created_at,
    user: activity.user ? {
      name: activity.user.name,
      email: activity.user.email,
      image: activity.user.image_url
    } : null
  })) || []
}

// Get vehicle comments
export async function getVehicleComments(vehicleId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      id,
      text,
      edited,
      edited_at,
      created_at,
      author:author_id(
        id,
        name,
        email,
        image_url
      )
    `)
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }

  // Transform to match existing format
  return data?.map((comment: any) => ({
    _id: comment.id,
    _type: 'comment' as const,
    vehicle: { _ref: vehicleId },
    text: comment.text,
    edited: comment.edited,
    editedAt: comment.edited_at,
    createdAt: comment.created_at,
    author: comment.author ? {
      _id: comment.author.id,
      _type: 'user' as const,
      name: comment.author.name,
      email: comment.author.email,
      image: comment.author.image_url,
      domain: comment.author.email.split('@')[1],
      role: 'sales' as const,
      lastLogin: new Date().toISOString(),
      active: true
    } : { _ref: comment.author_id },
    mentions: [] // Mentions will be fetched separately if needed
  })) || []
}
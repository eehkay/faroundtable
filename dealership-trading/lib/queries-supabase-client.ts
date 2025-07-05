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
  return data?.map(activity => ({
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
  return data?.map(comment => ({
    _id: comment.id,
    text: comment.text,
    edited: comment.edited,
    editedAt: comment.edited_at,
    createdAt: comment.created_at,
    author: comment.author ? {
      _id: comment.author.id,
      name: comment.author.name,
      email: comment.author.email,
      image: comment.author.image_url
    } : null,
    mentions: [] // Mentions will be fetched separately if needed
  })) || []
}
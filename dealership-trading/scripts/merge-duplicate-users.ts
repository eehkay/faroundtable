import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

// Define user type
interface SanityUser {
  _id: string
  email?: string
  name?: string
  role?: string
  location?: any
  lastLogin?: string
  active?: boolean
}

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN!,
  apiVersion: '2023-01-01',
  useCdn: false,
})

async function findAndMergeDuplicateUsers() {
  console.log('🔍 Finding duplicate users...\n')

  try {
    // Fetch all users
    const users: SanityUser[] = await client.fetch(`
      *[_type == "user"] | order(email asc) {
        _id,
        email,
        name,
        role,
        location,
        lastLogin,
        active
      }
    `)

    // Group users by email (case-insensitive)
    const usersByEmail = new Map<string, SanityUser[]>()
    
    for (const user of users) {
      const normalizedEmail = user.email?.toLowerCase() || ''
      if (!usersByEmail.has(normalizedEmail)) {
        usersByEmail.set(normalizedEmail, [])
      }
      usersByEmail.get(normalizedEmail)!.push(user)
    }

    // Find duplicates
    const duplicates = Array.from(usersByEmail.entries()).filter(([_, users]) => users.length > 1)

    if (duplicates.length === 0) {
      console.log('✅ No duplicate users found!')
      return
    }

    console.log(`Found ${duplicates.length} email(s) with duplicate accounts:\n`)

    for (const [email, userList] of duplicates) {
      console.log(`\n📧 Email: ${email}`)
      console.log('Duplicate accounts:')
      
      userList.forEach((user: SanityUser, index: number) => {
        console.log(`  ${index + 1}. ID: ${user._id}`)
        console.log(`     Name: ${user.name || 'N/A'}`)
        console.log(`     Role: ${user.role || 'N/A'}`)
        console.log(`     Last Login: ${user.lastLogin || 'Never'}`)
        console.log(`     Active: ${user.active}`)
      })

      // Determine which account to keep (prefer the one with most recent login or highest role)
      const primaryUser = userList.reduce((best: SanityUser, current: SanityUser) => {
        // Priority: admin > manager > transport > sales
        const roleOrder = { admin: 4, manager: 3, transport: 2, sales: 1 }
        const bestRole = roleOrder[best.role as keyof typeof roleOrder] || 0
        const currentRole = roleOrder[current.role as keyof typeof roleOrder] || 0

        if (currentRole > bestRole) return current
        if (currentRole < bestRole) return best

        // If roles are equal, prefer most recent login
        const bestLogin = best.lastLogin ? new Date(best.lastLogin).getTime() : 0
        const currentLogin = current.lastLogin ? new Date(current.lastLogin).getTime() : 0

        return currentLogin > bestLogin ? current : best
      })

      console.log(`\n✨ Keeping primary account: ${primaryUser._id}`)

      // Optional: Ask for confirmation
      console.log('\nTo merge these accounts and delete duplicates, run:')
      console.log(`npm run merge-users -- --email="${email}" --keep="${primaryUser._id}"`)
    }

  } catch (error) {
    console.error('Error finding duplicate users:', error)
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
let email: string | null = null
let keepId: string | null = null

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--email=')) {
    email = args[i].split('=')[1]
  } else if (args[i].startsWith('--keep=')) {
    keepId = args[i].split('=')[1]
  }
}

// Handle command line arguments for actual merging
if (email && keepId) {
  mergeDuplicates(email, keepId)
} else {
  // Just find and report duplicates
  findAndMergeDuplicateUsers()
}

async function mergeDuplicates(email: string, keepId: string) {
  console.log(`\n🔄 Merging duplicates for ${email}, keeping ${keepId}...`)

  try {
    // Fetch all users with this email
    const users: SanityUser[] = await client.fetch(`
      *[_type == "user" && email == $email] {
        _id,
        email,
        name,
        role,
        location,
        lastLogin
      }
    `, { email })

    const toDelete = users.filter((u: SanityUser) => u._id !== keepId)
    
    if (toDelete.length === 0) {
      console.log('No duplicates to delete.')
      return
    }

    // Update references from duplicate users to the primary user
    console.log('\n📝 Updating references...')
    
    for (const duplicate of toDelete) {
      // Update transfers
      const transfers: string[] = await client.fetch(`
        *[_type == "transfer" && (requestedBy._ref == $id || approvedBy._ref == $id || cancelledBy._ref == $id)]._id
      `, { id: duplicate._id })

      for (const transferId of transfers) {
        await client
          .patch(transferId)
          .set({
            'requestedBy._ref': keepId,
            'approvedBy._ref': keepId,
            'cancelledBy._ref': keepId,
          })
          .commit()
      }

      // Update activities
      const activities: string[] = await client.fetch(`
        *[_type == "activity" && user._ref == $id]._id
      `, { id: duplicate._id })

      for (const activityId of activities) {
        await client
          .patch(activityId)
          .set({ 'user._ref': keepId })
          .commit()
      }

      // Update comments
      const comments: string[] = await client.fetch(`
        *[_type == "comment" && author._ref == $id]._id
      `, { id: duplicate._id })

      for (const commentId of comments) {
        await client
          .patch(commentId)
          .set({ 'author._ref': keepId })
          .commit()
      }
    }

    // Delete duplicate users
    console.log('\n🗑️  Deleting duplicate users...')
    for (const duplicate of toDelete) {
      await client.delete(duplicate._id)
      console.log(`Deleted: ${duplicate._id}`)
    }

    console.log('\n✅ Merge complete!')

  } catch (error) {
    console.error('Error merging duplicates:', error)
  }
}
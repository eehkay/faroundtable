export interface BugReport {
  id: string
  message: string
  screenshot?: {
    filename: string
    url: string
  }
  reporter: {
    id: string
    name: string
    email: string
    role: string
    location?: string
  }
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  createdAt: string
  updatedAt: string
}
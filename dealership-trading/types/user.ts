export interface User {
  _id: string
  _type: 'user'
  email: string
  name: string
  image?: string
  domain: string
  role: 'sales' | 'manager' | 'admin' | 'transport'
  location?: {
    _ref: string
    _type: 'reference'
  }
  lastLogin: string
  active: boolean
}
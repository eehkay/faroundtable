"use client"

import { useState, useEffect } from 'react';
import { Search, UserPlus, Filter, MoreVertical, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import UserEditModal from './UserEditModal';
import type { DealershipLocation } from '@/types/vehicle';

interface User {
  _id: string;
  email: string;
  name: string;
  image?: string;
  role: 'admin' | 'manager' | 'sales' | 'transport';
  active: boolean;
  lastLogin?: string;
  location?: {
    _id: string;
    name: string;
    code: string;
  };
}

interface UserListProps {
  initialUsers: User[];
  locations: DealershipLocation[];
  currentUserId: string;
}

export default function UserList({ initialUsers, locations, currentUserId }: UserListProps) {
  // UserList Component initialized
  
  // Ensure initialUsers is always an array
  const safeInitialUsers = initialUsers || [];
  
  const [users, setUsers] = useState(safeInitialUsers);
  const [filteredUsers, setFilteredUsers] = useState(safeInitialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(user => user.active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(user => !user.active);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      }
    } catch (error) {
      // Failed to fetch users
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        await fetchUsers();
        setEditingUser(null);
      }
    } catch (error) {
      // Failed to update user
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (userId === currentUserId) {
      alert('Cannot deactivate your own account');
      return;
    }

    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      // Failed to deactivate user
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400';
      case 'manager':
        return 'bg-blue-500/20 text-blue-400';
      case 'sales':
        return 'bg-green-500/20 text-green-400';
      case 'transport':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg shadow-sm transition-all duration-200">
      {/* Header with Search and Filters */}
      <div className="p-6 border-b border-[#2a2a2a]">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-gray-100 placeholder-gray-400 focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex gap-3">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-gray-100 focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="sales">Sales</option>
              <option value="transport">Transport</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-gray-100 focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Add User Button */}
            <button
              onClick={() => setEditingUser({} as User)}
              className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition-all duration-200"
            >
              <UserPlus className="h-4 w-4" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-[#2a2a2a] h-16 rounded-lg"></div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No users in the system</p>
            <p className="text-gray-500 text-sm mt-2">Users will be created automatically when they sign in with Google</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No users match your filters</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-4 bg-[#141414] border border-[#2a2a2a]/30 rounded-lg hover:bg-[#1a1a1a] transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  {/* User Avatar */}
                  <div className="relative">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-[#3b82f6] rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {user.active ? (
                      <CheckCircle className="absolute -bottom-1 -right-1 h-4 w-4 text-green-500 bg-[#141414] rounded-full" />
                    ) : (
                      <XCircle className="absolute -bottom-1 -right-1 h-4 w-4 text-red-500 bg-[#141414] rounded-full" />
                    )}
                  </div>

                  {/* User Info */}
                  <div>
                    <h3 className="font-medium text-gray-100">{user.name}</h3>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>

                  {/* Role Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>

                  {/* Location */}
                  {user.location && (
                    <span className="px-2.5 py-1 bg-[#2a2a2a] text-gray-300 rounded-full text-xs font-medium">
                      {user.location.name}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingUser(user)}
                    className="p-2 text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a] rounded-lg transition-all duration-200"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  
                  {user._id !== currentUserId && (
                    <button
                      onClick={() => handleDeactivateUser(user._id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <UserEditModal
          user={editingUser}
          locations={locations}
          onSave={handleUpdateUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}
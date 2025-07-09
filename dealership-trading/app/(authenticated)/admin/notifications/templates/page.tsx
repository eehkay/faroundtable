'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Mail, 
  MessageSquare, 
  Plus, 
  Edit2, 
  Trash2, 
  Copy,
  ToggleLeft,
  ToggleRight,
  Search
} from 'lucide-react';
import type { NotificationTemplate, NotificationCategory } from '@/types/notifications';

export default function NotificationTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | 'all'>('all');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/notification-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (template: NotificationTemplate) => {
    try {
      const response = await fetch(`/api/admin/notification-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          active: !template.active
        })
      });

      if (!response.ok) throw new Error('Failed to update template');
      
      await fetchTemplates();
      toast.success(`Template ${!template.active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  };

  const handleDelete = async (template: NotificationTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/notification-templates/${template.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete template');
      }
      
      await fetchTemplates();
      toast.success('Template deleted successfully');
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error(error.message || 'Failed to delete template');
    }
  };

  const handleDuplicate = async (template: NotificationTemplate) => {
    try {
      const response = await fetch('/api/admin/notification-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          description: template.description,
          category: template.category,
          channels: template.channels,
          active: false
        })
      });

      if (!response.ok) throw new Error('Failed to duplicate template');
      
      await fetchTemplates();
      toast.success('Template duplicated successfully');
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories: NotificationCategory[] = ['transfer', 'system', 'vehicle', 'general'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Notification Templates</h1>
          <p className="text-gray-400 mt-1">
            Manage email and SMS templates for system notifications
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/notifications/templates/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as NotificationCategory | 'all')}
          className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
            <p className="text-gray-400">No templates found</p>
          </div>
        ) : (
          filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 hover:border-[#3a3a3a] transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{template.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      template.active 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {template.active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
                      {template.category}
                    </span>
                  </div>
                  {template.description && (
                    <p className="text-gray-400 text-sm mb-3">{template.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    {template.channels.email?.enabled && (
                      <div className="flex items-center gap-1 text-gray-400">
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                      </div>
                    )}
                    {template.channels.sms?.enabled && (
                      <div className="flex items-center gap-1 text-gray-400">
                        <MessageSquare className="w-4 h-4" />
                        <span>SMS</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(template)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title={template.active ? 'Deactivate' : 'Activate'}
                  >
                    {template.active ? (
                      <ToggleRight className="w-5 h-5 text-green-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => router.push(`/admin/notifications/templates/${template.id}`)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
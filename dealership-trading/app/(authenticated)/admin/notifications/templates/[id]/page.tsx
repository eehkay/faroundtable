'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TemplateForm } from '@/components/admin/notifications/TemplateForm';
import type { NotificationTemplate } from '@/types/notifications';

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<NotificationTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTemplate = useCallback(async () => {
    try {
      const id = params.id as string;
      const response = await fetch(`/api/admin/notification-templates/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Template not found');
          router.push('/admin/notifications/templates');
          return;
        }
        throw new Error('Failed to fetch template');
      }
      
      const data = await response.json();
      setTemplate(data);
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error('Failed to load template');
      router.push('/admin/notifications/templates');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading template...</div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Notification Template</h1>
        <p className="text-gray-400 mt-1">
          Update the email or SMS template configuration
        </p>
      </div>

      <TemplateForm template={template} />
    </div>
  );
}
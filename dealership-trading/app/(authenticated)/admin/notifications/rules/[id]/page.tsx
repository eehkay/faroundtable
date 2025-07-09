'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RuleForm } from '@/components/admin/notifications/RuleForm';
import type { NotificationRule } from '@/types/notifications';

export default function EditRulePage() {
  const params = useParams();
  const router = useRouter();
  const [rule, setRule] = useState<NotificationRule | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRule = useCallback(async () => {
    try {
      const id = params.id as string;
      const response = await fetch(`/api/admin/notification-rules/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Rule not found');
          router.push('/admin/notifications/rules');
          return;
        }
        throw new Error('Failed to fetch rule');
      }
      
      const data = await response.json();
      setRule(data);
    } catch (error) {
      console.error('Error fetching rule:', error);
      toast.error('Failed to load rule');
      router.push('/admin/notifications/rules');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchRule();
  }, [fetchRule]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading rule...</div>
      </div>
    );
  }

  if (!rule) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Notification Rule</h1>
        <p className="text-gray-400 mt-1">
          Update conditions and recipients for this notification
        </p>
      </div>

      <RuleForm rule={rule} />
    </div>
  );
}
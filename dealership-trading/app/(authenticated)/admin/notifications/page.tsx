'use client'

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAdmin } from "@/lib/permissions";
import EmailSettingsForm from "@/components/admin/notifications/EmailSettingsForm";
import EmailTemplateEditor from "@/components/admin/notifications/EmailTemplateEditor";
import NotificationPreview from "@/components/admin/notifications/NotificationPreview";
import { Mail, Settings, Eye } from "lucide-react";

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'settings' | 'templates' | 'preview'>('settings');

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !isAdmin(session.user.role)) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-[#2a2a2a] rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-[#2a2a2a] rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!session || !isAdmin(session.user.role)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Notification Settings</h1>
        <p className="mt-2 text-gray-400">
          Configure email templates and notification preferences
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#2a2a2a]">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General Settings
            </span>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Templates
            </span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'settings' && <EmailSettingsForm />}
        {activeTab === 'templates' && <EmailTemplateEditor />}
        {activeTab === 'preview' && <NotificationPreview />}
      </div>
    </div>
  );
}
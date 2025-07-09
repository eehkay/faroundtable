import { TemplateForm } from '@/components/admin/notifications/TemplateForm';

export default function NewTemplatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Notification Template</h1>
        <p className="text-gray-400 mt-1">
          Create a new email or SMS template for system notifications
        </p>
      </div>

      <TemplateForm />
    </div>
  );
}
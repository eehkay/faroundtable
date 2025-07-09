import { RuleForm } from '@/components/admin/notifications/RuleForm';

export default function NewRulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Notification Rule</h1>
        <p className="text-gray-400 mt-1">
          Define conditions and recipients for automatic notifications
        </p>
      </div>

      <RuleForm />
    </div>
  );
}
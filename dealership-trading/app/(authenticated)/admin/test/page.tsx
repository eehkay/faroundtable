import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function AdminTestPage() {
  const session = await getServerSession(authOptions);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white">Admin Test Page</h1>
      <div className="mt-4 p-4 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg">
        <p className="text-gray-300">Current user role: {session?.user?.role || 'Not logged in'}</p>
        <p className="text-gray-300">Current user email: {session?.user?.email || 'Not logged in'}</p>
        <p className="text-gray-300">Current user name: {session?.user?.name || 'Not logged in'}</p>
      </div>
    </div>
  );
}
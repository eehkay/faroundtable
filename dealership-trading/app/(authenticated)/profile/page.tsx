'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/users/${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchUserData();
    }
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 bg-zinc-900 border-zinc-800">
            <p className="text-center text-gray-400">Unable to load profile data</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
        
        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span>{userData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Domain:</span>
                <span>{userData.domain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Role:</span>
                <span className="capitalize">{userData.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Member Since:</span>
                <span>{new Date(userData._createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-6">
            <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
            <ProfileForm 
              user={userData} 
              onUpdate={(updatedUser) => setUserData(updatedUser)}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
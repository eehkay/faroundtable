'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Camera } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

interface DealershipLocation {
  _id: string;
  name: string;
  storeId: string;
}

interface ProfileFormProps {
  user: {
    _id: string;
    name: string;
    email: string;
    image?: string;
    location?: {
      _id: string;
      name: string;
    };
    role: string;
  };
  onUpdate: (updatedUser: any) => void;
}

export function ProfileForm({ user, onUpdate }: ProfileFormProps) {
  const { update: updateSession } = useSession();
  const [formData, setFormData] = useState({
    name: user.name || '',
    image: user.image || '',
    location: user.location?._id || ''
  });
  const [locations, setLocations] = useState<DealershipLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/dealerships');
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/users/${user._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          image: formData.image,
          location: formData.location || null
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        onUpdate(updatedUser);
        setMessage('Profile updated successfully!');
        
        // Update the session with new data
        await updateSession({
          user: {
            name: updatedUser.name,
            image: updatedUser.image,
          }
        });
      } else {
        const error = await response.text();
        setMessage(`Error: ${error}`);
      }
    } catch (error) {
      setMessage('Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real implementation, you would upload to a storage service
    // For now, we'll just show a placeholder message
    setMessage('Image upload functionality coming soon!');
    
    // You could implement image upload to Sanity or another service here
    // const formData = new FormData();
    // formData.append('file', file);
    // const response = await fetch('/api/upload', { method: 'POST', body: formData });
    // const { url } = await response.json();
    // setFormData({ ...formData, image: url });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Display Name</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 bg-zinc-800 border-zinc-700"
            placeholder="Enter your name"
            required
          />
        </div>

        <div>
          <Label htmlFor="location">Primary Location</Label>
          <select
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="mt-1 w-full rounded-md bg-zinc-800 border-zinc-700 text-white px-3 py-2"
          >
            <option value="">Select a location</option>
            {locations.map((loc) => (
              <option key={loc._id} value={loc._id}>
                {loc.name} ({loc.storeId})
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="image">Profile Image URL</Label>
          <div className="mt-1 flex gap-2">
            <Input
              id="image"
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="flex-1 bg-zinc-800 border-zinc-700"
              placeholder="https://example.com/image.jpg"
            />
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button type="button" variant="outline" size="icon">
                <Camera className="h-4 w-4" />
              </Button>
            </label>
          </div>
          {formData.image && (
            <div className="mt-2 relative h-20 w-20">
              <Image 
                src={formData.image} 
                alt="Profile preview" 
                fill
                className="rounded-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className={`text-sm ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
          {message}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          'Update Profile'
        )}
      </Button>
    </form>
  );
}
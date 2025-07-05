"use client"

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase-client';
import { getVehicleComments } from '@/lib/queries-supabase-client';
import type { Comment } from '@/types/transfer';

interface CommentSectionProps {
  vehicleId: string;
}

export default function CommentSection({ vehicleId }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setError(null);
        const data = await getVehicleComments(vehicleId);
        console.log('Fetched comments for vehicle:', vehicleId, data);
        setComments(data || []);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
        setError('Failed to load comments. Please check your connection.');
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`comments:${vehicleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `vehicle_id=eq.${vehicleId}`
        },
        (payload) => {
          console.log('Comment real-time update:', payload);
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vehicleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session?.user) return;

    setPosting(true);
    setError(null);

    try {
      const response = await fetch('/api/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId,
          text: newComment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      console.log('Comment posted successfully:', data);
      setNewComment('');
      
      // Fetch comments again to get the new one
      const updatedComments = await getVehicleComments(vehicleId);
      setComments(updatedComments || []);
    } catch (error) {
      console.error('Failed to post comment:', error);
      setError(error instanceof Error ? error.message : 'Failed to post comment. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleImageError = (commentId: string) => {
    setImageErrors(prev => ({ ...prev, [commentId]: true }));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="bg-[#1f1f1f] rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Comments</h3>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-1/4 mb-2" />
                  <div className="h-4 bg-gray-700 rounded w-full mb-1" />
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1f1f1f] rounded-lg shadow-sm p-6 transition-all duration-200">
      <h3 className="text-lg font-semibold text-white mb-4">Comments</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      
      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex items-start gap-3">
          {session?.user && (
            <div className="flex-shrink-0">
              {session.user.image && !imageErrors[session.user.id] ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={32}
                  height={32}
                  className="rounded-full"
                  onError={() => handleImageError(session.user.id)}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                  {getInitials(session.user.name || session.user.email || 'U')}
                </div>
              )}
            </div>
          )}
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-3 py-2 bg-[#2f2f2f] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-white placeholder-gray-400"
              rows={2}
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!newComment.trim() || posting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="text-gray-400 text-sm">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment._id} className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {comment.author?.image && !imageErrors[comment._id] ? (
                  <Image
                    src={comment.author.image}
                    alt={comment.author.name || 'User'}
                    width={32}
                    height={32}
                    className="rounded-full"
                    onError={() => handleImageError(comment._id)}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white text-xs font-medium">
                    {getInitials(comment.author?.name || comment.author?.email || 'U')}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">
                    {comment.author?.name || 'Unknown User'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                  {comment.edited && (
                    <span className="text-xs text-gray-500">(edited)</span>
                  )}
                </div>
                <p className="text-gray-300 text-sm mt-1 whitespace-pre-wrap break-words">
                  {comment.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
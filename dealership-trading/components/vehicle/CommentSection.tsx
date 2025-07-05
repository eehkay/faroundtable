"use client"

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { client, listenClient } from '@/lib/sanity';
import { vehicleCommentsQuery } from '@/lib/queries';
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setError(null);
        const data = await client.fetch(vehicleCommentsQuery, { vehicleId });
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
    
    // Subscribe to real-time updates using listenClient
    const subscription = listenClient
      .listen(`*[_type == "comment" && vehicle._ref == $vehicleId]`, { vehicleId })
      .subscribe({
        next: (update) => {
          console.log('Comment real-time update:', update);
          if (update.transition === 'appear' || update.transition === 'disappear') {
            fetchComments();
          }
        },
        error: (err) => {
          console.error('Comment subscription error:', err);
        }
      });

    return () => subscription.unsubscribe();
  }, [vehicleId, refreshTrigger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session) return;

    setPosting(true);
    try {
      const response = await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          text: newComment
        })
      });

      if (response.ok) {
        setNewComment('');
        // Refresh comments by updating trigger
        setRefreshTrigger(prev => prev + 1);
      } else {
        const error = await response.json();
        console.error('Failed to post comment:', error);
        alert(`Failed to post comment: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/comment?id=${commentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Refresh comments after successful deletion
        setRefreshTrigger(prev => prev + 1);
      } else {
        const error = await response.json();
        console.error('Failed to delete comment:', error);
        alert(`Failed to delete comment: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-[#2a2a2a] h-32 rounded"></div>;
  }

  if (error) {
    return (
      <div className="bg-[#1f1f1f] border border-red-800/50 rounded-lg p-4">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-4 transition-all duration-200">
      <h3 className="font-semibold mb-4 text-white">Comments</h3>
      
      {session && (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 rounded px-3 py-2 bg-[#141414] text-gray-100 placeholder-gray-400 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={posting}
            />
            <button
              type="submit"
              disabled={posting || !newComment.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-all duration-200"
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      )}

      {comments.length === 0 ? (
        <p className="text-gray-400 text-sm">No comments yet</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment._id} className="pb-3 last:pb-0 border-b border-[#2a2a2a]/30 last:border-b-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {'image' in comment.author && comment.author.image && !imageErrors[comment._id] && (
                    <Image
                      src={'image' in comment.author ? comment.author.image : ''}
                      alt={'name' in comment.author ? comment.author.name : 'User'}
                      className="w-8 h-8 rounded-full"
                      width={32}
                      height={32}
                      onError={() => setImageErrors(prev => ({ ...prev, [comment._id]: true }))}
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm text-gray-100">{'name' in comment.author ? comment.author.name : 'Unknown'}</p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      {comment.edited && ' (edited)'}
                    </p>
                  </div>
                </div>
                {session && ('_id' in comment.author && session.user.id === comment.author._id || session.user.role === 'admin') && (
                  <button
                    onClick={() => handleDelete(comment._id)}
                    className="text-red-400 hover:text-red-300 text-sm transition-all duration-200"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-100">{comment.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
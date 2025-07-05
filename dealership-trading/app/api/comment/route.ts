import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeClient } from '@/lib/sanity';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { vehicleId, text, mentions } = await request.json();
    
    if (!vehicleId || !text) {
      return NextResponse.json({ error: 'Vehicle ID and text are required' }, { status: 400 });
    }
    
    // Create comment
    const comment = await writeClient.create({
      _type: 'comment',
      vehicle: { _ref: vehicleId },
      author: { _ref: session.user.id },
      text,
      mentions: mentions?.map((userId: string) => ({ _ref: userId })) || [],
      edited: false,
      createdAt: new Date().toISOString()
    });
    
    // Create activity log
    await writeClient.create({
      _type: 'activity',
      vehicle: { _ref: vehicleId },
      user: { _ref: session.user.id },
      action: 'commented',
      details: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      createdAt: new Date().toISOString()
    });
    
    return NextResponse.json({ success: true, commentId: comment._id });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');
    
    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }
    
    // Get comment to check ownership
    const comment = await writeClient.fetch(
      `*[_type == "comment" && _id == $id][0]{ author }`,
      { id: commentId }
    );
    
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    
    // Check permissions
    const canDelete = 
      session.user.role === 'admin' || 
      comment.author._ref === session.user.id;
    
    if (!canDelete) {
      return NextResponse.json({ error: 'Unauthorized to delete this comment' }, { status: 403 });
    }
    
    await writeClient.delete(commentId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
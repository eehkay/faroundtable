import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { vehicleId, text, mentions } = await request.json();
    
    if (!vehicleId || !text) {
      return NextResponse.json({ error: 'Vehicle ID and text are required' }, { status: 400 });
    }
    
    // Get the user ID from the email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();
    
    if (userError || !user) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Create comment
    const { data: comment, error: commentError } = await supabaseAdmin
      .from('comments')
      .insert({
        vehicle_id: vehicleId,
        author_id: user.id,
        text,
        edited: false
      })
      .select()
      .single();
    
    if (commentError) {
      console.error('Error creating comment:', commentError);
      throw commentError;
    }
    
    // Create mentions if any
    if (mentions && mentions.length > 0 && comment) {
      const mentionRecords = mentions.map((userId: string) => ({
        comment_id: comment.id,
        user_id: userId
      }));
      
      await supabaseAdmin
        .from('comment_mentions')
        .insert(mentionRecords);
    }
    
    // Note: We don't create an activity log for comments since the comments 
    // themselves are shown in the unified feed, avoiding duplication
    
    return NextResponse.json({ success: true, commentId: comment.id });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');
    
    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }
    
    // Get the user ID from the email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();
    
    if (userError || !user) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get comment to check ownership
    const { data: comment, error: fetchError } = await supabaseAdmin
      .from('comments')
      .select('author_id')
      .eq('id', commentId)
      .single();
    
    if (fetchError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    
    // Check permissions
    const canDelete = 
      user.role === 'admin' || 
      comment.author_id === user.id;
    
    if (!canDelete) {
      return NextResponse.json({ error: 'Unauthorized to delete this comment' }, { status: 403 });
    }
    
    const { error: deleteError } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('id', commentId);
    
    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      throw deleteError;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
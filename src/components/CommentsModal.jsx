import React, { useState, useEffect } from 'react';
import { X, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function CommentsModal({ 
  item, 
  onClose, 
  userName,
  tableName,
  foreignKeyName 
}) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (item) {
      fetchComments();
      
      const subscription = supabase
        .channel(`comments_${tableName}_${item.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: tableName,
          filter: `${foreignKeyName}=eq.${item.id}`
        }, fetchComments)
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [item, tableName, foreignKeyName]);

  const fetchComments = async () => {
    setLoadingComments(true);
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq(foreignKeyName, item.id)
      .order('created_at', { ascending: true });
    if (!error) setComments(data || []);
    setLoadingComments(false);
  };

  const addComment = async () => {
    if (!newComment.trim() || !item || !userName) return;
    
    await supabase.from(tableName).insert([
      {
        [foreignKeyName]: item.id,
        comment_text: newComment,
        added_by: userName
      }
    ]);
    setNewComment('');
  };

  const handleCommentKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addComment();
    }
  };

  const deleteComment = async (commentId) => {
    await supabase.from(tableName).delete().eq('id', commentId);
    fetchComments();
  };

  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-white mb-2">{item.name}</h2>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                <ExternalLink size={14} />
                View Recipe
              </a>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Comments */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingComments ? (
            <div className="text-center py-8 text-gray-400">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No comments yet. Be the first to add one!</div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-sm text-gray-400">
                      <span className="font-medium text-blue-400">
                        {comment.added_by === userName ? 'You' : comment.added_by}
                      </span>
                      <span className="mx-2">•</span>
                      <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    {comment.added_by === userName && (
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-white whitespace-pre-wrap">{comment.comment_text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Comment */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex flex-col sm:flex-row gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyUp={handleCommentKeyPress}
              placeholder="Add a comment... (Press Enter to send, Shift+Enter for new line)"
              rows="2"
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <button
              onClick={addComment}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors sm:self-end w-full sm:w-auto"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

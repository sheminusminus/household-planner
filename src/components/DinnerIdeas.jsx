import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink, Heart, MessageCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function DinnerIdeas({ userName }) {
  const [dinnerIdeas, setDinnerIdeas] = useState([]);
  const [newDinnerIdea, setNewDinnerIdea] = useState('');
  const [newDinnerUrl, setNewDinnerUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    fetchDinnerIdeas();
    
    const subscription = supabase
      .channel('dinner_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dinner_ideas' }, fetchDinnerIdeas)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (selectedIdea) {
      fetchComments(selectedIdea.id);
      
      const subscription = supabase
        .channel('comments_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'dinner_idea_comments',
          filter: `dinner_idea_id=eq.${selectedIdea.id}`
        }, () => fetchComments(selectedIdea.id))
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedIdea]);

  const fetchDinnerIdeas = async () => {
    const { data, error } = await supabase
      .from('dinner_ideas')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setDinnerIdeas(data || []);
    setLoading(false);
  };

  const fetchComments = async (dinnerIdeaId) => {
    setLoadingComments(true);
    const { data, error } = await supabase
      .from('dinner_idea_comments')
      .select('*')
      .eq('dinner_idea_id', dinnerIdeaId)
      .order('created_at', { ascending: true });
    if (!error) setComments(data || []);
    setLoadingComments(false);
  };

  const addDinnerIdea = async () => {
    if (!newDinnerIdea.trim() || !userName) return;
    
    await supabase.from('dinner_ideas').insert([
      { 
        name: newDinnerIdea,
        url: newDinnerUrl.trim() || null,
        added_by: userName,
        favorited: false
      }
    ]);
    setNewDinnerIdea('');
    setNewDinnerUrl('');
  };

  const handleNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      addDinnerIdea();
    }
  };

  const handleUrlKeyPress = (e) => {
    if (e.key === 'Enter') {
      addDinnerIdea();
    }
  };

  const toggleFavorite = async (id, currentFavorited) => {
    await supabase
      .from('dinner_ideas')
      .update({ favorited: !currentFavorited })
      .eq('id', id);
  };

  const deleteDinnerIdea = async (id) => {
    await supabase.from('dinner_ideas').delete().eq('id', id);
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedIdea || !userName) return;
    
    await supabase.from('dinner_idea_comments').insert([
      {
        dinner_idea_id: selectedIdea.id,
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
    await supabase.from('dinner_idea_comments').delete().eq('id', commentId);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading...</div>;
  }

  const regularIdeas = dinnerIdeas.filter(idea => !idea.favorited);
  const favoritedIdeas = dinnerIdeas.filter(idea => idea.favorited);

  const renderIdea = (idea) => (
    <div
      key={idea.id}
      className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
    >
      <div 
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => setSelectedIdea(idea)}
      >
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">{idea.name}</span>
          {idea.url && (
            <a
              href={idea.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>
        {idea.url && (
          <div className="text-xs text-gray-400 mt-1 truncate overflow-hidden">
            {idea.url}
          </div>
        )}
        {idea.added_by && (
          <div className="text-xs text-gray-500 mt-1">
            Added by {idea.added_by === userName ? 'you' : idea.added_by}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 ml-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedIdea(idea);
          }}
          className="text-gray-400 hover:text-blue-400 transition-colors"
        >
          <MessageCircle size={18} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(idea.id, idea.favorited);
          }}
          className={`transition-colors ${
            idea.favorited ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-red-500'
          }`}
        >
          <Heart size={18} fill={idea.favorited ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteDinnerIdea(idea.id);
          }}
          className="text-red-500 hover:text-red-700 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6 space-y-3">
        <input
          type="text"
          value={newDinnerIdea}
          onChange={(e) => setNewDinnerIdea(e.target.value)}
          onKeyUp={handleNameKeyPress}
          placeholder="Dinner idea (e.g., Spaghetti Bolognese)..."
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={newDinnerUrl}
            onChange={(e) => setNewDinnerUrl(e.target.value)}
            onKeyUp={handleUrlKeyPress}
            placeholder="Recipe URL (optional)..."
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={addDinnerIdea}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 sm:w-auto w-full"
          >
            <Plus size={20} /> Add
          </button>
        </div>
      </div>

      {dinnerIdeas.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No dinner ideas yet. Add some meals you like to make!</p>
      ) : (
        <>
          {/* Regular Ideas */}
          {regularIdeas.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                All Ideas
              </h3>
              <div className="space-y-2">
                {regularIdeas.map(renderIdea)}
              </div>
            </div>
          )}

          {/* Favorited Ideas */}
          {favoritedIdeas.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                <Heart size={16} fill="currentColor" className="text-red-500" />
                Favorites
              </h3>
              <div className="space-y-2">
                {favoritedIdeas.map(renderIdea)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Comments Modal */}
      {selectedIdea && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col border border-gray-700">
            {/* Header */}
            <div className="p-6 border-b border-gray-700 flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedIdea.name}</h2>
                {selectedIdea.url && (
                  <a
                    href={selectedIdea.url}
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
                onClick={() => setSelectedIdea(null)}
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
              <div className="flex gap-2">
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
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors self-end"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

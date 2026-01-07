import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function DinnerIdeas() {
  const [dinnerIdeas, setDinnerIdeas] = useState([]);
  const [newDinnerIdea, setNewDinnerIdea] = useState('');
  const [newDinnerUrl, setNewDinnerUrl] = useState('');
  const [loading, setLoading] = useState(true);

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

  const fetchDinnerIdeas = async () => {
    const { data, error } = await supabase
      .from('dinner_ideas')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setDinnerIdeas(data || []);
    setLoading(false);
  };

  const addDinnerIdea = async () => {
    if (!newDinnerIdea.trim()) return;
    
    await supabase.from('dinner_ideas').insert([
      { 
        name: newDinnerIdea,
        url: newDinnerUrl.trim() || null
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

  const deleteDinnerIdea = async (id) => {
    await supabase.from('dinner_ideas').delete().eq('id', id);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading...</div>;
  }

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

      <div className="space-y-2">
        {dinnerIdeas.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No dinner ideas yet. Add some meals you like to make!</p>
        ) : (
          dinnerIdeas.map((idea) => (
            <div
              key={idea.id}
              className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <div className="flex-1 min-w-0">
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
              </div>
              <button
                onClick={() => deleteDinnerIdea(idea.id)}
                className="text-red-500 hover:text-red-700 transition-colors ml-3"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

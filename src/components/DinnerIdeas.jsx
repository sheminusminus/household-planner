import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function DinnerIdeas() {
  const [dinnerIdeas, setDinnerIdeas] = useState([]);
  const [newDinnerIdea, setNewDinnerIdea] = useState('');
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
      { name: newDinnerIdea }
    ]);
    setNewDinnerIdea('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addDinnerIdea();
    }
  };

  const deleteDinnerIdea = async (id) => {
    await supabase.from('dinner_ideas').delete().eq('id', id);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newDinnerIdea}
            onChange={(e) => setNewDinnerIdea(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add dinner idea (e.g., Spaghetti Bolognese)..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addDinnerIdea}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus size={20} /> Add
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {dinnerIdeas.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No dinner ideas yet. Add some meals you like to make!</p>
        ) : (
          dinnerIdeas.map((idea) => (
            <div
              key={idea.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-800 font-medium">{idea.name}</span>
              <button
                onClick={() => deleteDinnerIdea(idea.id)}
                className="text-red-500 hover:text-red-700 transition-colors"
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

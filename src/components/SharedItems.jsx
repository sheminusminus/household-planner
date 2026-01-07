import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SharedItems({ userName }) {
  const [sharedItems, setSharedItems] = useState([]);
  const [newSharedItem, setNewSharedItem] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSharedItems();
    
    const subscription = supabase
      .channel('shared_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shared_items' }, fetchSharedItems)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchSharedItems = async () => {
    const { data, error } = await supabase
      .from('shared_items')
      .select('*')
      .order('last_bought_date', { ascending: false });
    if (!error) setSharedItems(data || []);
    setLoading(false);
  };

  const addSharedItem = async () => {
    if (!newSharedItem.trim() || !userName) return;
    
    await supabase.from('shared_items').insert([
      { 
        name: newSharedItem, 
        last_bought_by: userName,
        last_bought_date: new Date().toISOString()
      }
    ]);
    setNewSharedItem('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addSharedItem();
    }
  };

  const updateSharedItemBuyer = async (id) => {
    if (!userName) return;
    
    await supabase
      .from('shared_items')
      .update({ 
        last_bought_by: userName,
        last_bought_date: new Date().toISOString()
      })
      .eq('id', id);
  };

  const deleteSharedItem = async (id) => {
    await supabase.from('shared_items').delete().eq('id', id);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newSharedItem}
            onChange={(e) => setNewSharedItem(e.target.value)}
            onKeyUp={handleKeyPress}
            placeholder="Add shared item (toilet paper, coffee, etc)..."
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={addSharedItem}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 sm:w-auto w-full"
          >
            <Plus size={20} /> Add
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {sharedItems.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No shared items yet. Add items you take turns buying!</p>
        ) : (
          sharedItems.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">{item.name}</span>
                <button
                  onClick={() => deleteSharedItem(item.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-300">
                  <span>Last bought by: </span>
                  <span className="font-medium text-blue-400">
                    {item.last_bought_by}
                  </span>
                  <span className="ml-2 text-gray-500">
                    ({new Date(item.last_bought_date).toLocaleDateString()})
                  </span>
                </div>
                {item.last_bought_by !== userName && (
                  <button
                    onClick={() => updateSharedItemBuyer(item.id)}
                    className="text-sm bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 transition-colors"
                  >
                    Mark as Bought
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

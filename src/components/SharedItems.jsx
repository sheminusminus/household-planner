import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const HOUSEHOLDS = ['Your Family', 'Sister\'s Family'];

export default function SharedItems() {
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
    if (!newSharedItem.trim()) return;
    
    await supabase.from('shared_items').insert([
      { 
        name: newSharedItem, 
        last_bought_by: HOUSEHOLDS[0],
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

  const updateSharedItemBuyer = async (id, currentBuyer) => {
    const nextBuyer = currentBuyer === HOUSEHOLDS[0] ? HOUSEHOLDS[1] : HOUSEHOLDS[0];
    await supabase
      .from('shared_items')
      .update({ 
        last_bought_by: nextBuyer,
        last_bought_date: new Date().toISOString()
      })
      .eq('id', id);
  };

  const deleteSharedItem = async (id) => {
    await supabase.from('shared_items').delete().eq('id', id);
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
            value={newSharedItem}
            onChange={(e) => setNewSharedItem(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add shared item (toilet paper, coffee, etc)..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addSharedItem}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus size={20} /> Add
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {sharedItems.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No shared items yet. Add items you take turns buying!</p>
        ) : (
          sharedItems.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800">{item.name}</span>
                <button
                  onClick={() => deleteSharedItem(item.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span>Last bought by: </span>
                  <span className={`font-medium ${
                    item.last_bought_by === HOUSEHOLDS[0] ? 'text-purple-600' : 'text-green-600'
                  }`}>
                    {item.last_bought_by}
                  </span>
                  <span className="ml-2 text-gray-400">
                    ({new Date(item.last_bought_date).toLocaleDateString()})
                  </span>
                </div>
                <button
                  onClick={() => updateSharedItemBuyer(item.id, item.last_bought_by)}
                  className="text-sm bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 transition-colors"
                >
                  Mark as Bought
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function GroceryList() {
  const [groceryItems, setGroceryItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroceryItems();
    
    const subscription = supabase
      .channel('grocery_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_items' }, fetchGroceryItems)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchGroceryItems = async () => {
    const { data, error } = await supabase
      .from('grocery_items')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setGroceryItems(data || []);
    setLoading(false);
  };

  const addGroceryItem = async () => {
    if (!newItem.trim()) return;
    
    await supabase.from('grocery_items').insert([
      { name: newItem, checked: false }
    ]);
    setNewItem('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addGroceryItem();
    }
  };

  const toggleGroceryItem = async (id, checked) => {
    await supabase
      .from('grocery_items')
      .update({ checked: !checked })
      .eq('id', id);
  };

  const deleteGroceryItem = async (id) => {
    await supabase.from('grocery_items').delete().eq('id', id);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add grocery item..."
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={addGroceryItem}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus size={20} /> Add
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {groceryItems.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No items yet. Add your first grocery item!</p>
        ) : (
          groceryItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <button
                onClick={() => toggleGroceryItem(item.id, item.checked)}
                className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${
                  item.checked
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-500'
                }`}
              >
                {item.checked && <Check size={16} className="text-white" />}
              </button>
              <span className={`flex-1 ${item.checked ? 'line-through text-gray-500' : 'text-white'}`}>
                {item.name}
              </span>
              <button
                onClick={() => deleteGroceryItem(item.id)}
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

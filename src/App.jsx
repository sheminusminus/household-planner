import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Trash2, Check, ShoppingCart, Calendar, Package } from 'lucide-react';

const supabaseUrl = 'https://wisrbqibbbauqxxicqct.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpc3JicWliYmJhdXF4eGljcWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NzY5NTUsImV4cCI6MjA4MzI1Mjk1NX0.FzoRZ9PCvcyik4S-w6zU2oqg2FI38sT2cYW5KrtBi7Q';
const supabase = createClient(supabaseUrl, supabaseKey);

const HOUSEHOLDS = ['Your Family', 'Sister\'s Family'];

export default function HouseholdPlanner() {
  const [activeTab, setActiveTab] = useState('grocery');
  const [groceryItems, setGroceryItems] = useState([]);
  const [dinnerIdeas, setDinnerIdeas] = useState([]);
  const [sharedItems, setSharedItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [newDinnerIdea, setNewDinnerIdea] = useState('');
  const [newSharedItem, setNewSharedItem] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroceryItems();
    fetchDinnerIdeas();
    fetchSharedItems();
    
    const grocerySubscription = supabase
      .channel('grocery_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_items' }, fetchGroceryItems)
      .subscribe();

    const dinnerSubscription = supabase
      .channel('dinner_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dinner_ideas' }, fetchDinnerIdeas)
      .subscribe();

    const sharedSubscription = supabase
      .channel('shared_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shared_items' }, fetchSharedItems)
      .subscribe();

    return () => {
      grocerySubscription.unsubscribe();
      dinnerSubscription.unsubscribe();
      sharedSubscription.unsubscribe();
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

  const fetchDinnerIdeas = async () => {
    const { data, error } = await supabase
      .from('dinner_ideas')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setDinnerIdeas(data || []);
  };

  const fetchSharedItems = async () => {
    const { data, error } = await supabase
      .from('shared_items')
      .select('*')
      .order('last_bought_date', { ascending: false });
    if (!error) setSharedItems(data || []);
  };

  const addGroceryItem = async () => {
    if (!newItem.trim()) return;
    
    await supabase.from('grocery_items').insert([
      { name: newItem, checked: false }
    ]);
    setNewItem('');
  };

  const handleGroceryKeyPress = (e) => {
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

  const addDinnerIdea = async () => {
    if (!newDinnerIdea.trim()) return;
    
    await supabase.from('dinner_ideas').insert([
      { name: newDinnerIdea }
    ]);
    setNewDinnerIdea('');
  };

  const handleDinnerKeyPress = (e) => {
    if (e.key === 'Enter') {
      addDinnerIdea();
    }
  };

  const deleteDinnerIdea = async (id) => {
    await supabase.from('dinner_ideas').delete().eq('id', id);
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

  const handleSharedKeyPress = (e) => {
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          🏠 Household Planner
        </h1>

        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('grocery')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                activeTab === 'grocery'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ShoppingCart className="inline-block mr-2" size={20} />
              Grocery List
            </button>
            <button
              onClick={() => setActiveTab('dinner')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                activeTab === 'dinner'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Calendar className="inline-block mr-2" size={20} />
              Dinner Ideas
            </button>
            <button
              onClick={() => setActiveTab('shared')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                activeTab === 'shared'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Package className="inline-block mr-2" size={20} />
              Shared Items
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'grocery' && (
              <div>
                <div className="mb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      onKeyPress={handleGroceryKeyPress}
                      placeholder="Add grocery item..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <p className="text-gray-500 text-center py-8">No items yet. Add your first grocery item!</p>
                  ) : (
                    groceryItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <button
                          onClick={() => toggleGroceryItem(item.id, item.checked)}
                          className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${
                            item.checked
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {item.checked && <Check size={16} className="text-white" />}
                        </button>
                        <span className={`flex-1 ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
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
            )}

            {activeTab === 'dinner' && (
              <div>
                <div className="mb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDinnerIdea}
                      onChange={(e) => setNewDinnerIdea(e.target.value)}
                      onKeyPress={handleDinnerKeyPress}
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
            )}

            {activeTab === 'shared' && (
              <div>
                <div className="mb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSharedItem}
                      onChange={(e) => setNewSharedItem(e.target.value)}
                      onKeyPress={handleSharedKeyPress}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

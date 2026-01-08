import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, GripVertical } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function GroceryList({ userName }) {
  const [groceryItems, setGroceryItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [dropPosition, setDropPosition] = useState(null); // { itemId, position: 'before' | 'after' }
  const gripRefs = React.useRef({});

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

  // Add touch event listeners with passive: false
  useEffect(() => {
    const grips = Object.values(gripRefs.current);
    
    grips.forEach(grip => {
      if (grip) {
        const touchStart = (e) => {
          const itemElement = grip.closest('[data-item-id]');
          if (itemElement) {
            const itemId = parseInt(itemElement.getAttribute('data-item-id'));
            const itemData = groceryItems.find(i => i.id === itemId);
            if (itemData) {
              e.preventDefault();
              setDraggedItem(itemData);
              setTouchStartY(e.touches[0].clientY);
            }
          }
        };

        const touchMove = (e) => {
          if (!draggedItem || touchStartY === null) return;
          e.preventDefault();
          
          const touchY = e.touches[0].clientY;
          const element = document.elementFromPoint(e.touches[0].clientX, touchY);
          
          if (element) {
            const itemElement = element.closest('[data-item-id]');
            if (itemElement) {
              const targetId = parseInt(itemElement.getAttribute('data-item-id'));
              const targetItem = groceryItems.find(i => i.id === targetId);
              
              if (targetItem && targetItem.id !== draggedItem.id && targetItem.added_by === draggedItem.added_by) {
                const rect = itemElement.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                const position = touchY < midpoint ? 'before' : 'after';
                setDropPosition({ itemId: targetItem.id, position });
              } else {
                setDropPosition(null);
              }
            } else {
              setDropPosition(null);
            }
          }
        };

        grip.addEventListener('touchstart', touchStart, { passive: false });
        grip.addEventListener('touchmove', touchMove, { passive: false });
      }
    });

    return () => {
      grips.forEach(grip => {
        if (grip) {
          grip.removeEventListener('touchstart', () => {});
          grip.removeEventListener('touchmove', () => {});
        }
      });
    };
  }, [groceryItems, draggedItem, touchStartY]);

  const fetchGroceryItems = async () => {
    const { data, error } = await supabase
      .from('grocery_items')
      .select('*')
      .order('order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (!error) setGroceryItems(data || []);
    setLoading(false);
  };

  const addGroceryItem = async () => {
    if (!newItem.trim() || !userName) return;
    
    // Get the max order value
    const maxOrder = groceryItems.length > 0 
      ? Math.max(...groceryItems.map(item => item.order || 0))
      : 0;
    
    await supabase.from('grocery_items').insert([
      { name: newItem, checked: false, added_by: userName, order: maxOrder + 1 }
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

  const clearCompletedItems = async () => {
    const completedItems = groceryItems.filter(item => item.checked);
    if (completedItems.length === 0) return;
    
    const completedIds = completedItems.map(item => item.id);
    await supabase.from('grocery_items').delete().in('id', completedIds);
  };

  const handleDragStart = (e, item) => {
    // Only allow drag from grip icon
    if (!e.target.closest('.drag-grip')) {
      e.preventDefault();
      return;
    }
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Determine drop position based on mouse position
    const itemElement = e.target.closest('[data-item-id]');
    if (itemElement && draggedItem) {
      const targetId = parseInt(itemElement.getAttribute('data-item-id'));
      const targetItem = groceryItems.find(item => item.id === targetId);
      
      if (targetItem && targetItem.id !== draggedItem.id && targetItem.added_by === draggedItem.added_by) {
        const rect = itemElement.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const position = e.clientY < midpoint ? 'before' : 'after';
        setDropPosition({ itemId: targetItem.id, position });
      } else {
        setDropPosition(null);
      }
    }
  };

  const handleDrop = async (e, targetItem) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetItem.id) {
      setDraggedItem(null);
      setDropPosition(null);
      return;
    }

    // Only allow reordering within the same person's items
    if (draggedItem.added_by !== targetItem.added_by) {
      setDraggedItem(null);
      setDropPosition(null);
      return;
    }

    const items = [...groceryItems];
    const draggedIndex = items.findIndex(item => item.id === draggedItem.id);
    const targetIndex = items.findIndex(item => item.id === targetItem.id);

    // Remove dragged item
    items.splice(draggedIndex, 1);
    
    // Determine insertion point based on drop position
    let insertIndex = items.findIndex(item => item.id === targetItem.id);
    if (dropPosition?.position === 'after') {
      insertIndex += 1;
    }
    
    // Insert at target position
    items.splice(insertIndex, 0, draggedItem);

    // Update order values
    const updates = items.map((item, index) => ({
      id: item.id,
      order: index
    }));

    // Update in database
    for (const update of updates) {
      await supabase
        .from('grocery_items')
        .update({ order: update.order })
        .eq('id', update.id);
    }

    setDraggedItem(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDropPosition(null);
  };

  const handleTouchStart = (e, item) => {
    // This is now handled by the useEffect with passive: false
  };

  const handleTouchMove = (e) => {
    // This is now handled by the useEffect with passive: false
  };

  const handleTouchEnd = async (e) => {
    if (!draggedItem || touchStartY === null) {
      setDraggedItem(null);
      setTouchStartY(null);
      return;
    }

    const touchY = e.changedTouches[0].clientY;
    const element = document.elementFromPoint(e.changedTouches[0].clientX, touchY);
    
    if (element) {
      const itemElement = element.closest('[data-item-id]');
      if (itemElement) {
        const targetId = parseInt(itemElement.getAttribute('data-item-id'));
        const targetItem = groceryItems.find(item => item.id === targetId);
        
        if (targetItem && targetItem.id !== draggedItem.id) {
          // Only allow reordering within the same person's items
          if (draggedItem.added_by !== targetItem.added_by) {
            setDraggedItem(null);
            setTouchStartY(null);
            return;
          }

          const items = [...groceryItems];
          const draggedIndex = items.findIndex(item => item.id === draggedItem.id);
          const targetIndex = items.findIndex(item => item.id === targetItem.id);

          // Remove dragged item and insert at target position
          items.splice(draggedIndex, 1);
          items.splice(targetIndex, 0, draggedItem);

          // Update order values
          const updates = items.map((item, index) => ({
            id: item.id,
            order: index
          }));

          // Update in database
          for (const update of updates) {
            await supabase
              .from('grocery_items')
              .update({ order: update.order })
              .eq('id', update.id);
          }
        }
      }
    }

    setDraggedItem(null);
    setTouchStartY(null);
    setDropPosition(null);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading...</div>;
  }

  const completedCount = groceryItems.filter(item => item.checked).length;

  // Group items by person
  const groupedItems = groceryItems.reduce((acc, item) => {
    const person = item.added_by || 'Unknown';
    if (!acc[person]) {
      acc[person] = [];
    }
    acc[person].push(item);
    return acc;
  }, {});

  // Sort so current user's items come first
  const sortedPeople = Object.keys(groupedItems).sort((a, b) => {
    if (a === userName) return -1;
    if (b === userName) return 1;
    return a.localeCompare(b);
  });

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyUp={handleKeyPress}
            placeholder="Add store item..."
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={addGroceryItem}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 sm:w-auto w-full"
          >
            <Plus size={20} /> Add
          </button>
        </div>
        {completedCount > 0 && (
          <button
            onClick={clearCompletedItems}
            className="text-sm bg-transparent text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors border border-gray-600"
          >
            Clear {completedCount} completed {completedCount === 1 ? 'item' : 'items'}
          </button>
        )}
      </div>

      <div className="space-y-6">
        {groceryItems.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No items yet. Add your first store item!</p>
        ) : (
          sortedPeople.map((person) => (
            <div key={person}>
              <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                {person === userName ? 'Your Items' : `${person}'s Items`}
              </h3>
              <div className="space-y-2">
                {groupedItems[person].map((item) => (
                  <div key={item.id}>
                    {/* Drop indicator before item */}
                    {dropPosition?.itemId === item.id && dropPosition?.position === 'before' && (
                      <div className="h-1 bg-blue-500 rounded-full mb-2 transition-all" />
                    )}
                    
                    <div
                      data-item-id={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, item)}
                      onDragEnd={handleDragEnd}
                      onTouchEnd={handleTouchEnd}
                      className={`flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors ${
                        draggedItem?.id === item.id ? 'opacity-50' : ''
                      }`}
                    >
                      <div 
                        ref={el => gripRefs.current[item.id] = el}
                        className="drag-grip cursor-move"
                        style={{ touchAction: 'none' }}
                      >
                        <GripVertical size={16} className="text-gray-500 flex-shrink-0 pointer-events-none" />
                      </div>
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
                    
                    {/* Drop indicator after item */}
                    {dropPosition?.itemId === item.id && dropPosition?.position === 'after' && (
                      <div className="h-1 bg-blue-500 rounded-full mt-2 transition-all" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

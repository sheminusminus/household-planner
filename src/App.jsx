import React, { useState } from 'react';
import { ShoppingCart, Calendar, Package } from 'lucide-react';
import GroceryList from './components/GroceryList';
import DinnerIdeas from './components/DinnerIdeas';
import SharedItems from './components/SharedItems';

export default function HouseholdPlanner() {
  const [activeTab, setActiveTab] = useState('grocery');

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
            {activeTab === 'grocery' && <GroceryList />}
            {activeTab === 'dinner' && <DinnerIdeas />}
            {activeTab === 'shared' && <SharedItems />}
          </div>
        </div>
      </div>
    </div>
  );
}

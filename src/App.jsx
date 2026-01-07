import React, { useState, useEffect } from 'react';
import { ShoppingCart, Calendar, Package } from 'lucide-react';
import GroceryList from './components/GroceryList';
import DinnerIdeas from './components/DinnerIdeas';
import SharedItems from './components/SharedItems';
import NameModal from './components/NameModal';

export default function HouseholdPlanner() {
  const [activeTab, setActiveTab] = useState('grocery');
  const [userName, setUserName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem('householdPlannerUserName');
    if (storedName) {
      setUserName(storedName);
    } else {
      setShowNameModal(true);
    }
  }, []);

  const handleSaveName = (name) => {
    localStorage.setItem('householdPlannerUserName', name);
    setUserName(name);
    setShowNameModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          🏠 Household Planner
        </h1>

        <div className="bg-gray-800 rounded-lg shadow-2xl mb-6 border border-gray-700">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('grocery')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                activeTab === 'grocery'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
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
                  : 'text-gray-300 hover:bg-gray-700'
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
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Package className="inline-block mr-2" size={20} />
              Shared Items
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'grocery' && <GroceryList userName={userName} />}
            {activeTab === 'dinner' && <DinnerIdeas userName={userName} />}
            {activeTab === 'shared' && <SharedItems userName={userName} />}
          </div>
        </div>
      </div>

      {showNameModal && <NameModal onSave={handleSaveName} />}
    </div>
  );
}

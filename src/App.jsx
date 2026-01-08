import React, { useState, useEffect } from 'react';
import { ShoppingCart, Calendar, Package, Wrench } from 'lucide-react';
import GroceryList from './components/GroceryList';
import DinnerIdeas from './components/DinnerIdeas';
import SharedItems from './components/SharedItems';
import Projects from './components/Projects';
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

  // Handle URL hash for tab routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the '#'
      if (['grocery', 'dinner', 'shared', 'projects'].includes(hash)) {
        setActiveTab(hash);
      } else if (!hash) {
        // Default to grocery if no hash
        window.location.hash = 'grocery';
      }
    };

    // Set initial tab from URL or default to grocery
    handleHashChange();

    // Listen for hash changes (back/forward buttons)
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleSaveName = (name) => {
    localStorage.setItem('householdPlannerUserName', name);
    setUserName(name);
    setShowNameModal(false);
  };

  const changeTab = (tab) => {
    window.location.hash = tab;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          🏠 Household Logistics
        </h1>

        <div className="bg-gray-800 rounded-lg shadow-2xl mb-6 border border-gray-700">
          <div className="flex border-b border-gray-700 overflow-x-auto">
            <button
              onClick={() => changeTab('grocery')}
              className={`flex-1 py-4 px-4 text-center font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'grocery'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <ShoppingCart className="inline-block mr-2" size={20} />
              Store List
            </button>
            <button
              onClick={() => changeTab('dinner')}
              className={`flex-1 py-4 px-4 text-center font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'dinner'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Calendar className="inline-block mr-2" size={20} />
              Dinner Ideas
            </button>
            <button
              onClick={() => changeTab('shared')}
              className={`flex-1 py-4 px-4 text-center font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'shared'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Package className="inline-block mr-2" size={20} />
              Shared Items
            </button>
            <button
              onClick={() => changeTab('projects')}
              className={`flex-1 py-4 px-4 text-center font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'projects'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Wrench className="inline-block mr-2" size={20} />
              Projects
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'grocery' && <GroceryList userName={userName} />}
            {activeTab === 'dinner' && <DinnerIdeas userName={userName} />}
            {activeTab === 'shared' && <SharedItems userName={userName} />}
            {activeTab === 'projects' && <Projects userName={userName} />}
          </div>
        </div>
      </div>

      {showNameModal && <NameModal onSave={handleSaveName} />}
    </div>
  );
}

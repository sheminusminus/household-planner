import React, { useState } from 'react';

export default function NameModal({ onSave }) {
  const [nameInput, setNameInput] = useState('');

  const handleSave = () => {
    if (nameInput.trim()) {
      onSave(nameInput.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Welcome!</h2>
        <p className="text-gray-300 mb-4">What's your name?</p>
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyUp={handleKeyPress}
          placeholder="Enter your name..."
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          autoFocus
        />
        <button
          onClick={handleSave}
          className="w-full bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Music, Users, Check } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

const SectionSelector: React.FC = () => {
  const { user } = useAuth();
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const sections = [
    { id: 'trumpets', name: 'Trumpets', icon: '🎺', description: 'SL: Lucas Langley\nASL: Kaden Raines' },
    { id: 'clarinets', name: 'Clarinets', icon: '🎵', description: '' },
    { id: 'trombones', name: 'Trombones', icon: '🎺', description: '' },
    { id: 'flutes', name: 'Flutes', icon: '🎶', description: '' },
    { id: 'percussion', name: 'Percussion', icon: '🥁', description: '' },
    { id: 'saxophones', name: 'Saxophones', icon: '🎷', description: '' },
    { id: 'euphoniums', name: 'Euphoniums', icon: '🎺', description: '' },
    { id: 'tubas', name: 'Tubas', icon: '🎺', description: '' },
    { id: 'drum majors', name: 'Drum Majors', icon: '🎖️', description: '' },
  ];

  const handleSectionSelect = async () => {
    if (!selectedSection || !user) return;

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        section: selectedSection
      });
      
      // The auth context will automatically update the user state
      // when the document changes, so we don't need to manually refresh
    } catch (error) {
      console.error('Error updating section:', error);
      alert('Error selecting section. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 sm:p-4 bg-amber-500/20 rounded-full">
              <Music className="h-8 w-8 sm:h-12 sm:w-12 text-amber-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 px-4">Welcome to the Band Olympics leaderboard!</h1>
          <p className="text-white/70 text-sm sm:text-base lg:text-lg mb-4 px-4">Choose your instrument section to get started</p>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 sm:p-4 max-w-2xl mx-auto">
            <p className="text-amber-200 text-xs sm:text-sm">
              ⚠️ <strong>Important:</strong> You can only choose your section once. Choose carefully!
            </p>
          </div>
        </div>

        {/* Section Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setSelectedSection(section.id)}
              className={`p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                selectedSection === section.id
                  ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{section.icon}</div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">{section.name}</h3>
                <p className="text-white/60 text-xs sm:text-sm">{section.description}</p>
                {selectedSection === section.id && (
                  <div className="mt-2 sm:mt-3 flex justify-center">
                    <div className="bg-amber-400 rounded-full p-1">
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-amber-900" />
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Confirm Button */}
        <div className="text-center px-4">
          <button
            onClick={handleSectionSelect}
            disabled={!selectedSection || loading}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 disabled:cursor-not-allowed text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg text-sm sm:text-base"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                <span>Joining Section...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>
                  {selectedSection 
                    ? `Join ${sections.find(s => s.id === selectedSection)?.name}` 
                    : 'Select a Section First'
                  }
                </span>
              </div>
            )}
          </button>
          
          {selectedSection && (
            <p className="text-white/60 text-xs sm:text-sm mt-3 sm:mt-4">
              You'll be joining the <strong className="text-white capitalize">{selectedSection}</strong> section
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectionSelector;
import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users, Award } from 'lucide-react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Section } from '../types';

const Dashboard: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      // Get all users to calculate section stats
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      
      const sectionStats: { [key: string]: { total_points: number; member_count: number } } = {};
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        const section = userData.section;
        
        if (section && section !== 'unassigned') {
          if (!sectionStats[section]) {
            sectionStats[section] = { total_points: 0, member_count: 0 };
          }
          sectionStats[section].total_points += userData.points || 0;
          sectionStats[section].member_count += 1;
        }
      });

      // Convert to Section array and sort by total points
      const sectionsArray: Section[] = Object.entries(sectionStats)
        .map(([name, stats]) => ({
          id: name,
          name,
          total_points: stats.total_points,
          member_count: stats.member_count,
          icon: getSectionIcon(name),
        }))
        .sort((a, b) => b.total_points - a.total_points);

      setSections(sectionsArray);
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSectionIcon = (sectionName: string) => {
    const icons: { [key: string]: string } = {
      trumpets: '🎺',
      clarinets: '🎷', 
      trombones: '🎺',
      flutes: '🎵',
      percussion: '🥁',
      saxophones: '🎷',
      euphoniums: '🎺',
      tubas: '🎺',
    };
    return icons[sectionName.toLowerCase()] || '🎵';
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return 'from-yellow-400 to-yellow-600';
      case 1: return 'from-gray-300 to-gray-500';
      case 2: return 'from-yellow-600 to-yellow-800';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  const getRankBorder = (index: number) => {
    switch (index) {
      case 0: return 'border-yellow-400';
      case 1: return 'border-gray-400';
      case 2: return 'border-yellow-600';
      default: return 'border-blue-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Section Leaderboard</h1>
        <p className="text-white/70 text-lg">See how each instrument section is performing</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Total Sections</p>
              <p className="text-2xl font-bold text-white">{sections.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Total Members</p>
              <p className="text-2xl font-bold text-white">
                {sections.reduce((sum, section) => sum + section.member_count, 0)}
              </p>
            </div>
            <Award className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Total Points</p>
              <p className="text-2xl font-bold text-white">
                {sections.reduce((sum, section) => sum + section.total_points, 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-4">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`bg-white/10 backdrop-blur-md rounded-xl p-6 border-2 ${getRankBorder(index)} transform transition-all duration-200 hover:scale-105 hover:bg-white/15`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRankColor(index)} flex items-center justify-center text-white font-bold text-lg`}>
                  #{index + 1}
                </div>
                <div className="text-4xl">{getSectionIcon(section.name)}</div>
                <div>
                  <h3 className="text-xl font-semibold text-white capitalize">{section.name}</h3>
                  <p className="text-white/60">{section.member_count} members</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-6 w-6 text-amber-400" />
                  <span className="text-2xl font-bold text-white">
                    {section.total_points.toLocaleString()}
                  </span>
                </div>
                <p className="text-white/60 text-sm">total points</p>
              </div>
            </div>
            
            {/* Progress bar showing relative performance */}
            <div className="mt-4">
              <div className="bg-white/20 rounded-full h-2">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${getRankColor(index)} transition-all duration-1000`}
                  style={{
                    width: `${Math.max(10, (section.total_points / Math.max(...sections.map(s => s.total_points))) * 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sections.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No sections yet</h3>
          <p className="text-white/60">Sections will appear here once they're created and have members.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
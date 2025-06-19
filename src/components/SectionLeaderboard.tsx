import React, { useState, useEffect } from 'react';
import { Trophy, Star, TrendingUp, Users } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

const SectionLeaderboard: React.FC = () => {
  const { user } = useAuth();
  const [sectionMembers, setSectionMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.section && user.section !== 'unassigned') {
      fetchSectionMembers();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSectionMembers = async () => {
    if (!user?.section) return;

    try {
      setError(null);
      console.log('Fetching members for section:', user.section);
      
      // First, try to get all users and filter by section
      const usersQuery = query(collection(db, 'users'));
      const querySnapshot = await getDocs(usersQuery);
      
      const allUsers: User[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        allUsers.push({
          id: doc.id,
          email: userData.email,
          name: userData.name,
          avatar_url: userData.avatar_url,
          section: userData.section,
          role: userData.role,
          points: userData.points || 0,
          created_at: userData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      });

      console.log('All users:', allUsers);
      
      // Filter by section and sort by points
      const sectionUsers = allUsers
        .filter(u => u.section === user.section)
        .sort((a, b) => b.points - a.points);

      console.log('Section users:', sectionUsers);
      setSectionMembers(sectionUsers);
    } catch (error) {
      console.error('Error fetching section members:', error);
      setError('Failed to load section members. Please try again.');
    } finally {
      setLoading(false);
    }
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

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md mx-auto">
          <h3 className="text-xl font-semibold text-red-400 mb-2">Error</h3>
          <p className="text-red-300">{error}</p>
          <button
            onClick={fetchSectionMembers}
            className="mt-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user?.section || user.section === 'unassigned') {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-white/40 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Section Assigned</h3>
        <p className="text-white/60">You haven't been assigned to a section yet. Contact an admin to get assigned.</p>
      </div>
    );
  }

  const userRank = sectionMembers.findIndex(member => member.id === user.id) + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 capitalize">{user.section} Section</h1>
        <p className="text-white/70 text-lg">Member rankings and performance</p>
      </div>

      {/* Section Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Total Members</p>
              <p className="text-2xl font-bold text-white">{sectionMembers.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Your Rank</p>
              <p className="text-2xl font-bold text-white">
                {userRank > 0 ? `#${userRank}` : 'N/A'}
              </p>
            </div>
            <Trophy className="h-8 w-8 text-amber-400" />
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Your Points</p>
              <p className="text-2xl font-bold text-white">{user.points || 0}</p>
            </div>
            <Star className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Member Leaderboard */}
      {sectionMembers.length > 0 ? (
        <div className="space-y-4">
          {sectionMembers.map((member, index) => (
            <div
              key={member.id}
              className={`bg-white/10 backdrop-blur-md rounded-xl p-6 border-2 ${
                member.id === user.id ? 'border-amber-400 bg-amber-500/10' : getRankBorder(index)
              } transform transition-all duration-200 hover:scale-105 hover:bg-white/15`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRankColor(index)} flex items-center justify-center text-white font-bold text-lg`}>
                    #{index + 1}
                  </div>
                  
                  {member.avatar_url && (
                    <img
                      src={member.avatar_url}
                      alt={member.name}
                      className="h-12 w-12 rounded-full border-2 border-white/20"
                    />
                  )}
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                      <span>{member.name}</span>
                      {member.id === user.id && (
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">You</span>
                      )}
                      {member.role === 'admin' && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Admin</span>
                      )}
                    </h3>
                    <p className="text-white/60 text-sm">{member.email}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-amber-400" />
                    <span className="text-xl font-bold text-white">
                      {member.points.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm">points</p>
                </div>
              </div>
              
              {/* Progress bar showing relative performance */}
              {sectionMembers.length > 1 && (
                <div className="mt-4">
                  <div className="bg-white/20 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${getRankColor(index)} transition-all duration-1000`}
                      style={{
                        width: `${Math.max(5, (member.points / Math.max(...sectionMembers.map(m => m.points), 1)) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No members in your section</h3>
          <p className="text-white/60">Members will appear here once they're assigned to your section.</p>
        </div>
      )}
    </div>
  );
};

export default SectionLeaderboard;
import React, { useState, useEffect } from 'react';
import { Plus, Minus, Users, Search, UserPlus, Settings, Lock, Unlock } from 'lucide-react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

const AdminPanel: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  const sections = [
    'trumpets', 'clarinets', 'trombones', 'flutes', 
    'percussion', 'saxophones', 'euphoniums', 'tubas',
    'drum majors'
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersQuery = query(collection(db, 'users'), orderBy('name'));
      const querySnapshot = await getDocs(usersQuery);
      
      const usersData: User[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        usersData.push({
          id: doc.id,
          email: userData.email,
          name: userData.name,
          avatar_url: userData.avatar_url,
          section: userData.section,
          role: userData.role,
          points: userData.points,
          created_at: userData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      });
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.section.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || pointsToAdd === 0 || !currentUser) return;

    try {
      // Update user points
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        points: selectedUser.points + pointsToAdd
      });

      // Create transaction record
      await addDoc(collection(db, 'point_transactions'), {
        user_id: selectedUser.id,
        admin_id: currentUser.id,
        points: pointsToAdd,
        reason: reason || 'No reason provided',
        created_at: serverTimestamp(),
      });

      // Reset form
      setSelectedUser(null);
      setPointsToAdd(0);
      setReason('');
      
      // Refresh users
      fetchUsers();
      
      alert('Points updated successfully!');
    } catch (error) {
      console.error('Error updating points:', error);
      alert('Error updating points. Please try again.');
    }
  };

  const handleSectionUpdate = async (userId: string, section: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Show confirmation dialog for section changes
    const confirmMessage = user.section === 'unassigned' 
      ? `Assign ${user.name} to ${section}?`
      : `Change ${user.name}'s section from ${user.section} to ${section}? This will affect leaderboard standings.`;
    
    if (!confirm(confirmMessage)) return;

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { section });
      
      fetchUsers();
      alert('Section updated successfully!');
    } catch (error) {
      console.error('Error updating section:', error);
      alert('Error updating section. Please try again.');
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
        <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
        <p className="text-white/70 text-lg">Manage users, sections, and points</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5" />
        <input
          type="text"
          placeholder="Search users by name, email, or section..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
        />
      </div>

      {/* Points Management Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">
              Update Points for {selectedUser.name}
            </h3>
            <form onSubmit={handlePointsSubmit} className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Points to Add/Subtract
                </label>
                <input
                  type="number"
                  value={pointsToAdd}
                  onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Enter points (negative to subtract)"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Reason
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Why are you updating points?"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={pointsToAdd === 0}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Update Points
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {user.avatar_url && (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="h-12 w-12 rounded-full border-2 border-white/20"
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                    <span>{user.name}</span>
                    {user.role === 'admin' && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Admin</span>
                    )}
                  </h3>
                  <p className="text-white/60 text-sm">{user.email}</p>
                  <p className="text-white/60 text-sm">Points: {user.points}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Section Selector */}
                <div className="relative">
                  <select
                    value={user.section}
                    onChange={(e) => handleSectionUpdate(user.id, e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 pr-8"
                  >
                    <option value="unassigned">Unassigned</option>
                    {sections.map(section => (
                      <option key={section} value={section} className="bg-gray-800">
                        {section.charAt(0).toUpperCase() + section.slice(1)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    {user.section === 'unassigned' ? (
                      <Unlock className="h-4 w-4 text-green-400" />
                    ) : (
                      <Lock className="h-4 w-4 text-amber-400" />
                    )}
                  </div>
                </div>
                
                {/* Points Button */}
                <button
                  onClick={() => setSelectedUser(user)}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Manage Points</span>
                </button>
              </div>
            </div>
            
            {/* Section Status */}
            <div className="mt-3 flex items-center space-x-2 text-sm">
              {user.section === 'unassigned' ? (
                <div className="flex items-center space-x-2 text-orange-400">
                  <Unlock className="h-4 w-4" />
                  <span>Awaiting section assignment</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-green-400">
                  <Lock className="h-4 w-4" />
                  <span>Assigned to {user.section} section</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No users found</h3>
          <p className="text-white/60">Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
import React, { useState, useEffect } from 'react';
import { Plus, Minus, Users, Search, UserPlus, Settings, Lock, Unlock, Shield, ShieldCheck, Crown, AlertTriangle, Trash2, RotateCcw } from 'lucide-react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  query, 
  orderBy,
  serverTimestamp,
  writeBatch 
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
  const [clearingPoints, setClearingPoints] = useState(false);

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

  const handleRoleUpdate = async (userId: string, newRole: 'member' | 'admin' | 'head_admin') => {
    const user = users.find(u => u.id === userId);
    if (!user || user.id === currentUser?.id) return;

    // Only Head Admins can modify admin roles
    if (currentUser?.role !== 'head_admin') {
      alert('Only Head Admins can modify admin roles.');
      return;
    }

    // Show confirmation dialog for role changes
    let confirmMessage = '';
    switch (newRole) {
      case 'head_admin':
        confirmMessage = `Grant HEAD ADMIN privileges to ${user.name}? They will have full control over all users and admin roles. This is the highest level of access.`;
        break;
      case 'admin':
        if (user.role === 'head_admin') {
          confirmMessage = `Demote ${user.name} from Head Admin to regular Admin? They will lose the ability to manage admin roles.`;
        } else {
          confirmMessage = `Grant admin privileges to ${user.name}? They will be able to manage users and points, but not admin roles.`;
        }
        break;
      case 'member':
        if (user.role === 'head_admin') {
          confirmMessage = `Remove ALL admin privileges from ${user.name}? They will lose Head Admin status and all administrative access.`;
        } else {
          confirmMessage = `Remove admin privileges from ${user.name}? They will lose access to the admin panel.`;
        }
        break;
    }
    
    if (!confirm(confirmMessage)) return;

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
      
      fetchUsers();
      
      const roleNames = {
        member: 'a regular member',
        admin: 'an admin',
        head_admin: 'a Head Admin'
      };
      
      alert(`${user.name} is now ${roleNames[newRole]}!`);
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Error updating role. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Only Head Admins can delete users
    if (currentUser?.role !== 'head_admin') {
      alert('Only Head Admins can delete user accounts.');
      return;
    }

    // Show strong confirmation dialog
    const confirmMessage = `⚠️ DANGER: Delete ${user.name}'s account permanently?\n\nThis action:\n• Cannot be undone\n• Will remove all their data\n• Will delete their point history\n• Will remove them from all leaderboards\n\nType "${user.name}" to confirm deletion:`;
    
    const confirmation = prompt(confirmMessage);
    if (confirmation !== user.name) {
      if (confirmation !== null) {
        alert('Deletion cancelled - name did not match exactly.');
      }
      return;
    }

    try {
      // Delete user document
      await deleteDoc(doc(db, 'users', userId));
      
      // Note: In a production app, you might also want to delete related data
      // like point transactions, but for now we'll just delete the user
      
      fetchUsers();
      alert(`${user.name}'s account has been permanently deleted.`);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user account. Please try again.');
    }
  };

  const handleClearAllPoints = async () => {
    // Only Head Admins can clear all points
    if (currentUser?.role !== 'head_admin') {
      alert('Only Head Admins can clear all points.');
      return;
    }

    // Show strong confirmation dialog
    const confirmMessage = `⚠️ DANGER: Reset ALL points in the entire system to 0?\n\nThis action:\n• Cannot be undone\n• Will reset every user's points to 0\n• Will affect all leaderboards\n• Will clear all section standings\n\nType "RESET ALL POINTS" to confirm:`;
    
    const confirmation = prompt(confirmMessage);
    if (confirmation !== 'RESET ALL POINTS') {
      if (confirmation !== null) {
        alert('Point reset cancelled - confirmation text did not match exactly.');
      }
      return;
    }

    setClearingPoints(true);
    try {
      // Use batch write to update all users at once
      const batch = writeBatch(db);
      
      users.forEach((user) => {
        const userRef = doc(db, 'users', user.id);
        batch.update(userRef, { points: 0 });
      });

      await batch.commit();
      
      // Create a system transaction record
      await addDoc(collection(db, 'point_transactions'), {
        user_id: 'SYSTEM',
        admin_id: currentUser.id,
        points: 0,
        reason: 'System-wide point reset by Head Admin',
        created_at: serverTimestamp(),
      });
      
      fetchUsers();
      alert('All points have been reset to 0 successfully!');
    } catch (error) {
      console.error('Error clearing all points:', error);
      alert('Error clearing points. Please try again.');
    } finally {
      setClearingPoints(false);
    }
  };

  const canModifyRoles = currentUser?.role === 'head_admin';
  const canDeleteUsers = currentUser?.role === 'head_admin';

  const getRoleBadge = (role: string, isCurrentUser: boolean) => {
    switch (role) {
      case 'head_admin':
        return (
          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full flex items-center space-x-1">
            <Crown className="h-3 w-3" />
            <span>Leadership</span>
          </span>
        );
      case 'admin':
        return (
          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full flex items-center space-x-1">
            <ShieldCheck className="h-3 w-3" />
            <span>Leadership</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getRoleControls = (user: User) => {
    if (!canModifyRoles || user.id === currentUser?.id) {
      return (
        <div className="text-xs text-white/50 text-center">
          {user.id === currentUser?.id ? 'Cannot modify your own role' : 'Head Admin required'}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name={`role-${user.id}`}
              checked={user.role === 'member'}
              onChange={() => handleRoleUpdate(user.id, 'member')}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
              user.role === 'member' 
                ? 'bg-gray-500 border-gray-500' 
                : 'bg-transparent border-white/40 hover:border-white/60'
            }`}>
            </div>
            <span className={`text-xs ${user.role === 'member' ? 'text-gray-400' : 'text-white/70'}`}>
              Member
            </span>
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name={`role-${user.id}`}
              checked={user.role === 'admin'}
              onChange={() => handleRoleUpdate(user.id, 'admin')}
              className="sr-only"
            />
            <div className={`relative w-4 h-4 rounded border-2 transition-all duration-200 ${
              user.role === 'admin' 
                ? 'bg-blue-500 border-blue-500' 
                : 'bg-transparent border-white/40 hover:border-white/60'
            }`}>
              {user.role === 'admin' && (
                <ShieldCheck className="h-2.5 w-2.5 text-white absolute top-0.5 left-0.5" />
              )}
            </div>
            <span className={`text-xs ${user.role === 'admin' ? 'text-blue-400' : 'text-white/70'}`}>
              Admin
            </span>
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name={`role-${user.id}`}
              checked={user.role === 'head_admin'}
              onChange={() => handleRoleUpdate(user.id, 'head_admin')}
              className="sr-only"
            />
            <div className={`relative w-4 h-4 rounded border-2 transition-all duration-200 ${
              user.role === 'head_admin' 
                ? 'bg-amber-500 border-amber-500' 
                : 'bg-transparent border-white/40 hover:border-white/60'
            }`}>
              {user.role === 'head_admin' && (
                <Crown className="h-2.5 w-2.5 text-white absolute top-0.5 left-0.5" />
              )}
            </div>
            <span className={`text-xs ${user.role === 'head_admin' ? 'text-amber-400' : 'text-white/70'}`}>
              Head Admin
            </span>
          </label>
        </div>
      </div>
    );
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
        {!canModifyRoles && (
          <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-2 text-amber-200">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                <strong>Note:</strong> Only Head Admins can modify admin roles
              </span>
            </div>
          </div>
        )}
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
            <div className="flex items-start justify-between">
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
                    {getRoleBadge(user.role, user.id === currentUser?.id)}
                    {user.id === currentUser?.id && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">You</span>
                    )}
                  </h3>
                  <p className="text-white/60 text-sm">{user.email}</p>
                  <p className="text-white/60 text-sm">Points: {user.points}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-6">
                {/* Role Management */}
                <div className="min-w-[120px]">
                  <h4 className="text-sm font-medium text-white/80 mb-2">Role</h4>
                  {getRoleControls(user)}
                </div>

                {/* Section Selector */}
                <div className="relative">
                  <h4 className="text-sm font-medium text-white/80 mb-2">Section</h4>
                  <select
                    value={user.section}
                    onChange={(e) => handleSectionUpdate(user.id, e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 pr-8"
                  >
                    {user.section === 'unassigned' && (
                      <option value="unassigned">Unassigned</option>
                    )}
                    {sections.map(section => (
                      <option key={section} value={section} className="bg-gray-800">
                        {section.charAt(0).toUpperCase() + section.slice(1)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-8 transform -translate-y-1/2 pointer-events-none">
                    {user.section === 'unassigned' ? (
                      <div className="h-4 w-4 text-green-400" />
                    ) : (
                      <div className="h-4 w-4 text-amber-400" />
                    )}
                  </div>
                </div>
                
                {/* Points Button */}
                <div>
                  <h4 className="text-sm font-medium text-white/80 mb-2">Points</h4>
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Manage</span>
                  </button>
                </div>

                {/* Delete User Button (Head Admin Only) */}
                {canDeleteUsers && (
                  <div>
                    <h4 className="text-sm font-medium text-white/80 mb-2">Account</h4>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Section Status */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                {user.section === 'unassigned' ? (
                  <div className="flex items-center space-x-2 text-orange-400">
                    <Unlock className="h-4 w-4" />
                    <span>Awaiting section assignment</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-green-400">
                  </div>
                )}
              </div>
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

      {/* Head Admin System Controls */}
      {currentUser?.role === 'head_admin' && (
        <div className="mt-12 pt-8 border-t border-red-500/20">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <h3 className="text-xl font-semibold text-red-400">System Administration</h3>
            </div>
            <p className="text-red-300 text-sm mb-6">
              ⚠️ <strong>Danger Zone:</strong> These actions affect the entire system and cannot be undone.
            </p>
            
            <div className="flex justify-center">
              <button
                onClick={handleClearAllPoints}
                disabled={clearingPoints}
                className="bg-red-500/20 hover:bg-red-500/30 disabled:bg-red-500/10 text-red-400 disabled:text-red-400/50 px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 font-semibold"
              >
                {clearingPoints ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                    <span>Clearing All Points...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-5 w-5" />
                    <span>Clear All Points</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

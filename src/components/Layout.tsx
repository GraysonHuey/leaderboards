import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Music, Trophy, Users, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Trophy },
    { path: '/dashboard/section', label: 'My Section', icon: Users },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/dashboard/admin', label: 'Admin', icon: Settings });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Navigation Bar */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <Music className="h-8 w-8 text-amber-400" />
                <span className="text-xl font-bold text-white">BandScore</span>
              </Link>
            </div>

            <div className="flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}

              <div className="flex items-center space-x-4 pl-4 border-l border-white/20">
                <div className="flex items-center space-x-3">
                  {user?.avatar_url && (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="h-8 w-8 rounded-full border-2 border-amber-400"
                    />
                  )}
                  <div className="text-white">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-white/60 capitalize">{user?.section}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
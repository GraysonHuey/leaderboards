import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Music, Trophy, Users, Settings, LogOut, Crown, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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

  // Add admin panel for admins and head admins
  if (user?.role === 'admin' || user?.role === 'head_admin') {
    navItems.push({ path: '/dashboard/admin', label: 'Admin', icon: Settings });
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'head_admin': return 'Head Admin';
      case 'admin': return 'Admin';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'head_admin': return 'text-amber-400';
      case 'admin': return 'text-blue-400';
      default: return 'text-white/60';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Navigation Bar */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <link rel="icon" type="image/png" href="/favicon.png" />
                <span className="text-lg sm:text-xl font-bold text-white">WARU Band Olympics</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
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
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">{user?.name}</p>
                      {user?.role === 'head_admin' && (
                        <Crown className="h-4 w-4 text-amber-400" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-white/60 capitalize">{user?.section}</span>
                      <span className="text-white/40">•</span>
                      <span className={getRoleColor(user?.role || '')}>
                        {getRoleDisplay(user?.role || '')}
                      </span>
                    </div>
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

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center space-x-2">
              {user?.avatar_url && (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="h-8 w-8 rounded-full border-2 border-amber-400"
                />
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-white/20 py-4">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
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
                
                <div className="border-t border-white/20 pt-4 mt-4">
                  <div className="px-4 py-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <p className="text-sm font-medium text-white">{user?.name}</p>
                      {user?.role === 'head_admin' && (
                        <Crown className="h-4 w-4 text-amber-400" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs mb-3">
                      <span className="text-white/60 capitalize">{user?.section}</span>
                      <span className="text-white/40">•</span>
                      <span className={getRoleColor(user?.role || '')}>
                        {getRoleDisplay(user?.role || '')}
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm">Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  ShoppingCart, 
  TrendingUp, 
  LogOut, 
  Wheat,
  Menu,
  X,
  Bell,
  Settings,
  User
} from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'from-blue-500 to-blue-600' },
    { name: 'Purchases', href: '/purchases', icon: ShoppingCart, color: 'from-purple-500 to-purple-600' },
    { name: 'Sales', href: '/sales', icon: TrendingUp, color: 'from-green-500 to-green-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/30">
      {/* Mobile header */}
      <div className="lg:hidden bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <Wheat className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent">
              MaizeBiz
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 transition-all duration-200">
              <Bell className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 transition-all duration-200"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white/90 backdrop-blur-xl border-b shadow-xl animate-slideDown">
          <div className="px-4 pt-2 pb-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`${
                    isActive
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-green-50'
                  } group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02]`}
                >
                  <div className={`${isActive ? 'bg-white/20' : 'bg-gradient-to-r ' + item.color} p-2 rounded-lg mr-3`}>
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-white'}`} />
                  </div>
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="w-full text-left group flex items-center px-4 py-3 text-sm font-semibold rounded-xl text-red-600 hover:bg-red-50 transition-all duration-300"
            >
              <div className="bg-red-100 p-2 rounded-lg mr-3">
                <LogOut className="h-4 w-4 text-red-600" />
              </div>
              Sign Out
            </button>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-white/80 backdrop-blur-xl shadow-2xl border-r border-white/20">
            <div className="flex items-center flex-shrink-0 px-6 py-6 border-b border-gray-100">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl">
                <Wheat className="h-7 w-7 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent">
                  MaizeBiz Tracker
                </span>
                <p className="text-xs text-gray-500 font-medium">Premium Edition</p>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-4 py-6 space-y-3">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-xl scale-[1.02]'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50 hover:scale-[1.01]'
                      } group flex items-center px-4 py-4 text-sm font-semibold rounded-2xl transition-all duration-300 transform`}
                    >
                      <div className={`${isActive ? 'bg-white/20' : 'bg-gradient-to-r ' + item.color} p-3 rounded-xl mr-4 shadow-lg`}>
                        <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-white'}`} />
                      </div>
                      <span className="flex-1">{item.name}</span>
                      {isActive && (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      )}
                    </Link>
                  );
                })}
              </nav>
              
              <div className="flex-shrink-0 px-4 py-6 border-t border-gray-100">
                <div className="flex items-center px-4 py-3 text-sm bg-gradient-to-r from-gray-50 to-green-50 rounded-2xl mb-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mr-3 shadow-lg">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <button className="w-full group flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200">
                    <Settings className="mr-3 h-4 w-4" />
                    Settings
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full group flex items-center px-4 py-3 text-sm font-medium rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-72 flex flex-col flex-1">
          <main className="flex-1 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

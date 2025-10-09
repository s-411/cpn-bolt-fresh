import { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-white hover:text-cpn-yellow transition-colors"
      >
        <div className="w-8 h-8 bg-cpn-yellow rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-cpn-dark" />
        </div>
        <span className="hidden md:block">{user.email}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
            <div className="font-medium">{user.email}</div>
            <div className="text-xs text-gray-400 capitalize">{user.subscription_tier} Plan</div>
          </div>
          <div className="py-1">
            {user?.subscription_tier !== 'player' && (
              <button
                onClick={() => {
                  navigate('/upgrade');
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-cpn-yellow hover:bg-gray-700 transition-colors"
              >
                <Crown className="w-4 h-4 mr-3" />
                Upgrade to Player Mode
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
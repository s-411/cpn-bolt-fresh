import { useState, useEffect } from 'react';
import { Plus, TrendingUp, DollarSign, Clock, Target, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
  });
  const [loading, setLoading] = useState(true);
  const [showAddGirl, setShowAddGirl] = useState(false);

  const isPlayerMode = user?.subscription_tier === 'player';

  useEffect(() => {
  });

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          {!isPlayerMode && (
            <button
              onClick={() => navigate('/upgrade')}
              className="flex items-center bg-cpn-yellow text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Player Mode
            </button>
          )}
        </div>
}
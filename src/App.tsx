import { useState, useEffect } from 'react';
import { Users, TrendingUp, Settings, BarChart3, Plus, CreditCard as Edit, Trash2, LogOut, Table, Share2, Globe, Trophy } from 'lucide-react';
import { AuthProvider, useAuth } from './lib/context/AuthContext';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Overview } from './pages/Overview';
import { GirlDetail } from './pages/GirlDetail';
import { Analytics } from './pages/Analytics';
import { DataEntry } from './pages/DataEntry';
import { AddDataPage } from './pages/AddDataPage';
import { Share } from './pages/Share';
import { ShareCenter } from './pages/ShareCenter';
import { DataVault } from './pages/DataVault';
import { Leaderboards } from './pages/Leaderboards';
import { AddGirlModal } from './components/AddGirlModal';
import { AddDataModal } from './components/AddDataModal';
import { EditGirlModal } from './components/EditGirlModal';
import { EditDataModal } from './components/EditDataModal';
import { ShareModal } from './components/ShareModal';
import { supabase } from './lib/supabase/client';
import { Database } from './lib/types/database';
import { calculateCostPerNut, calculateTimePerNut, calculateCostPerHour, formatCurrency, formatRating } from './lib/calculations';
import { exportGirlsData } from './lib/export';

type Girl = Database['public']['Tables']['girls']['Row'];
type DataEntry = Database['public']['Tables']['data_entries']['Row'];

interface GirlWithMetrics extends Girl {
  totalSpent: number;
  totalNuts: number;
  totalTime: number;
  costPerNut: number;
  timePerNut: number;
  costPerHour: number;
  entryCount: number;
}

function AppContent() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');
  const [activeView, setActiveView] = useState<'dashboard' | 'girls' | 'overview' | 'analytics' | 'dataentry' | 'datavault' | 'leaderboards' | 'share' | 'sharecenter' | 'settings'>('dashboard');
  const [showAddGirlModal, setShowAddGirlModal] = useState(false);
  const [showEditGirlModal, setShowEditGirlModal] = useState(false);
  const [showAddDataModal, setShowAddDataModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedGirl, setSelectedGirl] = useState<GirlWithMetrics | null>(null);
  const [viewingGirl, setViewingGirl] = useState<GirlWithMetrics | null>(null);
  const [addingDataForGirl, setAddingDataForGirl] = useState<GirlWithMetrics | null>(null);
  const [girls, setGirls] = useState<GirlWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadGirls();
    }
  }, [user]);

  // Handle URL hash navigation for hidden pages
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash === 'sharing-center' || hash === 'sharecenter') {
        setActiveView('sharecenter');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const loadGirls = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: girlsData, error: girlsError } = await supabase
        .from('girls')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (girlsError) throw girlsError;

      const { data: entriesData, error: entriesError } = await supabase
        .from('data_entries')
        .select('*')
        .in(
          'girl_id',
          girlsData?.map((g) => g.id) || []
        );

      if (entriesError) throw entriesError;

      const girlsWithMetrics = (girlsData || []).map((girl) => {
        const entries = entriesData?.filter((e) => e.girl_id === girl.id) || [];
        const totalSpent = entries.reduce((sum, e) => sum + Number(e.amount_spent), 0);
        const totalNuts = entries.reduce((sum, e) => sum + e.number_of_nuts, 0);
        const totalTime = entries.reduce((sum, e) => sum + e.duration_minutes, 0);

        return {
          ...girl,
          totalSpent,
          totalNuts,
          totalTime,
          costPerNut: calculateCostPerNut(totalSpent, totalNuts),
          timePerNut: calculateTimePerNut(totalTime, totalNuts),
          costPerHour: calculateCostPerHour(totalSpent, totalTime),
          entryCount: entries.length,
        };
      });

      setGirls(girlsWithMetrics);
    } catch (error) {
      console.error('Error loading girls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddData = (girl: GirlWithMetrics) => {
    setAddingDataForGirl(girl);
  };

  const handleEditGirl = (girl: GirlWithMetrics) => {
    setSelectedGirl(girl);
    setShowEditGirlModal(true);
  };

  const handleDeleteGirl = async (girl: GirlWithMetrics) => {
    if (!confirm(`Delete ${girl.name}? This will permanently delete this profile and all ${girl.entryCount} data entries. This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase.from('girls').delete().eq('id', girl.id);
      if (error) throw error;
      await loadGirls();
    } catch (error) {
      console.error('Error deleting girl:', error);
      alert('Failed to delete profile');
    }
  };

  const activeGirls = girls.filter((g) => g.is_active);
  const totalSpent = activeGirls.reduce((sum, g) => sum + g.totalSpent, 0);
  const totalNuts = activeGirls.reduce((sum, g) => sum + g.totalNuts, 0);
  const avgCostPerNut = calculateCostPerNut(totalSpent, totalNuts);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cpn-gray">Loading...</div>
      </div>
    );
  }

  if (!user) {
    if (authView === 'signup') {
      return (
        <SignUp
          onSwitchToSignIn={() => setAuthView('signin')}
          onSuccess={() => setAuthView('signin')}
        />
      );
    }
    return <SignIn onSwitchToSignUp={() => setAuthView('signup')} />;
  }

  const canAddGirl = profile?.subscription_tier === 'free' ? activeGirls.length < 1 : activeGirls.length < 50;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="hidden md:flex md:flex-col md:w-64 p-6" style={{ borderRight: '1px solid rgba(171, 171, 171, 0.2)' }}>
        <div className="mb-8">
          <h1 className="text-2xl text-cpn-yellow">CPN</h1>
          <p className="text-sm text-cpn-gray">Cost Per Nut Calculator</p>
          <div className="mt-2 text-xs text-cpn-gray">
            {profile?.email}
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <div className={`sidebar-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
            <TrendingUp size={20} />
            <span>Dashboard</span>
          </div>
          <div className={`sidebar-item ${activeView === 'girls' ? 'active' : ''}`} onClick={() => setActiveView('girls')}>
            <Users size={20} />
            <span>Girls</span>
          </div>
          <div className={`sidebar-item ${activeView === 'dataentry' ? 'active' : ''}`} onClick={() => setActiveView('dataentry')}>
            <Plus size={20} />
            <span>Quick Data Entry</span>
          </div>
          <div className={`sidebar-item ${activeView === 'overview' ? 'active' : ''}`} onClick={() => setActiveView('overview')}>
            <Table size={20} />
            <span>Overview</span>
          </div>
          <div className={`sidebar-item ${activeView === 'analytics' ? 'active' : ''}`} onClick={() => setActiveView('analytics')}>
            <BarChart3 size={20} />
            <span>Analytics</span>
          </div>
          <div className={`sidebar-item ${activeView === 'datavault' ? 'active' : ''}`} onClick={() => setActiveView('datavault')}>
            <Globe size={20} />
            <span>Data Vault</span>
          </div>
          <div className={`sidebar-item ${activeView === 'leaderboards' ? 'active' : ''}`} onClick={() => setActiveView('leaderboards')}>
            <Trophy size={20} />
            <span>Leaderboards</span>
          </div>
          <div className={`sidebar-item ${activeView === 'share' ? 'active' : ''}`} onClick={() => setActiveView('share')}>
            <Share2 size={20} />
            <span>Share</span>
          </div>
          <div className={`sidebar-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}>
            <Settings size={20} />
            <span>Settings</span>
          </div>
        </nav>

        <button onClick={signOut} className="sidebar-item text-red-400 hover:bg-red-500/10">
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </aside>

      <main className="flex-1 p-6 pb-24 md:pb-6 overflow-y-auto">
        {addingDataForGirl ? (
          <AddDataPage
            girlId={addingDataForGirl.id}
            onBack={() => {
              setAddingDataForGirl(null);
              loadGirls();
            }}
          />
        ) : viewingGirl ? (
          <GirlDetail
            girl={viewingGirl}
            onBack={() => setViewingGirl(null)}
            onRefresh={loadGirls}
          />
        ) : (
          <>
            {activeView === 'dashboard' && (
              <Dashboard
                girls={girls}
                activeGirls={activeGirls}
                totalSpent={totalSpent}
                totalNuts={totalNuts}
                avgCostPerNut={avgCostPerNut}
                onAddGirl={() => setShowAddGirlModal(true)}
                onShare={() => setShowShareModal(true)}
                canAddGirl={canAddGirl}
              />
            )}
            {activeView === 'girls' && (
              <GirlsView
                girls={girls}
                onAddGirl={() => setShowAddGirlModal(true)}
                onAddData={handleAddData}
                onEdit={handleEditGirl}
                onDelete={handleDeleteGirl}
                onViewDetail={setViewingGirl}
                canAddGirl={canAddGirl}
                subscriptionTier={profile?.subscription_tier || 'free'}
              />
            )}
            {activeView === 'overview' && (
              <Overview
                girls={girls}
                onAddData={handleAddData}
                onEdit={handleEditGirl}
                onDelete={handleDeleteGirl}
              />
            )}
            {activeView === 'analytics' && <Analytics girls={girls.map(g => ({ ...g }))} />}
            {activeView === 'dataentry' && user && (
              <DataEntry userId={user.id} onSuccess={loadGirls} />
            )}
            {activeView === 'datavault' && <DataVault />}
            {activeView === 'leaderboards' && <Leaderboards />}
            {activeView === 'share' && <Share />}
            {activeView === 'sharecenter' && <ShareCenter />}
            {activeView === 'settings' && <SettingsView profile={profile} girls={girls} onSignOut={signOut} />}
          </>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-cpn-dark px-2 py-3" style={{ borderTop: '1px solid rgba(171, 171, 171, 0.2)' }}>
        <div className="flex items-center justify-around">
          <div className={`mobile-nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
            <TrendingUp size={20} />
            <span className="text-xs">Home</span>
          </div>
          <div className={`mobile-nav-item ${activeView === 'dataentry' ? 'active' : ''}`} onClick={() => setActiveView('dataentry')}>
            <Plus size={20} />
            <span className="text-xs">Entry</span>
          </div>
          <div
            className="flex items-center justify-center w-14 h-14 -mt-8 bg-cpn-yellow rounded-full cursor-pointer"
            onClick={() => canAddGirl ? setShowAddGirlModal(true) : alert('Upgrade to Premium for unlimited profiles')}
          >
            <Plus size={28} className="text-cpn-dark" />
          </div>
          <div className={`mobile-nav-item ${activeView === 'share' ? 'active' : ''}`} onClick={() => setActiveView('share')}>
            <Share2 size={20} />
            <span className="text-xs">Share</span>
          </div>
          <div className={`mobile-nav-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}>
            <Settings size={20} />
            <span className="text-xs">More</span>
          </div>
        </div>
      </nav>

      {user && (
        <>
          <AddGirlModal
            isOpen={showAddGirlModal}
            onClose={() => setShowAddGirlModal(false)}
            onSuccess={loadGirls}
            userId={user.id}
          />
          {selectedGirl && (
            <>
              <EditGirlModal
                isOpen={showEditGirlModal}
                onClose={() => {
                  setShowEditGirlModal(false);
                  setSelectedGirl(null);
                }}
                onSuccess={loadGirls}
                girl={selectedGirl}
              />
              <AddDataModal
                isOpen={showAddDataModal}
                onClose={() => {
                  setShowAddDataModal(false);
                  setSelectedGirl(null);
                }}
                onSuccess={loadGirls}
                girlId={selectedGirl.id}
                girlName={selectedGirl.name}
              />
            </>
          )}
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            shareData={{
              type: 'overview',
              overviewStats: {
                totalGirls: activeGirls.length,
                totalSpent,
                totalNuts,
                avgCostPerNut,
                bestValueGirl: activeGirls.length > 0 ? activeGirls.sort((a, b) => a.costPerNut - b.costPerNut)[0]?.name : undefined,
              },
            }}
            title="My CPN Stats"
          />
        </>
      )}
    </div>
  );
}

interface DashboardProps {
  girls: GirlWithMetrics[];
  activeGirls: GirlWithMetrics[];
  totalSpent: number;
  totalNuts: number;
  avgCostPerNut: number;
  onAddGirl: () => void;
  onShare: () => void;
  canAddGirl: boolean;
}

function Dashboard({ girls, activeGirls, totalSpent, totalNuts, avgCostPerNut, onAddGirl, onShare, canAddGirl }: DashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl mb-2">Dashboard</h2>
          <p className="text-cpn-gray">Track your relationship efficiency metrics</p>
        </div>
        {girls.length > 0 && (
          <button
            onClick={onShare}
            className="btn-secondary flex items-center gap-2"
          >
            <Share2 size={20} />
            <span className="hidden sm:inline">Share</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-card-label">Active Girls</div>
          <div className="stat-card-value">{activeGirls.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total Spent</div>
          <div className="stat-card-value">{formatCurrency(totalSpent)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total Nuts</div>
          <div className="stat-card-value">{totalNuts}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Avg Cost/Nut</div>
          <div className="stat-card-value">{formatCurrency(avgCostPerNut)}</div>
        </div>
      </div>

      {girls.length === 0 ? (
        <div className="card-cpn">
          <h3 className="text-xl mb-4">Getting Started</h3>
          <div className="space-y-4 text-cpn-gray">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cpn-yellow text-cpn-dark font-bold flex-shrink-0">1</div>
              <div>
                <h4 className="text-white font-bold mb-1">Add Your First Girl</h4>
                <p className="text-sm">Create a profile with name, age, and hotness rating (5.0-10.0 scale)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cpn-yellow text-cpn-dark font-bold flex-shrink-0">2</div>
              <div>
                <h4 className="text-white font-bold mb-1">Track Your Data</h4>
                <p className="text-sm">Log date, amount spent, duration, and number of nuts for each encounter</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cpn-yellow text-cpn-dark font-bold flex-shrink-0">3</div>
              <div>
                <h4 className="text-white font-bold mb-1">Analyze Your Metrics</h4>
                <p className="text-sm">View cost per nut, time efficiency, and comparative analytics</p>
              </div>
            </div>
          </div>
          <button className="btn-cpn mt-6" onClick={onAddGirl} disabled={!canAddGirl}>
            Add Your First Girl
          </button>
        </div>
      ) : (
        <div className="card-cpn">
          <h3 className="text-xl mb-4">Performance Insights</h3>
          <div className="space-y-3">
            {activeGirls.length > 0 && (
              <>
                <div className="flex items-center justify-between p-3 bg-cpn-dark rounded-lg">
                  <span className="text-cpn-gray">Best Value</span>
                  <span className="text-cpn-yellow font-bold">
                    {activeGirls.sort((a, b) => a.costPerNut - b.costPerNut)[0]?.name} - {formatCurrency(activeGirls[0]?.costPerNut || 0)}/nut
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-cpn-dark rounded-lg">
                  <span className="text-cpn-gray">Highest Investment</span>
                  <span className="text-cpn-yellow font-bold">
                    {activeGirls.sort((a, b) => b.totalSpent - a.totalSpent)[0]?.name} - {formatCurrency(activeGirls[0]?.totalSpent || 0)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface GirlsViewProps {
  girls: GirlWithMetrics[];
  onAddGirl: () => void;
  onAddData: (girl: GirlWithMetrics) => void;
  onEdit: (girl: GirlWithMetrics) => void;
  onDelete: (girl: GirlWithMetrics) => void;
  onViewDetail: (girl: GirlWithMetrics) => void;
  canAddGirl: boolean;
  subscriptionTier: string;
}

function GirlsView({ girls, onAddGirl, onAddData, onEdit, onDelete, onViewDetail, canAddGirl, subscriptionTier }: GirlsViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl mb-2">Girls</h2>
          <p className="text-cpn-gray">Manage your profiles and metrics</p>
        </div>
        <button className="btn-cpn" onClick={onAddGirl} disabled={!canAddGirl}>
          Add New Girl
        </button>
      </div>

      {!canAddGirl && subscriptionTier === 'free' && (
        <div className="card-cpn bg-cpn-yellow/10 border-cpn-yellow/50">
          <p className="text-cpn-yellow text-sm">
            Free tier limited to 1 active profile. Upgrade to Premium for unlimited profiles.
          </p>
        </div>
      )}

      {girls.length === 0 ? (
        <div className="card-cpn text-center py-12">
          <Users size={64} className="mx-auto mb-4 text-cpn-gray" />
          <h3 className="text-xl mb-2">No girls yet</h3>
          <p className="text-cpn-gray mb-6">Add your first girl to start tracking metrics</p>
          <button className="btn-cpn" onClick={onAddGirl}>
            Add Your First Girl
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {girls.map((girl) => (
            <div key={girl.id} className="card-cpn">
              <div
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onViewDetail(girl)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{girl.name}</h3>
                    <p className="text-cpn-gray text-sm">{girl.age} years old</p>
                    <p className="text-cpn-yellow text-sm mt-1">{formatRating(girl.rating)}</p>
                  </div>
                  {!girl.is_active && (
                    <span className="px-2 py-1 text-xs bg-cpn-gray/20 text-cpn-gray rounded">Inactive</span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-cpn-gray">Total Spent</span>
                    <span className="font-bold">{formatCurrency(girl.totalSpent)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cpn-gray">Total Nuts</span>
                    <span className="font-bold">{girl.totalNuts}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cpn-gray">Cost/Nut</span>
                    <span className="font-bold text-cpn-yellow">{formatCurrency(girl.costPerNut)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cpn-gray">Entries</span>
                    <span className="font-bold">{girl.entryCount}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className="btn-cpn flex-1 flex items-center justify-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddData(girl);
                  }}
                >
                  <Plus size={16} />
                  Add Data
                </button>
                <button
                  className="btn-secondary px-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(girl);
                  }}
                >
                  <Edit size={16} />
                </button>
                <button
                  className="btn-danger px-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(girl);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsView({ profile, girls, onSignOut }: { profile: any; girls: any[]; onSignOut: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl mb-2">Settings</h2>
        <p className="text-cpn-gray">Manage your preferences and account</p>
      </div>

      <div className="space-y-4">
        <div className="card-cpn">
          <h3 className="text-xl mb-4">Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-cpn-gray mb-2">Email</label>
              <input type="email" className="input-cpn w-full" value={profile?.email || ''} disabled />
            </div>
            <div>
              <label className="block text-sm text-cpn-gray mb-2">Account Created</label>
              <input
                type="text"
                className="input-cpn w-full"
                value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : ''}
                disabled
              />
            </div>
          </div>
        </div>

        <div className="card-cpn">
          <h3 className="text-xl mb-4">Subscription</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg capitalize">{profile?.subscription_tier || 'Free'} Tier</p>
              <p className="text-sm text-cpn-gray">
                {profile?.subscription_tier === 'free' ? 'Limited to 1 active profile' : 'Unlimited profiles'}
              </p>
            </div>
            {profile?.subscription_tier === 'free' && (
              <button className="btn-cpn">Upgrade to Premium</button>
            )}
          </div>
          {profile?.subscription_tier === 'free' && (
            <div className="mt-4 p-4 bg-cpn-dark rounded-lg">
              <p className="text-sm text-cpn-gray">
                Upgrade to Premium for $1.99/week and unlock unlimited profiles, advanced analytics, and priority support.
              </p>
            </div>
          )}
        </div>

        <div className="card-cpn">
          <h3 className="text-xl mb-4">Data Management</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-cpn-gray mb-2">Export all your data to CSV format for backup or analysis</p>
              <button
                className="btn-cpn"
                onClick={() => exportGirlsData(girls)}
                disabled={girls.length === 0}
              >
                Export All Data to CSV
              </button>
            </div>
            <div className="p-3 bg-cpn-dark rounded-lg">
              <p className="text-xs text-cpn-gray">
                Total Profiles: <span className="text-white font-bold">{girls.length}</span>
                {' • '}
                Total Entries: <span className="text-white font-bold">{girls.reduce((sum, g) => sum + g.entryCount, 0)}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="card-cpn">
          <h3 className="text-xl mb-4 text-red-500">Sign Out</h3>
          <button className="btn-danger" onClick={onSignOut}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

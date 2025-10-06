import { useState, useEffect } from 'react';
import { Users, TrendingUp, Settings, BarChart3, Plus, CreditCard as Edit, Trash2, LogOut, Table, Share2, Globe, Trophy } from 'lucide-react';
import { isSubscriptionSuccessPage } from './lib/urlUtils';
import UpgradeModal from './components/UpgradeModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { ResetPassword } from './pages/ResetPassword';
import { PasswordUpdate } from './pages/PasswordUpdate';
import { Dashboard } from './pages/Dashboard';
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
import { ShareModal } from './components/ShareModal';
import PaywallModal from './components/PaywallModal';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import SubscriptionGate from './components/SubscriptionGate';
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
  const { user, profile, loading: authLoading, signOut, showPaywall, setShowPaywall } = useAuth();
  const [authView, setAuthView] = useState<'signin' | 'signup' | 'resetpassword' | 'passwordupdate'>('signin');
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

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/password-update') {
      setAuthView('passwordupdate');
    } else if (path === '/reset-password') {
      setAuthView('resetpassword');
    }
  }, []);

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
    if (isSubscriptionSuccessPage()) {
      return <SubscriptionSuccess />;
    }

    if (authView === 'signup') {
      return (
        <SignUp
          onSwitchToSignIn={() => {
            setAuthView('signin');
            window.history.pushState({}, '', '/');
          }}
          onSuccess={() => {
            setAuthView('signin');
            window.history.pushState({}, '', '/');
          }}
        />
      );
    }

    if (authView === 'resetpassword') {
      return (
        <ResetPassword
          onSwitchToSignIn={() => {
            setAuthView('signin');
            window.history.pushState({}, '', '/');
          }}
        />
      );
    }

    if (authView === 'passwordupdate') {
      return (
        <PasswordUpdate
          onSwitchToSignIn={() => {
            setAuthView('signin');
            window.history.pushState({}, '', '/');
          }}
        />
      );
    }

    return (
      <SignIn
        onSwitchToSignUp={() => {
          setAuthView('signup');
          window.history.pushState({}, '', '/signup');
        }}
        onSwitchToResetPassword={() => {
          setAuthView('resetpassword');
          window.history.pushState({}, '', '/reset-password');
        }}
      />
    );
  }

  if (isSubscriptionSuccessPage()) {
    return <SubscriptionSuccess />;
  }

  const canAddGirl = profile?.subscription_tier === 'boyfriend' ? activeGirls.length < 1 : activeGirls.length < 50;

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
          <div className={`sidebar-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => { setAddingDataForGirl(null); setActiveView('dashboard'); }}>
            <TrendingUp size={20} />
            <span>Dashboard</span>
          </div>
          <div className={`sidebar-item ${activeView === 'girls' ? 'active' : ''}`} onClick={() => { setAddingDataForGirl(null); setActiveView('girls'); }}>
            <Users size={20} />
            <span>Girls</span>
          </div>
          <div className={`sidebar-item ${activeView === 'dataentry' ? 'active' : ''}`} onClick={() => { setAddingDataForGirl(null); setActiveView('dataentry'); }}>
            <Plus size={20} />
            <span>Quick Data Entry</span>
          </div>
          <div className={`sidebar-item ${activeView === 'overview' ? 'active' : ''}`} onClick={() => { setAddingDataForGirl(null); setActiveView('overview'); }}>
            <Table size={20} />
            <span>Overview</span>
          </div>
          <div className={`sidebar-item ${activeView === 'analytics' ? 'active' : ''}`} onClick={() => { setAddingDataForGirl(null); setActiveView('analytics'); }}>
            <BarChart3 size={20} />
            <span>Analytics</span>
          </div>
          <div className={`sidebar-item ${activeView === 'datavault' ? 'active' : ''}`} onClick={() => { setAddingDataForGirl(null); setActiveView('datavault'); }}>
            <Globe size={20} />
            <span>Data Vault</span>
          </div>
          <div className={`sidebar-item ${activeView === 'leaderboards' ? 'active' : ''}`} onClick={() => { setAddingDataForGirl(null); setActiveView('leaderboards'); }}>
            <Trophy size={20} />
            <span>Leaderboards</span>
          </div>
          <div className={`sidebar-item ${activeView === 'share' ? 'active' : ''}`} onClick={() => { setAddingDataForGirl(null); setActiveView('share'); }}>
            <Share2 size={20} />
            <span>Share</span>
          </div>
          <div className={`sidebar-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => { setAddingDataForGirl(null); setActiveView('settings'); }}>
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
                onNavigate={setActiveView}
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
            {activeView === 'analytics' && (
              <SubscriptionGate
                isLocked={profile?.subscription_tier === 'boyfriend'}
                featureName="Analytics"
              >
                <Analytics girls={girls.map(g => ({ ...g }))} />
              </SubscriptionGate>
            )}
            {activeView === 'dataentry' && user && (
              <DataEntry userId={user.id} onSuccess={loadGirls} />
            )}
            {activeView === 'datavault' && (
              <SubscriptionGate
                isLocked={profile?.subscription_tier === 'boyfriend'}
                featureName="Data Vault"
              >
                <DataVault />
              </SubscriptionGate>
            )}
            {activeView === 'leaderboards' && (
              <SubscriptionGate
                isLocked={profile?.subscription_tier === 'boyfriend'}
                featureName="Leaderboards"
              >
                <Leaderboards />
              </SubscriptionGate>
            )}
            {activeView === 'share' && (
              <SubscriptionGate
                isLocked={profile?.subscription_tier === 'boyfriend'}
                featureName="Share"
              >
                <Share />
              </SubscriptionGate>
            )}
            {activeView === 'sharecenter' && <ShareCenter />}
            {activeView === 'settings' && <SettingsView profile={profile} girls={girls} onSignOut={signOut} />}
          </>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-cpn-dark px-2 py-3" style={{ borderTop: '1px solid rgba(171, 171, 171, 0.2)' }}>
        <div className="flex items-center justify-around">
          <div className={`mobile-nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => { setAddingDataForGirl(null); setActiveView('dashboard'); }}>
            <TrendingUp size={20} />
            <span className="text-xs">Home</span>
          </div>
          <div className={`mobile-nav-item ${activeView === 'dataentry' ? 'active' : ''}`} onClick={() => { setAddingDataForGirl(null); setActiveView('dataentry'); }}>
            <Plus size={20} />
            <span className="text-xs">Entry</span>
          </div>
          <div
            className="flex items-center justify-center w-14 h-14 -mt-8 bg-cpn-yellow rounded-full cursor-pointer"
            onClick={() => {
              if (canAddGirl) {
                setShowAddGirlModal(true);
              } else {
                setAddingDataForGirl(null);
                setActiveView('girls');
              }
            }}
          >
            <Plus size={28} className="text-cpn-dark" />
          </div>
          <div className={`mobile-nav-item ${activeView === 'share' ? 'active' : ''}`} onClick={() => { setAddingDataForGirl(null); setActiveView('share'); }}>
            <Share2 size={20} />
            <span className="text-xs">Share</span>
          </div>
          <div className={`mobile-nav-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => { setAddingDataForGirl(null); setActiveView('settings'); }}>
            <Settings size={20} />
            <span className="text-xs">More</span>
          </div>
        </div>
      </nav>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />

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

      {!canAddGirl && subscriptionTier === 'boyfriend' && (
        <div className="card-cpn bg-cpn-yellow/10 border-cpn-yellow/50">
          <p className="text-cpn-yellow text-sm">
            Boyfriend Mode is limited to 1 active profile. Activate Player Mode for unlimited profiles.
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const handleManageSubscription = async () => {
    try {
      setIsLoadingPortal(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please sign in to manage your subscription');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert(error instanceof Error ? error.message : 'Failed to open billing portal');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const getSubscriptionDisplay = () => {
    const tier = profile?.subscription_tier || 'boyfriend';
    if (tier === 'boyfriend') {
      return {
        name: 'Boyfriend Mode',
        description: 'Limited to 1 active profile',
        isFree: true,
      };
    } else if (tier === 'player') {
      return {
        name: 'Player Mode',
        description: 'Unlimited profiles and premium features',
        isFree: false,
      };
    }
    return {
      name: 'Unknown',
      description: 'Contact support',
      isFree: true,
    };
  };

  const subscription = getSubscriptionDisplay();

  return (
    <>
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-lg">{subscription.name}</p>
                <p className="text-sm text-cpn-gray">{subscription.description}</p>
                {!subscription.isFree && profile?.subscription_status && (
                  <p className="text-xs text-cpn-gray mt-1 capitalize">
                    Status: {profile.subscription_status}
                  </p>
                )}
              </div>
              {subscription.isFree ? (
                <button
                  className="btn-cpn"
                  onClick={() => setShowUpgradeModal(true)}
                >
                  Activate Player Mode
                </button>
              ) : (
                <button
                  className="btn-secondary"
                  onClick={handleManageSubscription}
                  disabled={isLoadingPortal}
                >
                  {isLoadingPortal ? 'Loading...' : 'Manage Billing'}
                </button>
              )}
            </div>

            {subscription.isFree && (
              <div className="p-4 bg-cpn-dark rounded-lg">
                <p className="text-sm text-cpn-gray mb-3">
                  Activate Player Mode to unlock:
                </p>
                <ul className="space-y-1 text-sm text-cpn-gray">
                  <li>• Unlimited profiles</li>
                  <li>• Full analytics access</li>
                  <li>• Data vault</li>
                  <li>• Leaderboards</li>
                  <li>• Share features</li>
                </ul>
                <p className="text-xs text-cpn-gray mt-3">
                  Starting at just $1.99/week or $27/year
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

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="all premium features"
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
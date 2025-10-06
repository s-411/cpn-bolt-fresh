import { useState, useMemo } from 'react';
import { BarChart3, Trophy } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../lib/calculations';

interface Girl {
  id: string;
  name: string;
  rating: number;
  totalSpent: number;
  totalNuts: number;
  totalTime: number;
  costPerNut: number;
  entryCount: number;
}

interface AnalyticsProps {
  girls: Girl[];
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

const COLORS = ['#f2f661', '#4ade80', '#60a5fa', '#f87171', '#c084fc', '#fb923c'];

export function Analytics({ girls }: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const spendingData = useMemo(() => {
    return girls
      .filter((g) => g.entryCount > 0)
      .map((girl, index) => ({
        name: girl.name,
        spent: girl.totalSpent,
        nuts: girl.totalNuts,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 6);
  }, [girls]);

  const efficiencyData = useMemo(() => {
    return girls
      .filter((g) => g.entryCount > 0)
      .map((girl) => ({
        name: girl.name,
        costPerNut: girl.costPerNut,
        entries: girl.entryCount,
      }))
      .sort((a, b) => a.costPerNut - b.costPerNut);
  }, [girls]);

  const distributionData = useMemo(() => {
    return girls
      .filter((g) => g.totalSpent > 0)
      .map((girl, index) => ({
        name: girl.name,
        value: girl.totalSpent,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [girls]);

  const roiData = useMemo(() => {
    return girls
      .filter((g) => g.entryCount > 0)
      .map((girl) => ({
        name: girl.name,
        costPerNut: girl.costPerNut,
        nutsPerDollar: girl.totalSpent > 0 ? (girl.totalNuts / girl.totalSpent).toFixed(2) : 0,
        totalNuts: girl.totalNuts,
      }))
      .sort((a, b) => a.costPerNut - b.costPerNut)
      .slice(0, 10);
  }, [girls]);

  if (girls.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl mb-2">Analytics</h2>
          <p className="text-cpn-gray">Visualize your relationship efficiency data</p>
        </div>

        <div className="card-cpn text-center py-12">
          <BarChart3 size={64} className="mx-auto mb-4 text-cpn-gray" />
          <h3 className="text-xl mb-2">No profiles yet</h3>
          <p className="text-cpn-gray">Add your first girl to get started</p>
        </div>
      </div>
    );
  }

  if (girls.every((g) => g.entryCount === 0)) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl mb-2">Analytics</h2>
          <p className="text-cpn-gray">Visualize your relationship efficiency data</p>
        </div>

        <div className="card-cpn text-center py-12">
          <BarChart3 size={64} className="mx-auto mb-4 text-cpn-gray" />
          <h3 className="text-xl mb-2">No data entries yet</h3>
          <p className="text-cpn-gray">
            You have {girls.length} {girls.length === 1 ? 'profile' : 'profiles'}, but no data entries yet.
            <br />
            Add data entries to see analytics and insights.
          </p>
        </div>
      </div>
    );
  }

  const totalSpent = useMemo(() => girls.reduce((sum, g) => sum + g.totalSpent, 0), [girls]);
  const totalNuts = useMemo(() => girls.reduce((sum, g) => sum + g.totalNuts, 0), [girls]);
  const totalTime = useMemo(() => girls.reduce((sum, g) => sum + g.totalTime, 0), [girls]);
  const activeProfiles = useMemo(() => girls.filter((g) => g.entryCount > 0).length, [girls]);
  const avgCostPerNut = useMemo(() => (totalNuts > 0 ? totalSpent / totalNuts : 0), [totalSpent, totalNuts]);
  const avgTimePerNut = useMemo(() => (totalNuts > 0 ? totalTime / totalNuts : 0), [totalTime, totalNuts]);

  const bestCostPerNut = useMemo(() => {
    const girlsWithData = girls.filter((g) => g.entryCount > 0 && g.costPerNut > 0);
    if (girlsWithData.length === 0) return null;
    return girlsWithData.reduce((best, g) => (g.costPerNut < best.costPerNut ? g : best));
  }, [girls]);

  const highestSpender = useMemo(() => {
    const girlsWithData = girls.filter((g) => g.entryCount > 0);
    if (girlsWithData.length === 0) return null;
    return girlsWithData.reduce((highest, g) => (g.totalSpent > highest.totalSpent ? g : highest));
  }, [girls]);

  const mostTimeSpent = useMemo(() => {
    const girlsWithData = girls.filter((g) => g.entryCount > 0);
    if (girlsWithData.length === 0) return null;
    return girlsWithData.reduce((most, g) => (g.totalTime > most.totalTime ? g : most));
  }, [girls]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const roiRankings = useMemo(() => {
    const girlsWithData = girls.filter((g) => g.entryCount > 0 && g.costPerNut > 0);
    if (girlsWithData.length === 0) return [];

    return girlsWithData
      .map((girl) => {
        const nutsPerHour = girl.totalTime > 0 ? (girl.totalNuts / (girl.totalTime / 60)) : 0;
        const efficiencyScore = (
          (girl.rating / 10) * 30 +
          (1 / girl.costPerNut) * 500 +
          nutsPerHour * 10
        );

        return {
          name: girl.name,
          rating: girl.rating,
          costPerNut: girl.costPerNut,
          nutsPerHour,
          efficiencyScore,
        };
      })
      .sort((a, b) => b.efficiencyScore - a.efficiencyScore);
  }, [girls]);

  const getEfficiencyColor = (score: number) => {
    if (score >= 13) return 'text-green-500';
    if (score >= 11) return 'text-cpn-yellow';
    return 'text-orange-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl mb-2">Analytics</h2>
        <p className="text-cpn-gray">Insights and trends across all your data</p>
      </div>

      {/* Top Metrics Grid - 3x2 Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Row 1 - Card 1: Total Spent */}
        <div className="card-cpn bg-cpn-dark border border-cpn-gray/20">
          <p className="text-sm text-cpn-gray mb-2">Total Spent</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(totalSpent)}</p>
        </div>

        {/* Row 1 - Card 2: Total Nuts */}
        <div className="card-cpn bg-cpn-dark border border-cpn-gray/20">
          <p className="text-sm text-cpn-gray mb-2">Total Nuts</p>
          <p className="text-3xl font-bold text-white">{totalNuts}</p>
          <p className="text-xs text-cpn-gray/60 mt-1">of {girls.length} total</p>
        </div>

        {/* Row 1 - Card 3: Active Profiles */}
        <div className="card-cpn bg-cpn-dark border border-cpn-gray/20">
          <p className="text-sm text-cpn-gray mb-2">Active Profiles</p>
          <p className="text-3xl font-bold text-white">{activeProfiles}</p>
        </div>

        {/* Row 2 - Card 4: Average Cost Per Nut */}
        <div className="card-cpn bg-cpn-dark border border-cpn-gray/20">
          <p className="text-sm text-cpn-gray mb-2">Average Cost Per Nut</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(avgCostPerNut)}</p>
        </div>

        {/* Row 2 - Card 5: Total Time */}
        <div className="card-cpn bg-cpn-dark border border-cpn-gray/20">
          <p className="text-sm text-cpn-gray mb-2">Total Time</p>
          <p className="text-3xl font-bold text-white">{formatTime(totalTime)}</p>
        </div>

        {/* Row 2 - Card 6: Average Time Per Nut */}
        <div className="card-cpn bg-cpn-dark border border-cpn-gray/20">
          <p className="text-sm text-cpn-gray mb-2">Average Time Per Nut</p>
          <p className="text-3xl font-bold text-white">{Math.round(avgTimePerNut)} mins</p>
        </div>
      </div>

      {/* Performance Insights Section */}
      <div className="card-cpn">
        <h3 className="text-lg mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Best Cost/Nut - Gold Trophy */}
          <div className="card-cpn bg-cpn-dark border border-cpn-gray/20 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
            <p className="text-sm text-cpn-gray mb-2">Best Cost/Nut</p>
            {bestCostPerNut ? (
              <>
                <p className="text-xl font-bold text-cpn-yellow mb-1">{bestCostPerNut.name}</p>
                <p className="text-lg text-white">{formatCurrency(bestCostPerNut.costPerNut)}</p>
              </>
            ) : (
              <p className="text-sm text-cpn-gray">No data</p>
            )}
          </div>

          {/* Highest Spender - Silver Trophy */}
          <div className="card-cpn bg-cpn-dark border border-cpn-gray/20 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-cpn-gray mb-2">Highest Spender</p>
            {highestSpender ? (
              <>
                <p className="text-xl font-bold text-cpn-yellow mb-1">{highestSpender.name}</p>
                <p className="text-lg text-white">{formatCurrency(highestSpender.totalSpent)}</p>
              </>
            ) : (
              <p className="text-sm text-cpn-gray">No data</p>
            )}
          </div>

          {/* Most Time Spent - Bronze Trophy */}
          <div className="card-cpn bg-cpn-dark border border-cpn-gray/20 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-orange-600" />
            <p className="text-sm text-cpn-gray mb-2">Most Time Spent</p>
            {mostTimeSpent ? (
              <>
                <p className="text-xl font-bold text-cpn-yellow mb-1">{mostTimeSpent.name}</p>
                <p className="text-lg text-white">{formatTime(mostTimeSpent.totalTime)}</p>
              </>
            ) : (
              <p className="text-sm text-cpn-gray">No data</p>
            )}
          </div>
        </div>
      </div>

      {/* ROI Performance Ranking */}
      {roiRankings.length > 0 && (
        <div className="card-cpn">
          <h3 className="text-lg mb-4">ROI Performance Ranking</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cpn-gray/20">
                  <th className="text-left py-3 px-4 text-sm font-medium text-cpn-gray">Rank</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cpn-gray">Name</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-cpn-gray">Rating</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-cpn-gray">Cost/Nut</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-cpn-gray">Nuts/Hour</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-cpn-gray">Efficiency Score</th>
                </tr>
              </thead>
              <tbody>
                {roiRankings.map((girl, index) => (
                  <tr
                    key={girl.name}
                    className={index % 2 === 0 ? 'bg-cpn-dark/50' : 'bg-transparent'}
                  >
                    <td className="py-3 px-4 text-white font-bold">{index + 1}</td>
                    <td className="py-3 px-4 text-white font-medium">{girl.name}</td>
                    <td className="py-3 px-4 text-center text-white">{girl.rating}/10</td>
                    <td className="py-3 px-4 text-right text-white">{formatCurrency(girl.costPerNut)}</td>
                    <td className="py-3 px-4 text-right text-white">{girl.nutsPerHour.toFixed(2)}</td>
                    <td className={`py-3 px-4 text-right font-bold ${getEfficiencyColor(girl.efficiencyScore)}`}>
                      {girl.efficiencyScore.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
          <button
            key={range}
            className={timeRange === range ? 'btn-cpn' : 'btn-secondary'}
            onClick={() => setTimeRange(range)}
          >
            {range === 'all' ? 'All Time' : range}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Girl */}
        <div className="card-cpn">
          <h3 className="text-lg mb-4">Total Spending by Girl</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spendingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" stroke="#ababab" />
              <YAxis stroke="#ababab" />
              <Tooltip
                contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #ababab' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="spent" fill="#f2f661" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Efficiency */}
        <div className="card-cpn">
          <h3 className="text-lg mb-4">Cost Efficiency (Lower is Better)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={efficiencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" stroke="#ababab" />
              <YAxis stroke="#ababab" />
              <Tooltip
                contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #ababab' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Line type="monotone" dataKey="costPerNut" stroke="#f2f661" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Spending Distribution */}
        <div className="card-cpn">
          <h3 className="text-lg mb-4">Spending Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #ababab' }}
                formatter={(value: number) => formatCurrency(value)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Nuts Distribution */}
        <div className="card-cpn">
          <h3 className="text-lg mb-4">Total Nuts by Girl</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spendingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" stroke="#ababab" />
              <YAxis stroke="#ababab" />
              <Tooltip
                contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #ababab' }}
              />
              <Bar dataKey="nuts" fill="#4ade80" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROI Rankings Table */}
      <div className="card-cpn">
        <h3 className="text-lg mb-4">ROI Rankings (Best Value First)</h3>
        <div className="overflow-x-auto">
          <table className="table-cpn">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th className="text-right">Cost/Nut</th>
                <th className="text-right">Nuts/$</th>
                <th className="text-right">Total Nuts</th>
              </tr>
            </thead>
            <tbody>
              {roiData.map((girl, index) => (
                <tr key={girl.name}>
                  <td>
                    <span className="font-bold text-cpn-yellow">#{index + 1}</span>
                  </td>
                  <td className="font-bold">{girl.name}</td>
                  <td className="text-right font-bold text-cpn-yellow">
                    {formatCurrency(girl.costPerNut)}
                  </td>
                  <td className="text-right">{girl.nutsPerDollar}</td>
                  <td className="text-right">{girl.totalNuts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-cpn bg-cpn-dark">
          <p className="text-sm text-cpn-gray mb-1">Total Girls Tracked</p>
          <p className="text-3xl font-bold text-cpn-yellow">{girls.length}</p>
        </div>
        <div className="card-cpn bg-cpn-dark">
          <p className="text-sm text-cpn-gray mb-1">Girls with Data</p>
          <p className="text-3xl font-bold text-cpn-yellow">
            {girls.filter((g) => g.entryCount > 0).length}
          </p>
        </div>
        <div className="card-cpn bg-cpn-dark">
          <p className="text-sm text-cpn-gray mb-1">Total Entries</p>
          <p className="text-3xl font-bold text-cpn-yellow">
            {girls.reduce((sum, g) => sum + g.entryCount, 0)}
          </p>
        </div>
      </div>
    </div>
  );
}

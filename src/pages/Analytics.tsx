import { useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../lib/calculations';

interface Girl {
  id: string;
  name: string;
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

  if (girls.length === 0 || girls.every((g) => g.entryCount === 0)) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl mb-2">Analytics</h2>
          <p className="text-cpn-gray">Visualize your relationship efficiency data</p>
        </div>

        <div className="card-cpn text-center py-12">
          <BarChart3 size={64} className="mx-auto mb-4 text-cpn-gray" />
          <h3 className="text-xl mb-2">No data yet</h3>
          <p className="text-cpn-gray">Add girls and data entries to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl mb-2">Analytics</h2>
        <p className="text-cpn-gray">Visualize your relationship efficiency data</p>
      </div>

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

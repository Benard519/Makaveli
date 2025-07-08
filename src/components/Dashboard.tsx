import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShoppingCart, 
  TrendingUp, 
  DollarSign, 
  Package,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Target,
  TrendingDown
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface DashboardStats {
  totalPurchases: number;
  totalSales: number;
  profit: number;
  stockRemaining: number;
  todayPurchases: number;
  todaySales: number;
  weeklyPurchases: number;
  weeklySales: number;
  monthlyPurchases: number;
  monthlySales: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('7days');

  useEffect(() => {
    fetchDashboardData();
  }, [user, timeRange]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch purchases
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id);

      if (purchasesError) throw purchasesError;

      // Fetch sales
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id);

      if (salesError) throw salesError;

      // Calculate stats
      const now = new Date();
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const weekStart = startOfDay(subDays(now, 7));
      const monthStart = startOfDay(subDays(now, 30));

      const totalPurchases = purchases?.reduce((sum, p) => sum + p.total_amount_paid, 0) || 0;
      const totalSales = sales?.reduce((sum, s) => sum + s.total_amount_received, 0) || 0;
      const totalBought = purchases?.reduce((sum, p) => sum + p.quantity_bought, 0) || 0;
      const totalSold = sales?.reduce((sum, s) => sum + s.quantity_sold, 0) || 0;

      const todayPurchases = purchases?.filter(p => {
        const date = new Date(p.date_of_purchase);
        return date >= todayStart && date <= todayEnd;
      }).reduce((sum, p) => sum + p.total_amount_paid, 0) || 0;

      const todaySales = sales?.filter(s => {
        const date = new Date(s.date_of_sale);
        return date >= todayStart && date <= todayEnd;
      }).reduce((sum, s) => sum + s.total_amount_received, 0) || 0;

      const weeklyPurchases = purchases?.filter(p => {
        const date = new Date(p.date_of_purchase);
        return date >= weekStart;
      }).reduce((sum, p) => sum + p.total_amount_paid, 0) || 0;

      const weeklySales = sales?.filter(s => {
        const date = new Date(s.date_of_sale);
        return date >= weekStart;
      }).reduce((sum, s) => sum + s.total_amount_received, 0) || 0;

      const monthlyPurchases = purchases?.filter(p => {
        const date = new Date(p.date_of_purchase);
        return date >= monthStart;
      }).reduce((sum, p) => sum + p.total_amount_paid, 0) || 0;

      const monthlySales = sales?.filter(s => {
        const date = new Date(s.date_of_sale);
        return date >= monthStart;
      }).reduce((sum, s) => sum + s.total_amount_received, 0) || 0;

      setStats({
        totalPurchases,
        totalSales,
        profit: totalSales - totalPurchases,
        stockRemaining: totalBought - totalSold,
        todayPurchases,
        todaySales,
        weeklyPurchases,
        weeklySales,
        monthlyPurchases,
        monthlySales,
      });

      // Prepare chart data
      const daysToShow = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
      const chartDays = Array.from({ length: daysToShow }, (_, i) => {
        const date = subDays(now, daysToShow - 1 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        const dayPurchases = purchases?.filter(p => p.date_of_purchase === dateStr)
          .reduce((sum, p) => sum + p.total_amount_paid, 0) || 0;
        
        const daySales = sales?.filter(s => s.date_of_sale === dateStr)
          .reduce((sum, s) => sum + s.total_amount_received, 0) || 0;

        return {
          date: format(date, 'MMM dd'),
          purchases: dayPurchases,
          sales: daySales,
          profit: daySales - dayPurchases,
        };
      });

      setChartData(chartDays);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-green-600 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg">No data available yet</p>
        <p className="text-gray-400 text-sm">Start by adding your first purchase or sale</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Purchases',
      value: `KES ${stats.totalPurchases.toLocaleString()}`,
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      change: `+${stats.weeklyPurchases.toLocaleString()}`,
      changeLabel: 'this week',
      trend: 'up'
    },
    {
      title: 'Total Sales',
      value: `KES ${stats.totalSales.toLocaleString()}`,
      icon: TrendingUp,
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
      change: `+${stats.weeklySales.toLocaleString()}`,
      changeLabel: 'this week',
      trend: 'up'
    },
    {
      title: 'Profit/Loss',
      value: `KES ${stats.profit.toLocaleString()}`,
      icon: stats.profit >= 0 ? Target : TrendingDown,
      gradient: stats.profit >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600',
      bgGradient: stats.profit >= 0 ? 'from-emerald-50 to-emerald-100' : 'from-red-50 to-red-100',
      change: `${stats.profit >= 0 ? '+' : ''}${((stats.weeklySales - stats.weeklyPurchases)).toLocaleString()}`,
      changeLabel: 'this week',
      trend: stats.profit >= 0 ? 'up' : 'down'
    },
    {
      title: 'Stock Remaining',
      value: `${stats.stockRemaining.toLocaleString()} kg`,
      icon: Package,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      change: stats.stockRemaining > 0 ? 'In Stock' : 'Out of Stock',
      changeLabel: 'current status',
      trend: stats.stockRemaining > 0 ? 'up' : 'down'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your business.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="block w-full pl-4 pr-10 py-3 text-base border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-300"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.title} 
              className={`bg-gradient-to-br ${card.bgGradient} rounded-3xl shadow-xl border border-white/20 p-4 lg:p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl min-w-0`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className={`bg-gradient-to-r ${card.gradient} p-4 rounded-2xl shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className={`p-2 rounded-xl ${card.trend === 'up' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {card.trend === 'up' ? (
                    <ArrowUpRight className={`h-4 w-4 ${card.trend === 'up' ? 'text-green-600' : 'text-red-600'}`} />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs lg:text-sm font-semibold text-gray-600 mb-1 truncate">{card.title}</p>
                <p className="text-lg lg:text-xl font-bold text-gray-900 mb-2 lg:mb-3 break-words" title={card.value}>{card.value}</p>
                <div className="flex items-center text-xs lg:text-sm min-w-0">
                  <span className={`font-semibold ${card.trend === 'up' ? 'text-green-600' : 'text-red-600'} truncate flex-shrink-0`}>
                    {card.change}
                  </span>
                  <span className="text-gray-500 ml-1 lg:ml-2 truncate">{card.changeLabel}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Today's Summary & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Today's Activity</h3>
            <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-2xl">
              <div className="flex items-center">
                <div className="p-2 bg-red-500 rounded-xl mr-3">
                  <ArrowDownRight className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-gray-700">Purchases</span>
              </div>
              <span className="text-lg font-bold text-gray-900 truncate">
                KES {stats.todayPurchases.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl">
              <div className="flex items-center">
                <div className="p-2 bg-green-500 rounded-xl mr-3">
                  <ArrowUpRight className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-gray-700">Sales</span>
              </div>
              <span className="text-lg font-bold text-gray-900 truncate">
                KES {stats.todaySales.toLocaleString()}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl">
                <span className="font-bold text-gray-900">Net Today</span>
                <span className={`text-lg font-bold truncate ${
                  (stats.todaySales - stats.todayPurchases) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  KES {(stats.todaySales - stats.todayPurchases).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
            <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button className="group flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-300">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-bold text-blue-900">Add Purchase</span>
            </button>
            <button className="group flex flex-col items-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl hover:from-green-100 hover:to-green-200 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
              <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-bold text-green-900">Add Sale</span>
            </button>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Sales vs Purchases Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="purchasesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                formatter={(value) => [`KES ${value.toLocaleString()}`, '']} 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area type="monotone" dataKey="purchases" stroke="#3B82F6" strokeWidth={3} fill="url(#purchasesGradient)" />
              <Area type="monotone" dataKey="sales" stroke="#10B981" strokeWidth={3} fill="url(#salesGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Daily Profit/Loss</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                formatter={(value) => [`KES ${value.toLocaleString()}`, 'Profit/Loss']} 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="profit" fill="url(#profitGradient)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
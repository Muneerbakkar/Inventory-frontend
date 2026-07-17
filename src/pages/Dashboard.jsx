import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Package, 
  TrendingUp, 
  ShoppingBag, 
  CreditCard, 
  DollarSign, 
  Users, 
  Truck, 
  AlertTriangle, 
  FileText, 
  RefreshCw,
  ArrowUpRight,
  Calendar
} from 'lucide-react';
import ReactApexChart from 'react-apexcharts';
import { VerticalStackedBarChart } from '../components/ui/Charts';
import { logout } from '../features/auth/authSlice';

export const Dashboard = () => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [aggregates, setAggregates] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Date Filter States
  const [filterType, setFilterType] = useState('this-month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Refs for programmatic calendar trigger
  const startRef = useRef(null);
  const endRef = useRef(null);

  const formatDateString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getDateParams = (type, start, end) => {
    const params = new URLSearchParams();
    const today = new Date();

    if (type === 'this-month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      params.append('startDate', formatDateString(firstDay));
      params.append('endDate', formatDateString(today));
    } else if (type === 'last-30-days') {
      const startDay = new Date();
      startDay.setDate(today.getDate() - 29);
      params.append('startDate', formatDateString(startDay));
      params.append('endDate', formatDateString(today));
    } else if (type === 'this-year') {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      params.append('startDate', formatDateString(firstDay));
      params.append('endDate', formatDateString(today));
    } else if (type === 'all-time') {
      params.append('allTime', 'true');
    } else if (type === 'custom') {
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);
    }
    return params.toString();
  };

  const fetchAggregates = async (isRefresh = false, type = filterType, start = startDate, end = endDate) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const queryStr = getDateParams(type, start, end);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/dashboard/aggregates?${queryStr}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include'
      });
      if (res.status === 401) {
        dispatch(logout());
        return;
      }
      const data = await res.json();
      if (data.status === 'success') {
        setAggregates(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFilterChange = (e) => {
    const val = e.target.value;
    setFilterType(val);
    if (val !== 'custom') {
      setStartDate('');
      setEndDate('');
    } else {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDateString(firstDay));
      setEndDate(formatDateString(today));
    }
  };

  useEffect(() => {
    if (filterType === 'custom' && (!startDate || !endDate)) {
      return;
    }
    fetchAggregates(false, filterType, startDate, endDate);
  }, [filterType, startDate, endDate]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-10 w-48 bg-muted rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-card border rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-80 bg-card border rounded-xl" />
          <div className="h-80 bg-card border rounded-xl" />
        </div>
      </div>
    );
  }

  const formatCurrency = (val) => {
    return `₹${(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatActivityText = (act) => {
    const userName = act.user?.name || 'System';
    const userRole = act.user?.role ? `(${act.user.role})` : '';
    const action = act.action.toLowerCase();
    const module = act.module;
    const id = act.readableId || act.documentId || '';

    return (
      <span>
        <span className="font-bold text-foreground">{userName}</span>{' '}
        <span className="text-muted-foreground">{userRole} {action}d a {module}</span>{' '}
        <span className="font-mono font-semibold text-primary">{id}</span>
      </span>
    );
  };

  // Helper card class mappings for beautiful subtle colors
  const cardThemes = {
    stock: { border: 'hover:border-emerald-500/50', iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' },
    sales: { border: 'hover:border-blue-500/50', iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400' },
    purchases: { border: 'hover:border-indigo-500/50', iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400' },
    outstanding: { border: 'hover:border-amber-500/50', iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' },
    commission: { border: 'hover:border-purple-500/50', iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400' },
    products: { border: 'hover:border-slate-500/50', iconBg: 'bg-slate-50 text-slate-600 dark:bg-slate-950/30 dark:text-slate-400' },
    customers: { border: 'hover:border-sky-500/50', iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400' },
    suppliers: { border: 'hover:border-orange-500/50', iconBg: 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400' },
    lowStock: { border: 'hover:border-red-500/50', iconBg: 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400' },
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header section with Date Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-sans">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time summaries, trends, and transaction history.</p>
        </div>
        
        {/* Controls Container */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Range Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Range:</span>
            <select
              value={filterType}
              onChange={handleFilterChange}
              className="px-3 py-1.5 border rounded-lg bg-card text-xs font-semibold shadow-xs focus:ring-2 focus:ring-primary outline-hidden cursor-pointer"
            >
              <option value="this-month">This Month</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="this-year">This Year</option>
              <option value="all-time">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Pickers */}
          {filterType === 'custom' && (
            <div className="flex items-center gap-2 animate-fadeIn">
              {/* Start Date Input Wrapper */}
              <div className="relative flex items-center">
                <input
                  type="date"
                  ref={startRef}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  onClick={() => startRef.current?.showPicker()}
                  className="pl-8 pr-2.5 py-1.5 border rounded-lg bg-card text-xs font-semibold shadow-xs focus:ring-2 focus:ring-primary outline-hidden cursor-pointer"
                />
                <Calendar 
                  className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => startRef.current?.showPicker()}
                />
              </div>

              <span className="text-xs text-muted-foreground font-semibold">to</span>

              {/* End Date Input Wrapper */}
              <div className="relative flex items-center">
                <input
                  type="date"
                  ref={endRef}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  onClick={() => endRef.current?.showPicker()}
                  className="pl-8 pr-2.5 py-1.5 border rounded-lg bg-card text-xs font-semibold shadow-xs focus:ring-2 focus:ring-primary outline-hidden cursor-pointer"
                />
                <Calendar 
                  className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => endRef.current?.showPicker()}
                />
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => fetchAggregates(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 px-3.5 py-1.5 border rounded-lg bg-card hover:bg-accent text-xs font-semibold transition-all duration-200 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Total Stock Value */}
        {aggregates.stockValue !== undefined && (
          <div className={`rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-250 hover:shadow-md ${cardThemes.stock.border}`}>
            <div className="p-5 flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Stock Value</span>
              <div className={`p-2 rounded-lg ${cardThemes.stock.iconBg}`}>
                <Package className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="p-5 pt-0">
              <div className="text-2xl font-black">{formatCurrency(aggregates.stockValue)}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Based on purchase prices</p>
            </div>
          </div>
        )}

        {/* Sales This Month */}
        <Link to="/sales" className={`rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-250 hover:shadow-md block ${cardThemes.sales.border}`}>
          <div className="p-5 flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sales This Month</span>
            <div className={`p-2 rounded-lg ${cardThemes.sales.iconBg}`}>
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="p-5 pt-0">
            <div className="text-2xl font-black">{formatCurrency(aggregates.salesThisMonth)}</div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 group">
              View sales ledger <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </p>
          </div>
        </Link>

        {/* Purchases This Month */}
        {aggregates.purchasesThisMonth !== undefined && (
          <Link to="/purchases" className={`rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-250 hover:shadow-md block ${cardThemes.purchases.border}`}>
            <div className="p-5 flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Purchases This Month</span>
              <div className={`p-2 rounded-lg ${cardThemes.purchases.iconBg}`}>
                <ShoppingBag className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="p-5 pt-0">
              <div className="text-2xl font-black">{formatCurrency(aggregates.purchasesThisMonth)}</div>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 group">
                View purchase bills <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </p>
          </div>
          </Link>
        )}

        {/* Outstanding Balances */}
        <Link to="/sales" className={`rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-250 hover:shadow-md block ${cardThemes.outstanding.border}`}>
          <div className="p-5 flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Outstanding</span>
            <div className={`p-2 rounded-lg ${cardThemes.outstanding.iconBg}`}>
              <CreditCard className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="p-5 pt-0">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{formatCurrency(aggregates.outstandingBalances)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Pending customer collections</p>
          </div>
        </Link>

        {/* Total Commissions */}
        {user?.role !== 'SalesStaff' && (
          <Link to="/referrals" className={`rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-250 hover:shadow-md block ${cardThemes.commission.border}`}>
            <div className="p-5 flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Commissions</span>
              <div className={`p-2 rounded-lg ${cardThemes.commission.iconBg}`}>
                <DollarSign className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="p-5 pt-0">
              <div className="text-2xl font-black">{formatCurrency(aggregates.unpaidCommissions)}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Total referral commissions</p>
            </div>
          </Link>
        )}

        {/* Active Products count */}
        <Link to="/products" className={`rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-250 hover:shadow-md block ${cardThemes.products.border}`}>
          <div className="p-5 flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Products</span>
            <div className={`p-2 rounded-lg ${cardThemes.products.iconBg}`}>
              <FileText className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="p-5 pt-0">
            <div className="text-2xl font-black">{aggregates.totalProducts || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Active items in inventory</p>
          </div>
        </Link>

        {/* Customers Count */}
        <Link to="/customers" className={`rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-250 hover:shadow-md block ${cardThemes.customers.border}`}>
          <div className="p-5 flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customers</span>
            <div className={`p-2 rounded-lg ${cardThemes.customers.iconBg}`}>
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="p-5 pt-0">
            <div className="text-2xl font-black">{aggregates.totalCustomers || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Registered active customers</p>
          </div>
        </Link>

        {/* Suppliers Count */}
        {aggregates.totalSuppliers !== undefined && (
          <Link to="/suppliers" className={`rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-250 hover:shadow-md block ${cardThemes.suppliers.border}`}>
            <div className="p-5 flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Suppliers</span>
              <div className={`p-2 rounded-lg ${cardThemes.suppliers.iconBg}`}>
                <Truck className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="p-5 pt-0">
              <div className="text-2xl font-black">{aggregates.totalSuppliers || 0}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Partnered distribution suppliers</p>
            </div>
          </Link>
        )}

      </div>

      {/* Primary Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Transaction Trends — ApexCharts Area */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-6 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Transaction Trends</h3>
              <p className="text-xs text-muted-foreground">Monthly analytics comparing sales and purchases.</p>
            </div>
          </div>
          <div className="w-full flex-1">
            {aggregates.trendData && aggregates.trendData.length > 0 ? (
              <ReactApexChart
                type="area"
                height={280}
                series={[
                  { name: 'Sales', data: aggregates.trendData.map(d => d.sales || 0) },
                  ...(aggregates.purchasesThisMonth !== undefined
                    ? [{ name: 'Purchases', data: aggregates.trendData.map(d => d.purchases || 0) }]
                    : [])
                ]}
                options={{
                  chart: { toolbar: { show: false }, zoom: { enabled: false }, background: 'transparent' },
                  colors: ['#10b981', '#6366f1'],
                  fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.0, shadeIntensity: 1 } },
                  stroke: { curve: 'smooth', width: 2.5 },
                  dataLabels: { enabled: false },
                  xaxis: {
                    categories: aggregates.trendData.map(d => d.monthName),
                    axisBorder: { show: false },
                    axisTicks: { show: false },
                    labels: { style: { colors: '#6b7280', fontSize: '11px', fontWeight: 500 } }
                  },
                  yaxis: {
                    labels: {
                      style: { colors: '#6b7280', fontSize: '10px' },
                      formatter: v => v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`
                    }
                  },
                  grid: { borderColor: 'rgba(128,128,128,0.12)', strokeDashArray: 4 },
                  legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px', fontWeight: 600, markers: { size: 6, shape: 'circle' } },
                  tooltip: {
                    shared: true,
                    y: { formatter: v => `₹${(v || 0).toLocaleString('en-IN')}` }
                  },
                  theme: { mode: document.documentElement.classList.contains('dark') ? 'dark' : 'light' }
                }}
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground text-sm border border-dashed rounded-xl">No trend data available</div>
            )}
          </div>
        </div>

        {/* Sales by Payment Mode — ApexCharts Donut */}
        <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col">
          <div>
            <h3 className="text-lg font-bold text-foreground">Sales by Payment Mode</h3>
            <p className="text-xs text-muted-foreground mb-2">Breakdown of collections method.</p>
          </div>
          {aggregates.salesByPaymentMode && aggregates.salesByPaymentMode.length > 0 ? (
            <ReactApexChart
              type="donut"
              height={280}
              series={aggregates.salesByPaymentMode.map(d => d.value)}
              options={{
                chart: { background: 'transparent', toolbar: { show: false } },
                labels: aggregates.salesByPaymentMode.map(d => d.name),
                colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'],
                dataLabels: { enabled: false },
                plotOptions: { pie: { donut: { size: '65%', labels: { show: true, value: { formatter: (val) => `₹${Number(val).toLocaleString('en-IN')}` }, total: { show: true, label: 'Total', fontSize: '11px', fontWeight: 700, formatter: (w) => `₹${w.globals.seriesTotals.reduce((a,b)=>a+b,0).toLocaleString('en-IN')}` } } } } },
                legend: { position: 'bottom', fontSize: '11px', fontWeight: 600, markers: { size: 6, shape: 'circle' } },
                tooltip: { y: { formatter: v => `₹${v.toLocaleString('en-IN')}` } },
                stroke: { width: 0 },
                theme: { mode: document.documentElement.classList.contains('dark') ? 'dark' : 'light' }
              }}
            />
          ) : (
            <div className="flex h-52 items-center justify-center text-muted-foreground text-sm border border-dashed rounded-xl">No payment data available</div>
          )}
        </div>
      </div>

      {/* Secondary Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Stock Valuation — Stacked Bar */}
          {aggregates.categoryValuation !== undefined && (
          <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col">
            <div>
              <h3 className="text-lg font-bold text-foreground">Stock Value by Category</h3>
              <p className="text-xs text-muted-foreground mb-4">Distribution of inventory capital across categories.</p>
            </div>
            <div className="flex-1 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              <VerticalStackedBarChart
                data={aggregates.categoryValuation}
                colors={['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4']}
              />
            </div>
          </div>
        )}

        {/* Top 5 Best-Selling Products — ApexCharts Bar */}
        <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col">
          <div>
            <h3 className="text-lg font-bold text-foreground">Top 5 Best-Selling Products</h3>
            <p className="text-xs text-muted-foreground mb-2">Top products by total items sold.</p>
          </div>
          {aggregates.topProducts && aggregates.topProducts.length > 0 ? (
            <ReactApexChart
              type="bar"
              height={280}
              series={[{ name: 'Units Sold', data: aggregates.topProducts.map(d => d.value) }]}
              options={{
                chart: { background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
                colors: ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ec4899'],
                plotOptions: { bar: { borderRadius: 6, distributed: true, columnWidth: '55%' } },
                dataLabels: { enabled: false },
                xaxis: {
                  categories: aggregates.topProducts.map(d => d.name.length > 12 ? d.name.slice(0, 12) + '…' : d.name),
                  axisBorder: { show: false },
                  axisTicks: { show: false },
                  labels: { style: { colors: '#6b7280', fontSize: '11px', fontWeight: 500 } }
                },
                yaxis: { labels: { style: { colors: '#6b7280', fontSize: '10px' } } },
                grid: { borderColor: 'rgba(128,128,128,0.12)', strokeDashArray: 4, yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
                legend: { show: false },
                tooltip: {
                  custom: ({ series, seriesIndex, dataPointIndex }) => {
                    const product = aggregates.topProducts[dataPointIndex];
                    return `<div style="padding:8px 12px;font-size:12px;font-weight:600">${product?.name}<br/><span style="font-weight:400;color:#6b7280">${series[seriesIndex][dataPointIndex]} units sold</span></div>`;
                  }
                },
                theme: { mode: document.documentElement.classList.contains('dark') ? 'dark' : 'light' }
              }}
            />
          ) : (
            <div className="flex h-52 items-center justify-center text-muted-foreground text-sm border border-dashed rounded-xl">No sales data available</div>
          )}
        </div>
      </div>

      {/* Bottom widgets: Recent activity */}
      <div className="w-full">
        {/* Recent Activity widget */}
        <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground font-sans">Recent Activity</h3>
              <p className="text-xs text-muted-foreground mt-1">Latest system-wide events and changes.</p>
            </div>
            <Link to="/audit-logs" className="text-xs font-semibold text-primary hover:underline cursor-pointer">
              View Audit Logs
            </Link>
          </div>

          <div className="flex-1 pr-1">
            {!aggregates.recentActivity || aggregates.recentActivity.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground text-xs">
                No recent system activity.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {aggregates.recentActivity.map((act) => (
                  <div key={act._id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Action Badge */}
                      <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[8px] font-extrabold uppercase border flex-shrink-0 ${
                        act.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50' :
                        act.action === 'UPDATE' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50' :
                        'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200/50'
                      }`}>
                        {act.action}
                      </span>
                      {/* Formatted Text */}
                      <p className="text-xs text-foreground leading-normal">
                        {formatActivityText(act)}
                      </p>
                    </div>
                    {/* Timestamp */}
                    <span className="text-[10px] text-muted-foreground font-semibold flex-shrink-0 text-right">
                      {formatDateTime(act.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

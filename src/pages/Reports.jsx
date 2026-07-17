import { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';

const SummaryCard = ({ title, value, subtext, valueClass = "" }) => (
  <div className="bg-card p-4 rounded-lg border shadow-sm flex flex-col">
    <span className="text-sm font-medium text-muted-foreground">{title}</span>
    <span className={`text-2xl font-bold mt-1 ${valueClass}`}>{value}</span>
    {subtext && <span className="text-xs text-muted-foreground mt-1">{subtext}</span>}
  </div>
);

export const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const tabs = [
    { id: 'sales', label: 'Sales Report', endpoint: 'sales' },
    { id: 'purchase', label: 'Purchase Report', endpoint: 'purchase' },
    { id: 'stock', label: 'Stock Valuation', endpoint: 'stock-valuation' },
    { id: 'gst', label: 'GST Report', endpoint: 'gst' },
    { id: 'commission', label: 'Commission Report', endpoint: 'commission' },
  ];

  useEffect(() => {
    setPage(1);
  }, [activeTab, startDate, endDate]);

  useEffect(() => {
    fetchReportData();
  }, [activeTab, startDate, endDate, page]);

  const fetchReportData = async () => {
    setLoading(true);
    setData(null);
    try {
      const tabConfig = tabs.find(t => t.id === activeTab);
      const query = new URLSearchParams();
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);
      query.append('page', page);
      query.append('limit', 10);

      const res = await fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')}/api/reports/${tabConfig.endpoint}?${query.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include'
      });
      const result = await res.json();
      if (result.status === 'success') {
        setData(result.data);
        if (result.pagination) {
          setPagination(result.pagination);
        } else {
          setPagination({ page: 1, pages: 1, total: 0 });
        }
      } else {
        setData({ error: result.message || 'Error fetching data' });
      }
    } catch (err) {
      console.error(err);
      setData({ error: 'Failed to fetch data' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!data) return;

    let exportData = data;
    try {
      const tabConfig = tabs.find(t => t.id === activeTab);
      const query = new URLSearchParams();
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);
      query.append('page', 1);
      query.append('limit', 10000);

      const res = await fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')}/api/reports/${tabConfig.endpoint}?${query.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include'
      });
      const result = await res.json();
      if (result.status === 'success') {
        exportData = result.data;
      }
    } catch (err) {
      console.error("Export fetch failed, falling back to current page data:", err);
    }

    let rows = [];

    const formatDateTime = (dateStr) => {
      if (!dateStr) return 'N/A';
      return new Date(dateStr).toLocaleString("en-IN", { 
        day: "2-digit", 
        month: "short", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    };

    if (activeTab === 'sales') {
      rows.push(["Date", "Invoice #", "Customer", "Total Amount", "Balance Due"]);
      (exportData.invoices || []).forEach(inv => {
        rows.push([formatDateTime(inv.date), inv.invoiceNumber, inv.customerId?.name || 'N/A', inv.grandTotal, inv.balanceDue]);
      });
    } else if (activeTab === 'purchase') {
      rows.push(["Date", "Bill #", "Supplier", "Total Amount", "Balance Due"]);
      (exportData.purchaseBills || []).forEach(bill => {
        rows.push([formatDateTime(bill.date), bill.billNumber, bill.supplierId?.name || 'N/A', bill.grandTotal, bill.balanceDue]);
      });
    } else if (activeTab === 'stock') {
      const hasPrice = exportData.products?.some(p => p.purchasePrice !== undefined);
      if (hasPrice) {
        rows.push(["Product", "Category", "Qty", "Unit Price", "Total Value"]);
        (exportData.products || []).forEach(prod => {
          rows.push([prod.name, prod.category?.name || 'N/A', `${prod.quantity} ${prod.unit}`, prod.purchasePrice, prod.quantity * prod.purchasePrice]);
        });
      } else {
        rows.push(["Product", "Category", "Qty"]);
        (exportData.products || []).forEach(prod => {
          rows.push([prod.name, prod.category?.name || 'N/A', `${prod.quantity} ${prod.unit}`]);
        });
      }
    } else if (activeTab === 'gst') {
      rows.push(["Type", "Date", "Invoice/Bill #", "Subtotal", "GST", "Grand Total"]);
      (exportData.salesGst || []).forEach(inv => {
        rows.push(["Sales (Output)", formatDateTime(inv.date), inv.invoiceNumber, inv.subTotal, inv.totalGst, inv.grandTotal]);
      });
      (exportData.purchaseGst || []).forEach(bill => {
        rows.push(["Purchase (Input)", formatDateTime(bill.date), bill.billNumber, bill.subTotal, bill.totalGst, bill.grandTotal]);
      });
    } else if (activeTab === 'commission') {
      rows.push(["Date", "Invoice #", "Customer", "Referral Person", "Total Amount", "Commission"]);
      (exportData.invoices || []).forEach(inv => {
        rows.push([formatDateTime(inv.date), inv.invoiceNumber, inv.customerId?.name || 'N/A', inv.referralId?.name || 'N/A', inv.grandTotal, inv.commissionDetails]);
      });
    }

    const csvArray = rows.map(row => 
      row.map(val => {
        if (val === null || val === undefined) return "";
        const str = String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(",")
    );

    const csvContent = "\uFEFF" + csvArray.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${activeTab}_report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString("en-IN", { 
      day: "2-digit", 
      month: "short", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const renderSalesTable = () => {
    const invoices = data?.invoices || [];
    const summary = data?.summary || {};
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SummaryCard title="Total Sales Amount" value={`₹${summary.totalAmount?.toLocaleString() || 0}`} />
          <SummaryCard title="Total Balance Due" value={`₹${summary.totalBalanceDue?.toLocaleString() || 0}`} valueClass="text-destructive" />
        </div>
        
        <div className="rounded-md border bg-card shadow-sm overflow-x-auto w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Balance Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Loading report data...</TableCell></TableRow>
            ) : data?.error ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-destructive">{data.error}</TableCell></TableRow>
            ) : invoices.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No sales data found.</TableCell></TableRow>
            ) : invoices.map((inv) => (
              <TableRow key={inv._id}>
                <TableCell data-label="Date">{formatDateTime(inv.date)}</TableCell>
                <TableCell data-label="Invoice #" className="font-medium">{inv.invoiceNumber}</TableCell>
                <TableCell data-label="Customer">{inv.customerId?.name || 'N/A'}</TableCell>
                <TableCell data-label="Total Amount" className="text-right font-semibold">₹{inv.grandTotal?.toLocaleString()}</TableCell>
                <TableCell data-label="Balance Due" className="text-right">₹{inv.balanceDue?.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      </div>
    );
  };

  const renderPurchaseTable = () => {
    const purchaseBills = data?.purchaseBills || [];
    const summary = data?.summary || {};
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SummaryCard title="Total Purchase Amount" value={`₹${summary.totalAmount?.toLocaleString() || 0}`} />
          <SummaryCard title="Total Balance Due" value={`₹${summary.totalBalanceDue?.toLocaleString() || 0}`} valueClass="text-destructive" />
        </div>
        
        <div className="rounded-md border bg-card shadow-sm overflow-x-auto w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Bill #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Balance Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Loading report data...</TableCell></TableRow>
            ) : data?.error ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-destructive">{data.error}</TableCell></TableRow>
            ) : purchaseBills.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No purchase data found.</TableCell></TableRow>
            ) : purchaseBills.map((bill) => (
              <TableRow key={bill._id}>
                <TableCell data-label="Date">{formatDateTime(bill.date)}</TableCell>
                <TableCell data-label="Bill #" className="font-medium">{bill.billNumber}</TableCell>
                <TableCell data-label="Supplier">{bill.supplierId?.name || 'N/A'}</TableCell>
                <TableCell data-label="Total Amount" className="text-right font-semibold">₹{bill.grandTotal?.toLocaleString()}</TableCell>
                <TableCell data-label="Balance Due" className="text-right">₹{bill.balanceDue?.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      </div>
    );
  };

  const renderStockTable = () => {
    const products = data?.products || [];
    const summary = data?.summary || {};
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard title="Total Products" value={summary.totalItems || 0} />
          <SummaryCard title="Total Quantity in Stock" value={summary.totalQuantity || 0} />
          {summary.totalValue !== undefined && (
            <SummaryCard title="Total Stock Valuation" value={`₹${summary.totalValue?.toLocaleString() || 0}`} valueClass="text-green-600" />
          )}
        </div>
        
        <div className="rounded-md border bg-card shadow-sm overflow-x-auto w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              {(!loading && !data?.error && products.some(p => p.purchasePrice !== undefined)) && (
                <>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Loading report data...</TableCell></TableRow>
            ) : data?.error ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-destructive">{data.error}</TableCell></TableRow>
            ) : products.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No stock data found.</TableCell></TableRow>
            ) : products.map((prod) => (
              <TableRow key={prod._id}>
                <TableCell data-label="Product" className="font-medium">{prod.name}</TableCell>
                <TableCell data-label="Category">{prod.category?.name || 'N/A'}</TableCell>
                <TableCell data-label="Qty" className="text-right">{prod.quantity} {prod.unit}</TableCell>
                {prod.purchasePrice !== undefined && (
                  <>
                    <TableCell data-label="Unit Price" className="text-right">₹{prod.purchasePrice?.toLocaleString()}</TableCell>
                    <TableCell data-label="Total Value" className="text-right font-semibold">₹{(prod.quantity * prod.purchasePrice)?.toLocaleString()}</TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      </div>
    );
  };

  const renderGstTable = () => {
    const sales = data?.salesGst || [];
    const purchases = data?.purchaseGst || [];
    const summary = data?.summary || {};
    
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard title="Total GST Collected (Sales)" value={`₹${summary.totalGstCollected?.toLocaleString() || 0}`} valueClass="text-green-600" />
          <SummaryCard title="Total GST Paid (Purchases)" value={`₹${summary.totalGstPaid?.toLocaleString() || 0}`} valueClass="text-blue-600" />
          <SummaryCard 
            title="Net GST Payable" 
            value={`₹${Math.abs(summary.netGstPayable || 0)?.toLocaleString()}`} 
            valueClass={summary.netGstPayable > 0 ? "text-destructive" : "text-green-600"}
            subtext={summary.netGstPayable > 0 ? "You need to pay" : "You have credit"}
          />
        </div>

        <div>
          <h3 className="text-md font-semibold mb-3 border-b pb-2">Sales GST Details (Output)</h3>
          <div className="rounded-md border bg-card shadow-sm overflow-x-auto w-full">
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">GST Collected</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Loading report data...</TableCell></TableRow>
              ) : data?.error ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-destructive">{data.error}</TableCell></TableRow>
              ) : sales.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No sales GST data found.</TableCell></TableRow>
              ) : sales.map((inv) => (
                <TableRow key={inv._id}>
                  <TableCell data-label="Date">{formatDateTime(inv.date)}</TableCell>
                  <TableCell data-label="Invoice #" className="font-medium">{inv.invoiceNumber}</TableCell>
                  <TableCell data-label="Subtotal" className="text-right">₹{inv.subTotal?.toLocaleString()}</TableCell>
                  <TableCell data-label="GST Collected" className="text-right font-semibold text-green-600">₹{inv.totalGst?.toLocaleString()}</TableCell>
                  <TableCell data-label="Grand Total" className="text-right">₹{inv.grandTotal?.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </div>
        </div>

        <div>
          <h3 className="text-md font-semibold mb-3 border-b pb-2">Purchase GST Details (Input)</h3>
          <div className="rounded-md border bg-card shadow-sm overflow-x-auto w-full">
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Bill #</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">GST Paid</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Loading report data...</TableCell></TableRow>
              ) : data?.error ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-destructive">{data.error}</TableCell></TableRow>
              ) : purchases.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No purchase GST data found.</TableCell></TableRow>
              ) : purchases.map((bill) => (
                <TableRow key={bill._id}>
                  <TableCell data-label="Date">{formatDateTime(bill.date)}</TableCell>
                  <TableCell data-label="Bill #" className="font-medium">{bill.billNumber}</TableCell>
                  <TableCell data-label="Subtotal" className="text-right">₹{bill.subTotal?.toLocaleString()}</TableCell>
                  <TableCell data-label="GST Paid" className="text-right font-semibold text-blue-600">₹{bill.totalGst?.toLocaleString()}</TableCell>
                  <TableCell data-label="Grand Total" className="text-right">₹{bill.grandTotal?.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </div>
        </div>
      </div>
    );
  };

  const renderCommissionTable = () => {
    const entries = data?.commissionEntries || [];
    const summary = data?.summary || {};
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SummaryCard title="Total Sales with Commission" value={`₹${summary.totalSalesWithCommission?.toLocaleString() || 0}`} />
          <SummaryCard title="Total Commission Earned" value={`₹${summary.totalCommissionPaid?.toLocaleString() || 0}`} valueClass="text-primary" />
        </div>
        
        <div className="rounded-md border bg-card shadow-sm overflow-x-auto w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Referral Person</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Commission</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading report data...</TableCell></TableRow>
            ) : data?.error ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-destructive">{data.error}</TableCell></TableRow>
            ) : entries.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No commission data found.</TableCell></TableRow>
            ) : entries.map((entry) => (
              <TableRow key={entry._id}>
                <TableCell>{formatDateTime(entry.date)}</TableCell>
                <TableCell className="font-medium">{entry.invoiceNumber}</TableCell>
                <TableCell>{entry.customerName || 'N/A'}</TableCell>
                <TableCell>{entry.referralName || 'N/A'}</TableCell>
                <TableCell className="text-right">₹{entry.totalAmount?.toLocaleString()}</TableCell>
                <TableCell className="text-right font-semibold text-primary">₹{entry.commissionAmount?.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 print:hidden w-full sm:w-auto bg-card p-4 rounded-md border shadow-sm">
          {activeTab !== 'stock' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative flex items-center w-full sm:w-auto">
                <input 
                  type="date" 
                  ref={startDateRef}
                  className="rounded-md border border-input bg-background pl-9 pr-3 py-1.5 text-sm w-full sm:w-auto [&::-webkit-calendar-picker-indicator]:hidden"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Calendar
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" 
                  onClick={() => startDateRef.current?.showPicker()}
                />
              </div>
              <span className="text-muted-foreground text-center">to</span>
              <div className="relative flex items-center w-full sm:w-auto">
                <input 
                  type="date" 
                  ref={endDateRef}
                  className="rounded-md border border-input bg-background pl-9 pr-3 py-1.5 text-sm w-full sm:w-auto [&::-webkit-calendar-picker-indicator]:hidden"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <Calendar
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" 
                  onClick={() => endDateRef.current?.showPicker()}
                />
              </div>
            </div>
          )}
          <Button variant="outline" className="w-full sm:w-auto" onClick={handleExportCSV} disabled={loading || !data || data.error}>
            Export to CSV
          </Button>
        </div>
      </div>

      <div className="flex border-b overflow-x-auto scrollbar-hide print:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-6">
        <h2 className="text-2xl font-bold text-center">{tabs.find(t => t.id === activeTab)?.label}</h2>
        {(startDate || endDate) && activeTab !== 'stock' && (
          <p className="text-center text-muted-foreground">
            Period: {startDate ? new Date(startDate).toLocaleDateString('en-IN') : 'Start'} to {endDate ? new Date(endDate).toLocaleDateString('en-IN') : 'Today'}
          </p>
        )}
      </div>

      <div className="print:p-0">
        <div className="overflow-x-auto print:overflow-visible">
          <>
            {activeTab === 'sales' && renderSalesTable()}
            {activeTab === 'purchase' && renderPurchaseTable()}
            {activeTab === 'stock' && renderStockTable()}
            {activeTab === 'gst' && renderGstTable()}
            {activeTab === 'commission' && renderCommissionTable()}
          </>
        </div>
        
        {pagination && pagination.pages > 1 && !loading && !data?.error && (
          <div className="flex items-center justify-end space-x-2 mt-4 print:hidden">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0 cursor-pointer"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === pagination.pages}>Next</Button>
          </div>
        )}
      </div>
    </div>
  );
};


import { useNavigate, useParams, Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Edit, Phone, MapPin, Building2, FileText, CreditCard, BadgeCheck } from "lucide-react";
import { BackButton } from "../../components/ui/BackButton";
import { useGetSupplierByIdQuery } from "../../features/suppliers/supplierApi";
import { useGetPurchaseBillsQuery, useGetPurchaseReturnsQuery, useGetDebitNotesQuery } from "../../features/purchases/purchasesApi";
import { Button } from "../../components/ui/Button";

const DetailRow = ({ label, value }) => (
  <div className="flex flex-col gap-0.5 min-w-0">
    <p className="text-xs text-muted-foreground uppercase tracking-wide truncate">{label}</p>
    <p className="text-sm font-semibold text-foreground break-words">{value || <span className="text-muted-foreground italic">Not provided</span>}</p>
  </div>
);

const Section = ({ icon: Icon, title, children }) => (
  <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
    <div className="flex items-center gap-2 border-b pb-3">
      <Icon className="h-4 w-4 text-primary" />
      <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
    </div>
    <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
      {children}
    </div>
  </div>
);

export const SupplierDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetSupplierByIdQuery(id);
  const supplier = data?.data?.supplier;

  const [activeTab, setActiveTab] = useState("details");

  const { data: billsData } = useGetPurchaseBillsQuery(undefined, { skip: activeTab !== 'ledger' });
  const { data: returnsData } = useGetPurchaseReturnsQuery(undefined, { skip: activeTab !== 'ledger' });
  const { data: notesData } = useGetDebitNotesQuery(undefined, { skip: activeTab !== 'ledger' });

  const ledgerEntries = useMemo(() => {
    if (activeTab !== 'ledger') return [];
    const entries = [];
    
    (billsData?.data?.purchaseBills || []).filter(b => b.supplierId?._id === id || b.supplierId === id).forEach(b => {
      entries.push({ id: b._id, date: new Date(b.date), type: 'Purchase Bill', ref: b.billNumber, credit: b.grandTotal, debit: 0 });
    });
    
    (returnsData?.data?.purchaseReturns || []).filter(r => r.supplierId?._id === id || r.supplierId === id).forEach(r => {
      entries.push({ id: r._id, date: new Date(r.date), type: 'Purchase Return', ref: r.returnNumber, credit: 0, debit: r.grandTotal });
    });

    (notesData?.data?.debitNotes || []).filter(n => n.supplierId?._id === id || n.supplierId === id).forEach(n => {
      // Debit note is basically a formal document of return, we can show it but might duplicate the balance.
      // Let's just show it with 0 impact if it's related to a return, or just show it instead of return.
      // We will show it as informational (0 impact on this simple ledger view if we already count returns)
      entries.push({ id: n._id, date: new Date(n.date), type: `Debit Note (${n.status})`, ref: n.noteNumber, credit: 0, debit: 0, noteAmount: n.amount });
    });

    // Sort chronologically
    entries.sort((a, b) => a.date - b.date);

    // Calculate running balance (Credit - Debit)
    let balance = 0;
    entries.forEach(e => {
      balance += (e.credit - e.debit);
      e.balance = balance;
    });

    return entries.reverse(); // Newest first for display
  }, [activeTab, billsData, returnsData, notesData, id]);

  if (isLoading) return (
    <div className="flex h-60 items-center justify-center text-muted-foreground">Loading supplier details...</div>
  );

  if (isError || !supplier) return (
    <div className="flex h-60 items-center justify-center text-destructive">Failed to load supplier details.</div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <BackButton />
          <span className="text-muted-foreground">/</span>
          <h1 className="text-2xl font-bold tracking-tight">{supplier.name}</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            supplier.isActive !== false
              ? "bg-green-500/10 text-green-500"
              : "bg-red-500/10 text-red-500"
          }`}>
            {supplier.isActive !== false ? "Active" : "Inactive"}
          </span>
        </div>
        <Link to={`/suppliers/${id}/edit`}>
          <Button size="sm">
            <Edit className="mr-2 h-4 w-4" /> Edit Supplier
          </Button>
        </Link>
      </div>

      <div className="border-b">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('details')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'details'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'ledger'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Ledger & History
          </button>
        </nav>
      </div>

      {activeTab === 'details' && (
        <div className="space-y-5">
          {/* Contact & GST */}
      <Section icon={Phone} title="Contact & GST Details">
        <DetailRow label="Supplier ID" value={<span className="font-mono">{supplier.customId}</span>} />
        <DetailRow label="Phone" value={supplier.phone} />
        <DetailRow label="Alternate Phone" value={supplier.alternatePhone} />
        <DetailRow label="GST Number" value={supplier.gstNumber} />
        <DetailRow label="GST Type" value={supplier.gstType} />
      </Section>

      {/* Address */}
      <Section icon={MapPin} title="Address">
        <DetailRow label="Street" value={supplier.address?.street} />
        <DetailRow label="City" value={supplier.address?.city} />
        <DetailRow label="State" value={supplier.address?.state} />
        <DetailRow label="Pincode" value={supplier.address?.pincode} />
      </Section>

      {/* Bank Details */}
      <Section icon={CreditCard} title="Bank Details">
        <DetailRow label="Bank Name" value={supplier.bankDetails?.bankName} />
        <DetailRow label="Account Number" value={supplier.bankDetails?.accountNumber} />
        <DetailRow label="IFSC Code" value={supplier.bankDetails?.ifsc} />
      </Section>

      {/* Notes */}
      {supplier.notes && (
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b pb-3">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide">Notes</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{supplier.notes}</p>
        </div>
      )}

      {/* Meta */}
      <div className="flex gap-6 text-xs text-muted-foreground px-1">
        <span>Created: {new Date(supplier.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
        <span>Last Updated: {new Date(supplier.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
      </div>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="space-y-5">
          <div className="rounded-md border bg-card responsive-table overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Ref No</th>
                  <th className="p-4 font-medium text-right text-green-600">Credit (₹)</th>
                  <th className="p-4 font-medium text-right text-red-600">Debit (₹)</th>
                  <th className="p-4 font-medium text-right">Balance (₹)</th>
                </tr>
              </thead>
              <tbody>
                {ledgerEntries.map((entry) => (
                  <tr key={entry.id + entry.type} className="border-b last:border-0 hover:bg-muted/50">
                    <td data-label="Date" className="p-4">{entry.date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    <td data-label="Type" className="p-4 font-medium">{entry.type}</td>
                    <td data-label="Ref No" className="p-4">{entry.ref}</td>
                    <td data-label="Credit (₹)" className="p-4 text-right">{entry.credit > 0 ? entry.credit.toFixed(2) : '-'}</td>
                    <td data-label="Debit (₹)" className="p-4 text-right">{entry.debit > 0 ? entry.debit.toFixed(2) : (entry.noteAmount ? `(${entry.noteAmount.toFixed(2)})` : '-')}</td>
                    <td data-label="Balance (₹)" className="p-4 text-right font-semibold">{entry.balance.toFixed(2)}</td>
                  </tr>
                ))}
                {ledgerEntries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">No transactions found for this supplier.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

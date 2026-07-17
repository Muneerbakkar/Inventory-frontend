import { Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { Reports } from "./pages/Reports";
import { CompanySettings } from "./pages/Settings/CompanySettings";
import { AuditLog } from "./pages/Settings/AuditLog";
import { Login } from "./pages/Login";
import { SupplierList } from "./pages/Suppliers/SupplierList";
import { SupplierForm } from "./pages/Suppliers/SupplierForm";
import { SupplierDetail } from "./pages/Suppliers/SupplierDetail";
import { ProfilePage } from "./pages/Profile/ProfilePage";
import { UserList } from "./pages/Users/UserList";
import { UserForm } from "./pages/Users/UserForm";
import { UserDetail } from "./pages/Users/UserDetail";
import { ProductList } from "./pages/Products/ProductList";
import { ProductForm } from "./pages/Products/ProductForm";
import { ProductDetail } from "./pages/Products/ProductDetail";
import { StockAdjustment } from "./pages/Products/StockAdjustment";
import { GstSettings } from "./pages/Settings/GstSettings";
import { CategoryList } from "./pages/Categories/CategoryList";
import { CategoryForm } from "./pages/Categories/CategoryForm";
import { SalesList } from "./pages/Sales/SalesList";
import { NewSale } from "./pages/Sales/NewSale";
import { InvoiceView } from "./pages/Sales/InvoiceView";
import { ReferralLedger } from "./pages/Referrals/ReferralLedger";
import { ReferralForm } from "./pages/Referrals/ReferralForm";
import { CustomerList } from "./pages/Customers/CustomerList";
import { CustomerForm } from "./pages/Customers/CustomerForm";
import { PurchaseList } from "./pages/Purchases/PurchaseList";
import { PurchaseForm } from "./pages/Purchases/PurchaseForm";
import { PurchaseView } from "./pages/Purchases/PurchaseView";
import { PurchaseReturnList } from "./pages/Purchases/PurchaseReturnList";
import { PurchaseReturnForm } from "./pages/Purchases/PurchaseReturnForm";
import { PurchaseReturnView } from "./pages/Purchases/PurchaseReturnView";
import { DebitNoteList } from "./pages/Purchases/DebitNoteList";
import { QuotationList } from "./pages/Quotations/QuotationList";
import { QuotationForm } from "./pages/Quotations/QuotationForm";
import { QuotationDetail } from "./pages/Quotations/QuotationDetail";
import { Notifications } from "./pages/Notifications/Notifications";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<CompanySettings />} />
        <Route path="audit-logs" element={<AuditLog />} />
        <Route path="suppliers" element={<SupplierList />} />
        <Route path="suppliers/new" element={<SupplierForm />} />
        <Route path="suppliers/:id" element={<SupplierDetail />} />
        <Route path="suppliers/:id/edit" element={<SupplierForm />} />
          {/* Product Routes */}
          <Route path="products" element={<ProductList />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
          <Route path="products/:id/adjust" element={<StockAdjustment />} />

          {/* Settings Routes */}
          <Route path="settings/gst" element={<GstSettings />} />

          {/* Category Routes */}
          <Route path="categories" element={<CategoryList />} />
          <Route path="categories/new" element={<CategoryForm />} />
          <Route path="categories/:id/edit" element={<CategoryForm />} />
          <Route path="customers" element={<CustomerList />} />
          <Route path="customers/new" element={<CustomerForm />} />
          <Route path="customers/:id/edit" element={<CustomerForm />} />
          <Route path="sales" element={<SalesList />} />
          <Route path="sales/new" element={<NewSale />} />
          <Route path="sales/:id" element={<InvoiceView />} />
          <Route path="sales/:id/edit" element={<NewSale />} />
          <Route path="referrals" element={<ReferralLedger />} />
          <Route path="referrals/:id/edit" element={<ReferralForm />} />
          <Route path="quotations" element={<QuotationList />} />
          <Route path="quotations/new" element={<QuotationForm />} />
          <Route path="quotations/:id" element={<QuotationDetail />} />
          <Route path="quotations/:id/edit" element={<QuotationForm />} />
          <Route path="purchases" element={<PurchaseList />} />
          <Route path="purchases/new" element={<PurchaseForm />} />
          <Route path="purchases/:id" element={<PurchaseView />} />
          <Route path="purchases/:id/edit" element={<PurchaseForm />} />
          <Route path="purchase-returns" element={<PurchaseReturnList />} />
          <Route path="purchase-returns/new" element={<PurchaseReturnForm />} />
          <Route path="purchase-returns/:id" element={<PurchaseReturnView />} />
          <Route path="purchase-returns/:id/edit" element={<PurchaseReturnForm />} />
          <Route path="debit-notes" element={<DebitNoteList />} />
        <Route path="users" element={<UserList />} />
        <Route path="users/new" element={<UserForm />} />
        <Route path="users/:id" element={<UserDetail />} />
        <Route path="users/:id/edit" element={<UserForm />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<div>Page Not Found</div>} />
      </Route>
    </Routes>
  );
}

export default App;

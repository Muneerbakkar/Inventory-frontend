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
import { RolesPermissions } from "./pages/Settings/RolesPermissions";
import { RoleForm } from "./pages/Settings/RoleForm";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="reports" element={<ProtectedRoute requiredPermission="Reports.read"><Reports /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute requiredPermission="Settings.read"><CompanySettings /></ProtectedRoute>} />
        <Route path="audit-logs" element={<ProtectedRoute requiredPermission="Settings.read"><AuditLog /></ProtectedRoute>} />
        <Route path="suppliers" element={<ProtectedRoute requiredPermission="Suppliers.read"><SupplierList /></ProtectedRoute>} />
        <Route path="suppliers/new" element={<ProtectedRoute requiredPermission="Suppliers.create"><SupplierForm /></ProtectedRoute>} />
        <Route path="suppliers/:id" element={<ProtectedRoute requiredPermission="Suppliers.read"><SupplierDetail /></ProtectedRoute>} />
        <Route path="suppliers/:id/edit" element={<ProtectedRoute requiredPermission="Suppliers.update"><SupplierForm /></ProtectedRoute>} />
          {/* Product Routes */}
          <Route path="products" element={<ProtectedRoute requiredPermission="Products.read"><ProductList /></ProtectedRoute>} />
          <Route path="products/new" element={<ProtectedRoute requiredPermission="Products.create"><ProductForm /></ProtectedRoute>} />
          <Route path="products/:id" element={<ProtectedRoute requiredPermission="Products.read"><ProductDetail /></ProtectedRoute>} />
          <Route path="products/:id/edit" element={<ProtectedRoute requiredPermission="Products.update"><ProductForm /></ProtectedRoute>} />
          <Route path="products/:id/adjust" element={<ProtectedRoute requiredPermission="Products.update"><StockAdjustment /></ProtectedRoute>} />
          {/* Settings Routes */}
          <Route path="settings/gst" element={<ProtectedRoute requiredPermission="Settings.read"><GstSettings /></ProtectedRoute>} />
          <Route path="settings/roles" element={<ProtectedRoute requiredPermission="Roles.read"><RolesPermissions /></ProtectedRoute>} />
          <Route path="settings/roles/new" element={<ProtectedRoute requiredPermission="Roles.create"><RoleForm /></ProtectedRoute>} />
          <Route path="settings/roles/:id" element={<ProtectedRoute requiredPermission="Roles.update"><RoleForm /></ProtectedRoute>} />

          {/* Category Routes */}
          <Route path="categories" element={<ProtectedRoute requiredPermission="Categories.read"><CategoryList /></ProtectedRoute>} />
          <Route path="categories/new" element={<ProtectedRoute requiredPermission="Categories.create"><CategoryForm /></ProtectedRoute>} />
          <Route path="categories/:id/edit" element={<ProtectedRoute requiredPermission="Categories.update"><CategoryForm /></ProtectedRoute>} />
          <Route path="customers" element={<ProtectedRoute requiredPermission="Customers.read"><CustomerList /></ProtectedRoute>} />
          <Route path="customers/new" element={<ProtectedRoute requiredPermission="Customers.create"><CustomerForm /></ProtectedRoute>} />
          <Route path="customers/:id/edit" element={<ProtectedRoute requiredPermission="Customers.update"><CustomerForm /></ProtectedRoute>} />
          <Route path="sales" element={<ProtectedRoute requiredPermission="Sales.read"><SalesList /></ProtectedRoute>} />
          <Route path="sales/new" element={<ProtectedRoute requiredPermission="Sales.create"><NewSale /></ProtectedRoute>} />
          <Route path="sales/:id" element={<ProtectedRoute requiredPermission="Sales.read"><InvoiceView /></ProtectedRoute>} />
          <Route path="sales/:id/edit" element={<ProtectedRoute requiredPermission="Sales.update"><NewSale /></ProtectedRoute>} />
          <Route path="referrals" element={<ProtectedRoute requiredPermission="Referrals.read"><ReferralLedger /></ProtectedRoute>} />
          <Route path="referrals/:id/edit" element={<ProtectedRoute requiredPermission="Referrals.update"><ReferralForm /></ProtectedRoute>} />
          <Route path="quotations" element={<ProtectedRoute requiredPermission="Quotations.read"><QuotationList /></ProtectedRoute>} />
          <Route path="quotations/new" element={<ProtectedRoute requiredPermission="Quotations.create"><QuotationForm /></ProtectedRoute>} />
          <Route path="quotations/:id" element={<ProtectedRoute requiredPermission="Quotations.read"><QuotationDetail /></ProtectedRoute>} />
          <Route path="quotations/:id/edit" element={<ProtectedRoute requiredPermission="Quotations.update"><QuotationForm /></ProtectedRoute>} />
          <Route path="purchases" element={<ProtectedRoute requiredPermission="Purchases.read"><PurchaseList /></ProtectedRoute>} />
          <Route path="purchases/new" element={<ProtectedRoute requiredPermission="Purchases.create"><PurchaseForm /></ProtectedRoute>} />
          <Route path="purchases/:id" element={<ProtectedRoute requiredPermission="Purchases.read"><PurchaseView /></ProtectedRoute>} />
          <Route path="purchases/:id/edit" element={<ProtectedRoute requiredPermission="Purchases.update"><PurchaseForm /></ProtectedRoute>} />
          <Route path="purchase-returns" element={<ProtectedRoute requiredPermission="Purchases.read"><PurchaseReturnList /></ProtectedRoute>} />
          <Route path="purchase-returns/new" element={<ProtectedRoute requiredPermission="Purchases.create"><PurchaseReturnForm /></ProtectedRoute>} />
          <Route path="purchase-returns/:id" element={<ProtectedRoute requiredPermission="Purchases.read"><PurchaseReturnView /></ProtectedRoute>} />
          <Route path="purchase-returns/:id/edit" element={<ProtectedRoute requiredPermission="Purchases.update"><PurchaseReturnForm /></ProtectedRoute>} />
          <Route path="debit-notes" element={<ProtectedRoute requiredPermission="Purchases.read"><DebitNoteList /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute requiredPermission="Users.read"><UserList /></ProtectedRoute>} />
        <Route path="users/new" element={<ProtectedRoute requiredPermission="Users.create"><UserForm /></ProtectedRoute>} />
        <Route path="users/:id" element={<ProtectedRoute requiredPermission="Users.read"><UserDetail /></ProtectedRoute>} />
        <Route path="users/:id/edit" element={<ProtectedRoute requiredPermission="Users.update"><UserForm /></ProtectedRoute>} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<div>Page Not Found</div>} />
      </Route>
    </Routes>
  );
}

export default App;

import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";

// Layout & Guards
import Layout from "../components/Layout";
import NotFound from "../components/notFound";
import Login from "../components/login/login";

// Pages
import Dashboard from "../pages/homePage";
import DivisionPage from "../pages/divisionPage";
import KaratPage from "../pages/karatPage";
import MetalRatePage from "../pages/metalRatePage";
import MetalStock from "../pages/metalStock";
import TradeDebtor from "../pages/tradeDebtorPage";
import Currency from "../pages/currencyPage";
import BranchMaster from "../pages/branchPage";
import CostCenterPage from "../pages/costCenterPage";
import CountryPage from "../pages/countryPage";
import VendorMaster from "../pages/vendorPage";
import BrandPage from "../pages/brandPage";
import SizePage from "../pages/sizePage";
import ColorPage from "../pages/colorPage";
import CategoryPage from "../pages/categoryPage";
import SubCategoryPage from "../pages/subCategoryPage";
import TypeMasterPage from "../pages/typeMasterPage";
import GoldCenterPage from "../pages/goldCenterPage";
import ChargeCostPage from "../pages/chargeCostPage";
import PremiumDiscountPage from "../pages/premiumDiscountPage";
import OthersPage from "../pages/OthersPage.jsx";
import VatPage from "../pages/VatPage.jsx";
import ExpenseCostPage from "../pages/ExpenseCostPage";
import StockBalancePage from "../pages/StockBalancePage";
import PurchaseMetal from "../pages/metalPurchase";
import MetalSales from "../pages/metalSales";
import SalesReturn from "../pages/SalesReturn";
import PurchaseReturn from "../pages/PurchaseReturn";
import ProfileManagement from "../components/Accounts/Debtors/Profile/ProfileManagement";
import AccountCreditors from "../components/Accounts/Creditors/Profile/ProfileManagement";
import ModeOfReceipt from "../pages/modeReceiptPage";
import Voucher from "../pages/Voucher";
import LiquidityProvider from "../pages/LiquidityProvider";
import Debtor from "../pages/Debtor";
import Bank from "../pages/Bank";
import Purchasefixing from "../pages/PurchaseFixing";
import Salesfixing from "../pages/SalesFixing";
import MetalReceipt from "../pages/metalReceipt";
import CurrencyPayment from "../pages/currencyPayment";
import MetalPayment from "../pages/metalPayment";
import TradeCreditors from "../components/Accounts/Creditors/TradeCreditors";
import AccountType from "../components/AccountType/AccountMaster";
import AccountTypeDetails from "../components/AccountType/AccountTypeDetails";
import TransferPage from "../pages/TransferPage";
import OpeningBalance from "../pages/OpeningBalance";
import Inventory from "../pages/Inventory";
import MetalStockLedgerPage from "../pages/MetalStockLedger";
import InventoryStockReport from "../pages/InventoryStockReport";
import InventoryActivityLog from "../pages/InventoryActivityLog";
import MetalinventoryDetailPage from "../pages/MetalinventoryDetailPage";
import MetalStockLedger from "../pages/MetalStockLedger";
import StockMovement from "../pages/StockMovement";
import StockAnalysis from "../pages/StockAnalysis";
import TransactionSummaryPage from "../pages/TransactionSummary";
import StockAnalysisPage from "../pages/StockAnalysis";
import OwnStockPage from "../pages/OwnStockPage.jsx";
import StockMovementPCS from "../pages/StockMovementPCS.jsx";
import StockBalance from "../pages/StockBalance.jsx";
import SalesAnalysis from "../pages/SalesAnalysis.jsx";
import SalesFixManagementPage from "../pages/SalesFixManagement";
import PurchaseFixManagementPage from "../pages/PurchaseFixManagement.jsx";
import FixingRegistryPage from "../pages/FixingResgitry.jsx";
import StatementofAccountsPage from "../pages/statementofaccount.jsx";
import CurrencyFixing from "../components/CurrencyFix/CurrencyFix.jsx";
import CurrencyFix from "../pages/currencyfixing.jsx";
export default function UserRouter() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route element={<Layout />}>
        {/* Dashboard */}
        <Route path="/dashboard" element={<MetalStock />} />

        {/* Masters */}
        <Route path="/division-master" element={<DivisionPage />} />
        <Route path="/karat-master" element={<KaratPage />} />
        <Route path="/metal-rate-type" element={<MetalRatePage />} />
        <Route path="/metal-stock" element={<MetalStock />} />
        <Route path="/currency-master" element={<Currency />} />
        <Route path="/branch-master" element={<BranchMaster />} />
        <Route path="/cost-center" element={<CostCenterPage />} />
        <Route path="/country-master" element={<CountryPage />} />
        <Route path="/vendor-master" element={<VendorMaster />} />
        <Route path="/brand-master" element={<BrandPage />} />
        <Route path="/size-master" element={<SizePage />} />
        <Route path="/color-master" element={<ColorPage />} />
        <Route path="/main-category" element={<CategoryPage />} />
        <Route path="/sub-category" element={<SubCategoryPage />} />
        <Route path="/type-master" element={<TypeMasterPage />} />
        <Route path="/gold" element={<GoldCenterPage />} />
        <Route path="/stock-balance" element={<StockBalancePage />} />
        <Route path="/charge" element={<ChargeCostPage />} />
        <Route path="/premium-discount" element={<PremiumDiscountPage />} />
        <Route path="/vat" element={<VatPage />} />
        <Route path="/others" element={<OthersPage />} />
        <Route path="/expense" element={<ExpenseCostPage />} />
        <Route path="/parties" element={<TradeDebtor />} />
        <Route
          path="/sales-fix-management"
          element={<SalesFixManagementPage />}
        />
        <Route
          path="/purchase-fix-management"
          element={<PurchaseFixManagementPage />}
        />
                <Route path="currencyfix-management" element={<CurrencyFix />} />


        {/* <Route path="/metal-stock-ledger" element={<MetalStockLedgerPage />} />
        <Route path="/stock-movement" element={<StockMovement />} />
        <Route path="/stock-analysis" element={<StockAnalysis />} />
        <Route path="/transaction-summary" element={<TransactionSummaryPage />} /> */}
        {/* Metal Transactions */}
        <Route path="/metal-purchase" element={<PurchaseMetal />} />
        <Route path="/metal-purchase/:module" element={<PurchaseMetal />} />

        <Route path="/metal-sale" element={<MetalSales />} />
        <Route path="/sales-metal/:module" element={<MetalSales />} />

        <Route path="/purchase-return" element={<PurchaseReturn />} />
        <Route path="/purchase-return/:module" element={<PurchaseReturn />} />

        {/* <Route path="/sales-return" element={<SalesReturn />} /> */}
        <Route path="/sales-return" element={<SalesReturn />} />
        <Route path="/sales-return/:module" element={<SalesReturn />} />

        {/* Accounts */}
        <Route path="/accounts/:debtorId" element={<ProfileManagement />} />
        <Route path="/accounts/:creditorId" element={<AccountCreditors />} />
        <Route path="/trade-creditors" element={<TradeCreditors />} />
        <Route path="/account-type" element={<AccountType />} />
        <Route path="/account-type/:id" element={<AccountTypeDetails />} />
        <Route path="/ceditors" element={<LiquidityProvider />} />
        <Route path="/debtor" element={<Debtor />} />
        <Route path="/bank" element={<Bank />} />

        {/* Payments/Receipts */}
        <Route path="/metal-payment" element={<MetalPayment />} />
        <Route path="/metal-payment/:module" element={<MetalPayment />} />

        <Route
          path="/currency-payment"
          element={<CurrencyPayment />}
        />
        <Route path="/currency-payment/:module" element={<CurrencyPayment />} />

        <Route path="/metal-receipt" element={<MetalReceipt />} />
        <Route path="/metal-receipt/:module" element={<MetalReceipt />} />

        <Route path="/currency-receipt" element={<ModeOfReceipt />} />
        <Route path="/currency-receipt/:module" element={<ModeOfReceipt />} />

        {/* Fixings */}
        <Route path="/purchase-fixing" element={<Purchasefixing />} />
        <Route path="/sales-fixing" element={<Salesfixing />} />

        {/* Transfers */}
        <Route
          path="/transfer"
          element={<Navigate to="/transfer/transfer" replace />}
        />
        <Route path="/transfer/:module" element={<TransferPage />} />

        {/* Other */}
        <Route path="/opening-balance" element={<OpeningBalance />} />
        <Route path="/voucher" element={<Voucher />} />

        {/* Inventory */}
        <Route path="/inventory/metals" element={<Inventory />} />
        <Route
          path="/inventory/stock-report"
          element={<InventoryStockReport />}
        />
        <Route
          path="/inventory/metal-stock-ledger"
          element={<MetalStockLedgerPage />}
        />
        <Route
          path="/inventory/activity-log"
          element={<InventoryActivityLog />}
        />
        <Route
          path="/inventory/metals/:id"
          element={<MetalinventoryDetailPage />}
        />
        <Route
          path="/reports/metal-stock-ledger"
          element={<MetalStockLedger />}
        />
        <Route path="/reports/stock-movement" element={<StockMovement />} />
        <Route path="/reports/stock-analysis" element={<StockAnalysisPage />} />
        <Route
          path="/reports/transaction-summary"
          element={<TransactionSummaryPage />}
        />
        <Route path="/reports/own-stock" element={<OwnStockPage />} />
        <Route
          path="/reports/stock-movement-pcs"
          element={<StockMovementPCS />}
        />
        <Route path="/reports/stock-balance" element={<StockBalance />} />
        <Route path="/reports/sales-analysis" element={<SalesAnalysis />} />
        <Route
          path="/reports/fixing-registry"
          element={<FixingRegistryPage />}
        />
        <Route
          path="/reports/statements"
          element={<StatementofAccountsPage />}
        />

          <Route
          path="/currency-fix"
          element={<CurrencyFixing />}
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

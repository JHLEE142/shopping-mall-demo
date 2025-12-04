import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  DollarSign,
  Loader2,
  Filter,
  Mail,
  Package,
  Phone,
  Plus,
  Search,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
  Users as UsersIcon,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { deleteProduct, fetchProducts, updateProduct } from '../services/productService';
import { fetchOrders as fetchOrdersApi, fetchOrderById } from '../services/orderService';
import { getUsers as getUsersApi } from '../services/userService';
import {
  getDashboardStats,
  getRevenueTrend,
  getCategorySales,
  getOrderStatusDistribution,
  getTopProducts,
  getStatisticsData,
  getCategoryPerformance,
  getStatisticsHighlights,
} from '../services/statisticsService';

const NAV_ITEMS = ['Dashboard', 'Sales', 'Inventory', 'Customers', 'Statistics', 'Products'];
const PRODUCTS_PAGE_SIZE = 2;

// Inventory Row Component
function InventoryRow({ product, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingValues, setEditingValues] = useState({
    stock: product.inventory?.stock ?? 0,
    reserved: product.inventory?.reserved ?? 0,
    reorderPoint: product.inventory?.reorderPoint ?? 0,
    supplier: product.inventory?.supplier || '',
    cost: product.inventory?.cost ?? 0,
  });

  useEffect(() => {
    if (!isEditing) {
      setEditingValues({
        stock: product.inventory?.stock ?? 0,
        reserved: product.inventory?.reserved ?? 0,
        reorderPoint: product.inventory?.reorderPoint ?? 0,
        supplier: product.inventory?.supplier || '',
        cost: product.inventory?.cost ?? 0,
      });
    }
  }, [product, isEditing]);

  const stock = product.inventory?.stock ?? 0;
  const reserved = product.inventory?.reserved ?? 0;
  const available = Math.max(stock - reserved, 0);
  const reorderPoint = product.inventory?.reorderPoint ?? 0;
  const supplier = product.inventory?.supplier || '-';
  const costLabel = formatCurrency(product.inventory?.cost ?? 0);
  const priceLabel = formatCurrency(product.price ?? 0);
  const statusClass = getStatusClassName(product.inventory?.status);
  const statusLabel = formatStatusLabel(product.inventory?.status || 'in-stock');

  const handleSave = async () => {
    try {
      await onUpdate(product, editingValues);
      setIsEditing(false);
    } catch (error) {
      // Error is handled in onUpdate
    }
  };

  const handleCancel = () => {
    setEditingValues({
      stock: product.inventory?.stock ?? 0,
      reserved: product.inventory?.reserved ?? 0,
      reorderPoint: product.inventory?.reorderPoint ?? 0,
      supplier: product.inventory?.supplier || '',
      cost: product.inventory?.cost ?? 0,
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="admin-table__row admin-table__row--editing">
        <span className="admin-text-mono">{product.sku}</span>
        <div>
          <p className="admin-table__primary">{product.name}</p>
          <p className="admin-table__secondary">{product.category}</p>
        </div>
        <input
          type="number"
          min="0"
          value={editingValues.stock}
          onChange={(e) => setEditingValues({ ...editingValues, stock: Number(e.target.value) || 0 })}
          className="admin-table__input"
        />
        <input
          type="number"
          min="0"
          value={editingValues.reserved}
          onChange={(e) => setEditingValues({ ...editingValues, reserved: Number(e.target.value) || 0 })}
          className="admin-table__input"
        />
        <span>{Math.max(editingValues.stock - editingValues.reserved, 0)}</span>
        <input
          type="number"
          min="0"
          value={editingValues.reorderPoint}
          onChange={(e) => setEditingValues({ ...editingValues, reorderPoint: Number(e.target.value) || 0 })}
          className="admin-table__input"
        />
        <input
          type="text"
          value={editingValues.supplier}
          onChange={(e) => setEditingValues({ ...editingValues, supplier: e.target.value })}
          className="admin-table__input"
          placeholder="공급업체"
        />
        <input
          type="number"
          min="0"
          value={editingValues.cost}
          onChange={(e) => setEditingValues({ ...editingValues, cost: Number(e.target.value) || 0 })}
          className="admin-table__input"
        />
        <span>{priceLabel}</span>
        <span className={`admin-status ${statusClass}`}>{statusLabel}</span>
        <div className="admin-table__actions">
          <button
            type="button"
            className="admin-table__action-button"
            onClick={handleSave}
          >
            저장
          </button>
          <button
            type="button"
            className="admin-table__action-button admin-table__action-button--ghost"
            onClick={handleCancel}
          >
            취소
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-table__row">
      <span className="admin-text-mono">{product.sku}</span>
      <div>
        <p className="admin-table__primary">{product.name}</p>
        <p className="admin-table__secondary">{product.category}</p>
      </div>
      <span>{stock}</span>
      <span>{reserved}</span>
      <span>{available}</span>
      <span>{reorderPoint}</span>
      <span>{supplier}</span>
      <span>{costLabel}</span>
      <span>{priceLabel}</span>
      <span className={`admin-status ${statusClass}`}>{statusLabel}</span>
      <div className="admin-table__actions">
        <button
          type="button"
          className="admin-table__action-button"
          onClick={() => setIsEditing(true)}
        >
          수정
        </button>
      </div>
    </div>
  );
}

const STAT_CARDS = [
  { label: 'Total Revenue', value: '$45,231', change: '+12.5%', trend: 'up', icon: DollarSign },
  { label: 'Orders', value: '1,234', change: '+8.2%', trend: 'up', icon: ShoppingCart },
  { label: 'Customers', value: '892', change: '+15.3%', trend: 'up', icon: UsersIcon },
  { label: 'Products', value: '156', change: '-2.4%', trend: 'down', icon: Package },
];

const REVENUE_TREND = [
  { month: 'Jan', revenue: 3200, orders: 89 },
  { month: 'Feb', revenue: 3800, orders: 102 },
  { month: 'Mar', revenue: 4200, orders: 118 },
  { month: 'Apr', revenue: 3900, orders: 95 },
  { month: 'May', revenue: 4800, orders: 134 },
  { month: 'Jun', revenue: 5200, orders: 145 },
];

const CATEGORY_SALES = [
  { category: 'Lighting', sales: 12500 },
  { category: 'Furniture', sales: 18200 },
  { category: 'Decor', sales: 8900 },
  { category: 'Textiles', sales: 6400 },
  { category: 'Stationery', sales: 4200 },
];

const ORDER_STATUS = [
  { name: 'Completed', value: 645, color: '#16a34a' },
  { name: 'Processing', value: 234, color: '#f59e0b' },
  { name: 'Shipped', value: 289, color: '#3b82f6' },
  { name: 'Cancelled', value: 66, color: '#ef4444' },
];

const TOP_PRODUCTS = [
  { name: 'Minimal Desk Lamp', sales: 234, revenue: 20826 },
  { name: 'Oak Coffee Table', sales: 156, revenue: 70200 },
  { name: 'Ceramic Vase', sales: 189, revenue: 8505 },
  { name: 'Wool Throw Blanket', sales: 145, revenue: 18125 },
  { name: 'Leather Notebook', sales: 267, revenue: 8544 },
];

const CUSTOMERS = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
    orders: 12,
    totalSpent: 1240,
    avgOrderValue: 103,
    lastOrder: '2024-01-13',
    joinDate: '2023-06-15',
    segment: 'VIP',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 (555) 234-5678',
    orders: 8,
    totalSpent: 890,
    avgOrderValue: 111,
    lastOrder: '2024-01-08',
    joinDate: '2023-08-22',
    segment: 'Regular',
    status: 'Active',
  },
  {
    id: 3,
    name: 'Michael Chen',
    email: 'm.chen@email.com',
    phone: '+1 (555) 345-6789',
    orders: 15,
    totalSpent: 2150,
    avgOrderValue: 143,
    lastOrder: '2024-01-12',
    joinDate: '2023-03-10',
    segment: 'VIP',
    status: 'Active',
  },
  {
    id: 4,
    name: 'Emma Wilson',
    email: 'emma.w@email.com',
    phone: '+1 (555) 456-7890',
    orders: 6,
    totalSpent: 670,
    avgOrderValue: 112,
    lastOrder: '2024-01-10',
    joinDate: '2023-09-05',
    segment: 'Regular',
    status: 'Active',
  },
  {
    id: 5,
    name: 'David Brown',
    email: 'david.brown@email.com',
    phone: '+1 (555) 567-8901',
    orders: 10,
    totalSpent: 1450,
    avgOrderValue: 145,
    lastOrder: '2024-01-14',
    joinDate: '2023-05-18',
    segment: 'VIP',
    status: 'Active',
  },
  {
    id: 6,
    name: 'Lisa Anderson',
    email: 'lisa.a@email.com',
    phone: '+1 (555) 678-9012',
    orders: 4,
    totalSpent: 380,
    avgOrderValue: 95,
    lastOrder: '2023-12-28',
    joinDate: '2023-10-12',
    segment: 'New',
    status: 'Active',
  },
  {
    id: 7,
    name: 'James Wilson',
    email: 'james.w@email.com',
    phone: '+1 (555) 789-0123',
    orders: 2,
    totalSpent: 178,
    avgOrderValue: 89,
    lastOrder: '2023-12-15',
    joinDate: '2023-11-20',
    segment: 'New',
    status: 'Inactive',
  },
];

const STATISTICS_HIGHLIGHTS = [
  { label: 'Avg Order Value', value: '$87.50', change: '+8.3%', trend: 'up', icon: DollarSign },
  { label: 'Conversion Rate', value: '3.8%', change: '+0.5%', trend: 'up', icon: TrendingUp },
  { label: 'Customer Lifetime Value', value: '$1,245', change: '+12.1%', trend: 'up', icon: UsersIcon },
  { label: 'Cart Abandonment', value: '68.2%', change: '-3.2%', trend: 'down', icon: ShoppingCart },
];

const MONTHLY_STATS = [
  { month: 'Jan', revenue: 12500, orders: 145, customers: 89, conversion: 3.2 },
  { month: 'Feb', revenue: 15200, orders: 178, customers: 102, conversion: 3.5 },
  { month: 'Mar', revenue: 18900, orders: 210, customers: 118, conversion: 3.8 },
  { month: 'Apr', revenue: 16700, orders: 192, customers: 95, conversion: 3.4 },
  { month: 'May', revenue: 21300, orders: 245, customers: 134, conversion: 4.1 },
  { month: 'Jun', revenue: 24800, orders: 289, customers: 145, conversion: 4.3 },
];

const TRAFFIC_SOURCES = [
  { source: 'Direct', visitors: 12450, conversions: 498, rate: 4.0 },
  { source: 'Organic Search', visitors: 18920, conversions: 757, rate: 4.0 },
  { source: 'Social Media', visitors: 8340, conversions: 250, rate: 3.0 },
  { source: 'Email', visitors: 5670, conversions: 340, rate: 6.0 },
  { source: 'Referral', visitors: 3210, conversions: 96, rate: 3.0 },
];

const ACQUISITION_DATA = [
  { month: 'Jan', newCustomers: 89, returningCustomers: 56 },
  { month: 'Feb', newCustomers: 102, returningCustomers: 76 },
  { month: 'Mar', newCustomers: 118, returningCustomers: 92 },
  { month: 'Apr', newCustomers: 95, returningCustomers: 97 },
  { month: 'May', newCustomers: 134, returningCustomers: 111 },
  { month: 'Jun', newCustomers: 145, returningCustomers: 144 },
];

const CATEGORY_PERFORMANCE = [
  { category: 'Lighting', revenue: 18500, orders: 234, avgOrder: 79, growth: 12.5 },
  { category: 'Furniture', revenue: 35200, orders: 156, avgOrder: 226, growth: 18.3 },
  { category: 'Home Decor', revenue: 14800, orders: 289, avgOrder: 51, growth: 8.7 },
  { category: 'Textiles', revenue: 12400, orders: 145, avgOrder: 86, growth: 15.2 },
  { category: 'Stationery', revenue: 8900, orders: 267, avgOrder: 33, growth: 6.4 },
];

const STATUS_CLASS_MAP = {
  Completed: 'admin-status--success',
  completed: 'admin-status--success',
  Paid: 'admin-status--success',
  paid: 'admin-status--success',
  Fulfilled: 'admin-status--info',
  fulfilled: 'admin-status--info',
  Shipped: 'admin-status--info',
  shipped: 'admin-status--info',
  Processing: 'admin-status--warning',
  processing: 'admin-status--warning',
  Pending: 'admin-status--warning',
  pending: 'admin-status--warning',
  'In Stock': 'admin-status--success',
  'Low Stock': 'admin-status--warning',
  Critical: 'admin-status--danger',
  Cancelled: 'admin-status--danger',
  cancelled: 'admin-status--danger',
  Refunded: 'admin-status--danger',
  refunded: 'admin-status--danger',
  Active: 'admin-status--success',
  Inactive: 'admin-status--warning',
};

const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
});

function formatCurrency(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) {
    return currencyFormatter.format(0);
  }
  return currencyFormatter.format(numeric);
}

function formatStatusLabel(status) {
  if (!status) {
    return '-';
  }

  return status
    .toString()
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusClassName(status) {
  if (!status) {
    return '';
  }

  const direct = STATUS_CLASS_MAP[status];
  if (direct) {
    return direct;
  }

  const lower = status.toString().toLowerCase();
  if (STATUS_CLASS_MAP[lower]) {
    return STATUS_CLASS_MAP[lower];
  }

  const titleCase = lower.replace(/\b\w/g, (char) => char.toUpperCase());
  if (STATUS_CLASS_MAP[titleCase]) {
    return STATUS_CLASS_MAP[titleCase];
  }

  return '';
}

const SEGMENT_CLASS_MAP = {
  VIP: 'admin-segment--vip',
  Regular: 'admin-segment--regular',
  New: 'admin-segment--new',
};

const NAV_DESCRIPTION = {
  Dashboard: 'Overview of your store performance',
  Sales: 'Monitor your revenue pipeline and orders',
  Inventory: 'Manage stock health across all products',
  Customers: 'View and manage customer information',
  Statistics: 'Detailed analytics and insights',
  Products: '신규 등록 상품 관리',
};

function AdminDashboard({
  user,
  onNavigateToStore,
  onLogout,
  onAddProduct = () => {},
  onEditProduct = () => {},
  initialNav = NAV_ITEMS[0],
  isLoggingOut = false,
}) {
  const [activeNav, setActiveNav] = useState(initialNav);
  const [activeRevenuePoint, setActiveRevenuePoint] = useState(REVENUE_TREND.at(-1));
  const [activeCategory, setActiveCategory] = useState(CATEGORY_SALES[0]);
  const [activeOrderStatus, setActiveOrderStatus] = useState(ORDER_STATUS[0]);
  const [productList, setProductList] = useState([]);
  const [productsStatus, setProductsStatus] = useState('idle');
  const [productsError, setProductsError] = useState('');
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [productPage, setProductPage] = useState(1);
  const [productPagination, setProductPagination] = useState({
    totalPages: 1,
    totalItems: 0,
  });
  const [salesOrders, setSalesOrders] = useState([]);
  const [salesStatus, setSalesStatus] = useState('idle');
  const [salesError, setSalesError] = useState('');
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState(null);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState(null);
  const [selectedSalesOrderStatus, setSelectedSalesOrderStatus] = useState('idle');
  const [salesPage, setSalesPage] = useState(1);
  const [salesPagination, setSalesPagination] = useState({
    totalPages: 1,
    totalItems: 0,
  });
  const [inventoryList, setInventoryList] = useState([]);
  const [inventoryStatus, setInventoryStatus] = useState('idle');
  const [inventoryError, setInventoryError] = useState('');
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryPagination, setInventoryPagination] = useState({
    totalPages: 1,
    totalItems: 0,
  });
  const [customersList, setCustomersList] = useState([]);
  const [customersStatus, setCustomersStatus] = useState('idle');
  const [customersError, setCustomersError] = useState('');
  const [customersPage, setCustomersPage] = useState(1);
  const [customersPagination, setCustomersPagination] = useState({
    totalPages: 1,
    totalItems: 0,
  });
  const [allCustomers, setAllCustomers] = useState([]); // VIP/Regular/New 계산용 전체 고객 목록

  // Dashboard 데이터 상태
  const [dashboardStats, setDashboardStats] = useState(null);
  const [dashboardStatsStatus, setDashboardStatsStatus] = useState('idle');
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [revenueTrendStatus, setRevenueTrendStatus] = useState('idle');
  const [categorySales, setCategorySales] = useState([]);
  const [categorySalesStatus, setCategorySalesStatus] = useState('idle');
  const [orderStatusDistribution, setOrderStatusDistribution] = useState([]);
  const [orderStatusStatus, setOrderStatusStatus] = useState('idle');
  const [topProducts, setTopProducts] = useState([]);
  const [topProductsStatus, setTopProductsStatus] = useState('idle');

  // Statistics 데이터 상태
  const [statisticsHighlights, setStatisticsHighlights] = useState(null);
  const [statisticsHighlightsStatus, setStatisticsHighlightsStatus] = useState('idle');
  const [statisticsData, setStatisticsData] = useState(null);
  const [statisticsDataStatus, setStatisticsDataStatus] = useState('idle');
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [categoryPerformanceStatus, setCategoryPerformanceStatus] = useState('idle');

  useEffect(() => {
    setActiveNav(initialNav);
  }, [initialNav]);

  const loadCustomers = useCallback(
    async (page = 1) => {
      try {
        setCustomersStatus('loading');
        setCustomersError('');
        const data = await getUsersApi({ page, limit: 10 });
        setCustomersList(data?.items ?? []);
        setCustomersPagination({
          totalPages: data?.totalPages ?? 1,
          totalItems: data?.totalItems ?? 0,
        });
        setCustomersPage(data?.page ?? page);
        setCustomersStatus('success');
      } catch (error) {
        setCustomersStatus('error');
        setCustomersError(error.message || '사용자 정보를 불러오지 못했습니다.');
      }
    },
    []
  );

  // VIP/Regular/New 계산을 위한 전체 고객 목록 로드
  const loadAllCustomers = useCallback(async () => {
    try {
      const data = await getUsersApi({ page: 1, limit: 1000, user_type: 'customer' });
      setAllCustomers(data?.items ?? []);
    } catch (error) {
      // 에러가 나도 무시 (요약 정보만 실패)
      console.error('Failed to load all customers for summary:', error);
    }
  }, []);

  useEffect(() => {
    if (activeNav !== 'Customers') {
      return;
    }
    if (customersStatus === 'idle') {
      loadCustomers(1);
      loadAllCustomers();
    }
  }, [activeNav, customersStatus, loadCustomers, loadAllCustomers]);

  const customerSummary = useMemo(() => {
    // 가입일 기준으로 세그먼트 계산
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const customers = allCustomers.filter((user) => user.user_type === 'customer');
    
    const vip = customers.filter((customer) => {
      const joinDate = customer.createdAt ? new Date(customer.createdAt) : null;
      return joinDate && joinDate < ninetyDaysAgo; // 90일 이상 된 고객
    }).length;

    const regular = customers.filter((customer) => {
      const joinDate = customer.createdAt ? new Date(customer.createdAt) : null;
      return joinDate && joinDate >= ninetyDaysAgo && joinDate < thirtyDaysAgo; // 30-90일 사이
    }).length;

    const newCustomers = customers.filter((customer) => {
      const joinDate = customer.createdAt ? new Date(customer.createdAt) : null;
      return joinDate && joinDate >= thirtyDaysAgo; // 30일 이내
    }).length;

    return {
      vip,
      regular,
      new: newCustomers,
    };
  }, [allCustomers]);

  const handleCustomersPageChange = useCallback(
    (direction) => {
      const nextPage = customersPage + direction;
      if (nextPage < 1 || nextPage > customersPagination.totalPages) {
        return;
      }
      loadCustomers(nextPage);
    },
    [customersPage, customersPagination.totalPages, loadCustomers]
  );

  const totalOrderEntries = useMemo(() => {
    if (orderStatusDistribution.length > 0) {
      return orderStatusDistribution.reduce((sum, status) => sum + status.value, 0);
    }
    return ORDER_STATUS.reduce((sum, status) => sum + status.value, 0);
  }, [orderStatusDistribution]);

  const loadProducts = useCallback(
    async (page = 1) => {
      try {
        setProductsStatus('loading');
        setProductsError('');
        const data = await fetchProducts(page, PRODUCTS_PAGE_SIZE);

        const totalPages = Math.max(data?.totalPages ?? 1, 1);
        const totalItems = data?.totalItems ?? 0;

        if (page > totalPages && totalPages > 0) {
          await loadProducts(totalPages);
          return;
        }

        setProductList(data?.items ?? []);
        setProductPagination({ totalPages, totalItems });
        setProductPage(data?.page ?? page);
        setProductsStatus('success');
      } catch (error) {
        setProductsStatus('error');
        setProductsError(error.message || '상품 목록을 불러오지 못했습니다.');
      } finally {
        setDeletingProductId(null);
      }
    },
    []
  );

  useEffect(() => {
    if (activeNav !== 'Products') {
      return;
    }
    loadProducts(1);
  }, [activeNav, loadProducts]);

  const handleProductPageChange = useCallback(
    (direction) => {
      const nextPage = productPage + direction;
      if (nextPage < 1 || nextPage > productPagination.totalPages) {
        return;
      }
      loadProducts(nextPage);
    },
    [productPage, productPagination.totalPages, loadProducts]
  );

  const loadInventory = useCallback(
    async (page = 1) => {
      try {
        setInventoryStatus('loading');
        setInventoryError('');
        // 모든 상품을 가져와서 인벤토리 정보 표시
        const data = await fetchProducts(page, 50);
        setInventoryList(data?.items ?? []);
        setInventoryPagination({
          totalPages: data?.totalPages ?? 1,
          totalItems: data?.totalItems ?? 0,
        });
        setInventoryPage(data?.page ?? page);
        setInventoryStatus('success');
      } catch (error) {
        setInventoryStatus('error');
        setInventoryError(error.message || '인벤토리 정보를 불러오지 못했습니다.');
      }
    },
    []
  );

  useEffect(() => {
    if (activeNav !== 'Inventory') {
      return;
    }
    if (inventoryStatus === 'idle') {
      loadInventory(1);
    }
  }, [activeNav, inventoryStatus, loadInventory]);

  const handleUpdateInventory = useCallback(
    async (product, updates) => {
      if (!product?._id) {
        return;
      }
      try {
        // inventory 필드만 업데이트 (서버에서 상태 자동 계산)
        const inventoryUpdate = {
          stock: updates.stock ?? product.inventory?.stock ?? 0,
          reserved: updates.reserved ?? product.inventory?.reserved ?? 0,
          reorderPoint: updates.reorderPoint ?? product.inventory?.reorderPoint ?? 0,
          supplier: updates.supplier ?? product.inventory?.supplier ?? '',
          cost: updates.cost ?? product.inventory?.cost ?? 0,
        };

        // inventory 필드만 업데이트
        await updateProduct(product._id, {
          inventory: inventoryUpdate,
        });
        
        // 업데이트 후 목록 새로고침
        await loadInventory(inventoryPage);
      } catch (error) {
        console.error('Inventory update error:', error);
        alert(error.message || '재고 정보를 수정하지 못했습니다.');
      }
    },
    [loadInventory, inventoryPage]
  );

  const handleInventoryPageChange = useCallback(
    (direction) => {
      const nextPage = inventoryPage + direction;
      if (nextPage < 1 || nextPage > inventoryPagination.totalPages) {
        return;
      }
      loadInventory(nextPage);
    },
    [inventoryPage, inventoryPagination.totalPages, loadInventory]
  );

  const loadSalesOrders = useCallback(
    async (page = 1) => {
      try {
        setSalesStatus('loading');
        setSalesError('');
        const data = await fetchOrdersApi({ page, limit: 20 });
        setSalesOrders(data?.items ?? []);
        setSalesPagination({
          totalPages: data?.totalPages ?? 1,
          totalItems: data?.totalItems ?? 0,
        });
        setSalesPage(data?.page ?? page);
        setSalesStatus('success');
      } catch (error) {
        setSalesStatus('error');
        setSalesError(error.message || '주문 정보를 불러오지 못했습니다.');
      }
    },
    []
  );

  useEffect(() => {
    if (salesStatus === 'idle' && (activeNav === 'Sales' || activeNav === 'Dashboard')) {
      loadSalesOrders(1);
    }
  }, [activeNav, salesStatus, loadSalesOrders]);

  const handleReloadSales = useCallback(() => {
    loadSalesOrders(salesPage);
  }, [loadSalesOrders, salesPage]);

  const handleSalesPageChange = useCallback(
    (direction) => {
      const nextPage = salesPage + direction;
      if (nextPage < 1 || nextPage > salesPagination.totalPages) {
        return;
      }
      loadSalesOrders(nextPage);
    },
    [salesPage, salesPagination.totalPages, loadSalesOrders]
  );

  useEffect(() => {
    if (activeNav !== 'Sales') {
      setSelectedSalesOrderId(null);
      setSelectedSalesOrder(null);
    }
  }, [activeNav]);

  // Dashboard 데이터 로드
  const loadDashboardData = useCallback(async () => {
    try {
      setDashboardStatsStatus('loading');
      const [stats, trend, category, status, top] = await Promise.all([
        getDashboardStats(),
        getRevenueTrend(),
        getCategorySales(),
        getOrderStatusDistribution(),
        getTopProducts(),
      ]);
      setDashboardStats(stats);
      setRevenueTrend(trend);
      setCategorySales(category);
      setOrderStatusDistribution(status);
      setTopProducts(top);
      setDashboardStatsStatus('success');
      setRevenueTrendStatus('success');
      setCategorySalesStatus('success');
      setOrderStatusStatus('success');
      setTopProductsStatus('success');

      // 초기 active 상태 설정
      if (trend.length > 0) {
        setActiveRevenuePoint(trend[trend.length - 1]);
      }
      if (category.length > 0) {
        setActiveCategory(category[0]);
      }
      if (status.length > 0) {
        setActiveOrderStatus(status[0]);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setDashboardStatsStatus('error');
      setRevenueTrendStatus('error');
      setCategorySalesStatus('error');
      setOrderStatusStatus('error');
      setTopProductsStatus('error');
    }
  }, []);

  useEffect(() => {
    if (activeNav === 'Dashboard' && dashboardStatsStatus === 'idle') {
      loadDashboardData();
    }
  }, [activeNav, dashboardStatsStatus, loadDashboardData]);

  // Statistics 데이터 로드
  const loadStatisticsData = useCallback(async () => {
    try {
      setStatisticsHighlightsStatus('loading');
      setStatisticsDataStatus('loading');
      setCategoryPerformanceStatus('loading');
      const [highlights, stats, performance] = await Promise.all([
        getStatisticsHighlights(),
        getStatisticsData(),
        getCategoryPerformance(),
      ]);
      setStatisticsHighlights(highlights);
      setStatisticsData(stats);
      setCategoryPerformance(performance);
      setStatisticsHighlightsStatus('success');
      setStatisticsDataStatus('success');
      setCategoryPerformanceStatus('success');
    } catch (error) {
      console.error('Failed to load statistics data:', error);
      setStatisticsHighlightsStatus('error');
      setStatisticsDataStatus('error');
      setCategoryPerformanceStatus('error');
    }
  }, []);

  useEffect(() => {
    if (activeNav === 'Statistics' && statisticsHighlightsStatus === 'idle') {
      loadStatisticsData();
    }
  }, [activeNav, statisticsHighlightsStatus, loadStatisticsData]);

  // 주문 상세 정보 로드
  useEffect(() => {
    if (!selectedSalesOrderId) {
      setSelectedSalesOrder(null);
      return;
    }

    let isMounted = true;

    async function loadOrderDetail() {
      try {
        setSelectedSalesOrderStatus('loading');
        const order = await fetchOrderById(selectedSalesOrderId);
        if (!isMounted) return;
        setSelectedSalesOrder(order);
        setSelectedSalesOrderStatus('success');
      } catch (error) {
        if (!isMounted) return;
        console.error('Failed to load order detail:', error);
        setSelectedSalesOrderStatus('error');
        // 에러가 나도 현재 페이지의 주문 정보로 대체 시도
        const localOrder = salesOrders.find(
          (o) => (o.orderNumber || o._id) === selectedSalesOrderId
        );
        if (localOrder) {
          setSelectedSalesOrder(localOrder);
          setSelectedSalesOrderStatus('success');
        }
      }
    }

    loadOrderDetail();

    return () => {
      isMounted = false;
    };
  }, [selectedSalesOrderId, salesOrders]);

  const handleSelectSalesOrder = useCallback((orderId) => {
    setSelectedSalesOrderId(orderId);
  }, []);

  const reloadCurrentPage = useCallback(() => {
    loadProducts(productPage);
  }, [loadProducts, productPage]);

  const handleDeleteProduct = useCallback(
    async (product) => {
      if (!product?._id) return;
      const confirmed = window.confirm(`[${product.name}] 상품을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`);
      if (!confirmed) return;

      try {
        setDeletingProductId(product._id);
        await deleteProduct(product._id);
        await loadProducts(productPage);
      } catch (error) {
        setProductsStatus('error');
        setProductsError(error.message || '상품 삭제에 실패했어요. 잠시 후 다시 시도해주세요.');
      } finally {
        setDeletingProductId(null);
      }
    },
    [loadProducts]
  );

  const renderDashboard = () => {
    // 통계 카드 데이터 계산
    const statCards = useMemo(() => {
      if (!dashboardStats) {
        return STAT_CARDS; // 기본값
      }

      const revenueChange = dashboardStats.revenueChange || 0;
      const ordersChange = dashboardStats.ordersChange || 0;
      const customersChange = dashboardStats.customersChange || 0;
      const productsChange = dashboardStats.productsChange || 0;

      return [
        {
          label: 'Total Revenue',
          value: formatCurrency(dashboardStats.totalRevenue || 0),
          change: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`,
          trend: revenueChange >= 0 ? 'up' : 'down',
          icon: DollarSign,
        },
        {
          label: 'Orders',
          value: dashboardStats.totalOrders?.toLocaleString() || '0',
          change: `${ordersChange >= 0 ? '+' : ''}${ordersChange.toFixed(1)}%`,
          trend: ordersChange >= 0 ? 'up' : 'down',
          icon: ShoppingCart,
        },
        {
          label: 'Customers',
          value: dashboardStats.totalCustomers?.toLocaleString() || '0',
          change: `${customersChange >= 0 ? '+' : ''}${customersChange.toFixed(1)}%`,
          trend: customersChange >= 0 ? 'up' : 'down',
          icon: UsersIcon,
        },
        {
          label: 'Products',
          value: dashboardStats.totalProducts?.toLocaleString() || '0',
          change: `${productsChange >= 0 ? '+' : ''}${productsChange.toFixed(1)}%`,
          trend: productsChange >= 0 ? 'up' : 'down',
          icon: Package,
        },
      ];
    }, [dashboardStats]);

    return (
      <>
        <section className="admin-section">
          <div className="admin-grid admin-grid--summary">
            {statCards.map((card) => {
              const Icon = card.icon;
              const isUp = card.trend === 'up';
              return (
                <article key={card.label} className="admin-card admin-card--stat">
                  <div className="admin-card__stat-icon">
                    <Icon className="admin-icon" />
                  </div>
                  <div className="admin-card__stat-body">
                    <p className="admin-card__label">{card.label}</p>
                    <p className="admin-card__value">{card.value}</p>
                  </div>
                  <div className={`admin-card__trend-badge ${isUp ? 'is-positive' : 'is-negative'}`}>
                    {isUp ? <TrendingUp className="admin-icon" /> : <TrendingDown className="admin-icon" />}
                    <span>{card.change}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

      <section className="admin-section admin-grid admin-grid--two">
        <article className="admin-card admin-card--chart">
          <header className="admin-card__header">
            <div>
              <h2>Revenue Trend</h2>
              <p>Monthly revenue performance</p>
            </div>
            <span className="admin-badge">{`${activeRevenuePoint.month} · ${formatCurrency(activeRevenuePoint.revenue)}`}</span>
          </header>
          <div className="admin-chart">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={revenueTrend.length > 0 ? revenueTrend : REVENUE_TREND}
                onMouseLeave={() =>
                  setActiveRevenuePoint(
                    revenueTrend.length > 0 ? revenueTrend[revenueTrend.length - 1] : REVENUE_TREND.at(-1)
                  )
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 12px 24px rgba(15,23,42,0.08)' }}
                  formatter={(value, name) => (name === 'revenue' ? [`$${value.toLocaleString()}`, 'Revenue'] : [value, 'Orders'])}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#111827"
                  fill="url(#revenueGradient)"
                  activeDot={{
                    r: 5,
                    onMouseEnter: (_, index) =>
                      setActiveRevenuePoint(
                        revenueTrend.length > 0 ? revenueTrend[index] : REVENUE_TREND[index]
                      ),
                  }}
                />
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111827" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
            <div className="admin-chart-details">
              <strong>{activeRevenuePoint.month}</strong>
              <span>{`Revenue: ${formatCurrency(activeRevenuePoint.revenue)}`}</span>
              <span>{`Orders: ${activeRevenuePoint.orders}`}</span>
            </div>
          </div>
        </article>

        <article className="admin-card admin-card--chart">
          <header className="admin-card__header">
            <div>
              <h2>Sales by Category</h2>
              <p>Current month performance</p>
            </div>
            <span className="admin-badge">{`${activeCategory.category} · ${formatCurrency(activeCategory.sales)}`}</span>
          </header>
          <div className="admin-chart">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={categorySales.length > 0 ? categorySales : CATEGORY_SALES}
                onMouseLeave={() =>
                  setActiveCategory(categorySales.length > 0 ? categorySales[0] : CATEGORY_SALES[0])
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="category" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  cursor={{ fill: 'rgba(17,24,39,0.04)' }}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 12px 24px rgba(15,23,42,0.08)' }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Sales']}
                />
                <Bar dataKey="sales">
                  {(categorySales.length > 0 ? categorySales : CATEGORY_SALES).map((entry, index) => (
                    <Cell
                      key={entry.category}
                      fill={activeCategory.category === entry.category ? '#4f46e5' : '#111827'}
                      onMouseEnter={() =>
                        setActiveCategory(
                          categorySales.length > 0 ? categorySales[index] : CATEGORY_SALES[index]
                        )
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="admin-chart-details">
            <strong>{activeCategory.category}</strong>
            <span>{`Revenue: ${formatCurrency(activeCategory.sales)}`}</span>
          </div>
        </article>
      </section>

      <section className="admin-section admin-grid admin-grid--two">
        <article className="admin-card admin-card--chart">
          <header className="admin-card__header">
            <div>
              <h2>Order Status Distribution</h2>
              <p>Fulfilment breakdown</p>
            </div>
          </header>
          <div className="admin-chart admin-chart--donut">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={orderStatusDistribution.length > 0 ? orderStatusDistribution : ORDER_STATUS}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  onMouseLeave={() =>
                    setActiveOrderStatus(
                      orderStatusDistribution.length > 0 ? orderStatusDistribution[0] : ORDER_STATUS[0]
                    )
                  }
                >
                  {(orderStatusDistribution.length > 0 ? orderStatusDistribution : ORDER_STATUS).map((entry) => (
                    <Cell key={entry.name} fill={entry.color} onMouseEnter={() => setActiveOrderStatus(entry)} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 12px 24px rgba(15,23,42,0.08)' }}
                  formatter={(value, name) => [`${value}`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="admin-chart-donut__center">
              <strong>{activeOrderStatus.name}</strong>
              <span>{`${Math.round((activeOrderStatus.value / totalOrderEntries) * 100)}%`}</span>
              <small>{`${activeOrderStatus.value} orders`}</small>
            </div>
            <div className="admin-chart-donut__legend">
              {(orderStatusDistribution.length > 0 ? orderStatusDistribution : ORDER_STATUS).map((status) => (
                <button
                  key={status.name}
                  type="button"
                  className={`admin-chart-donut__legend-item ${
                    activeOrderStatus.name === status.name ? 'is-active' : ''
                  }`}
                  onMouseEnter={() => setActiveOrderStatus(status)}
                >
                  <span className="admin-chart-donut__marker" style={{ backgroundColor: status.color }} />
                  <span>{`${status.name} · ${status.value}`}</span>
                </button>
              ))}
            </div>
          </div>
        </article>

        <article className="admin-card">
          <header className="admin-card__header">
            <div>
              <h2>Top Selling Products</h2>
              <p>Based on units sold</p>
            </div>
          </header>
          <div className="admin-table admin-table--products">
            <div className="admin-table__header">
              <span>Product</span>
              <span>Units Sold</span>
              <span>Revenue</span>
            </div>
            <div className="admin-table__body">
              {(topProducts.length > 0 ? topProducts : TOP_PRODUCTS).map((product) => (
                <div key={product.name} className="admin-table__row">
                  <span>{product.name}</span>
                  <span>{product.sales}</span>
                  <span>{formatCurrency(product.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="admin-section">
        <header className="admin-section__header admin-section__header--inline">
          <div className="admin-section__title">
            <TrendingUp className="admin-icon" />
            <h2>Recent Orders</h2>
          </div>
          <button
            type="button"
            className="admin-filter-button"
            onClick={handleReloadSales}
            disabled={salesStatus === 'loading'}
          >
            <Loader2 className={`admin-icon ${salesStatus === 'loading' ? 'admin-icon--spin' : ''}`} />
            새로고침
          </button>
        </header>
        <div className="admin-table admin-table--orders">
          <div className="admin-table__header">
            <span>Order ID</span>
            <span>Customer</span>
            <span>Product</span>
            <span>Qty</span>
            <span>Amount</span>
            <span>Payment</span>
            <span>Status</span>
            <span>Date</span>
          </div>
          <div className="admin-table__body">
            {salesStatus === 'loading' && salesOrders.length === 0 && (
              <div className="admin-empty-state">
                <Loader2 className="admin-icon admin-icon--spin" />
                <p>주문 데이터를 불러오는 중입니다...</p>
              </div>
            )}
            {salesStatus === 'error' && salesOrders.length === 0 && (
              <div className="admin-alert admin-alert--error">
                <AlertCircle className="admin-icon" />
                <div>
                  <strong>주문 목록을 불러오지 못했어요.</strong>
                  <p>{salesError}</p>
                </div>
                <button type="button" className="admin-filter-button" onClick={handleReloadSales}>
                  다시 시도
                </button>
              </div>
            )}
            {salesStatus === 'success' && salesOrders.length === 0 && (
              <div className="admin-empty-state">
                <ShoppingCart className="admin-icon" />
                <h3>아직 주문이 없습니다.</h3>
                <p>새로운 주문이 들어오면 이곳에서 확인할 수 있어요.</p>
              </div>
            )}
            {salesOrders.slice(0, 5).map((order) => {
              const orderId = order.orderNumber || order._id;
              const customerName = order.user?.name || order.guestName || '비회원';
              const firstItem = order.items?.[0];
              const productLabel = firstItem
                ? order.items.length > 1
                  ? `${firstItem.name} 외 ${order.items.length - 1}건`
                  : firstItem.name
                : '-';
              const totalQuantity = order.items?.reduce(
                (sum, item) => sum + (item.quantity || 0),
                0
              );
              const grandTotal = order.summary?.grandTotal ?? order.payment?.amount ?? 0;
              const amountLabel = formatCurrency(grandTotal);
              const paymentMethod = order.payment?.method
                ? order.payment.method.toUpperCase()
                : '-';
              const statusLabel = formatStatusLabel(order.status);
              const statusClass = getStatusClassName(order.status);
              const createdAt = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString('ko-KR')
                : '-';

              return (
                <div key={`dashboard-${orderId}`} className="admin-table__row">
                  <span className="admin-text-mono">{orderId}</span>
                  <div>
                    <p className="admin-table__primary">{customerName}</p>
                    <p className="admin-table__secondary">
                      {order.user?.email || order.contact?.email || order.guestEmail || '-'}
                    </p>
                  </div>
                  <span>{productLabel}</span>
                  <span>{totalQuantity}</span>
                  <span>{amountLabel}</span>
                  <span>{paymentMethod}</span>
                  <span className={`admin-status ${statusClass}`}>{statusLabel}</span>
                  <span>{createdAt}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      </>
    );
  };

  const renderSalesOrderDetail = () => {
    if (!selectedSalesOrderId) {
      return null;
    }

    if (selectedSalesOrderStatus === 'loading') {
      return (
        <section className="admin-section">
          <article className="admin-card">
            <div className="admin-loading-state">
              <Loader2 className="admin-icon admin-icon--spin" />
              <p>주문 상세 정보를 불러오는 중입니다...</p>
            </div>
          </article>
        </section>
      );
    }

    if (selectedSalesOrderStatus === 'error' || !selectedSalesOrder) {
      return (
        <section className="admin-section">
          <article className="admin-card">
            <div className="admin-alert admin-alert--error">
              <AlertCircle className="admin-icon" />
              <div>
                <strong>주문 상세 정보를 불러오지 못했습니다.</strong>
                <p>주문번호를 다시 확인해주세요.</p>
              </div>
              <button
                type="button"
                className="admin-filter-button"
                onClick={() => setSelectedSalesOrderId(null)}
              >
                닫기
              </button>
            </div>
          </article>
        </section>
      );
    }

    const orderId = selectedSalesOrder.orderNumber || selectedSalesOrder._id;
    const customerName = selectedSalesOrder.user?.name || selectedSalesOrder.guestName || '비회원';
    const contactEmail =
      selectedSalesOrder.user?.email ||
      selectedSalesOrder.contact?.email ||
      selectedSalesOrder.guestEmail ||
      '-';
    const contactPhone =
      selectedSalesOrder.user?.phone ||
      selectedSalesOrder.contact?.phone ||
      selectedSalesOrder.guestPhone ||
      '-';
    const paymentMethod = selectedSalesOrder.payment?.method
      ? selectedSalesOrder.payment.method.toUpperCase()
      : '-';
    const paymentStatusLabel = formatStatusLabel(
      selectedSalesOrder.payment?.status || selectedSalesOrder.status
    );
    const paymentStatusClass = getStatusClassName(
      selectedSalesOrder.payment?.status || selectedSalesOrder.status
    );
    const statusLabel = formatStatusLabel(selectedSalesOrder.status);
    const statusClass = getStatusClassName(selectedSalesOrder.status);
    const shipping = selectedSalesOrder.shipping || {};
    const shippingAddress = shipping.address || {};
    const shippingStatusLabel = formatStatusLabel(shipping.status || 'pending');
    const shippingStatusClass = getStatusClassName(shipping.status || 'pending');
    const shippingPaymentLabel = '-'; // 스키마에 prepaid 필드가 없음
    const addressParts = [
      shippingAddress.address1,
      shippingAddress.address2,
      shippingAddress.postalCode,
    ].filter(Boolean);
    const shippingAddressFull = addressParts.length > 0 ? addressParts.join(' ') : '-';
    const shippingMemo = shipping.request || selectedSalesOrder.notes || '-';
    const createdAt = selectedSalesOrder.createdAt
      ? new Date(selectedSalesOrder.createdAt).toLocaleString('ko-KR')
      : '-';
    const updatedAt = selectedSalesOrder.updatedAt
      ? new Date(selectedSalesOrder.updatedAt).toLocaleString('ko-KR')
      : '-';
    const detailItems = selectedSalesOrder.items ?? [];
    const totalQuantity = detailItems.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
    
    // 데이터베이스의 summary 값 사용 (계산하지 않음)
    const itemsSubtotal = Number(selectedSalesOrder.summary?.subtotal || 0);
    const shippingFee = Number(selectedSalesOrder.summary?.shippingFee || 0);
    const discountTotal = Number(selectedSalesOrder.summary?.discountTotal || 0);
    const tax = Number(selectedSalesOrder.summary?.tax || 0);
    const grandTotal = Number(
      selectedSalesOrder.summary?.grandTotal ?? 
      selectedSalesOrder.payment?.amount ?? 
      0
    );

    return (
      <section className="admin-section">
        <article className="admin-card">
          <header className="admin-card__header">
            <div>
              <h2>주문 상세</h2>
              <p className="admin-card__secondary">{`주문번호 ${orderId}`}</p>
            </div>
            <button
              type="button"
              className="admin-filter-button"
              onClick={() => setSelectedSalesOrderId(null)}
            >
              <X className="admin-icon" />
              닫기
            </button>
          </header>

          <div className="admin-grid admin-grid--two">
            <div className="admin-table admin-table--compact">
              <div className="admin-table__header">
                <span>주문 정보</span>
                <span />
              </div>
              <div className="admin-table__body">
                <div className="admin-table__row">
                  <span>주문 상태</span>
                  <span className={`admin-status ${statusClass}`}>{statusLabel}</span>
                </div>
                <div className="admin-table__row">
                  <span>결제 수단</span>
                  <span>{paymentMethod}</span>
                </div>
                <div className="admin-table__row">
                  <span>결제 상태</span>
                  <span className={`admin-status ${paymentStatusClass}`}>{paymentStatusLabel}</span>
                </div>
                <div className="admin-table__row">
                  <span>주문 일시</span>
                  <span>{createdAt}</span>
                </div>
                <div className="admin-table__row">
                  <span>업데이트</span>
                  <span>{updatedAt}</span>
                </div>
                <div className="admin-table__row">
                  <span>상품 수량</span>
                  <span>{totalQuantity}</span>
                </div>
                <div className="admin-table__row">
                  <span>상품 금액</span>
                  <span>{formatCurrency(itemsSubtotal)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="admin-table__row">
                    <span>할인 금액</span>
                    <span>-{formatCurrency(discountTotal)}</span>
                  </div>
                )}
                <div className="admin-table__row">
                  <span>배송비</span>
                  <span>{shippingFee > 0 ? formatCurrency(shippingFee) : '무료 배송'}</span>
                </div>
                {tax > 0 && (
                  <div className="admin-table__row">
                    <span>부가세</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                )}
                <div className="admin-table__row">
                  <span>총 결제금액</span>
                  <strong>{formatCurrency(grandTotal)}</strong>
                </div>
              </div>
            </div>

            <div className="admin-table admin-table--compact">
              <div className="admin-table__header">
                <span>고객 정보</span>
                <span />
              </div>
              <div className="admin-table__body">
                <div className="admin-table__row">
                  <span>고객명</span>
                  <span>{customerName}</span>
                </div>
                <div className="admin-table__row">
                  <span>이메일</span>
                  <span>{contactEmail}</span>
                </div>
                <div className="admin-table__row">
                  <span>연락처</span>
                  <span>{contactPhone}</span>
                </div>
                <div className="admin-table__row">
                  <span>메모</span>
                  <span>{shippingMemo}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-grid admin-grid--two">
            <div className="admin-table admin-table--compact">
              <div className="admin-table__header">
                <span>배송 정보</span>
                <span />
              </div>
              <div className="admin-table__body">
                <div className="admin-table__row">
                  <span>배송 상태</span>
                  <span className={`admin-status ${shippingStatusClass}`}>{shippingStatusLabel}</span>
                </div>
                <div className="admin-table__row">
                  <span>받는 사람</span>
                  <span>{shippingAddress.name || customerName || '-'}</span>
                </div>
                <div className="admin-table__row">
                  <span>전화번호</span>
                  <span>{shippingAddress.phone || contactPhone || '-'}</span>
                </div>
                <div className="admin-table__row">
                  <span>주소</span>
                  <span>{shippingAddressFull}</span>
                </div>
                <div className="admin-table__row">
                  <span>우편번호</span>
                  <span>{shippingAddress.postalCode || '-'}</span>
                </div>
                <div className="admin-table__row">
                  <span>배송 요청사항</span>
                  <span>{shipping.request || shippingMemo}</span>
                </div>
              </div>
            </div>

            <div className="admin-table admin-table--compact">
              <div className="admin-table__header">
                <span>기타 정보</span>
                <span />
              </div>
              <div className="admin-table__body">
                <div className="admin-table__row">
                  <span>결제 ID</span>
                  <span className="admin-text-mono">
                    {selectedSalesOrder.payment?.transactionId || '-'}
                  </span>
                </div>
                <div className="admin-table__row">
                  <span>배송 방법</span>
                  <span>{shipping.carrier || '-'}</span>
                </div>
                <div className="admin-table__row">
                  <span>배송비 결제</span>
                  <span>{shippingPaymentLabel}</span>
                </div>
                <div className="admin-table__row">
                  <span>추적 번호</span>
                  <span className="admin-text-mono">{shipping.trackingNumber || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-section__header">
            <div className="admin-section__title">
              <Package className="admin-icon" />
              <h3>주문 상품</h3>
            </div>
          </div>
          <div className="admin-table admin-table--compact">
            <div className="admin-table__header">
              <span>상품명</span>
              <span>옵션</span>
              <span>수량</span>
              <span>가격</span>
              <span>합계</span>
            </div>
            <div className="admin-table__body">
              {detailItems.length === 0 ? (
                <div className="admin-empty-state">
                  <Package className="admin-icon" />
                  <h4>상품 정보가 없습니다.</h4>
                </div>
              ) : (
                detailItems.map((item) => {
                  const unitPrice = item.unitPrice || 0;
                  const quantity = item.quantity || 0;
                  const lineDiscount = item.lineDiscount || 0;
                  const itemTotal = item.lineTotal || (unitPrice * quantity - lineDiscount);
                  return (
                    <div key={item._id || item.sku || item.name} className="admin-table__row">
                      <span>{item.name}</span>
                      <span>{item.options && typeof item.options === 'object' ? Object.values(item.options).join(', ') || '-' : '-'}</span>
                      <span>{quantity}</span>
                      <span>{formatCurrency(unitPrice)}</span>
                      <span>{formatCurrency(itemTotal)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </article>
      </section>
    );
  };

  const renderSales = () => (
    <>
      <section className="admin-section">
        <div className="admin-search-group">
          <div className="admin-search">
            <Search className="admin-search__icon" />
            <input className="admin-search__input" type="text" placeholder="Search orders..." />
          </div>
          <button type="button" className="admin-filter-button">
            <Filter className="admin-icon" />
            Filter
          </button>
        </div>
      </section>

      <section className="admin-section">
        <header className="admin-section__header admin-section__header--inline">
          <div className="admin-section__title">
            <TrendingUp className="admin-icon" />
            <h2>Sales Orders</h2>
          </div>
          <button
            type="button"
            className="admin-filter-button"
            onClick={handleReloadSales}
            disabled={salesStatus === 'loading'}
          >
            <Loader2 className={`admin-icon ${salesStatus === 'loading' ? 'admin-icon--spin' : ''}`} />
            새로고침
          </button>
        </header>
        <div className="admin-table admin-table--orders">
          <div className="admin-table__header">
            <span>Order ID</span>
            <span>Customer</span>
            <span>Product</span>
            <span>Qty</span>
            <span>Amount</span>
            <span>Payment</span>
            <span>Shipping</span>
            <span>Status</span>
            <span>Date</span>
          </div>
          <div className="admin-table__body">
            {salesStatus === 'loading' && (
              <div className="admin-empty-state">
                <Loader2 className="admin-icon admin-icon--spin" />
                <p>주문 데이터를 불러오는 중입니다...</p>
              </div>
            )}
            {salesStatus === 'error' && (
              <div className="admin-alert admin-alert--error">
                <AlertCircle className="admin-icon" />
                <div>
                  <strong>주문 목록을 불러오지 못했어요.</strong>
                  <p>{salesError}</p>
                </div>
                <button type="button" className="admin-filter-button" onClick={handleReloadSales}>
                  다시 시도
                </button>
              </div>
            )}
            {salesStatus === 'success' && salesOrders.length === 0 && (
              <div className="admin-empty-state">
                <ShoppingCart className="admin-icon" />
                <h3>아직 주문이 없습니다.</h3>
                <p>새로운 주문이 들어오면 이곳에서 확인할 수 있어요.</p>
              </div>
            )}
            {salesStatus === 'success' &&
              salesOrders.length > 0 &&
              salesOrders.map((order) => {
                const orderId = order.orderNumber || order._id;
                const customerName = order.user?.name || order.guestName || '비회원';
                const customerEmail =
                  order.user?.email || order.contact?.email || order.guestEmail || '-';
                const firstItem = order.items?.[0];
                const productLabel = firstItem
                  ? order.items.length > 1
                    ? `${firstItem.name} 외 ${order.items.length - 1}건`
                    : firstItem.name
                  : '-';
                const totalQuantity = order.items?.reduce(
                  (sum, item) => sum + (item.quantity || 0),
                  0
                );
                const grandTotal =
                  order.summary?.grandTotal ?? order.payment?.amount ?? 0;
                const amountLabel = formatCurrency(grandTotal);
                const paymentMethod = order.payment?.method
                  ? order.payment.method.toUpperCase()
                  : '-';
                const shippingFee = order.summary?.shippingFee ?? 0;
                const shippingLabel =
                  shippingFee > 0 ? formatCurrency(shippingFee) : '무료 배송';
                const statusLabel = formatStatusLabel(order.status);
                const statusClass = getStatusClassName(order.status);
                const createdAt = order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString('ko-KR')
                  : '-';

                const isSelected = selectedSalesOrderId === orderId;
                return (
                  <div key={orderId} className="admin-table__row">
                    <button
                      type="button"
                      className="admin-text-mono admin-table__link"
                      onClick={() => handleSelectSalesOrder(orderId)}
                      aria-pressed={isSelected}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        color: '#4f46e5',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        font: 'inherit',
                      }}
                    >
                      {orderId}
                    </button>
                    <div>
                      <p className="admin-table__primary">{customerName}</p>
                      <p className="admin-table__secondary">{customerEmail}</p>
                    </div>
                    <span>{productLabel}</span>
                    <span>{totalQuantity}</span>
                    <span>{amountLabel}</span>
                    <span>{paymentMethod}</span>
                    <span>{shippingLabel}</span>
                    <span className={`admin-status ${statusClass}`}>{statusLabel}</span>
                    <span>{createdAt}</span>
                  </div>
                );
              })}
          </div>
        </div>
        {salesPagination.totalPages > 1 && (
          <div className="admin-pagination">
            <button
              type="button"
              className="admin-pagination__button"
              onClick={() => handleSalesPageChange(-1)}
              disabled={salesPage <= 1 || salesStatus === 'loading'}
            >
              이전
            </button>
            <span className="admin-pagination__status">
              {salesPage} / {salesPagination.totalPages} (총 {salesPagination.totalItems}건)
            </span>
            <button
              type="button"
              className="admin-pagination__button"
              onClick={() => handleSalesPageChange(1)}
              disabled={
                salesPage >= salesPagination.totalPages || salesStatus === 'loading'
              }
            >
              다음
            </button>
          </div>
        )}
      </section>

      {renderSalesOrderDetail()}
    </>
  );

  const renderInventory = () => (
    <>
      <section className="admin-section">
        <div className="admin-search">
          <Search className="admin-search__icon" />
          <input className="admin-search__input" type="text" placeholder="Search products..." />
        </div>
      </section>

      <section className="admin-section">
        {inventoryStatus === 'loading' && (
          <div className="admin-empty-state">
            <Loader2 className="admin-icon admin-icon--spin" />
            <p>재고 정보를 불러오는 중입니다...</p>
          </div>
        )}
        {inventoryStatus === 'error' && (
          <div className="admin-alert admin-alert--error admin-alert--icon">
            <AlertCircle className="admin-icon" />
            <div>
              <strong>재고 정보를 불러오지 못했습니다.</strong>
              <p>{inventoryError}</p>
            </div>
            <button type="button" className="admin-filter-button" onClick={loadInventory}>
              다시 시도
            </button>
          </div>
        )}
        {inventoryStatus === 'success' && (
          <div className="admin-alert admin-alert--warning admin-alert--icon">
            <AlertTriangle className="admin-icon" />
            <div>
              <strong>Low Stock Alert</strong>
              <p>
                {inventoryList.filter((item) => getStatusClassName(item.inventory?.status) !== 'admin-status--success').length}
                개의 상품이 재주문 임계값 이하입니다.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="admin-section">
        <header className="admin-section__header admin-section__header--inline">
          <div className="admin-section__title">
            <Package className="admin-icon" />
            <h2>Inventory Management</h2>
          </div>
          <button
            type="button"
            className="admin-filter-button"
            onClick={() => loadInventory(inventoryPage)}
            disabled={inventoryStatus === 'loading'}
          >
            <Loader2 className={`admin-icon ${inventoryStatus === 'loading' ? 'admin-icon--spin' : ''}`} />
            새로고침
          </button>
        </header>
        <div className="admin-table admin-table--inventory">
          <div className="admin-table__header">
            <span>SKU</span>
            <span>Product</span>
            <span>Stock</span>
            <span>Reserved</span>
            <span>Available</span>
            <span>Reorder</span>
            <span>Supplier</span>
            <span>Cost</span>
            <span>Price</span>
            <span>Status</span>
            <span>관리</span>
          </div>
          <div className="admin-table__body">
            {inventoryStatus === 'success' && inventoryList.length === 0 ? (
              <div className="admin-empty-state">
                <Package className="admin-icon" />
                <h3>재고 상품이 없습니다.</h3>
                <p>상품을 등록하면 재고 현황을 이곳에서 관리할 수 있어요.</p>
              </div>
            ) : (
              inventoryList.map((item) => {
                const stock = item.inventory?.stock ?? 0;
                const reserved = item.inventory?.reserved ?? 0;
                const available = Math.max(stock - reserved, 0);
                const reorderPoint = item.inventory?.reorderPoint ?? 0;
                const supplier = item.inventory?.supplier || '-';
                const costLabel = formatCurrency(item.inventory?.cost ?? 0);
                const priceLabel = formatCurrency(item.price ?? 0);
                const statusClass = getStatusClassName(item.inventory?.status);
                const statusLabel = formatStatusLabel(item.inventory?.status || 'in-stock');

                return (
                  <InventoryRow
                    key={item._id}
                    product={item}
                    onUpdate={handleUpdateInventory}
                  />
                );
              })
            )}
          </div>
        </div>
        {inventoryPagination.totalPages > 1 && (
          <div className="admin-pagination">
            <button
              type="button"
              className="admin-pagination__button"
              onClick={() => handleInventoryPageChange(-1)}
              disabled={inventoryPage <= 1 || inventoryStatus === 'loading'}
            >
              이전
            </button>
            <span className="admin-pagination__status">
              {inventoryPage} / {inventoryPagination.totalPages}
            </span>
            <button
              type="button"
              className="admin-pagination__button"
              onClick={() => handleInventoryPageChange(1)}
              disabled={
                inventoryPage >= inventoryPagination.totalPages || inventoryStatus === 'loading'
              }
            >
              다음
            </button>
          </div>
        )}
      </section>
    </>
  );

  const renderCustomers = () => (
    <>
      <section className="admin-section">
        <div className="admin-search">
          <Search className="admin-search__icon" />
          <input className="admin-search__input" type="text" placeholder="Search customers..." />
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-grid admin-grid--summary">
          <article className="admin-card admin-card--summary-small">
            <p className="admin-card__label">VIP Customers</p>
            <p className="admin-card__value">{customerSummary.vip}</p>
          </article>
          <article className="admin-card admin-card--summary-small">
            <p className="admin-card__label">Regular Customers</p>
            <p className="admin-card__value">{customerSummary.regular}</p>
          </article>
          <article className="admin-card admin-card--summary-small">
            <p className="admin-card__label">New Customers</p>
            <p className="admin-card__value">{customerSummary.new}</p>
          </article>
        </div>
      </section>

      <section className="admin-section">
        <header className="admin-section__header admin-section__header--inline">
          <div className="admin-section__title">
            <Users className="admin-icon" />
            <h2>Customer Database</h2>
          </div>
          <button
            type="button"
            className="admin-filter-button"
            onClick={() => {
              loadCustomers(customersPage);
              loadAllCustomers();
            }}
            disabled={customersStatus === 'loading'}
          >
            <Loader2 className={`admin-icon ${customersStatus === 'loading' ? 'admin-icon--spin' : ''}`} />
            새로고침
          </button>
        </header>
        {customersStatus === 'loading' && customersList.length === 0 && (
          <div className="admin-empty-state">
            <Loader2 className="admin-icon admin-icon--spin" />
            <p>사용자 정보를 불러오는 중입니다...</p>
          </div>
        )}
        {customersStatus === 'error' && (
          <div className="admin-alert admin-alert--error">
            <AlertCircle className="admin-icon" />
            <div>
              <strong>사용자 정보를 불러오지 못했습니다.</strong>
              <p>{customersError}</p>
            </div>
            <button type="button" className="admin-filter-button" onClick={() => loadCustomers(customersPage)}>
              다시 시도
            </button>
          </div>
        )}
        {customersStatus === 'success' && customersList.length === 0 && (
          <div className="admin-empty-state">
            <Users className="admin-icon" />
            <h3>등록된 사용자가 없습니다.</h3>
            <p>사용자가 회원가입하면 이곳에서 확인할 수 있어요.</p>
          </div>
        )}
        {customersStatus === 'success' && customersList.length > 0 && (
          <>
            <div className="admin-table admin-table--customers">
              <div className="admin-table__header">
                <span>User</span>
                <span>Contact</span>
                <span>Type</span>
                <span>Orders</span>
                <span>Total Spent</span>
                <span>Avg Order</span>
                <span>Last Order</span>
                <span>Segment</span>
                <span>Status</span>
              </div>
              <div className="admin-table__body">
                {customersList.map((user) => {
                  const joinDate = user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('ko-KR')
                    : '-';
                  // 주문 정보는 아직 없으므로 임시 값
                  const orders = 0;
                  const totalSpent = 0;
                  const avgOrderValue = 0;
                  const lastOrder = '-';
                  
                  // 세그먼트 계산 (가입일 기준)
                  const now = new Date();
                  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                  const joinDateObj = user.createdAt ? new Date(user.createdAt) : null;
                  
                  let segment = 'New';
                  if (joinDateObj) {
                    if (joinDateObj < ninetyDaysAgo) {
                      segment = 'VIP';
                    } else if (joinDateObj >= ninetyDaysAgo && joinDateObj < thirtyDaysAgo) {
                      segment = 'Regular';
                    } else {
                      segment = 'New';
                    }
                  }
                  
                  const status = 'Active';
                  const isAdmin = user.user_type === 'admin';

                  return (
                    <div key={user._id || user.id} className="admin-table__row">
                      <div>
                        <p className="admin-table__primary">
                          {user.name}
                          {isAdmin && (
                            <span className="admin-badge" style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                              Admin
                            </span>
                          )}
                        </p>
                        <p className="admin-table__tertiary">{`Joined ${joinDate}`}</p>
                      </div>
                      <div>
                        <p className="admin-table__secondary">
                          <Mail className="admin-icon admin-icon--inline" />
                          {user.email}
                        </p>
                        {user.address && (
                          <p className="admin-table__secondary">
                            <Phone className="admin-icon admin-icon--inline" />
                            {user.address}
                          </p>
                        )}
                      </div>
                      <span className={isAdmin ? 'admin-status admin-status--info' : ''}>
                        {isAdmin ? 'Admin' : 'Customer'}
                      </span>
                      <span>{orders}</span>
                      <span>{formatCurrency(totalSpent)}</span>
                      <span>{formatCurrency(avgOrderValue)}</span>
                      <span className="admin-table__secondary">{lastOrder}</span>
                      {!isAdmin && (
                        <span className={`admin-segment ${SEGMENT_CLASS_MAP[segment] || ''}`}>{segment}</span>
                      )}
                      {isAdmin && <span>-</span>}
                      <span className={`admin-status ${STATUS_CLASS_MAP[status] || ''}`}>{status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {customersPagination.totalPages > 1 && (
              <div className="admin-pagination">
                <button
                  type="button"
                  className="admin-pagination__button"
                  onClick={() => handleCustomersPageChange(-1)}
                  disabled={customersPage <= 1 || customersStatus === 'loading'}
                >
                  이전
                </button>
                <span className="admin-pagination__status">
                  {customersPage} / {customersPagination.totalPages}
                </span>
                <button
                  type="button"
                  className="admin-pagination__button"
                  onClick={() => handleCustomersPageChange(1)}
                  disabled={
                    customersPage >= customersPagination.totalPages || customersStatus === 'loading'
                  }
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );

  const renderStatistics = () => {
    // Statistics 하이라이트 카드 데이터 계산
    const statisticsCards = useMemo(() => {
      if (!statisticsHighlights) {
        return STATISTICS_HIGHLIGHTS; // 기본값
      }

      return [
        {
          label: 'Avg Order Value',
          value: formatCurrency(statisticsHighlights.avgOrderValue || 0),
          change: `${statisticsHighlights.avgOrderValueChange >= 0 ? '+' : ''}${statisticsHighlights.avgOrderValueChange.toFixed(1)}%`,
          trend: statisticsHighlights.avgOrderValueChange >= 0 ? 'up' : 'down',
          icon: DollarSign,
        },
        {
          label: 'Conversion Rate',
          value: `${statisticsHighlights.conversionRate?.toFixed(1) || '0'}%`,
          change: `${statisticsHighlights.conversionRateChange >= 0 ? '+' : ''}${statisticsHighlights.conversionRateChange.toFixed(1)}%`,
          trend: statisticsHighlights.conversionRateChange >= 0 ? 'up' : 'down',
          icon: TrendingUp,
        },
        {
          label: 'Customer Lifetime Value',
          value: formatCurrency(statisticsHighlights.lifetimeValue || 0),
          change: `${statisticsHighlights.lifetimeValueChange >= 0 ? '+' : ''}${statisticsHighlights.lifetimeValueChange.toFixed(1)}%`,
          trend: statisticsHighlights.lifetimeValueChange >= 0 ? 'up' : 'down',
          icon: UsersIcon,
        },
        {
          label: 'Cart Abandonment',
          value: `${statisticsHighlights.cartAbandonmentRate?.toFixed(1) || '0'}%`,
          change: `${statisticsHighlights.cartAbandonmentChange >= 0 ? '+' : ''}${statisticsHighlights.cartAbandonmentChange.toFixed(1)}%`,
          trend: statisticsHighlights.cartAbandonmentChange >= 0 ? 'down' : 'up', // 이탈률은 낮을수록 좋음
          icon: ShoppingCart,
        },
      ];
    }, [statisticsHighlights]);

    return (
      <>
        <section className="admin-section">
          <div className="admin-grid admin-grid--summary">
            {statisticsCards.map((metric) => {
              const Icon = metric.icon;
              const isUp = metric.trend === 'up';
              return (
                <article key={metric.label} className="admin-card admin-card--stat">
                  <div className="admin-card__stat-icon">
                    <Icon className="admin-icon" />
                  </div>
                  <div className="admin-card__stat-body">
                    <p className="admin-card__label">{metric.label}</p>
                    <p className="admin-card__value">{metric.value}</p>
                  </div>
                  <div className={`admin-card__trend-badge ${isUp ? 'is-positive' : 'is-negative'}`}>
                    {isUp ? <TrendingUp className="admin-icon" /> : <TrendingDown className="admin-icon" />}
                    <span>{metric.change}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

      <section className="admin-section admin-grid admin-grid--two">
        <article className="admin-card admin-card--chart">
          <header className="admin-card__header">
            <div>
              <h2>Revenue &amp; Orders Trend</h2>
              <p>Detailed analytics and insights</p>
            </div>
            <BarChart3 className="admin-icon" />
          </header>
          <div className="admin-chart">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={statisticsData?.monthlyStats || MONTHLY_STATS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis yAxisId="left" stroke="#6b7280" />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 12px 24px rgba(15,23,42,0.08)' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#111827" strokeWidth={2} name="Revenue ($)" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#4f46e5" strokeWidth={2} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="admin-card admin-card--chart">
          <header className="admin-card__header">
            <div>
              <h2>Customer Acquisition</h2>
              <p>New vs returning customers</p>
            </div>
          </header>
          <div className="admin-chart">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statisticsData?.acquisitionData || ACQUISITION_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 12px 24px rgba(15,23,42,0.08)' }} />
                <Legend />
                <Bar dataKey="newCustomers" fill="#111827" name="New Customers" />
                <Bar dataKey="returningCustomers" fill="#d4d4d4" name="Returning Customers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="admin-section admin-grid admin-grid--two">
        <article className="admin-card admin-card--chart">
          <header className="admin-card__header">
            <div>
              <h2>Conversion Rate Trend</h2>
              <p>Monthly conversion performance</p>
            </div>
          </header>
          <div className="admin-chart">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={statisticsData?.monthlyStats || MONTHLY_STATS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" domain={[0, 6]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 12px 24px rgba(15,23,42,0.08)' }} />
                <Line type="monotone" dataKey="conversion" stroke="#111827" strokeWidth={2} name="Conversion Rate (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="admin-card">
          <header className="admin-card__header">
            <div>
              <h2>Traffic Sources &amp; Conversions</h2>
              <p>Monitor acquisition performance</p>
            </div>
          </header>
          <div className="admin-table admin-table--compact">
            <div className="admin-table__header">
              <span>Source</span>
              <span>Visitors</span>
              <span>Conversions</span>
              <span>Rate</span>
              <span>Performance</span>
            </div>
            <div className="admin-table__body">
              {TRAFFIC_SOURCES.map((traffic) => (
                <div key={traffic.source} className="admin-table__row">
                  <span>{traffic.source}</span>
                  <span>{traffic.visitors.toLocaleString()}</span>
                  <span>{traffic.conversions}</span>
                  <span>{`${traffic.rate}%`}</span>
                  <div className="admin-progress">
                    <div className="admin-progress__bar" style={{ width: `${traffic.rate * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="admin-section">
        <article className="admin-card">
          <header className="admin-card__header">
            <div>
              <h2>Category Performance</h2>
              <p>Revenue and growth by category</p>
            </div>
          </header>
          <div className="admin-table admin-table--compact">
            <div className="admin-table__header">
              <span>Category</span>
              <span>Revenue</span>
              <span>Orders</span>
              <span>Avg Order</span>
              <span>Growth</span>
            </div>
            <div className="admin-table__body">
              {(categoryPerformance.length > 0 ? categoryPerformance : CATEGORY_PERFORMANCE).map((category) => (
                <div key={category.category} className="admin-table__row">
                  <span>{category.category}</span>
                  <span>{formatCurrency(category.revenue)}</span>
                  <span>{category.orders}</span>
                  <span>{formatCurrency(category.avgOrder)}</span>
                  <span className={`admin-card__trend ${category.growth >= 0 ? 'is-positive' : 'is-negative'}`}>
                    {`${category.growth >= 0 ? '+' : ''}${category.growth}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>
      </>
    );
  };

  const renderProducts = () => (
    <>
      <section className="admin-section">
        <header className="admin-section__header admin-section__header--inline">
          <div className="admin-section__title">
            <Package className="admin-icon" />
            <h2>상품 관리</h2>
          </div>
          <button type="button" className="admin-filter-button" onClick={onAddProduct}>
            <Plus className="admin-icon" />
            새 상품 등록
          </button>
        </header>
        <div className="admin-card">
          {productsStatus === 'loading' && (
            <div className="admin-loading-state">
              <Loader2 className="admin-icon admin-icon--spin" />
              <p>상품 목록을 불러오는 중입니다...</p>
            </div>
          )}
          {productsStatus === 'error' && (
            <div className="admin-alert admin-alert--error">
              <AlertCircle className="admin-icon" />
              <div>
                <strong>목록을 불러오지 못했어요.</strong>
                <p>{productsError}</p>
              </div>
              <button
                type="button"
                className="admin-filter-button"
                onClick={reloadCurrentPage}
              >
                다시 시도
              </button>
            </div>
          )}
          {productsStatus === 'success' && productList.length === 0 && (
            <div className="admin-empty-state">
              <Package className="admin-icon" />
              <h3>등록된 상품이 없습니다.</h3>
              <p>새로운 상품을 등록하면 이곳에서 확인할 수 있어요.</p>
              <button type="button" className="admin-filter-button" onClick={onAddProduct}>
                <Plus className="admin-icon" />
                첫 상품 등록하기
              </button>
            </div>
          )}
          {productsStatus === 'success' && productList.length > 0 && (
            <div className="admin-table admin-table--inventory admin-table--products-list">
              <div className="admin-table__header">
                <span>이미지</span>
                <span>SKU</span>
                <span>상품명</span>
                <span>카테고리</span>
                <span>가격</span>
                <span>등록일</span>
                <span>관리</span>
              </div>
              <div className="admin-table__body">
                {productList.map((product) => (
                  <div key={product._id || product.sku} className="admin-table__row">
                    <span className="admin-table__image">
                      {product.image ? (
                        <img src={product.image} alt={product.name} loading="lazy" />
                      ) : (
                        <span className="admin-table__image--placeholder">No Image</span>
                      )}
                    </span>
                    <span className="admin-text-mono">{product.sku}</span>
                    <div>
                      <p className="admin-table__primary">{product.name}</p>
                      {product.description && (
                        <p className="admin-table__secondary admin-table__secondary--clamp">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <span>{product.category}</span>
                    <span>{`₩${Number(product.price).toLocaleString()}`}</span>
                    <span className="admin-table__secondary">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                    <div className="admin-table__actions">
                      <button
                        type="button"
                        className="admin-table__action-button"
                        onClick={() => onEditProduct(product)}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className="admin-table__action-button admin-table__action-button--danger"
                        disabled={deletingProductId === product._id}
                        onClick={() => handleDeleteProduct(product)}
                      >
                        {deletingProductId === product._id ? '삭제 중...' : '삭제'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="admin-pagination">
                <button
                  type="button"
                  className="admin-pagination__button"
                  onClick={() => handleProductPageChange(-1)}
                  disabled={productPage <= 1 || productsStatus === 'loading'}
                >
                  이전
                </button>
                <span className="admin-pagination__status">
                  {productPage} / {productPagination.totalPages}
                </span>
                <button
                  type="button"
                  className="admin-pagination__button"
                  onClick={() => handleProductPageChange(1)}
                  disabled={
                    productPage >= productPagination.totalPages || productsStatus === 'loading'
                  }
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );

  const activeContent = {
    Dashboard: renderDashboard(),
    Sales: renderSales(),
    Inventory: renderInventory(),
    Customers: renderCustomers(),
    Statistics: renderStatistics(),
    Products: renderProducts(),
  }[activeNav];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">Caurora Admin</div>
        <nav className="admin-sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              type="button"
              className={`admin-sidebar__nav-item ${activeNav === item ? 'is-active' : ''}`}
              onClick={() => setActiveNav(item)}
            >
              <span className="admin-sidebar__nav-bullet" />
              {item}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <div className="admin-user-card">
            <div className="admin-user-card__avatar">{user?.name?.[0] || 'U'}</div>
            <div>
              <p className="admin-user-card__name">{user?.name || 'Admin'}</p>
              <p className="admin-user-card__role">{user?.user_type || 'admin'}</p>
            </div>
          </div>
          <button type="button" className="admin-sidebar__logout" onClick={onLogout} disabled={isLoggingOut}>
            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__titles">
            <h1>{activeNav}</h1>
            <p>{NAV_DESCRIPTION[activeNav]}</p>
          </div>
          <div className="admin-topbar__actions">
            <button
              type="button"
              className="admin-topbar__button admin-topbar__button--primary"
              onClick={onAddProduct}
            >
              상품 등록
            </button>
            <button type="button" className="admin-topbar__button" onClick={onNavigateToStore}>
              Store
            </button>
            <button type="button" className="admin-topbar__button is-active">
              {activeNav}
            </button>
          </div>
        </header>

        <main className="admin-content">{activeContent}</main>
      </div>
    </div>
  );
}

export default AdminDashboard;

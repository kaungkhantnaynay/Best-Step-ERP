export type ProductStatus = "Active" | "Low stock" | "Draft" | "Archived";

export type OrderStatus =
  | "Draft"
  | "Reserved"
  | "Packed"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

export type ShipmentStatus =
  | "Pending"
  | "Assigned"
  | "In transit"
  | "Delayed"
  | "Delivered";

export type InventoryRisk = "Healthy" | "Watch" | "Low" | "Critical";

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  status: ProductStatus;
  stock: number;
  reorderPoint: number;
  warehouse: string;
  value: number;
};

export type InventoryItem = {
  id: string;
  product: string;
  sku: string;
  warehouse: string;
  bin: string;
  available: number;
  reserved: number;
  reorderPoint: number;
  risk: InventoryRisk;
  lastMovement: string;
};

export type Warehouse = {
  id: string;
  name: string;
  location: string;
  manager: string;
  utilization: number;
  activeBins: number;
  totalBins: number;
  dailyMoves: number;
};

export type WarehouseBin = {
  code: string;
  zone: string;
  product: string;
  quantity: number;
  status: "Open" | "Reserved" | "Full";
};

export type Order = {
  id: string;
  customer: string;
  status: OrderStatus;
  items: number;
  total: number;
  warehouse: string;
  owner: string;
  dueDate: string;
};

export type Shipment = {
  id: string;
  orderId: string;
  carrier: string;
  status: ShipmentStatus;
  destination: string;
  eta: string;
  progress: number;
};

export type Notification = {
  id: string;
  title: string;
  description: string;
  type: "Low stock" | "Shipment" | "Order" | "System";
  priority: "High" | "Medium" | "Low";
  time: string;
};

export type TimelineEvent = {
  id: string;
  title: string;
  description: string;
  time: string;
  status?: string;
};

export type Kpi = {
  label: string;
  value: string;
  change: string;
  tone: "positive" | "warning" | "neutral";
};

export type ChartPoint = {
  name: string;
  orders?: number;
  revenue?: number;
  inventory?: number;
  shipped?: number;
  delayed?: number;
  moves?: number;
};

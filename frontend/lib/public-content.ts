export const navLinks = [
  { href: "/", label: "Product" },
  { href: "/pricing", label: "Pricing" },
  { href: "/login", label: "Login" },
];

export const modules = [
  {
    title: "Inventory",
    description: "Track stock by SKU, bin, reorder point, and movement history.",
    stat: "12 low-stock items",
  },
  {
    title: "Warehouses",
    description: "See warehouse capacity, bin locations, transfers, and activity.",
    stat: "4 active sites",
  },
  {
    title: "Orders",
    description: "Reserve inventory, monitor order status, and reduce fulfillment delays.",
    stat: "86 open orders",
  },
  {
    title: "Shipments",
    description: "Follow assignments, carrier status, delivery progress, and timelines.",
    stat: "22 in transit",
  },
];

export const features = [
  {
    title: "Tenant-aware operations",
    description:
      "Designed for organization-scoped workflows across products, warehouses, orders, and shipments.",
  },
  {
    title: "Built for repeat work",
    description:
      "Dense tables, filters, status badges, timelines, and forms keep everyday work fast.",
  },
  {
    title: "Operational analytics",
    description:
      "Inventory value, shipment performance, warehouse activity, and sales trends stay visible.",
  },
];

export const testimonials = [
  {
    quote:
      "Best Step gives our warehouse and order teams one shared operating view.",
    name: "Operations Lead",
    company: "Regional distributor",
  },
  {
    quote:
      "The product feels built for people checking stock, orders, and shipment status all day.",
    name: "Fulfillment Manager",
    company: "Retail logistics team",
  },
];

export const plans = [
  {
    name: "Starter",
    price: "$49",
    description: "For small teams organizing products, inventory, and orders.",
    cta: "Start with Starter",
    featured: false,
    features: [
      "Product and category tracking",
      "Inventory tables and low-stock views",
      "Order and shipment workspace",
      "Basic analytics dashboard",
    ],
  },
  {
    name: "Operations",
    price: "$149",
    description: "For growing logistics teams with multiple warehouses.",
    cta: "Choose Operations",
    featured: true,
    features: [
      "Multi-warehouse management",
      "Bin-level inventory visibility",
      "Transfers and stock movement history",
      "Shipment timelines and alerts",
    ],
  },
  {
    name: "Scale",
    price: "Custom",
    description: "For larger teams that need controls, auditability, and support.",
    cta: "Talk to sales",
    featured: false,
    features: [
      "Advanced RBAC planning",
      "Audit logs and notifications",
      "Background report generation",
      "Priority implementation support",
    ],
  },
];

export const comparisonRows = [
  ["Products and categories", "Included", "Included", "Included"],
  ["Inventory and stock movements", "Included", "Included", "Included"],
  ["Warehouse and bin management", "Basic", "Advanced", "Advanced"],
  ["Shipment timelines", "Basic", "Included", "Included"],
  ["Audit logs and RBAC", "Planned", "Planned", "Advanced planning"],
];

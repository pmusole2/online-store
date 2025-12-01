/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  ShoppingBag,
  DollarSign,
  Clock,
  AlertCircle,
} from "lucide-react";
import { ROUTES, CONDITION_DISPLAY_NAMES } from "@/lib/constants";
import { formatZMW } from "@auto-marketplace/shared";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

type ProductStatus = "draft" | "active" | "sold" | "suspended";

const STATUS_CONFIG: Record<ProductStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "outline" },
  active: { label: "Active", variant: "default" },
  sold: { label: "Sold", variant: "secondary" },
  suspended: { label: "Suspended", variant: "destructive" },
};

export default function SellDashboardPage() {
  const { user, isSignedIn, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | ProductStatus>("all");

  // Get seller's products
  const products = useQuery(
    api.products.getProductsBySeller,
    user?._id ? { sellerId: user._id } : "skip"
  );

  // Get seller's orders (sales)
  const sellerOrders = useQuery(
    api.orders.getSellerOrders,
    user?._id ? { sellerId: user._id } : "skip"
  );

  // Loading state
  if (authLoading || (isSignedIn && (products === undefined || sellerOrders === undefined))) {
    return <SellDashboardSkeleton />;
  }

  // Not signed in
  if (!isSignedIn) {
    return (
      <div className="container flex flex-col items-center justify-center py-16">
        <Package className="h-16 w-16 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Start Selling</h1>
        <p className="mt-2 text-muted-foreground">
          Please sign in to manage your listings
        </p>
        <Button asChild className="mt-6">
          <Link href={ROUTES.SIGN_IN}>Sign In</Link>
        </Button>
      </div>
    );
  }

  // Calculate stats
  const stats = {
    totalListings: products?.length || 0,
    activeListings: products?.filter((p) => p.status === "active").length || 0,
    totalSales: sellerOrders?.filter((o) => o.status === "completed").length || 0,
    totalRevenue: sellerOrders
      ?.filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + o.sellerPayout, 0) || 0,
    pendingOrders: sellerOrders?.filter((o) =>
      ["paid", "processing"].includes(o.status)
    ).length || 0,
  };

  // Filter products based on tab
  const filteredProducts = products?.filter((product) => {
    if (activeTab === "all") return true;
    return product.status === activeTab;
  });

  return (
    <div className="container py-6">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={ROUTES.HOME}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Sell</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Seller Dashboard</h1>
        <Button asChild>
          <Link href={ROUTES.CREATE_LISTING}>
            <Plus className="mr-2 h-4 w-4" />
            Create Listing
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalListings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeListings} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              Completed orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatZMW(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From completed sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Orders Alert */}
      {stats.pendingOrders > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium">You have {stats.pendingOrders} pending orders</p>
                <p className="text-sm text-muted-foreground">
                  Process them to keep buyers happy
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href={ROUTES.SELLER_ORDERS}>View Orders</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Listings</CardTitle>
          <CardDescription>
            Manage your product listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({products?.length || 0})</TabsTrigger>
              <TabsTrigger value="active">
                Active ({products?.filter((p) => p.status === "active").length || 0})
              </TabsTrigger>
              <TabsTrigger value="draft">
                Draft ({products?.filter((p) => p.status === "draft").length || 0})
              </TabsTrigger>
              <TabsTrigger value="sold">
                Sold ({products?.filter((p) => p.status === "sold").length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {!filteredProducts || filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">
                    No listings in this category
                  </p>
                  <Button asChild className="mt-4">
                    <Link href={ROUTES.CREATE_LISTING}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Listing
                    </Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const statusConfig = STATUS_CONFIG[product.status as ProductStatus];

                      return (
                        <TableRow key={product._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                                <img
                                  src={product.images?.[0] || "/placeholder.png"}
                                  alt={product.title}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <Link
                                  href={ROUTES.PRODUCT(product._id)}
                                  className="font-medium hover:underline line-clamp-1"
                                >
                                  {product.title}
                                </Link>
                                <p className="text-xs text-muted-foreground">
                                  {CONDITION_DISPLAY_NAMES[product.condition]}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{formatZMW(product.price)}</span>
                            {product.compareAtPrice && (
                              <span className="ml-2 text-sm text-muted-foreground line-through">
                                {formatZMW(product.compareAtPrice)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusConfig?.variant}>
                              {statusConfig?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell>{product.views}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDistanceToNow(product.createdAt, { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={ROUTES.PRODUCT(product._id)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={ROUTES.EDIT_LISTING(product._id)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function SellDashboardSkeleton() {
  return (
    <div className="container py-6">
      <Skeleton className="mb-6 h-4 w-32" />
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}

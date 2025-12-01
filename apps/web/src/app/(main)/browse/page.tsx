"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductGrid } from "@/components/product/ProductGrid";
import {
  ProductFilters,
  ProductSortSelect,
  FilterState,
} from "@/components/product/ProductFilters";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ChevronRight, LayoutGrid, List, Car, Laptop, Wrench, Package } from "lucide-react";
import { ROUTES } from "@/lib/constants";

const categoryIcons: Record<string, React.ElementType> = {
  "auto-parts": Car,
  "car-accessories": Wrench,
  "tech-electronics": Laptop,
  "general": Package,
};

export default function BrowsePage() {
  const [filters, setFilters] = useState<FilterState>({
    conditions: [],
    priceMin: 0,
    priceMax: 100000,
    province: "",
    sortBy: "newest",
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Get categories
  const categories = useQuery(api.categories.getParentCategories);

  // Get products with filters
  const products = useQuery(api.products.getRecentProducts, { limit: 24 });

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
            <BreadcrumbPage>Browse</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 lg:shrink-0">
          {/* Categories */}
          <div className="mb-6">
            <h2 className="mb-4 text-lg font-semibold">Categories</h2>
            {categories === undefined ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => {
                  const Icon = categoryIcons[category.slug] || Package;
                  return (
                    <Link key={category._id} href={ROUTES.CATEGORY(category.slug)}>
                      <Card className="transition-colors hover:bg-muted/50">
                        <CardContent className="flex items-center gap-3 p-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{category.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Browse products
                            </p>
                          </div>
                          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="hidden lg:block">
            <h2 className="mb-4 text-lg font-semibold">Filters</h2>
            <ProductFilters filters={filters} onFiltersChange={setFilters} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">All Products</h1>
              <p className="text-muted-foreground">
                {products?.length ?? 0} products available
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile Filters */}
              <div className="lg:hidden">
                <ProductFilters filters={filters} onFiltersChange={setFilters} />
              </div>

              {/* Sort */}
              <ProductSortSelect
                value={filters.sortBy}
                onChange={(value) => setFilters({ ...filters, sortBy: value })}
              />

              {/* View Mode Toggle */}
              <div className="hidden items-center rounded-lg border p-1 sm:flex">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <ProductGrid
            products={products}
            columns={viewMode === "grid" ? 3 : 2}
            emptyMessage="No products found. Try adjusting your filters."
          />

          {/* Load More */}
          {products && products.length >= 24 && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline">Load More Products</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

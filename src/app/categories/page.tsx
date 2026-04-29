import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { categories, transactions } from "@/server/demo-data";

export default function CategoriesPage() {
  return (
    <>
      <PageHeader
        title="Categories"
        description="User-owned category system. Uncategorised is protected and all unmatched transactions land there."
      />
      <Panel title="Category management">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const count = transactions.filter((transaction) => transaction.categoryId === category.id).length;
            return (
              <div key={category.id} className="rounded-md border border-[var(--border)] bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm" style={{ background: category.color }} />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  {category.isSystem ? <StatusBadge tone="warning">System</StatusBadge> : <StatusBadge>Edit</StatusBadge>}
                </div>
                <div className="mt-2 text-xs text-[var(--muted)]">{count} transactions assigned</div>
              </div>
            );
          })}
        </div>
      </Panel>
    </>
  );
}

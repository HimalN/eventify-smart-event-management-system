import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
  label?: string;
  className?: string;
}

export function PaginationControls({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = [6, 9, 18, 27],
  label = "items",
  className = "",
}: PaginationControlsProps) {
  if (total <= 0) return null;

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  // Generate page numbers to display with smart windowing
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxButtons = 5;
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div
      className={`mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs ${className}`}
    >
      <div className="text-xs text-muted-foreground">
        Showing <strong className="text-foreground font-semibold">{startRecord}</strong> to{" "}
        <strong className="text-foreground font-semibold">{endRecord}</strong> of{" "}
        <strong className="text-foreground font-semibold">{total}</strong> {label}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onLimitChange && (
          <div className="flex items-center gap-1.5 mr-2">
            <span className="text-[11px] text-muted-foreground">Per page:</span>
            <Select
              value={String(limit)}
              onValueChange={(val) => onLimitChange(Number(val))}
            >
              <SelectTrigger className="h-8 text-xs w-20 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {limitOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)} className="text-xs">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {/* First Page */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg"
              disabled={!hasPrev || page === 1}
              onClick={() => onPageChange(1)}
              title="First page"
            >
              <ChevronsLeft className="size-4" />
              <span className="sr-only">First page</span>
            </Button>

            {/* Prev Page */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 rounded-lg text-xs gap-1"
              disabled={!hasPrev}
              onClick={() => onPageChange(Math.max(1, page - 1))}
            >
              <ChevronLeft className="size-3.5" /> Prev
            </Button>

            {/* Page Number Buttons */}
            <div className="flex items-center gap-1 mx-0.5">
              {getPageNumbers().map((num) => (
                <Button
                  key={num}
                  variant={num === page ? "default" : "outline"}
                  size="sm"
                  className={`h-8 w-8 p-0 rounded-lg text-xs font-semibold ${
                    num === page ? "bg-primary text-primary-foreground shadow-xs" : ""
                  }`}
                  onClick={() => onPageChange(num)}
                >
                  {num}
                </Button>
              ))}
            </div>

            {/* Next Page */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 rounded-lg text-xs gap-1"
              disabled={!hasNext}
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            >
              Next <ChevronRight className="size-3.5" />
            </Button>

            {/* Last Page */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg"
              disabled={!hasNext || page === totalPages}
              onClick={() => onPageChange(totalPages)}
              title="Last page"
            >
              <ChevronsRight className="size-4" />
              <span className="sr-only">Last page</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

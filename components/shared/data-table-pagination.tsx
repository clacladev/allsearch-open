'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/libs/utils/cn';

export function DataTablePagination({
  page,
  totalPages,
  onPageChange,
  className,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'border-border flex items-center justify-between gap-3 border-t px-4 py-3 md:px-6 md:py-1.5',
        className
      )}
    >
      <div className="flex flex-1 justify-start">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
          aria-label="Go to previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft aria-hidden="true" />
          <span className="hidden md:inline">Previous</span>
        </Button>
      </div>
      <span
        className="hidden size-10 items-center justify-center rounded-lg bg-muted text-sm font-medium text-foreground md:flex"
        aria-live="polite"
      >
        {page}
      </span>
      <span className="text-sm text-muted-foreground md:hidden" aria-live="polite">
        Page {page} of {totalPages}
      </span>
      <div className="flex flex-1 justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
          aria-label="Go to next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <span className="hidden md:inline">Next</span>
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';

import { Button } from '../button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../primitives/shadcn/select';
import { cn } from '../../utils/cn';

export type PaginationControlsProps = {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  summaryLabel: React.ReactNode;
  previousLabel: React.ReactNode;
  nextLabel: React.ReactNode;
  pageSizeLabel?: React.ReactNode;
  previousAriaLabel?: string;
  nextAriaLabel?: string;
  pageSizeAriaLabel?: string;
  isLoading?: boolean;
  className?: string;
};

export function PaginationControls({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
  summaryLabel,
  previousLabel,
  nextLabel,
  pageSizeLabel = 'Rows per page',
  previousAriaLabel,
  nextAriaLabel,
  pageSizeAriaLabel,
  isLoading = false,
  className,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      aria-busy={isLoading}
    >
      <div className="text-sm text-muted-foreground">{summaryLabel}</div>
      <div className="flex flex-wrap items-center gap-3">
        {onPageSizeChange ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{pageSizeLabel}</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
              disabled={isLoading}
            >
              <SelectTrigger
                className="h-8 w-[70px]"
                aria-label={
                  pageSizeAriaLabel ??
                  (typeof pageSizeLabel === 'string' ? pageSizeLabel : undefined)
                }
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={isFirstPage || isLoading}
            aria-label={
              previousAriaLabel ?? (typeof previousLabel === 'string' ? previousLabel : undefined)
            }
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            <span className="sr-only sm:not-sr-only sm:inline">{previousLabel}</span>
          </Button>
          <span className="min-w-[4rem] px-2 text-center text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={isLastPage || isLoading}
            aria-label={nextAriaLabel ?? (typeof nextLabel === 'string' ? nextLabel : undefined)}
          >
            <span className="sr-only sm:not-sr-only sm:inline">{nextLabel}</span>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}

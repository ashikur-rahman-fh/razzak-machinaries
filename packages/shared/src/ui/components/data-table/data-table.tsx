import * as React from 'react';

import { Table } from '../../primitives/shadcn/table';
import { cn } from '../../utils/cn';

export type DataTableProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  footer?: React.ReactNode;
  overlay?: React.ReactNode;
};

export function DataTable({ children, className, footer, overlay, ...props }: DataTableProps) {
  return (
    <div
      className={cn('rounded-lg border border-border bg-card shadow-card', className)}
      {...props}
    >
      {overlay}
      <Table>{children}</Table>
      {footer ? <div className="border-t border-border p-4">{footer}</div> : null}
    </div>
  );
}

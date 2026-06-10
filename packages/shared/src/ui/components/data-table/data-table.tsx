import * as React from 'react';

import { Table } from '../../primitives/shadcn/table';
import { cn } from '../../utils/cn';

export type DataTableProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function DataTable({ children, className, footer, ...props }: DataTableProps) {
  return (
    <div
      className={cn('rounded-lg border border-border bg-card shadow-card', className)}
      {...props}
    >
      <Table>{children}</Table>
      {footer ? <div className="border-t border-border p-4">{footer}</div> : null}
    </div>
  );
}

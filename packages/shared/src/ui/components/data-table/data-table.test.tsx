import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../primitives/shadcn/table';
import { DataTable } from './data-table';
import { DataTableRefreshBar } from './data-table-refresh-bar';

describe('DataTable', () => {
  it('renders overlay outside the table element', () => {
    const { container } = render(
      <DataTable data-testid="data-table" overlay={<DataTableRefreshBar />}>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ada</TableCell>
          </TableRow>
        </TableBody>
      </DataTable>,
    );

    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    expect(table?.querySelector('[aria-hidden="true"]')).toBeNull();

    const root = screen.getByTestId('data-table');
    expect(root.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});

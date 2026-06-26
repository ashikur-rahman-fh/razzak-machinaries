'use client';

import { type Customer } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  BilingualText,
  Button,
  cn,
  DataTable,
  DataTableRefreshBar,
  EmptyState,
  ErrorState,
  Skeleton,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { buildDetailUrl, buildEditUrl, type CustomerListState } from '../routes';
import {
  formatCustomerPhone,
  hasMediator,
  hasMemoPageNumber,
  truncateAddress,
  EMPTY_CELL_VALUE,
} from '../utils';
import { CustomerAvatar } from './CustomerAvatar';

type CustomerTableProps = {
  customers: Customer[];
  listState: CustomerListState;
  pageSize: number;
  isLoading: boolean;
  isRefreshing?: boolean;
  error: unknown;
  hasSearch: boolean;
  onRetry: () => void;
  onClearSearch: () => void;
  ariaHidden?: boolean;
};

function TableHeadLabel({ translationKey }: { translationKey: string }) {
  return <TranslatedText translationKey={translationKey} as="span" compact />;
}

function TableSkeletonRows({ columns, rowCount }: { columns: number; rowCount: number }) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }).map((__, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton className="h-4 w-full max-w-[120px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function CustomerTable({
  customers,
  listState,
  pageSize,
  isLoading,
  isRefreshing = false,
  error,
  hasSearch,
  onRetry,
  onClearSearch,
  ariaHidden = false,
}: CustomerTableProps) {
  const router = useRouter();
  const { language, displayMode } = useLanguagePreference();

  const columnCount = 7;

  if (error) {
    return (
      <div className="space-y-3">
        <ErrorState
          message={<TranslatedText translationKey="customer.list.loadError" as="span" />}
        />
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <TranslatedText translationKey="customer.actions.retry" as="span" compact />
        </Button>
      </div>
    );
  }

  if (!isLoading && customers.length === 0) {
    return (
      <EmptyState
        title={
          <TranslatedText
            translationKey={hasSearch ? 'customer.list.emptySearch' : 'customer.list.empty'}
            as="span"
            layout="inline"
          />
        }
        action={
          hasSearch ? (
            <button
              type="button"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              onClick={onClearSearch}
            >
              <TranslatedText translationKey="customer.actions.clearSearch" as="span" compact />
            </button>
          ) : (
            <Button asChild size="sm">
              <Link href="/customers/new">
                <TranslatedText translationKey="customer.list.createCustomer" as="span" compact />
              </Link>
            </Button>
          )
        }
      />
    );
  }

  return (
    <DataTable
      data-testid="customer-table"
      aria-busy={isRefreshing}
      className={cn('hidden lg:block', isRefreshing && 'relative opacity-60 transition-opacity')}
      aria-hidden={ariaHidden || undefined}
      overlay={isRefreshing ? <DataTableRefreshBar /> : undefined}
    >
      <TableHeader>
        <TableRow>
          <TableHead>
            <TableHeadLabel translationKey="customer.list.column.customer" />
          </TableHead>
          <TableHead>
            <TableHeadLabel translationKey="customer.field.phone" />
          </TableHead>
          <TableHead>
            <TableHeadLabel translationKey="customer.field.fatherName" />
          </TableHead>
          <TableHead>
            <TableHeadLabel translationKey="customer.field.address" />
          </TableHead>
          <TableHead>
            <TableHeadLabel translationKey="customer.field.mediatorName" />
          </TableHead>
          <TableHead>
            <TableHeadLabel translationKey="customer.field.memoPageNumber" />
          </TableHead>
          <TableHead className="w-[100px]">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && customers.length === 0 ? (
          <TableSkeletonRows columns={columnCount} rowCount={pageSize} />
        ) : (
          customers.map((customer) => {
            const detailHref = buildDetailUrl(customer.id, listState);
            const editHref = buildEditUrl(customer.id, listState);

            return (
              <TableRow
                key={customer.id}
                data-testid={`customer-row-${customer.id}`}
                className="cursor-pointer"
                onClick={() => router.push(detailHref)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    router.push(detailHref);
                  }
                }}
                tabIndex={0}
                role="link"
                aria-label={`${customer.fullNameEn}, ${formatCustomerPhone(customer)}`}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <CustomerAvatar
                      fullNameBn={customer.fullNameBn}
                      fullNameEn={customer.fullNameEn}
                      profilePictureUrl={customer.profilePictureUrl}
                    />
                    <div className="min-w-0">
                      <p className="font-bangla font-medium">{customer.fullNameBn}</p>
                      <p className="text-xs text-muted-foreground">{customer.fullNameEn}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{formatCustomerPhone(customer)}</TableCell>
                <TableCell>
                  <BilingualText
                    bn={customer.fatherNameBn}
                    en={customer.fatherNameEn}
                    mode={displayMode}
                    language={language}
                    layout="default"
                    as="span"
                    fallback={EMPTY_CELL_VALUE}
                  />
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <span className="font-bangla">{truncateAddress(customer.addressBn)}</span>
                </TableCell>
                <TableCell>
                  {hasMediator(customer) ? (
                    <BilingualText
                      bn={customer.mediatorNameBn}
                      en={customer.mediatorNameEn}
                      mode={displayMode}
                      language={language}
                      layout="default"
                      as="span"
                    />
                  ) : (
                    EMPTY_CELL_VALUE
                  )}
                </TableCell>
                <TableCell>
                  {hasMemoPageNumber(customer) ? (
                    <>
                      <span className="font-bangla">{customer.memoPageNumberBn}</span>
                      {customer.memoPageNumberEn !== customer.memoPageNumberBn ? (
                        <span className="block text-xs text-muted-foreground">
                          {customer.memoPageNumberEn}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    EMPTY_CELL_VALUE
                  )}
                </TableCell>
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <div className="flex gap-1">
                    <Button asChild variant="outline" size="sm">
                      <Link href={detailHref}>
                        <TranslatedText translationKey="customer.actions.view" as="span" compact />
                      </Link>
                    </Button>
                    {!customer.isArchived ? (
                      <Button asChild variant="outline" size="sm">
                        <Link href={editHref}>
                          <TranslatedText
                            translationKey="customer.actions.edit"
                            as="span"
                            compact
                          />
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </DataTable>
  );
}

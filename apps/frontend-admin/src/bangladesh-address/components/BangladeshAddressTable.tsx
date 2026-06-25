'use client';

import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  BilingualText,
  cn,
  DataTable,
  DataTableRefreshBar,
  EmptyState,
  RecoverableErrorState,
  Skeleton,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useState } from 'react';

import { getGeoConfig } from '../config';
import { getGeoDeleteErrorMessage } from '../errors';
import { buildDetailUrl, buildEditUrl } from '../routes';
import {
  type GeoListState,
  type GeoRecord,
  type GeoResourceType,
  type ParentLookupMap,
} from '../types';
import { AddressRecordActions } from './AddressRecordActions';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

type BangladeshAddressTableProps = {
  geoType: GeoResourceType;
  records: GeoRecord[];
  listState: GeoListState;
  parentLookup: ParentLookupMap;
  pageSize: number;
  isLoading: boolean;
  isRefreshing?: boolean;
  error: unknown;
  hasSearchOrFilters: boolean;
  onRetry: () => void;
  onClearSearch: () => void;
  onDeleteSuccess: () => void;
};

function TableHeadLabel({ translationKey }: { translationKey: string }) {
  return <TranslatedText translationKey={translationKey} as="span" compact />;
}

function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');
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

function ParentNameCell({
  parentLookup,
  parentId,
  language,
  displayMode,
}: {
  parentLookup: ParentLookupMap;
  parentId: number | undefined;
  language: 'en' | 'bn';
  displayMode: 'en' | 'bn' | 'both';
}) {
  if (parentId === undefined) {
    return <>—</>;
  }
  const parent = parentLookup.get(parentId);
  if (!parent) {
    return <>{String(parentId)}</>;
  }
  return (
    <BilingualText
      en={parent.nameEn}
      bn={parent.nameBn}
      mode={displayMode}
      language={language}
      as="span"
    />
  );
}

export function BangladeshAddressTable({
  geoType,
  records,
  listState,
  parentLookup,
  pageSize,
  isLoading,
  isRefreshing = false,
  error,
  hasSearchOrFilters,
  onRetry,
  onClearSearch,
  onDeleteSuccess,
}: BangladeshAddressTableProps) {
  const { language, displayMode, t } = useLanguagePreference();
  const config = getGeoConfig(geoType);
  const typeLabel = t(config.singularLabelKey);

  const [deleteTarget, setDeleteTarget] = useState<GeoRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const columnCount = geoType === 'divisions' ? 4 : 6;

  async function handleConfirmDelete() {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await config.delete(deleteTarget.id);
      setDeleteTarget(null);
      onDeleteSuccess();
    } catch (err) {
      setDeleteError(getGeoDeleteErrorMessage(err, language));
    } finally {
      setIsDeleting(false);
    }
  }

  if (error) {
    return (
      <RecoverableErrorState
        message={<TranslatedText translationKey="geo.list.loadError" as="span" />}
        onRetry={onRetry}
        retryLabel={<TranslatedText translationKey="geo.list.retry" as="span" compact />}
      />
    );
  }

  if (!isLoading && records.length === 0) {
    return (
      <EmptyState
        title={
          <TranslatedText
            translationKey={hasSearchOrFilters ? 'geo.list.emptySearch' : 'geo.list.empty'}
            as="span"
            layout="inline"
          />
        }
        action={
          hasSearchOrFilters ? (
            <button
              type="button"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              onClick={onClearSearch}
            >
              <TranslatedText translationKey="geo.actions.clearSearch" as="span" compact />
            </button>
          ) : undefined
        }
      />
    );
  }

  return (
    <>
      <DataTable
        data-testid="geo-address-table"
        aria-busy={isRefreshing}
        className={cn(isRefreshing && 'relative opacity-60 transition-opacity')}
        overlay={isRefreshing ? <DataTableRefreshBar /> : undefined}
      >
        <TableHeader>
          <TableRow>
            <TableHead>
              <TableHeadLabel translationKey="geo.field.sourceId" />
            </TableHead>
            <TableHead>
              <TableHeadLabel translationKey="geo.field.name" />
            </TableHead>
            <TableHead>
              <TableHeadLabel translationKey="geo.field.nameBn" />
            </TableHead>
            {geoType === 'districts' ? (
              <>
                <TableHead>
                  <TableHeadLabel translationKey="geo.field.division" />
                </TableHead>
                <TableHead>
                  <TableHeadLabel translationKey="geo.field.divisionSourceId" />
                </TableHead>
              </>
            ) : null}
            {geoType === 'upazilas' ? (
              <>
                <TableHead>
                  <TableHeadLabel translationKey="geo.field.district" />
                </TableHead>
                <TableHead>
                  <TableHeadLabel translationKey="geo.field.districtSourceId" />
                </TableHead>
              </>
            ) : null}
            {geoType === 'unions' ? (
              <>
                <TableHead>
                  <TableHeadLabel translationKey="geo.field.upazila" />
                </TableHead>
                <TableHead>
                  <TableHeadLabel translationKey="geo.field.upazilaSourceId" />
                </TableHead>
              </>
            ) : null}
            <TableHead className="w-[70px]">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && records.length === 0 ? (
            <TableSkeletonRows columns={columnCount} rowCount={pageSize} />
          ) : (
            records.map((record) => {
              const detailHref = buildDetailUrl(geoType, record.id, listState);
              const editHref = buildEditUrl(geoType, record.id, listState);

              return (
                <TableRow key={record.id} data-testid={`geo-row-${record.id}`}>
                  <TableCell className="font-mono text-sm">{record.id}</TableCell>
                  <TableCell>
                    <Link
                      href={detailHref}
                      className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label={interpolate(t('geo.actions.viewPlace'), {
                        name: record.nameEn,
                        type: typeLabel,
                      })}
                    >
                      <BilingualText
                        en={record.nameEn}
                        bn={record.nameBn}
                        mode={displayMode}
                        language={language}
                        as="span"
                      />
                    </Link>
                  </TableCell>
                  <TableCell className="font-bangla">{record.nameBn}</TableCell>
                  {geoType === 'districts' && 'divisionId' in record ? (
                    <>
                      <TableCell>
                        <ParentNameCell
                          parentLookup={parentLookup}
                          parentId={record.divisionId}
                          language={language}
                          displayMode={displayMode}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{record.divisionId}</TableCell>
                    </>
                  ) : null}
                  {geoType === 'upazilas' && 'districtId' in record ? (
                    <>
                      <TableCell>
                        <ParentNameCell
                          parentLookup={parentLookup}
                          parentId={record.districtId}
                          language={language}
                          displayMode={displayMode}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{record.districtId}</TableCell>
                    </>
                  ) : null}
                  {geoType === 'unions' && 'upazilaId' in record ? (
                    <>
                      <TableCell>
                        <ParentNameCell
                          parentLookup={parentLookup}
                          parentId={record.upazilaId}
                          language={language}
                          displayMode={displayMode}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{record.upazilaId}</TableCell>
                    </>
                  ) : null}
                  <TableCell>
                    <AddressRecordActions
                      viewHref={detailHref}
                      editHref={editHref}
                      onDelete={() => {
                        setDeleteError(null);
                        setDeleteTarget(record);
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </DataTable>

      {deleteTarget ? (
        <ConfirmDeleteModal
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => {
            if (!open && !isDeleting) {
              setDeleteTarget(null);
              setDeleteError(null);
            }
          }}
          recordName={deleteTarget.nameEn}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
          errorMessage={deleteError}
        />
      ) : null}
    </>
  );
}

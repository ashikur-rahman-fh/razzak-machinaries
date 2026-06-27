'use client';

import type { HalkhataInvitationGeneration } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  PaginationControls,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';

import { buildInvitationPrintUrl } from '../routes';

type InvitationGenerationHistoryProps = {
  halkhataId: number;
  generations: HalkhataInvitationGeneration[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onReuseSelection?: (generation: HalkhataInvitationGeneration) => void;
};

const MODE_LABEL_KEYS = {
  manual: 'halkhata.invitations.mode.manual',
  all_active: 'halkhata.invitations.mode.allActive',
  due_only: 'halkhata.invitations.mode.dueOnly',
} as const;

export function InvitationGenerationHistory({
  halkhataId,
  generations,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onReuseSelection,
}: InvitationGenerationHistoryProps) {
  const { language } = useLanguagePreference();

  return (
    <Card>
      <CardHeader>
        <TranslatedText
          translationKey="halkhata.invitations.historyTitle"
          as="div"
          className="text-lg font-semibold"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {generations.length === 0 ? (
          <EmptyState
            title={<TranslatedText translationKey="halkhata.invitations.historyEmpty" as="span" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <TranslatedText
                      translationKey="halkhata.invitations.history.generatedAt"
                      as="span"
                      compact
                    />
                  </TableHead>
                  <TableHead>
                    <TranslatedText
                      translationKey="halkhata.invitations.history.generatedBy"
                      as="span"
                      compact
                    />
                  </TableHead>
                  <TableHead>
                    <TranslatedText
                      translationKey="halkhata.invitations.history.mode"
                      as="span"
                      compact
                    />
                  </TableHead>
                  <TableHead>
                    <TranslatedText
                      translationKey="halkhata.invitations.history.count"
                      as="span"
                      compact
                    />
                  </TableHead>
                  <TableHead className="text-right">
                    <TranslatedText
                      translationKey="halkhata.invitations.history.actions"
                      as="span"
                      compact
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generations.map((generation) => (
                  <TableRow key={generation.id}>
                    <TableCell>
                      {new Date(generation.generatedAt).toLocaleString(
                        language === 'bn' ? 'bn-BD' : 'en-GB',
                      )}
                    </TableCell>
                    <TableCell>{generation.generatedByName ?? '—'}</TableCell>
                    <TableCell>
                      <TranslatedText
                        translationKey={MODE_LABEL_KEYS[generation.customerSelectionMode]}
                        as="span"
                        compact
                      />
                    </TableCell>
                    <TableCell className="tabular-nums">{generation.customerCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={buildInvitationPrintUrl(halkhataId, generation.id)}>
                            <TranslatedText
                              translationKey="halkhata.invitations.history.viewPrint"
                              as="span"
                              compact
                            />
                          </Link>
                        </Button>
                        {onReuseSelection ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onReuseSelection(generation)}
                          >
                            <TranslatedText
                              translationKey="halkhata.invitations.history.reuseSelection"
                              as="span"
                              compact
                            />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <PaginationControls
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
          summaryLabel={
            language === 'bn'
              ? `${totalCount} টির মধ্যে ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalCount)}`
              : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalCount)} of ${totalCount}`
          }
          previousLabel={language === 'bn' ? 'আগের' : 'Previous'}
          nextLabel={language === 'bn' ? 'পরের' : 'Next'}
        />
      </CardContent>
    </Card>
  );
}

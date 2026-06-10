'use client';

import { useTranslation } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';

type AddressRecordActionsProps = {
  viewHref: string;
  editHref: string;
  onDelete: () => void;
};

export function AddressRecordActions({ viewHref, editHref, onDelete }: AddressRecordActionsProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label={t('geo.actions.openMenu')}
        >
          <span aria-hidden className="text-base leading-none">
            ⋯
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={viewHref}>
            <TranslatedText translationKey="geo.actions.view" as="span" compact />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={editHref}>
            <TranslatedText translationKey="geo.actions.edit" as="span" compact />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={(event) => {
            event.preventDefault();
            onDelete();
          }}
        >
          <TranslatedText translationKey="geo.actions.delete" as="span" compact />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

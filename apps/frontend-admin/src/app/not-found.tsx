import { Button, EmptyState, TranslatedText } from '@razzak-machinaries/shared/ui';
import Link from 'next/link';

import { AdminAppShell } from '@/components/AdminAppShell';

export default function NotFound() {
  return (
    <AdminAppShell data-testid="admin-not-found-page" activeRoute="dashboard">
      <EmptyState
        title={<TranslatedText translationKey="notFound.title" as="span" />}
        description={<TranslatedText translationKey="notFound.description" as="span" />}
        action={
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
            <Button asChild>
              <Link href="/">
                <TranslatedText translationKey="nav.dashboard" as="span" compact />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/profile">
                <TranslatedText translationKey="notFound.backToProfile" as="span" compact />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/customers">
                <TranslatedText translationKey="notFound.viewCustomers" as="span" compact />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/bangladesh-address">
                <TranslatedText translationKey="notFound.viewBangladeshAddress" as="span" compact />
              </Link>
            </Button>
          </div>
        }
      />
    </AdminAppShell>
  );
}

from django.core.management.base import BaseCommand

from customers.models import Customer
from transactions.services import sync_customer_cached_balance


class Command(BaseCommand):
    help = "Recalculate cached_balance for all customers from transaction ledger."

    def handle(self, *args, **options):
        customer_ids = Customer.objects.values_list("id", flat=True)
        updated = 0
        for customer_id in customer_ids:
            sync_customer_cached_balance(customer_id)
            updated += 1
        self.stdout.write(self.style.SUCCESS(f"Recalculated balance for {updated} customer(s)."))

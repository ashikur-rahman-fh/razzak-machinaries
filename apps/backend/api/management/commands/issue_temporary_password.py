from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from api.admin.password_utils import generate_legacy_temporary_password
from api.admin.staff_profile import ensure_staff_profile

User = get_user_model()


class Command(BaseCommand):
    help = "Issue a one-time temporary password for an existing user (interactive or --username)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            help="Username to reset (skips interactive prompt).",
        )
        parser.add_argument(
            "--no-input",
            action="store_true",
            help="Do not prompt for confirmation (requires --username).",
        )

    def handle(self, *args, **options):
        username = options.get("username")
        no_input = options.get("no_input")

        if not username:
            username = input("Username: ").strip()
        if not username:
            raise CommandError("Username is required.")

        user = User.objects.filter(username=username).only("id", "username").first()
        if user is None:
            raise CommandError(f"No user found with username '{username}'.")

        if not no_input:
            confirm = input(f"Type 'yes' to reset password for {username}: ").strip().lower()
            if confirm != "yes":
                self.stdout.write("Password reset cancelled.")
                return

        try:
            temporary_password = generate_legacy_temporary_password(user=user)
        except RuntimeError as exc:
            raise CommandError(str(exc)) from exc
        user.set_password(temporary_password)
        user.save(update_fields=["password"])
        ensure_staff_profile(user, must_change_password=False)

        self.stdout.write(self.style.WARNING(f"Temporary password issued for user: {username}"))
        self.stdout.write(temporary_password)
        self.stdout.write(
            "This temporary password is shown only once. Share it securely and instruct "
            "the user to change it after login."
        )

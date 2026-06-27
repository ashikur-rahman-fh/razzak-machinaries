INVALID_CREDENTIALS_MESSAGE = "Invalid login details. Please check your credentials and try again."
ADMIN_FORBIDDEN_MESSAGE = "You do not have permission to access the admin area."

INVALID_CREDENTIALS_CODE = "INVALID_CREDENTIALS"
ADMIN_FORBIDDEN_CODE = "ADMIN_FORBIDDEN"
INVALID_CURRENT_PASSWORD_CODE = "INVALID_CURRENT_PASSWORD"
WEAK_PASSWORD_CODE = "WEAK_PASSWORD"

INVALID_CURRENT_PASSWORD_MESSAGE = "The current password is incorrect."
WEAK_PASSWORD_MESSAGE = "Please choose a stronger password."

MUST_CHANGE_PASSWORD_CODE = "MUST_CHANGE_PASSWORD"
MUST_CHANGE_PASSWORD_MESSAGE = (
    "You must change your temporary password before using this action. "
    "Use the change temporary password endpoint."
)
TEMPORARY_PASSWORD_NOT_REQUIRED_CODE = "TEMPORARY_PASSWORD_NOT_REQUIRED"
TEMPORARY_PASSWORD_NOT_REQUIRED_MESSAGE = (
    "Your account does not require a temporary password change."
)

PROFILE_FORBIDDEN_WRITE_KEYS = frozenset(
    {
        "id",
        "username",
        "password",
        "is_staff",
        "isStaff",
        "is_superuser",
        "isSuperuser",
        "is_active",
        "isActive",
        "groups",
        "user_permissions",
        "userPermissions",
        "last_login",
        "lastLogin",
        "date_joined",
        "dateJoined",
    }
)

SAFE_USER_RESPONSE_KEYS = frozenset(
    {
        "id",
        "name",
        "firstName",
        "lastName",
        "username",
        "email",
        "isStaff",
        "isSuperuser",
        "mustChangePassword",
    }
)

FORBIDDEN_USER_RESPONSE_KEYS = frozenset(
    {
        "password",
        "last_login",
        "date_joined",
        "groups",
        "user_permissions",
        "is_active",
    }
)

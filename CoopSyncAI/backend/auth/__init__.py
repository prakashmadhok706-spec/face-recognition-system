# Centralized Authentication and Security Package for CoopSync AI
from .security import hash_password, verify_password, migrate_plaintext_password
from .jwt_handler import (
    create_access_token, 
    create_refresh_token, 
    decode_token, 
    revoke_token, 
    is_token_revoked
)
from .dependencies import (
    get_current_user, 
    get_current_active_user, 
    get_optional_current_user
)
from .permissions import require_role, require_any_role, verify_ownership_or_roles

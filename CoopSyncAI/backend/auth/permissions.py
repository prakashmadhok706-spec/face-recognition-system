from fastapi import Depends, HTTPException, status
from typing import List, Set
from database import User
from .dependencies import get_current_user

# Role normalization mapping
ROLE_NORMALIZATION = {
    "admin": "admin",
    "institution_admin": "admin",
    "ncct_admin": "ncct_admin",
    "trainer": "trainer",
    "student": "student",
    "employer": "employer"
}

class RoleChecker:
    """Dependency that enforces role-based access control based on server-side token identity."""
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles: Set[str] = {
            ROLE_NORMALIZATION.get(r.strip().lower(), r.strip().lower()) 
            for r in allowed_roles
        }

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        user_role = ROLE_NORMALIZATION.get(
            (current_user.role or "").strip().lower(), 
            (current_user.role or "").strip().lower()
        )
        
        # NCCT Admin inherits administrative privileges
        if "admin" in self.allowed_roles and user_role == "ncct_admin":
            return current_user

        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: User role '{current_user.role}' lacks sufficient privileges. Required roles: {sorted(list(self.allowed_roles))}"
            )
        return current_user

def require_role(*roles: str):
    """Factory helper returning a RoleChecker dependency."""
    return RoleChecker(list(roles))

def require_any_role(*roles: str):
    """Alias for require_role."""
    return RoleChecker(list(roles))

def verify_ownership_or_roles(
    current_user: User, 
    target_student_id: str, 
    target_user_id: int = None,
    elevated_roles: List[str] = None
) -> bool:
    """
    Verify that current_user is either:
    1. The student themselves (sub matching target_student_id or user_id), OR
    2. An elevated role (e.g. trainer, admin, ncct_admin).
    Raises HTTPException(403) if unauthorized.
    """
    if elevated_roles is None:
        elevated_roles = ["trainer", "admin", "ncct_admin"]

    norm_elevated = {ROLE_NORMALIZATION.get(r, r) for r in elevated_roles}
    user_role = ROLE_NORMALIZATION.get((current_user.role or "").lower(), "")

    if user_role in norm_elevated:
        return True

    # Check student identity match
    is_same_student_id = (current_user.student_id and current_user.student_id == target_student_id)
    is_same_user_id = (target_user_id is not None and current_user.id == target_user_id)

    if is_same_student_id or is_same_user_id:
        return True

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied: You do not have permission to access another student's private records."
    )


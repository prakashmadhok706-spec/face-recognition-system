import os
import time
import jwt
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, Set
import logging

logger = logging.getLogger("coopsync.jwt")

# Secret key and algorithm configuration
# Read secret from environment variable; provide explicit fallback for local dev
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "coopsync_enterprise_jwt_sih2026_super_secure_key_1029384756")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")) # 1 hour default
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7")) # 7 days default
TOKEN_ISSUER = os.getenv("TOKEN_ISSUER", "coopsync-auth-service")
TOKEN_AUDIENCE = os.getenv("TOKEN_AUDIENCE", "coopsync-api")

# In-memory revocation set for revoked/logged-out JWT IDs (jti) or tokens
_REVOKED_TOKENS: Set[str] = set()

def create_access_token(
    user_id: int, 
    role: str, 
    email: str, 
    student_id: Optional[str] = None, 
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a signed HMAC-SHA256 access JWT."""
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    
    payload: Dict[str, Any] = {
        "sub": str(user_id),
        "user_id": user_id,
        "role": role.strip().lower(),
        "email": email.strip().lower(),
        "student_id": student_id,
        "type": "access",
        "iss": TOKEN_ISSUER,
        "aud": TOKEN_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp())
    }
    
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token

def create_refresh_token(
    user_id: int, 
    role: str, 
    email: str, 
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a signed HMAC-SHA256 refresh JWT."""
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    
    payload: Dict[str, Any] = {
        "sub": str(user_id),
        "user_id": user_id,
        "role": role.strip().lower(),
        "email": email.strip().lower(),
        "type": "refresh",
        "iss": TOKEN_ISSUER,
        "aud": TOKEN_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp())
    }
    
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token

def decode_token(token: str, expected_type: str = "access") -> Dict[str, Any]:
    """
    Decode and cryptographically validate a JWT.
    Validates signature, expiration, issuer, audience, and token type.
    Raises jwt.PyJWTError on any failure.
    """
    if is_token_revoked(token):
        raise jwt.InvalidTokenError("Token has been revoked or logged out.")

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
            audience=TOKEN_AUDIENCE,
            issuer=TOKEN_ISSUER,
            options={"require": ["exp", "iat", "sub", "role"]}
        )
    except jwt.ExpiredSignatureError:
        raise jwt.ExpiredSignatureError("Token has expired.")
    except jwt.InvalidTokenError as e:
        raise jwt.InvalidTokenError(f"Invalid token: {e}")

    # Validate token type
    token_type = payload.get("type", "access")
    if token_type != expected_type:
        raise jwt.InvalidTokenError(f"Expected token type '{expected_type}', got '{token_type}'.")

    return payload

def revoke_token(token: str) -> None:
    """Revoke a token (used during logout)."""
    if token:
        _REVOKED_TOKENS.add(token.strip())

def is_token_revoked(token: str) -> bool:
    """Check if token is present in the revocation list."""
    return token.strip() in _REVOKED_TOKENS


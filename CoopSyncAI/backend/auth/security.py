import os
import logging
import bcrypt
from typing import Tuple, Optional

logger = logging.getLogger("coopsync.security")

# BCRYPT work factor
BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", "12"))

def hash_password(password: str) -> str:
    """Securely hash a plaintext password using bcrypt with salt rounds."""
    if not password:
        raise ValueError("Password cannot be empty.")
    # Bcrypt truncates at 72 bytes; enforce UTF-8 encode and safety clamp
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")

def is_bcrypt_hash(value: str) -> bool:
    """Check if a string has the structure of a valid bcrypt hash."""
    if not value or not isinstance(value, str):
        return False
    return value.startswith(("$2a$", "$2b$", "$2y$")) and len(value) >= 59

def verify_and_migrate_password(plain_password: str, stored_hash: str) -> Tuple[bool, Optional[str]]:
    """
    Verify password against stored value.
    Supports transparent migration of existing legacy plaintext passwords without breaking accounts.
    Returns (is_valid, new_hash_to_save).
    If migration is needed, new_hash_to_save contains the freshly hashed bcrypt string.
    """
    if not plain_password or not stored_hash:
        return False, None

    pwd_bytes = plain_password.encode("utf-8")[:72]

    # 1. Stored value is already a bcrypt hash
    if is_bcrypt_hash(stored_hash):
        try:
            stored_bytes = stored_hash.encode("utf-8")
            is_valid = bcrypt.checkpw(pwd_bytes, stored_bytes)
            return is_valid, None
        except Exception as e:
            logger.error(f"Error during bcrypt verification: {e}")
            return False, None

    # 2. Legacy Plaintext Password Migration Path
    # Strictly match plain_password to stored string
    if plain_password == stored_hash:
        logger.info("Migrated legacy plaintext password to secure bcrypt hash.")
        new_hash = hash_password(plain_password)
        return True, new_hash

    return False, None

def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Simple verification helper returning a boolean."""
    is_valid, _ = verify_and_migrate_password(plain_password, stored_hash)
    return is_valid

def migrate_plaintext_password(plain_password: str) -> str:
    """Helper to convert a verified plaintext string to bcrypt."""
    return hash_password(plain_password)

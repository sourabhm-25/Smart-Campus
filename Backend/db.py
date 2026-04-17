# db.py — compatibility shim
# All collections now live in core/database.py (single MongoClient).
# This file is kept so existing imports (e.g. Retrieval_modular.py) don't break
# until they're updated to import from core.database directly.

from core.database import get_collection, db  # noqa: F401

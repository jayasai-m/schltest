import sys
import os
import shutil

# Determine paths
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "smart-school-iot", "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import tempfile

# Signal Vercel environment
os.environ["VERCEL"] = "1"
tmp_dir = "/tmp" if os.name != "nt" else tempfile.gettempdir()
upload_dir = os.path.join(tmp_dir, "uploads")
os.environ["UPLOAD_DIR"] = upload_dir
os.makedirs(upload_dir, exist_ok=True)

# Copy bundled SQLite database to writable temp directory on cold start or update
tmp_db = os.path.join(tmp_dir, "smart_school.db")
src_db = os.path.join(BACKEND_DIR, "smart_school.db")
if os.path.exists(src_db):
    if not os.path.exists(tmp_db) or os.path.getmtime(src_db) > os.path.getmtime(tmp_db):
        try:
            shutil.copy2(src_db, tmp_db)
            print(f">>> Copied updated smart_school.db to {tmp_db}")
        except Exception as e:
            print(f"Notice: Failed to copy SQLite db to temp: {e}")

# Copy bundled uploads to writable temp uploads directory on cold start
src_uploads = os.path.join(BACKEND_DIR, "uploads")
if os.path.exists(src_uploads):
    for f in os.listdir(src_uploads):
        sf = os.path.join(src_uploads, f)
        df = os.path.join(upload_dir, f)
        if os.path.isfile(sf) and not os.path.exists(df):
            try:
                shutil.copy2(sf, df)
            except Exception:
                pass

from app.main import app

import sqlite3
import os

DB_PATH = os.environ.get("DATABASE_URL") or os.environ.get("DATABASE_PATH") or os.path.join(os.path.dirname(__file__), "database.db")
# Simple cleanup for common connection string formats
if DB_PATH.startswith("sqlite:///"):
    DB_PATH = DB_PATH.replace("sqlite:///", "")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS user_profiles (
            user_id TEXT PRIMARY KEY,
            name TEXT,
            avatar_url TEXT,
            base_resume TEXT,
            personality_profile TEXT,
            subscription_tier TEXT DEFAULT 'free',
            credits INTEGER DEFAULT 5,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            title TEXT,
            company TEXT,
            description TEXT,
            posted_date TEXT,
            status TEXT DEFAULT 'pending_review',
            compatibility_score INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS applications (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
            company TEXT,
            title TEXT,
            status TEXT DEFAULT 'Saved',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS interviews (
            session_id TEXT PRIMARY KEY,
            user_id TEXT,
            job_title TEXT,
            status TEXT DEFAULT 'active',
            questions TEXT DEFAULT '[]',
            answers TEXT DEFAULT '[]',
            scores TEXT DEFAULT '[]',
            feedbacks TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS saved_artifacts (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            artifact_type TEXT,
            title TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS usage_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            service_type TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    conn.commit()
    conn.close()
    print("Local Database initialized successfully.")


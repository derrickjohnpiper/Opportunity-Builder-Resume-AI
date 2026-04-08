CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY,
    full_name TEXT,
    base_resume TEXT,
    linkedin_url TEXT,
    weekly_goal INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

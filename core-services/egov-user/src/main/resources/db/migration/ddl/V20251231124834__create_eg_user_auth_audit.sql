CREATE TABLE IF NOT EXISTS eg_user_auth_audit (
    id BIGSERIAL PRIMARY KEY,
    user_uuid VARCHAR(64),
    username VARCHAR(64),
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(128),
    action VARCHAR(32),
    status VARCHAR(16),
    request_url TEXT,
    created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_user_uuid
    ON eg_user_auth_audit(user_uuid);

CREATE INDEX IF NOT EXISTS idx_auth_audit_created_at
    ON eg_user_auth_audit(created_at);

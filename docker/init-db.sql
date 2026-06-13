-- Initialize platform schema for multi-tenant control plane
CREATE SCHEMA IF NOT EXISTS platform;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant permissions
GRANT ALL ON SCHEMA platform TO backent;
GRANT ALL ON SCHEMA public TO backent;

#!/bin/bash
# Complete PostgreSQL Setup Script

echo "Setting up PostgreSQL for Drawing Tool..."
echo ""

# Run commands as postgres user
sudo -u postgres psql << EOF
-- Drop and recreate user to ensure clean state
DROP USER IF EXISTS hyder;
CREATE USER hyder WITH PASSWORD 'drawing_tool_dev';

-- Drop and recreate database
DROP DATABASE IF EXISTS drawing_tool;
CREATE DATABASE drawing_tool OWNER hyder;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE drawing_tool TO hyder;

-- Connect to the database and set schema permissions
\c drawing_tool
GRANT ALL ON SCHEMA public TO hyder;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hyder;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hyder;

\q
EOF

echo ""
echo "✅ PostgreSQL setup complete!"
echo ""
echo "Database: drawing_tool"
echo "User: hyder"
echo "Password: drawing_tool_dev"
echo "Connection: postgresql://hyder:drawing_tool_dev@localhost:5432/drawing_tool"

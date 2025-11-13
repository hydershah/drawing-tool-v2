#!/bin/bash
# PostgreSQL Setup Script for Drawing Tool

echo "Setting up local PostgreSQL database..."

# Create PostgreSQL user
sudo -u postgres psql -c "CREATE USER hyder WITH PASSWORD 'drawing_tool_dev';" 2>/dev/null || echo "User 'hyder' already exists"

# Create database
sudo -u postgres psql -c "CREATE DATABASE drawing_tool OWNER hyder;" 2>/dev/null || echo "Database 'drawing_tool' already exists"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE drawing_tool TO hyder;"

echo "PostgreSQL setup complete!"
echo ""
echo "Database: drawing_tool"
echo "User: hyder"
echo "Password: drawing_tool_dev"
echo ""
echo "Connection string: postgresql://hyder:drawing_tool_dev@localhost:5432/drawing_tool"

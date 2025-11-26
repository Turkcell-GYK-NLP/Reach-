#!/bin/sh
set -e

echo "=========================================="
echo "🚀 REACH+ Docker Startup Script"
echo "=========================================="

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
    echo "⏳ Waiting for PostgreSQL to be ready..."
    
    # If DATABASE_URL exists, extract connection info from it
    if [ -n "$DATABASE_URL" ]; then
        # Extract host from DATABASE_URL
        # Format: postgresql://user:pass@host:port/dbname
        PG_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
        PG_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    else
        PG_HOST="$PGHOST"
        PG_PORT="${PGPORT:-5432}"
    fi
    
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if pg_isready -h "$PG_HOST" -p "$PG_PORT" > /dev/null 2>&1; then
            echo "✅ PostgreSQL is ready!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo "   Attempt $attempt/$max_attempts - PostgreSQL not ready yet..."
        sleep 2
    done
    
    echo "❌ ERROR: PostgreSQL did not become ready in time"
    exit 1
}

# Function to check if database exists and has tables
check_database() {
    echo "🔍 Checking database status..."
    
    # Check if users table exists with correct schema
    table_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='users';" 2>/dev/null | xargs)
    
    if [ "$table_count" = "1" ]; then
        # Check if password_hash column exists
        column_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='users' AND column_name='password_hash';" 2>/dev/null | xargs)
        
        if [ "$column_count" = "1" ]; then
            echo "✅ Database already initialized with correct schema"
            return 0
        else
            echo "⚠️  Database exists but schema is outdated"
            return 1
        fi
    else
        echo "⚠️  Database needs initialization"
        return 1
    fi
}

# Function to initialize database
init_database() {
    echo "🗄️  Initializing database schema..."
    
    cd /app
    
    # Create basic extensions first
    echo "   Creating PostgreSQL extensions..."
    psql "$DATABASE_URL" > /dev/null 2>&1 <<-EOSQL || echo "   ⚠️  Extension creation skipped (may already exist)"
		CREATE EXTENSION IF NOT EXISTS pgcrypto;
		CREATE EXTENSION IF NOT EXISTS citext;
	EOSQL
    
    echo "   Running migrations..."
    run_migrations
    
    echo "✅ Database schema created successfully"
}

# Function to create FAISS indices
init_faiss_indices() {
    echo "🔍 Initializing FAISS indices..."
    
    # Check if indices already exist
    if [ -f "/app/faiss_index/toplanma_alanlari.index" ] && [ -f "/app/faiss_index/ilkyardim.index" ]; then
        echo "✅ FAISS indices already exist, skipping creation"
        return 0
    fi
    
    echo "📊 Creating FAISS indices (this may take a few minutes)..."
    
    cd /python-app || cd /app
    
    # Create toplanma alanları index
    if [ -f "faiss_indexer.py" ]; then
        echo "   Creating toplanma alanları index..."
        if python3 faiss_indexer.py; then
            echo "   ✅ Toplanma alanları index created"
        else
            echo "   ⚠️  Warning: Toplanma alanları index creation failed (non-fatal)"
        fi
    fi
    
    # Create ilkyardım index
    if [ -f "ilkyardim_indexer.py" ]; then
        echo "   Creating ilkyardım index..."
        if python3 ilkyardim_indexer.py; then
            echo "   ✅ İlkyardım index created"
        else
            echo "   ⚠️  Warning: İlkyardım index creation failed (non-fatal)"
        fi
    fi
    
    echo "✅ FAISS indices initialization completed"
}

# Function to run database migrations
run_migrations() {
    echo "🔄 Running database migrations..."
    
    cd /app
    
    # Check if Drizzle migrations exist
    if [ -d "migrations" ] && [ "$(ls -A migrations/*.sql 2>/dev/null)" ]; then
        echo "   Found migrations, applying..."
        
        # Apply each migration file in order
        for migration_file in migrations/*.sql; do
            if [ -f "$migration_file" ]; then
                migration_name=$(basename "$migration_file")
                echo "   Applying $migration_name..."
                
                # Apply migration using DATABASE_URL, ignore errors for already existing objects
                psql "$DATABASE_URL" -v ON_ERROR_STOP=0 -f "$migration_file" 2>&1 | \
                    grep -v "already exists" | grep -v "does not exist" | grep -v "^$" || true
            fi
        done
        
        echo "   ✅ Migrations completed"
    else
        echo "   ℹ️  No migrations found"
    fi
}

# Main execution flow
main() {
    echo ""
    echo "🔧 Environment:"
    echo "   NODE_ENV: $NODE_ENV"
    
    if [ -n "$DATABASE_URL" ]; then
        # Extract and display host from DATABASE_URL (hide password)
        DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
        echo "   DATABASE: $DB_NAME"
        echo "   HOST: $DB_HOST"
    else
        echo "   DATABASE: $PGDATABASE"
        echo "   HOST: $PGHOST:$PGPORT"
    fi
    echo ""
    
    # Wait for PostgreSQL
    wait_for_postgres
    
    echo ""
    
    # Check and initialize database if needed
    if ! check_database; then
        init_database
        run_migrations
    else
        echo "ℹ️  Database already initialized, skipping setup"
    fi
    
    echo ""
    
    # Initialize FAISS indices
    init_faiss_indices
    
    echo ""
    echo "=========================================="
    echo "🎉 Initialization completed successfully!"
    echo "=========================================="
    echo ""
    echo "🚀 Starting REACH+ application..."
    echo "   Port: $PORT"
    echo "   Mode: $NODE_ENV"
    echo ""
    
    # Start the Node.js application
    cd /app
    exec node dist/index.js
}

# Run main function
main


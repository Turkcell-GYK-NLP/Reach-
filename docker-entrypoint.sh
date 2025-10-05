#!/bin/sh
set -e

echo "=========================================="
echo "🚀 REACH+ Docker Startup Script"
echo "=========================================="

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
    echo "⏳ Waiting for PostgreSQL to be ready..."
    
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" > /dev/null 2>&1; then
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
    
    # Check if we can connect
    if ! PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c '\dt' > /dev/null 2>&1; then
        echo "⚠️  Database connection failed or no tables found"
        return 1
    fi
    
    # Check if users table exists
    table_count=$(PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='users';" 2>/dev/null | xargs)
    
    if [ "$table_count" = "1" ]; then
        echo "✅ Database already initialized"
        return 0
    else
        echo "⚠️  Database needs initialization"
        return 1
    fi
}

# Function to initialize database
init_database() {
    echo "🗄️  Initializing database schema..."
    
    cd /python-app || cd /app
    
    if python3 database.py; then
        echo "✅ Database schema created successfully"
    else
        echo "❌ ERROR: Database initialization failed"
        exit 1
    fi
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
        echo "   Found Drizzle migrations, applying..."
        
        # Apply each migration file
        for migration_file in migrations/*.sql; do
            if [ -f "$migration_file" ]; then
                echo "   Applying $(basename "$migration_file")..."
                PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$migration_file" > /dev/null 2>&1 || true
            fi
        done
        
        echo "   ✅ Migrations applied"
    else
        echo "   ℹ️  No migrations found, skipping"
    fi
}

# Main execution flow
main() {
    echo ""
    echo "🔧 Environment:"
    echo "   NODE_ENV: $NODE_ENV"
    echo "   DATABASE: $PGDATABASE"
    echo "   HOST: $PGHOST:$PGPORT"
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


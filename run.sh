#!/bin/bash

# Ciel Production Server Launcher
# Starts both frontend and backend services as background daemons
# Services continue running even after SSH disconnection

set -e

# PID file locations
BACKEND_PID_FILE="backend.pid"
FRONTEND_PID_FILE="frontend.pid"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required commands exist
check_dependencies() {
    local missing=""

    if ! command -v go >/dev/null 2>&1; then
        missing="$missing go"
    fi

    if ! command -v pnpm >/dev/null 2>&1; then
        missing="$missing pnpm"
    fi

    if [ -n "$missing" ]; then
        log_error "Missing required dependencies:$missing"
        exit 1
    fi
}

# Stop backend service
stop_backend() {
    local stopped=0

    # Stop backend by port 6137
    log_info "Checking for backend process on port 6137..."
    if command -v ss >/dev/null 2>&1; then
        # Use ss if available (modern Linux)
        local backend_pids=$(ss -tlnp 2>/dev/null | grep ':6137' | grep -oP 'pid=\K[0-9]+' | sort -u)
    elif command -v netstat >/dev/null 2>&1; then
        # Fall back to netstat
        local backend_pids=$(netstat -tlnp 2>/dev/null | grep ':6137' | awk '{print $7}' | grep -oP '^[0-9]+' | sort -u)
    else
        log_warn "Neither ss nor netstat found, trying PID file method"
        local backend_pids=""
    fi

    if [ -n "$backend_pids" ]; then
        for pid in $backend_pids; do
            if kill -0 $pid 2>/dev/null; then
                log_info "Stopping backend process (PID: $pid)"
                kill $pid 2>/dev/null
                sleep 1
                if kill -0 $pid 2>/dev/null; then
                    log_warn "Force killing backend process (PID: $pid)"
                    kill -9 $pid 2>/dev/null
                fi
                stopped=1
            fi
        done
    elif [ -f "$BACKEND_PID_FILE" ]; then
        # Fallback to PID file if port check didn't find anything
        local pid=$(cat "$BACKEND_PID_FILE")
        if kill -0 $pid 2>/dev/null; then
            log_info "Stopping backend from PID file (PID: $pid)"
            kill $pid 2>/dev/null
            sleep 1
            if kill -0 $pid 2>/dev/null; then
                kill -9 $pid 2>/dev/null
            fi
            stopped=1
        fi
    else
        log_info "No backend process found on port 6137"
    fi
    rm -f "$BACKEND_PID_FILE"

    # Additional cleanup for backend processes
    pkill -f "go run.*apps/backend" 2>/dev/null && stopped=1 || true
    pkill -f "apps/backend/main" 2>/dev/null && stopped=1 || true

    if [ $stopped -eq 1 ]; then
        log_success "Backend stopped"
    else
        log_warn "No running backend found"
    fi
}

# Stop frontend service
stop_frontend() {
    local stopped=0

    # Stop frontend by port 3000
    log_info "Checking for frontend process on port 3000..."
    if command -v ss >/dev/null 2>&1; then
        local frontend_pids=$(ss -tlnp 2>/dev/null | grep ':3000' | grep -oP 'pid=\K[0-9]+' | sort -u)
    elif command -v netstat >/dev/null 2>&1; then
        local frontend_pids=$(netstat -tlnp 2>/dev/null | grep ':3000' | awk '{print $7}' | grep -oP '^[0-9]+' | sort -u)
    else
        local frontend_pids=""
    fi

    if [ -n "$frontend_pids" ]; then
        for pid in $frontend_pids; do
            if kill -0 $pid 2>/dev/null; then
                log_info "Stopping frontend process (PID: $pid)"
                kill $pid 2>/dev/null
                sleep 1
                if kill -0 $pid 2>/dev/null; then
                    log_warn "Force killing frontend process (PID: $pid)"
                    kill -9 $pid 2>/dev/null
                fi
                stopped=1
            fi
        done
    elif [ -f "$FRONTEND_PID_FILE" ]; then
        # Fallback to PID file if port check didn't find anything
        local pid=$(cat "$FRONTEND_PID_FILE")
        if kill -0 $pid 2>/dev/null; then
            log_info "Stopping frontend from PID file (PID: $pid)"
            kill $pid 2>/dev/null
            sleep 1
            if kill -0 $pid 2>/dev/null; then
                kill -9 $pid 2>/dev/null
            fi
            stopped=1
        fi
    else
        log_info "No frontend process found on port 3000"
    fi
    rm -f "$FRONTEND_PID_FILE"

    # Additional cleanup for frontend processes
    pkill -f "node.*server.js" 2>/dev/null && stopped=1 || true

    if [ $stopped -eq 1 ]; then
        log_success "Frontend stopped"
    else
        log_warn "No running frontend found"
    fi
}

# Stop all services
stop_services() {
    stop_backend
    stop_frontend
}

# Start backend service
start_backend() {
    # Check if .env exists in backend
    if [ ! -f "apps/backend/.env" ] && [ ! -f "apps/backend/.env.local" ]; then
        log_error "No .env file found in apps/backend/"
        log_error "Production environment requires .env configuration"
        return 1
    fi

    # Check if backend is already running
    if command -v ss >/dev/null 2>&1; then
        local backend_pids=$(ss -tlnp 2>/dev/null | grep ':6137' | grep -oP 'pid=\K[0-9]+' | sort -u)
    elif command -v netstat >/dev/null 2>&1; then
        local backend_pids=$(netstat -tlnp 2>/dev/null | grep ':6137' | awk '{print $7}' | grep -oP '^[0-9]+' | sort -u)
    else
        local backend_pids=""
    fi

    if [ -n "$backend_pids" ]; then
        log_error "Backend is already running on port 6137"
        log_error "Run './run.sh stop backend' to stop it first"
        return 1
    fi

    # Start backend using setsid to create a new process group
    log_info "Starting backend on port 6137..."
    setsid nohup pnpm run:backend > backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$BACKEND_PID_FILE"
    disown $BACKEND_PID
    log_success "Backend started (PID: $BACKEND_PID, log: backend.log)"

    # Wait a moment for backend to initialize
    sleep 2

    # Check if backend is still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        log_error "Backend failed to start. Check backend.log for details."
        tail -n 20 backend.log
        rm -f "$BACKEND_PID_FILE"
        return 1
    fi

    return 0
}

# Start frontend service
start_frontend() {
    # Check if frontend is already running
    if command -v ss >/dev/null 2>&1; then
        local frontend_pids=$(ss -tlnp 2>/dev/null | grep ':3000' | grep -oP 'pid=\K[0-9]+' | sort -u)
    elif command -v netstat >/dev/null 2>&1; then
        local frontend_pids=$(netstat -tlnp 2>/dev/null | grep ':3000' | awk '{print $7}' | grep -oP '^[0-9]+' | sort -u)
    else
        local frontend_pids=""
    fi

    if [ -n "$frontend_pids" ]; then
        log_error "Frontend is already running on port 3000"
        log_error "Run './run.sh stop frontend' to stop it first"
        return 1
    fi

    # Build frontend if needed
    log_info "Building frontend..."
    cd apps/frontend

    # Always build for production to ensure latest code
    log_info "Running production build..."
    pnpm run build 2>&1 | tee ../../frontend-build.log
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        log_error "Frontend build failed. Check frontend-build.log for details."
        cd ../..
        return 1
    fi
    log_success "Frontend built successfully"

    # Start frontend in production mode using pnpm start
    # This uses Next.js built-in production server
    log_info "Starting frontend on port 3000..."
    setsid nohup pnpm start > ../../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "../../$FRONTEND_PID_FILE"
    disown $FRONTEND_PID
    cd ../..
    log_success "Frontend started (PID: $FRONTEND_PID, log: frontend.log)"

    return 0
}

# Start all services
start_services() {
    check_dependencies
    
    log_info "Starting Ciel production environment as background services..."
    
    start_backend
    local backend_status=$?
    
    start_frontend
    local frontend_status=$?
    
    if [ $backend_status -eq 0 ] && [ $frontend_status -eq 0 ]; then
        # Display status
        echo ""
        log_success "Production servers started successfully!"
        echo ""
        echo "Services are running in the background and will continue after SSH disconnect:"
        echo "  - Backend:  http://localhost:6137"
        echo "  - Frontend: http://localhost:3000"
        echo ""
        log_info "Logs are being written to:"
        echo "  - Backend:  backend.log"
        echo "  - Frontend: frontend.log"
        echo ""
        log_info "To view logs in real-time:"
        echo "  - Backend:  tail -f backend.log"
        echo "  - Frontend: tail -f frontend.log"
        echo ""
        log_info "To manage services:"
        echo "  - Check status:       ./run.sh status"
        echo "  - Stop all:           ./run.sh stop"
        echo "  - Stop backend:       ./run.sh stop backend"
        echo "  - Stop frontend:      ./run.sh stop frontend"
        echo "  - Restart all:        ./run.sh restart"
        echo "  - Restart backend:    ./run.sh restart backend"
        echo "  - Restart frontend:   ./run.sh restart frontend"
        echo ""
        log_success "You can now safely disconnect from SSH"
        return 0
    else
        log_error "Failed to start some services"
        return 1
    fi
}

# Show usage information
show_usage() {
    echo "Usage: ./run.sh [COMMAND] [SERVICE]"
    echo ""
    echo "Commands:"
    echo "  (no args)          Start all services (default)"
    echo "  start [SERVICE]    Start all services or specific service"
    echo "  stop [SERVICE]     Stop all services or specific service"
    echo "  restart [SERVICE]  Restart all services or specific service"
    echo "  status             Show status of all services"
    echo "  help               Show this help message"
    echo ""
    echo "Services:"
    echo "  backend            Backend API service (port 6137)"
    echo "  frontend           Frontend web service (port 3000)"
    echo ""
    echo "Examples:"
    echo "  ./run.sh                      # Start all services"
    echo "  ./run.sh start backend        # Start only backend"
    echo "  ./run.sh stop                 # Stop all services"
    echo "  ./run.sh stop backend         # Stop only backend"
    echo "  ./run.sh stop frontend        # Stop only frontend"
    echo "  ./run.sh restart              # Restart all services"
    echo "  ./run.sh restart backend      # Restart only backend"
    echo "  ./run.sh restart frontend     # Restart only frontend"
    echo "  ./run.sh status               # Check service status"
}

# Main execution
main() {
    # Change to script directory (project root)
    cd "$(dirname "$0")"

    local command="${1:-start}"
    local service="${2:-all}"

    case "$command" in
        start)
            case "$service" in
                backend)
                    start_backend
                    ;;
                frontend)
                    start_frontend
                    ;;
                all|*)
                    start_services
                    ;;
            esac
            ;;
        
        stop)
            case "$service" in
                backend)
                    stop_backend
                    ;;
                frontend)
                    stop_frontend
                    ;;
                all|*)
                    stop_services
                    ;;
            esac
            ;;
        
        restart)
            case "$service" in
                backend)
                    log_info "Restarting backend..."
                    stop_backend
                    sleep 1
                    start_backend
                    ;;
                frontend)
                    log_info "Restarting frontend..."
                    stop_frontend
                    sleep 1
                    start_frontend
                    ;;
                all|*)
                    log_info "Restarting all services..."
                    stop_services
                    sleep 1
                    start_services
                    ;;
            esac
            ;;
        
        status)
            echo "Checking service status..."
            
            # Check backend on port 6137
            if command -v ss >/dev/null 2>&1; then
                local backend_pids=$(ss -tlnp 2>/dev/null | grep ':6137' | grep -oP 'pid=\K[0-9]+' | sort -u)
            elif command -v netstat >/dev/null 2>&1; then
                local backend_pids=$(netstat -tlnp 2>/dev/null | grep ':6137' | awk '{print $7}' | grep -oP '^[0-9]+' | sort -u)
            else
                local backend_pids=""
            fi

            if [ -n "$backend_pids" ]; then
                for pid in $backend_pids; do
                    log_success "Backend is running on port 6137 (PID: $pid)"
                done
            else
                log_warn "Backend is not running on port 6137"
            fi

            # Check frontend on port 3000
            if command -v ss >/dev/null 2>&1; then
                local frontend_pids=$(ss -tlnp 2>/dev/null | grep ':3000' | grep -oP 'pid=\K[0-9]+' | sort -u)
            elif command -v netstat >/dev/null 2>&1; then
                local frontend_pids=$(netstat -tlnp 2>/dev/null | grep ':3000' | awk '{print $7}' | grep -oP '^[0-9]+' | sort -u)
            else
                local frontend_pids=""
            fi

            if [ -n "$frontend_pids" ]; then
                for pid in $frontend_pids; do
                    log_success "Frontend is running on port 3000 (PID: $pid)"
                done
            else
                log_warn "Frontend is not running on port 3000"
            fi
            ;;
        
        help|--help|-h)
            show_usage
            ;;
        
        *)
            log_error "Unknown command: $command"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

main "$@"

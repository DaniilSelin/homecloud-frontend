#!/bin/bash

# HomeCloud Frontend Management Script

case "$1" in
    start)
        echo "Starting HomeCloud Frontend..."
        docker-compose up -d
        echo "Frontend is running at http://localhost:3000"
        ;;
    stop)
        echo "Stopping HomeCloud Frontend..."
        docker-compose down
        ;;
    restart)
        echo "Restarting HomeCloud Frontend..."
        docker-compose down
        docker-compose up -d
        echo "Frontend is running at http://localhost:3000"
        ;;
    build)
        echo "Building HomeCloud Frontend..."
        docker-compose up --build -d
        echo "Frontend is running at http://localhost:3000"
        ;;
    logs)
        docker-compose logs -f
        ;;
    status)
        docker-compose ps
        ;;
    clean)
        echo "Cleaning up containers and images..."
        docker-compose down --rmi all --volumes --remove-orphans
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|build|logs|status|clean}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the frontend container"
        echo "  stop    - Stop the frontend container"
        echo "  restart - Restart the frontend container"
        echo "  build   - Build and start the frontend container"
        echo "  logs    - Show container logs"
        echo "  status  - Show container status"
        echo "  clean   - Remove containers and images"
        exit 1
        ;;
esac 
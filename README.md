# Server Dashboard

This is a monitoring dashboard for servers in a LAN network. It uses Fritz!Box API to discover hosts and monitors server resources and SSH users.

## Features

- Server resource monitoring (CPU, RAM, GPU)
- Active SSH users tracking
- Fritz!Box integration for host discovery
- Real-time updates
- Add and manage multiple servers

## Prerequisites

- Docker and Docker Compose
- Fritz!Box with API access
- SSH access to monitored servers

## Configuration

Create a `.env` file in the root directory with:

```env
FRITZ_IP=your_fritzbox_ip
FRITZ_USER=your_fritzbox_user
FRITZ_PASSWORD=your_fritzbox_password
```

## Running the Application

1. Start the application:
   ```bash
   docker-compose up --build
   ```

2. Access the dashboard at http://localhost:3000

## Architecture

- Frontend: Next.js + Tremor UI
- Backend: FastAPI + SQLAlchemy
- Database: PostgreSQL
- Container orchestration: Docker Compose

## Adding Servers

Use the form in the dashboard to add new servers. You'll need:
- Server name
- IP address
- SSH username

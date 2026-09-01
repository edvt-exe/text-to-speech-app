# VoiceCraft Deployment Guide

This guide covers deploying VoiceCraft using Docker and docker-compose.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- At least 2GB free disk space (for container layers and generated audio files)

## Quick Start

### 1. Build and Start the Application

```bash
# Build the Docker image and start the container
docker-compose up -d

# View logs
docker-compose logs -f voicecraft-app

# Check application status
docker-compose ps
```

The application will be available at `http://localhost:3000`

### 2. Stop the Application

```bash
# Stop without removing containers (data persists)
docker-compose stop

# Start again (no rebuild needed)
docker-compose start

# Stop and remove containers (volumes persist data)
docker-compose down
```

---

## Volume Management (Critical for Data Persistence)

### Understanding Volumes

VoiceCraft uses two named volumes:

1. **voicecraft-db** — Contains the SQLite database (`history.db`)
   - Stores all audio generation records
   - Stores content hashes (caching)
   - Stores share UUIDs

2. **voicecraft-audio** — Contains generated MP3 files
   - All `speech_*.mp3` files
   - Cached audio files

**Why volumes matter:** Without volumes, all data is lost when the container stops.

### View Volume Information

```bash
# List all volumes
docker volume ls

# Inspect a specific volume
docker volume inspect voicecraft-db
docker volume inspect voicecraft-audio

# See where volume data is stored on host
docker volume inspect voicecraft-db | grep Mountpoint
```

### Backup Your Data

```bash
# Backup the database volume
docker run --rm -v voicecraft-db:/data -v $(pwd):/backup \
  alpine tar czf /backup/voicecraft-db-backup.tar.gz -C /data .

# Backup the audio files
docker run --rm -v voicecraft-audio:/data -v $(pwd):/backup \
  alpine tar czf /backup/voicecraft-audio-backup.tar.gz -C /data .
```

### Restore from Backup

```bash
# Restore database
docker run --rm -v voicecraft-db:/data -v $(pwd):/backup \
  alpine tar xzf /backup/voicecraft-db-backup.tar.gz -C /data

# Restore audio files
docker run --rm -v voicecraft-audio:/data -v $(pwd):/backup \
  alpine tar xzf /backup/voicecraft-audio-backup.tar.gz -C /data
```

### Delete Volumes (⚠️ DESTRUCTIVE)

```bash
# Remove unused volumes
docker volume prune

# Remove specific volume (ALL DATA LOST)
docker volume rm voicecraft-db
docker volume rm voicecraft-audio
```

---

## Environment Configuration

### Using Environment Variables

1. Create a `.env` file in the project root:

```bash
cp backend/.env.example backend/.env
```

2. Edit `backend/.env`:

```env
NODE_ENV=production
PORT=3000
```

3. The `docker-compose.yml` automatically loads the `.env` file

### In Production

For production deployments, consider using:

- Docker Compose override files: `docker-compose.prod.yml`
- Environment variable files: `docker-compose -f docker-compose.yml --env-file .env.production up`
- Container orchestration: Kubernetes, Docker Swarm

---

## Common Operations

### View Logs

```bash
# Real-time logs
docker-compose logs -f voicecraft-app

# Last 100 lines
docker-compose logs --tail=100 voicecraft-app

# With timestamps
docker-compose logs -f --timestamps voicecraft-app
```

### Execute Commands in Container

```bash
# Open a shell
docker-compose exec voicecraft-app sh

# Run a one-off command
docker-compose exec voicecraft-app npm list
```

### Monitor Container Health

```bash
# Check health status
docker-compose ps

# Health logs (detailed)
docker inspect voicecraft-app | grep -A 20 '"Health"'
```

### Rebuild After Code Changes

```bash
# Rebuild the image (without cache)
docker-compose build --no-cache

# Rebuild and restart
docker-compose up -d --build
```

---

## Production Deployment Checklist

- [ ] Use a reverse proxy (nginx) for HTTPS and load balancing
- [ ] Set up log aggregation (ELK stack, Datadog, etc.)
- [ ] Configure automated backups for volumes
- [ ] Set up monitoring and alerting
- [ ] Use environment-specific `.env` files
- [ ] Enable health checks
- [ ] Configure restart policies
- [ ] Set resource limits (done in docker-compose.yml)
- [ ] Use private Docker registries if needed
- [ ] Implement secrets management (never commit .env to git)

---

## Docker Hub / Registry Deployment

### Push Image to Registry

```bash
# Build with registry tag
docker build -t myregistry.azurecr.io/voicecraft:1.0.0 .

# Push to registry
docker push myregistry.azurecr.io/voicecraft:1.0.0

# Update docker-compose.yml to use registry
# image: myregistry.azurecr.io/voicecraft:1.0.0
```

### Deploy to Cloud (AWS ECS, Azure Container Instances, etc.)

1. Push image to your cloud registry
2. Update docker-compose.yml with registry image URL
3. Deploy to cloud orchestration service
4. Ensure volumes are configured for persistence

---

## Troubleshooting

### Container Exits Immediately

```bash
# Check logs
docker-compose logs voicecraft-app

# Look for startup errors
docker-compose exec voicecraft-app npm list
```

### Database Connection Errors

```bash
# Verify database volume exists
docker volume ls | grep voicecraft-db

# Check volume path
docker volume inspect voicecraft-db

# Restart container to remount volumes
docker-compose restart voicecraft-app
```

### Audio Files Not Persisting

```bash
# Verify audio volume mount
docker-compose exec voicecraft-app ls -la /app/backend/audio-output

# Check volume permissions
docker volume inspect voicecraft-audio
```

### Out of Disk Space

```bash
# Remove unused volumes and images
docker system prune -a --volumes

# Check disk usage
docker system df
```

---

## Performance Tuning

### Increase Resource Limits

Edit `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'      # Increase CPU
      memory: 1G     # Increase RAM
```

### Database Optimization

The SQLite database (better-sqlite3) is optimized for single-machine deployments. For multi-instance production:

- Consider migrating to PostgreSQL
- Implement shared volume mounting (NFS) across instances
- Use external database services (RDS, Cloud SQL)

### Caching Layer

The built-in caching layer reduces redundant TTS API calls significantly. Monitor cache hit rates in logs.

---

## Updating the Application

### For Code Changes

```bash
# Pull latest code from git
git pull

# Rebuild and restart
docker-compose up -d --build
```

### For Dependency Updates

```bash
# Update dependencies in backend/package.json
npm update

# Rebuild with new dependencies
docker-compose up -d --build
```

---

## Monitoring & Health Checks

The container includes a built-in health check that:
- Runs every 30 seconds
- Times out after 10 seconds
- Retries up to 3 times
- Waits 5 seconds after container start before first check

Monitor health status:

```bash
docker-compose ps

# Output example:
# voicecraft-app ... Up 5 minutes (healthy)
```

---

## Security Best Practices

✅ **Implemented:**
- Non-root user execution (nodejs user)
- Multi-stage build (reduced attack surface)
- Resource limits (prevent DoS)
- Health checks (automatic restart on failure)
- Read-only volumes where possible

⚠️ **Additional Recommendations:**
- Use HTTPS/TLS in production (nginx reverse proxy)
- Scan images for vulnerabilities: `trivy image voicecraft:latest`
- Never commit `.env` files to version control
- Use secrets management: Docker Secrets, HashiCorp Vault
- Implement rate limiting (already built-in to application)
- Keep base image updated: `docker pull node:20-alpine`

---

## Support

For issues or questions:
1. Check container logs: `docker-compose logs voicecraft-app`
2. Verify volume mounts: `docker volume ls && docker volume inspect <name>`
3. Ensure sufficient disk space: `df -h`
4. Check Docker daemon health: `docker ps`

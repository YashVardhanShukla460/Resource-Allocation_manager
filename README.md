# Resource Allocation Manager

Express + MongoDB service for multi-tenant resource allocation with fair-share scheduling, policy controls, autoscale hooks, and audit events.

## Features
- Tenant lifecycle APIs and resource allocation/release APIs.
- Weighted fair-share scheduling to prevent monopolization.
- Hard per-tenant limits and cluster capacity enforcement.
- MongoDB persistence for tenants, policy, and allocation events.
- Shell provisioning hook triggered by utilization threshold.
- Optional Git commit tracking for policy changes.
- Kubernetes ResourceQuota sample (`k8s/resource-quota.yaml`).
- Unix `ulimit` launch script for process-level caps.

## Stack
- Node.js, Express, Mongoose
- MongoDB Atlas or local MongoDB
- Bash scripts for provisioning automation

## Quick Start
1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI` (Atlas or local).
3. Install and seed:
```bash
npm install
npm run seed
```
4. Start service:
```bash
npm start
```

## Atlas URI Note
If your password contains `@`, encode it as `%40` in the URI.
Example: `yash@123` becomes `yash%40123`.

## API Endpoints
Base path: `/api`

- `GET /health`
- `POST /tenants`
- `GET /tenants`
- `POST /allocations`
- `POST /allocations/release`
- `POST /usage`
- `GET /resources/status`
- `GET /policy`
- `PUT /policy`
- `POST /admin/provision`
- `POST /admin/autoscale-check`

## Autoscale Flow
1. Clients report usage through `/api/usage`.
2. `/api/admin/autoscale-check` compares utilization against `utilizationThreshold`.
3. If threshold is exceeded, provisioning script is executed.
4. Policy capacity is increased by `provisionStep`.

## Git Policy Tracking
Set `ENABLE_GIT_POLICY_TRACKING=true`.
On policy changes/provision events, the service writes `policies/current.json` and commits it with a policy message (best effort).

## ulimit Run (Linux/macOS)
```bash
npm run start:ulimit
```

## Kubernetes Quota
Apply sample:
```bash
kubectl apply -f k8s/resource-quota.yaml
```

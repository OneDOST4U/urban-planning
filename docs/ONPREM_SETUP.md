# On-prem server + Cloudflare Tunnel

Serve this static Vite app from a **dedicated local Ubuntu server** (not the events Dell), then publish it through its **own** Cloudflare Tunnel.

This app has no API or database. Docker only runs nginx with the production `dist/` build.

## What you will have

| Piece | Value |
|-------|--------|
| Server | Separate Ubuntu host (not `172.168.1.209` / events) |
| App checkout | e.g. `/home/planning/urban-planning` |
| Compose project | `urban-planning-onprem` |
| Local origin | `http://127.0.0.1:80` |
| Cloudflare | **New** tunnel for this server only |
| Public URL | hostname you choose, e.g. `https://lasam.dost02.com` |
| Deploy branch | `onprem` |

Pick any hostname on `dost02.com` (or another Cloudflare zone). Change it in `.env.onprem` and the tunnel ingress.

## 1. Prepare the server

On the **new** Ubuntu server (24.04 recommended):

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y git curl ca-certificates openssh-server ufw
```

Reserve a fixed LAN IP on your router. Example: `172.168.1.210` (use your actual IP).

Install Docker:

```bash
git clone https://github.com/OneDOST4U/urban-planning.git
cd urban-planning
sudo bash scripts/install-docker-ubuntu.sh
# log out and back in so docker works without sudo
```

Hardening (recommended before public URL):

- UFW: allow SSH only; do **not** open port 80/443 to the internet (Cloudflare Tunnel connects outbound)
- SSH keys instead of passwords
- Disable sleep/suspend for 24/7 uptime

## 2. Clone and first deploy

```bash
cd ~
git clone https://github.com/OneDOST4U/urban-planning.git
cd urban-planning
git checkout onprem
cp .env.onprem.example .env.onprem
nano .env.onprem   # set ONPREM_APP_URL to your chosen hostname
```

Keep a durable copy for the GitHub runner:

```bash
mkdir -p ~/secrets
cp .env.onprem ~/secrets/.env.urban-planning-onprem
chmod 600 ~/secrets/.env.urban-planning-onprem
```

Deploy:

```bash
chmod +x scripts/*.sh
./scripts/deploy-onprem.sh
curl -sI http://127.0.0.1/
```

## 3. Create a dedicated Cloudflare Tunnel

In **Cloudflare Zero Trust → Networks → Tunnels**, create a **new** tunnel for this server. Do **not** reuse the events tunnel (`dost-events-onprem-vm`).

On the urban-planning server:

1. Install `cloudflared` (see [Cloudflare Linux docs](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/))
2. Copy [deploy/cloudflared/config.example.yml](../deploy/cloudflared/config.example.yml) to `/etc/cloudflared/config.yml`
3. Replace tunnel UUID and credentials path with the values from the dashboard
4. Enable the service:

```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
sudo systemctl status cloudflared
```

Example ingress (this server only):

```yaml
tunnel: YOUR_NEW_TUNNEL_UUID
credentials-file: /etc/cloudflared/YOUR_NEW_TUNNEL_UUID.json

ingress:
  - hostname: lasam.dost02.com
    service: http://127.0.0.1:80
  - service: http_status:404
```

In Cloudflare DNS, add a **proxied CNAME**:

`lasam` → `<new-tunnel-id>.cfargotunnel.com`

Validate and restart:

```bash
sudo cloudflared tunnel ingress validate
sudo systemctl restart cloudflared
```

Public smoke:

```bash
APP_URL=https://lasam.dost02.com ./scripts/post-deploy-smoke-onprem.sh
```

## 4. GitHub Actions self-hosted runner

Register a runner on **this server** for `OneDOST4U/urban-planning` only (not the events repo):

1. Repo **Settings → Actions → Runners → New self-hosted runner**
2. Choose **Linux x64**
3. Labels: `linux`, `urban-planning-onprem`
4. `./svc.sh install && ./svc.sh start`

Optional repo **Variable**: `ONPREM_APP_URL` = `https://lasam.dost02.com`

Push to branch **`onprem`** to deploy. Manual run: **Actions → Deploy On-Prem → Run workflow**.

## Operator checklist

- [ ] Separate Ubuntu server prepared (not the events Dell)
- [ ] Docker installed; app healthy on `http://127.0.0.1/`
- [ ] **New** Cloudflare tunnel + DNS for your hostname
- [ ] Self-hosted runner online with labels `linux`, `urban-planning-onprem`
- [ ] Push to `onprem` deploys; public URL loads the Lasam map

## Related

Events uses a different server and tunnel. Same general pattern, but keep stacks independent:

- Events: `dost-events` → `events.dost02.com` on the events Dell
- Urban planning: this repo → your hostname on this server

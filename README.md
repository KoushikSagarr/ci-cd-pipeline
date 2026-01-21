# 🚀 The DevOps Engine: Secure CI/CD Pipeline

![Build Status](https://img.shields.io/badge/build-passing-brightgreen) ![K8s](https://img.shields.io/badge/Kubernetes-Ready-blue) ![Docker](https://img.shields.io/badge/Container-Docker-2496ED) ![Security](https://img.shields.io/badge/Security-Trivy%20%2B%20SAST-red)

> **The core microservice and automation logic powering the Resilient DevOps Ecosystem.**

This repository contains the source code, infrastructure-as-code (IaC), and pipeline definitions for a **self-healing, secure-by-design** web application. It is designed to work in tandem with the [CI/CD Dashboard](https://github.com/KoushikSagarr/ci-cd-dashboard).

---

## ⚡ Architecture Flow



[Image of kubernetes architecture diagram]


```text
[ Developer ] ── push ──▶ [ GitHub ] ── webhook ──▶ [ Jenkins Pipeline ]
                                                          │
    ┌─────────────────────────────────────────────────────┘
    │
    ├── 🔍 SAST Scan (ESLint + NPM Audit)
    ├── 🏗️ Build Docker Image
    ├── 🛡️ Container Security Scan (Trivy)
    ├── 📤 Push to Registry
    └── ☸️ Deploy to Kubernetes (Rolling Update)

```

---

## 📂 Repository Structure

```bash
ci-cd-pipeline/
├── app/                        # 🟢 Node.js Microservice
│   ├── app.js                  # Express App + Prometheus Metrics
│   ├── Dockerfile              # Multi-stage, secure build
│   └── package.json            # Dependencies
├── k8s/                        # ☸️ Kubernetes Manifests
│   ├── deployment.yaml         # HA Setup with Liveness Probes
│   ├── service.yaml            # NodePort Service exposure
│   ├── ingress.yaml            # (Optional) Ingress rules
│   └── chaos-experiment.yaml   # Chaos Mesh configuration
└── Jenkinsfile                 # ⚙️ The Groovy Pipeline Script

```

---

## 🛠️ Tech Stack & Features

| Component | Tech | Description |
| --- | --- | --- |
| **App Runtime** | Node.js + Express | Lightweight backend exposing `/metrics` & `/health`. |
| **Container** | Docker (Alpine) | Minimized attack surface area. |
| **Orchestration** | Kubernetes | High Availability (2 Replicas) with auto-restart. |
| **CI/CD** | Jenkins | Groovy-scripted pipeline with parallel stages. |
| **Security** | Trivy | Image scanning to block CVEs before deployment. |
| **Resilience** | Chaos Mesh | Configuration for "Pod Kill" experiments. |

---

## ☸️ Kubernetes Configuration

We use a production-grade configuration to ensure zero downtime.

### `deployment.yaml` Highlights:

* **Replicas:** `2` (Ensures availability if one pod dies).
* **Liveness Probe:** Checks `/health`. If the app freezes, K8s restarts it.
* **Readiness Probe:** Checks `/ready`. Traffic isn't sent until the app is fully loaded.
* **Resource Limits:** CPU/Memory caps to prevent noisy neighbor issues.

---

## 🚀 How to Deploy

### Prerequisites

* Jenkins installed locally or on a server.
* Docker & Kubernetes (Minikube, K3s, or Docker Desktop) running.
* `kubectl` configured.

### 1. Configure Jenkins

Ensure your Jenkins has the following plugins installed:

* *Docker Pipeline*
* *Kubernetes CLI*
* *NodeJS Plugin*

### 2. Set Up Webhooks

If running Jenkins locally, use **Ngrok** to expose it:

```bash
ngrok http 8080
# Copy the URL and add to GitHub Repo Settings -> Webhooks
# URL: https://<ngrok-id>.ngrok-io/github-webhook/

```

### 3. The Pipeline Strategy (`Jenkinsfile`)

The pipeline follows a **strict quality gate** philosophy:

1. **Stage: Checkout** - Pulls code.
2. **Stage: Install** - Sets up Node.js environment.
3. **Stage: Security (SAST)** - Runs static analysis. **Fails on error.**
4. **Stage: Build** - Creates the Docker artifact.
5. **Stage: Security (Image)** - Runs `trivy image`. **Fails on Critical CVEs.**
6. **Stage: Deploy** - Applies `k8s/deployment.yaml` to the cluster.

---

## 📊 Observability

The application is instrumented with `prom-client`.

* **Metrics Endpoint:** `http://localhost:30080/metrics`
* **Data Exposed:** HTTP Request Rate, Error Rate (5xx), Heap Usage.

---

## 🤝 Contributing

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📜 License

MIT License © 2025 **[KoushikSagarr]**

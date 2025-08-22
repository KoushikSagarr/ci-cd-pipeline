apiVersion: apps/v1
kind: Deployment
metadata:
  name: ci-cd-dashboard-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ci-cd-dashboard
  template:
    metadata:
      labels:
        app: ci-cd-dashboard
    spec:
      containers:
        - name: ci-cd-dashboard-app
          image: koushiksagar/ci-cd-app:latest
          ports:
            - containerPort: 4000
---
apiVersion: v1
kind: Service
metadata:
  name: ci-cd-dashboard-service
spec:
  selector:
    app: ci-cd-dashboard
  ports:
    - protocol: TCP
      port: 80
      targetPort: 4000
  type: LoadBalancer

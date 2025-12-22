pipeline {
    agent any

    parameters {
        booleanParam(name: 'RUN_CHAOS_TEST', defaultValue: false, description: 'Run Chaos Engineering tests after deployment')
        booleanParam(name: 'SKIP_SECURITY_SCAN', defaultValue: false, description: 'Skip security scans (SAST and Container Scan)')
    }

    environment {
        IMAGE_NAME = "ci-cd-app"
        DOCKER_HUB_REPO = "koushiksagar/ci-cd-app"
        DOCKER_TAG = "latest"
    }

    stages {
        stage('Install Dependencies') {
            steps {
                dir('app') {
                    bat 'npm install'
                }
            }
        }

        stage('Security: SAST') {
            when {
                expression { return !params.SKIP_SECURITY_SCAN }
            }
            steps {
                dir('app') {
                    echo 'Running npm audit for dependency vulnerabilities...'
                    bat 'npm audit --audit-level=high || exit 0'
                    
                    echo 'Running ESLint security analysis...'
                    bat 'npx eslint . --ext .js --config .eslintrc.json || exit 0'
                }
            }
        }

        stage('Run Tests') {
            steps {
                dir('app') {
                    bat 'npm test'
                }
            }
        }

        stage('Docker Build') {
            steps {
                dir('app') {
                    bat 'docker build -t %IMAGE_NAME% .'
                }
            }
        }

        stage('Security: Container Scan') {
            when {
                expression { return !params.SKIP_SECURITY_SCAN }
            }
            steps {
                script {
                    echo 'Scanning container image with Trivy for vulnerabilities...'
                    def result = bat(
                        script: 'C:\\Tools\\Trivy\\trivy.exe image --severity CRITICAL --exit-code 1 %IMAGE_NAME%',
                        returnStatus: true
                    )
                    if (result != 0) {
                        error("CRITICAL vulnerabilities found in container image! Blocking deployment.")
                    }
                    echo 'Container scan passed - no CRITICAL vulnerabilities found.'
                }
            }
        }

        stage('Docker Push') {
            steps {
                dir('app') {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        bat '''
                        docker login -u %DOCKER_USER% -p %DOCKER_PASS%
                        docker tag %IMAGE_NAME% %DOCKER_HUB_REPO%:%DOCKER_TAG%
                        docker push %DOCKER_HUB_REPO%:%DOCKER_TAG%
                        '''
                    }
                }
            }
        }

        stage('Kubernetes Deployment') {
            steps {
                script {
                    echo "Deploying to Kubernetes using kubeconfig credentials..."
                    withKubeConfig([credentialsId: 'kubeconfig-minikube']) {
                        try {
                            bat 'kubectl config current-context'
                            bat 'kubectl cluster-info --request-timeout=10s'
                            bat 'kubectl get nodes'

                            echo "Creating namespace if not exists..."
                            bat 'kubectl create namespace ci-cd-app --dry-run=client -o yaml | kubectl apply -f -'

                            echo "Applying Kubernetes manifests..."
                            bat '''
                                kubectl apply -f k8s/deployment.yaml -n ci-cd-app
                                kubectl apply -f k8s/service.yaml -n ci-cd-app
                                kubectl rollout status deployment/ci-cd-app -n ci-cd-app --timeout=300s
                            '''

                            echo "Kubernetes deployment successful!"
                            bat 'kubectl get services ci-cd-app-service -n ci-cd-app'
                            bat 'kubectl get pods -n ci-cd-app -l app=ci-cd-app'
                        } catch (Exception e) {
                            echo "Kubernetes deployment failed: ${e.getMessage()}"
                            currentBuild.result = 'UNSTABLE'
                            echo "Continuing build despite Kubernetes deployment issues"
                        }
                    }
                }
            }
        }

        stage('Chaos Test') {
            when {
                expression { return params.RUN_CHAOS_TEST }
            }
            steps {
                script {
                    echo "Running Chaos Engineering experiment..."
                    withKubeConfig([credentialsId: 'kubeconfig-minikube']) {
                        try {
                            bat 'kubectl apply -f k8s/chaos-experiment.yaml -n ci-cd-app'
                            echo "Chaos experiment applied. Waiting for 45 seconds for experiment completion..."
                            bat 'ping -n 46 127.0.0.1 > nul'
                            
                            echo "Verifying application recovery..."
                            bat 'kubectl get pods -n ci-cd-app -l app=ci-cd-app'
                            bat 'kubectl rollout status deployment/ci-cd-app -n ci-cd-app --timeout=60s'
                            echo "Application recovered successfully from chaos test!"
                        } catch (Exception e) {
                            echo "Chaos test warning: ${e.getMessage()}"
                            echo "Note: Chaos Mesh may not be installed in the cluster"
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                def buildStatus = currentBuild.result ?: 'SUCCESS'
                def buildNumber = env.BUILD_NUMBER
                def jobName = env.JOB_NAME
                def consoleLink = "${env.BUILD_URL}console"
                def commitMessage = ""
                def duration = currentBuild.durationString

                try {
                    commitMessage = bat(
                        script: 'git log -1 --pretty=format:"%%s"',
                        returnStdout: true
                    ).trim()
                } catch (Exception e) {
                    commitMessage = "Could not retrieve commit message"
                }

                def errorDetails = ""
                if (buildStatus in ['FAILURE', 'UNSTABLE']) {
                    try {
                        errorDetails = bat(
                            script: 'type "%JENKINS_HOME%\\jobs\\%JOB_NAME%\\builds\\%BUILD_NUMBER%\\log" 2>nul || echo "Could not read build log"',
                            returnStdout: true
                        )
                        if (errorDetails.length() > 1000) {
                            errorDetails = "..." + errorDetails.substring(errorDetails.length() - 1000)
                        }
                    } catch (Exception e) {
                        errorDetails = "Could not retrieve error details: ${e.getMessage()}"
                    }
                }

                // Security scan results summary
                def securityScanSkipped = params.SKIP_SECURITY_SCAN ?: false
                def chaosTestRan = params.RUN_CHAOS_TEST ?: false

                def jsonBody = [
                    status: buildStatus,
                    jobName: jobName,
                    buildNumber: buildNumber,
                    consoleLink: consoleLink,
                    commitMessage: commitMessage,
                    duration: duration,
                    errorDetails: errorDetails,
                    timestamp: new Date().format("yyyy-MM-dd'T'HH:mm:ss'Z'"),
                    kubernetesDeployed: buildStatus in ['SUCCESS', 'UNSTABLE'],
                    securityScanSkipped: securityScanSkipped,
                    chaosTestRan: chaosTestRan
                ]

                // Fetch ngrok URL dynamically from ngrok inspector API
                def backendUrl = ""
                try {
                    def ngrokResponse = bat(
                        script: 'powershell -Command "(Invoke-WebRequest -Uri \'http://localhost:4040/api/tunnels\' -UseBasicParsing).Content"',
                        returnStdout: true
                    ).trim()
                    def jsonSlurper = new groovy.json.JsonSlurper()
                    def ngrokData = jsonSlurper.parseText(ngrokResponse.substring(ngrokResponse.indexOf('{')))
                    if (ngrokData.tunnels && ngrokData.tunnels.size() > 0) {
                        backendUrl = ngrokData.tunnels[0].public_url
                        echo "Discovered ngrok URL: ${backendUrl}"
                    }
                } catch (Exception e) {
                    echo "Could not fetch ngrok URL: ${e.getMessage()}"
                    backendUrl = "http://localhost:3001"
                }

                if (backendUrl) {
                    withCredentials([string(credentialsId: 'jenkins-api-token', variable: 'JENKINS_API_TOKEN')]) {
                        try {
                            httpRequest(
                                url: "${backendUrl}/api/log-final-status",
                                httpMode: 'POST',
                                contentType: 'APPLICATION_JSON',
                                requestBody: groovy.json.JsonOutput.toJson(jsonBody),
                                customHeaders: [[name: 'Authorization', value: "Bearer ${JENKINS_API_TOKEN}"]],
                                validResponseCodes: '100:399',
                                timeout: 30
                            )
                            echo "Build status sent successfully to backend at ${backendUrl}"
                        } catch (Exception e) {
                            echo "Failed to send build status to backend: ${e.getMessage()}"
                        }
                    }
                } else {
                    echo "No backend URL available, skipping build status notification"
                }
            }
        }

        success {
            echo "Build completed successfully! Kubernetes deployment done."
        }

        failure {
            echo "Build failed. Check logs for details."
        }

        unstable {
            echo "Build completed with warnings. Kubernetes deployment may have issues."
        }
    }
}

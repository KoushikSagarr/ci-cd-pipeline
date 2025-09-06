pipeline {
    agent any

    environment {
        IMAGE_NAME = "ci-cd-app"
        DOCKER_HUB_REPO = "koushiksagar/ci-cd-app"
        DOCKER_TAG = "latest"
        // Use environment variable for backend URL - set this in Jenkins global env or system env
        BACKEND_URL = "${env.BACKEND_URL ?: 'http://localhost:3001'}"
    }

    stages {
        stage('Install Dependencies') {
            steps {
                dir('app') {
                    bat 'npm install'
                }
            }
        }

        stage('Run Tests') {
            steps {
                echo 'No tests implemented yet.'
                // TODO: Add your test commands here when ready
                // dir('app') {
                //     bat 'npm test'
                // }
            }
        }

        stage('Docker Build & Push') {
            steps {
                dir('app') {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        bat '''
                        docker login -u %DOCKER_USER% -p %DOCKER_PASS%
                        docker build -t %IMAGE_NAME% .
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
                    echo "Switching to Docker Desktop Kubernetes context..."
                    
                    try {
                        // Switch to docker-desktop context (no credentials needed for local)
                        bat 'kubectl config use-context docker-desktop'
                        
                        // Verify connectivity
                        bat 'kubectl cluster-info --request-timeout=10s'
                        bat 'kubectl get nodes'
                        
                        echo "Applying Kubernetes manifests..."
                        
                        // Create namespace if it doesn't exist
                        bat 'kubectl create namespace ci-cd-app --dry-run=client -o yaml | kubectl apply -f -'
                        
                        // Apply deployments
                        bat '''
                            kubectl apply -f k8s/deployment.yaml -n ci-cd-app
                            kubectl apply -f k8s/service.yaml -n ci-cd-app
                            kubectl rollout status deployment/ci-cd-app-deployment -n ci-cd-app --timeout=300s
                        '''
                        
                        echo "Kubernetes deployment successful!"
                        // Get service info
                        bat 'kubectl get services ci-cd-app-service -n ci-cd-app'
                        bat 'kubectl get pods -n ci-cd-app -l app=ci-cd-app'
                        
                        // Show service URL
                        echo "Application should be accessible via: http://localhost (if using LoadBalancer)"
                        
                    } catch (Exception e) {
                        echo "Kubernetes deployment failed: ${e.getMessage()}"
                        currentBuild.result = 'UNSTABLE'
                        echo "Continuing build despite Kubernetes deployment issues"
                        
                        // Enhanced troubleshooting
                        echo "=== TROUBLESHOOTING INFO ==="
                        echo "1. Ensure Docker Desktop is running"
                        echo "2. Enable Kubernetes in Docker Desktop Settings"
                        echo "3. Wait for Kubernetes to fully start (green indicator)"
                        
                        try {
                            echo "Available contexts:"
                            bat 'kubectl config get-contexts'
                            echo "Current context:"
                            bat 'kubectl config current-context'
                            echo "Docker status:"
                            bat 'docker version --format "Client: {{.Client.Version}}, Server: {{.Server.Version}}"'
                        } catch (Exception diagEx) {
                            echo "Could not get diagnostic info: ${diagEx.getMessage()}"
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                // Get the actual build result - handle null case
                def buildStatus = currentBuild.result ?: 'SUCCESS'
                def buildNumber = env.BUILD_NUMBER
                def jobName = env.JOB_NAME
                def consoleLink = "${env.BUILD_URL}console"
                def commitMessage = ""
                def duration = currentBuild.durationString
                
                // Try to get commit message
                try {
                    commitMessage = bat(
                        script: 'git log -1 --pretty=format:"%%s"',
                        returnStdout: true
                    ).trim()
                } catch (Exception e) {
                    commitMessage = "Could not retrieve commit message"
                }
                
                // Get error details if build failed
                def errorDetails = ""
                if (buildStatus == 'FAILURE' || buildStatus == 'UNSTABLE') {
                    try {
                        errorDetails = bat(
                            script: 'type "%JENKINS_HOME%\\jobs\\%JOB_NAME%\\builds\\%BUILD_NUMBER%\\log" 2>nul || echo "Could not read build log"',
                            returnStdout: true
                        )
                        // Limit error details to last 1000 characters to avoid payload issues
                        if (errorDetails.length() > 1000) {
                            errorDetails = "..." + errorDetails.substring(errorDetails.length() - 1000)
                        }
                    } catch (Exception e) {
                        errorDetails = "Could not retrieve error details: ${e.getMessage()}"
                    }
                }
                
                def jsonBody = [
                    status: buildStatus,
                    jobName: jobName,
                    buildNumber: buildNumber,
                    consoleLink: consoleLink,
                    commitMessage: commitMessage,
                    duration: duration,
                    errorDetails: errorDetails,
                    timestamp: new Date().format("yyyy-MM-dd'T'HH:mm:ss'Z'"),
                    kubernetesDeployed: buildStatus in ['SUCCESS', 'UNSTABLE']
                ]

                withCredentials([string(credentialsId: 'jenkins-api-token', variable: 'JENKINS_API_TOKEN')]) {
                    try {
                        echo "Sending build status to backend: ${buildStatus}"
                        echo "Backend URL: ${env.BACKEND_URL}/api/log-final-status"
                        
                        def response = httpRequest(
                            url: "${env.BACKEND_URL}/api/log-final-status",
                            httpMode: 'POST',
                            contentType: 'APPLICATION_JSON',
                            requestBody: groovy.json.JsonOutput.toJson(jsonBody),
                            customHeaders: [
                                [name: 'Authorization', value: "Bearer ${JENKINS_API_TOKEN}"]
                            ],
                            validResponseCodes: '100:399',
                            timeout: 30
                        )
                        echo "Successfully sent build status to backend. Response: ${response.status}"
                    } catch (Exception e) {
                        echo "Failed to send build status to backend: ${e.getMessage()}"
                        echo "Check if backend server is running and BACKEND_URL is correct"
                        echo "Current BACKEND_URL: ${env.BACKEND_URL}"
                        echo "To set BACKEND_URL: Go to Jenkins > Manage Jenkins > Configure System > Environment variables"
                    }
                }
            }
        }
        
        success {
            echo "Build completed successfully!"
            echo "Application deployed to Kubernetes cluster"
        }
        
        failure {
            echo "Build failed. Check the logs for details."
        }
        
        unstable {
            echo "Build completed with warnings or non-critical failures."
            echo "Docker image pushed successfully, but Kubernetes deployment may have issues"
        }
    }
}
pipeline {
    agent any

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

        stage('Run Tests') {
            steps {
                echo 'No tests implemented yet.'
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
            try {
                echo 'Checking Kubernetes connectivity...'
                
                withKubeConfig([credentialsId: 'kubeconfig-minikube']) {
                    bat 'kubectl cluster-info --request-timeout=10s'
                    
                    echo 'Kubernetes cluster is accessible. Proceeding with deployment...'
                    
                    bat '''
                        echo "Applying Kubernetes deployment..."
                        kubectl apply -f deployment.yaml --validate=false
                        
                        echo "Waiting for deployment to be ready..."
                        kubectl wait --for=condition=available --timeout=300s deployment/ci-cd-app-deployment
                        
                        echo "Checking deployment status..."
                        kubectl get deployments
                        kubectl get pods -l app=ci-cd-app
                        kubectl get services
                        
                        echo "Deployment completed successfully!"
                    '''
                }
                
                // Optional: Get the NodePort URL for Minikube
                script {
                    try {
                        def minikubeUrl = bat(
                            script: 'minikube service ci-cd-app-service --url',
                            returnStdout: true
                        ).trim()
                        echo "Application accessible at: ${minikubeUrl}"
                    } catch (Exception e) {
                        echo "Could not get Minikube service URL: ${e.getMessage()}"
                        echo "You can access the app using: kubectl port-forward service/ci-cd-app-service 4000:4000"
                    }
                }
                
            } catch (Exception e) {
                currentBuild.result = 'UNSTABLE'
                echo "❌ Kubernetes deployment failed: ${e.getMessage()}"
                
                // Provide troubleshooting information
                echo "🔧 Troubleshooting steps:"
                echo "1. Check if Minikube is running: minikube status"
                echo "2. Start Minikube if needed: minikube start"
                echo "3. Verify kubectl context: kubectl config current-context"
                echo "4. Check cluster info: kubectl cluster-info"
                
                // Try to get more diagnostic info
                try {
                    withKubeConfig([credentialsId: 'kubeconfig-minikube']) {
                        bat 'kubectl config view --minify'
                        bat 'kubectl get nodes'
                    }
                } catch (Exception diagError) {
                    echo "Could not get diagnostic info: ${diagError.getMessage()}"
                }
                
                // Don't fail the entire build, just mark as unstable
                echo "⚠️  Continuing build despite Kubernetes deployment issues"
            }
        }
    }
}
    post {
        always {
            script {
                def buildStatus = currentBuild.result
                def buildNumber = env.BUILD_NUMBER
                def jobName = env.JOB_NAME
                def consoleLink = "${env.BUILD_URL}/console"
                
                def jsonBody = [
                    status: buildStatus,
                    jobName: jobName,
                    buildNumber: buildNumber,
                    consoleLink: consoleLink
                ]

                withCredentials([string(credentialsId: 'jenkins-api-token', variable: 'JENKINS_API_TOKEN')]) {
                    try {
                        httpRequest(
                            url: "${env.BACKEND_URL}/api/log-final-status",
                            httpMode: 'POST',
                            contentType: 'APPLICATION_JSON',
                            requestBody: groovy.json.JsonOutput.toJson(jsonBody),
                            customHeaders: [
                                [name: 'Authorization', value: "Bearer ${JENKINS_API_TOKEN}"]
                            ],
                            validResponseCodes: '100:399'
                        )
                        echo "Successfully sent build status to backend."
                    } catch (e) {
                        echo "Failed to send build status to backend: ${e}"
                    }
                }
            }
        }
    }
}

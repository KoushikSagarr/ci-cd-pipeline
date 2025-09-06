pipeline {
    agent any

    environment {
        IMAGE_NAME = "ci-cd-app"
        DOCKER_HUB_REPO = "koushiksagar/ci-cd-app"
        DOCKER_TAG = "latest"
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
                        httpRequest(
                            url: "${env.BACKEND_URL}/api/log-final-status",
                            httpMode: 'POST',
                            contentType: 'APPLICATION_JSON',
                            requestBody: groovy.json.JsonOutput.toJson(jsonBody),
                            customHeaders: [[name: 'Authorization', value: "Bearer ${JENKINS_API_TOKEN}"]],
                            validResponseCodes: '100:399',
                            timeout: 30
                        )
                        echo "Build status sent successfully to backend."
                    } catch (Exception e) {
                        echo "Failed to send build status to backend: ${e.getMessage()}"
                    }
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

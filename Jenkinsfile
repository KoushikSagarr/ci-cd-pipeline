pipeline {
    agent any

    environment {
        IMAGE_NAME = "ci-cd-app"
        DOCKER_HUB_REPO = "koushiksagar/ci-cd-app"
        DOCKER_TAG = "latest"
    }

    stages {
        stage('Git Checkout') {
            steps {
                echo "Checking out Git repository..."
                // This assumes your job is configured to checkout from a Git repo.
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies...'
                dir('app') {
                    bat 'npm install'
                }
            }
            post {
                success {
                    bat "curl -X POST -H \"Content-Type: application/json\" -d \"{\\\"stageName\\\":\\\"Install Dependencies\\\"}\" ${env.BACKEND_URL}/api/pipeline-stage"
                }
            }
        }

        stage('Run Tests') {
            steps {
                echo 'Running tests...'
                echo 'No tests implemented yet.'
            }
            post {
                success {
                    bat "curl -X POST -H \"Content-Type: application/json\" -d \"{\\\"stageName\\\":\\\"Run Tests\\\"}\" ${env.BACKEND_URL}/api/pipeline-stage"
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                echo 'Building and pushing Docker image...'
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
            post {
                success {
                    bat "curl -X POST -H \"Content-Type: application/json\" -d \"{\\\"stageName\\\":\\\"Docker Build & Push\\\"}\" ${env.BACKEND_URL}/api/pipeline-stage"
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
pipeline {
    agent any

    environment {
        IMAGE_NAME = "ci-cd-app"
        DOCKER_HUB_REPO = "koushiksagar/ci-cd-app"
        DOCKER_TAG = "latest"
        BACKEND_URL = "https://5e3f63294371.ngrok-free.app/api/log-final-status"
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

                // Use withCredentials to securely pass the Jenkins API token
                // Replace 'jenkins-api-token' with the ID of your Secret Text credential
                withCredentials([string(credentialsId: 'jenkins-api-token', variable: 'JENKINS_API_TOKEN')]) {
                    try {
                        httpRequest(
                            url: env.BACKEND_URL,
                            httpMode: 'POST',
                            contentType: 'APPLICATION_JSON',
                            requestBody: groovy.json.JsonOutput.toJson(jsonBody),
                            // Add the API token to the request headers for authentication
                            customHeaders: [
                                [name: 'Authorization', value: "Bearer ${JENKINS_API_TOKEN}"]
                            ],
                            // Add a CSRF crumb to avoid a 403 error on Jenkins' end, if required
                            validResponseCodes: '100:399' // The accepted range for valid HTTP status codes
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
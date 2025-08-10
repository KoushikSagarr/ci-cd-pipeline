pipeline {
    agent any

    environment {
        IMAGE_NAME = "ci-cd-app"
        DOCKER_HUB_REPO = "koushiksagar/ci-cd-app"
        DOCKER_TAG = "latest"
        BACKEND_URL = "https://481458ea85f7.ngrok-free.app/api/log-final-status" // <-- Change this to your ngrok URL
    }

    stages {
        stage('Checkout Application Code') {
            steps {
                // This step checks out the application code from its dedicated repository.
                // Replace with your actual application repository URL and credentials.
                checkout([$class: 'GitSCM', branches: [[name: '*/main']], userRemoteConfigs: [[url: 'https://github.com/KoushikSagarr/ci-cd-dashboard']]])
            }
        }

        stage('Install Dependencies') {
            steps {
                // The application code is now available in the workspace.
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

                sh "curl -X POST -H 'Content-Type: application/json' -d '{\"status\":\"${buildStatus}\", \"jobName\":\"${jobName}\", \"buildNumber\":\"${buildNumber}\", \"consoleLink\":\"${consoleLink}\"}' ${env.BACKEND_URL}"
            }
        }
    }
}
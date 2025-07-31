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
    }
}

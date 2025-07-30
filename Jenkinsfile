pipeline {
    agent any

    environment {
        IMAGE_NAME = "ci-cd-app"
    }

    stages {
        stage('Checkout Code') {
            steps {
                git 'https://github.com/KoushikSagarr/ci-cd-pipeline.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('app') {
                    sh 'npm install'
                }
            }
        }

        stage('Run Tests') {
            steps {
                echo 'No tests implemented yet.'
            }
        }

        stage('Docker Build') {
            steps {
                dir('app') {
                    sh 'docker build -t $IMAGE_NAME .'
                }
            }
        }

        stage('Docker Run (Optional)') {
            steps {
                echo 'Optionally run and test the container here'
            }
        }
    }
}

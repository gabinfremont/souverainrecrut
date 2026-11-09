pipeline {
    agent any

    environment {
        IMAGE = 'gabinfremont/souverainrecrut-backend'
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Install + Prisma') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                    sh 'npx prisma generate'
                }
            }
        }

        stage('Tests + Couverture') {
            steps {
                dir('backend') { sh 'npm test' }
            }
        }

        stage('SonarQube') {
            steps {
                dir('backend') {
                    withSonarQubeEnv('SonarQube') {
                        sh "${tool 'SonarScanner'}/bin/sonar-scanner"
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker') {
            steps {
                script {
                    def version = sh(script: "node -p \"require('./backend/package.json').version\"", returnStdout: true).trim()
                    env.TAG = "${version}-${env.GIT_COMMIT.take(7)}"
                }
                dir('backend') {
                    sh 'docker build -t $IMAGE:$TAG .'
                }
            }
        }

        stage('Scan Trivy') {
            steps {
                sh 'trivy image --exit-code 1 --severity CRITICAL --format table -o trivy-report.txt $IMAGE:$TAG'
            }
        }

        stage('Push Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub',
                                                  usernameVariable: 'DH_USER',
                                                  passwordVariable: 'DH_TOKEN')]) {
                    sh 'echo $DH_TOKEN | docker login -u $DH_USER --password-stdin'
                    sh 'docker push $IMAGE:$TAG'
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'backend/coverage/**, trivy-report.txt', allowEmptyArchive: true
            sh 'docker logout || true'
        }
        failure { echo 'Pipeline en échec' }
    }
}
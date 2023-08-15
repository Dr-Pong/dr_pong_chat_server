// pipeline {
//     agent any
//     stages {
//         stage('Checkout') {
//             steps {
//                 git branch: 'main',
//                 credentialsId: 'GitHub_access_token',
//                 url: 'https://github.com/Dr-Pong/dr_pong_api_gateway'
//             }
//         }
//     }
// }
pipeline {
    agent any
    tools {
        nodejs "Jenkins-nodejs"
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm  // 프로젝트 루트 디렉토리에서 checkout 실행
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        stage('Build') {
            steps {
                // 여기에 루트 디렉토리에서 실행할 작업을 정의합니다.
                sh 'npm run build'
            }
        }
        // 다른 스테이지들...
    }
}
pipeline {
  agent any

  parameters {
    string(name: 'NEXT_PUBLIC_API_BASE_URL', defaultValue: 'http://localhost:6137')
  }

  environment {
    REGISTRY = 'ghcr.io'
    OWNER = 'bettaworx'
    BACKEND_IMAGE = 'ghcr.io/bettaworx/ciel-backend'
    FRONTEND_IMAGE = 'ghcr.io/bettaworx/ciel-frontend'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Prepare Tag') {
      steps {
        script {
          env.IMAGE_TAG = "sha-${env.GIT_COMMIT[0..6]}"
        }
      }
    }

    stage('Docker Login') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'ghcr-token', usernameVariable: 'GHCR_USER', passwordVariable: 'GHCR_TOKEN')]) {
          sh 'echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin'
        }
      }
    }

    stage('Build Backend') {
      steps {
        sh 'docker build -f Dockerfile.backend -t $BACKEND_IMAGE:$IMAGE_TAG .'
      }
    }

    stage('Build Frontend') {
      steps {
        sh 'docker build -f Dockerfile.frontend --build-arg NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL -t $FRONTEND_IMAGE:$IMAGE_TAG .'
      }
    }

    stage('Push Images') {
      steps {
        sh 'docker push $BACKEND_IMAGE:$IMAGE_TAG'
        sh 'docker push $FRONTEND_IMAGE:$IMAGE_TAG'
      }
    }
  }
}

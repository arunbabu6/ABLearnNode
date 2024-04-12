pipeline {
    agent any

    environment {
        DOCKER_IMAGEE = 'arunthopil/pro-green-v4' // Corrected variable name
        SONARQUBE_TOKEN = credentials('sonar-aws')
        DOCKERHUB_CREDENTIALS = credentials('dockerhub1')
        MONGO_URI = credentials('MONGO_URI')
        // SSH credentials for each environment
        PROJECT_DIR = '/opt/docker-green'
    }

    stages {
        stage('Setup') {
            steps {
                script {
                    // Set environment based on branch name
                    if (BRANCH_NAME == 'main') {
                        env.ENVIRONMENT = 'Production'
                    } else if (BRANCH_NAME == 'development') {
                        env.ENVIRONMENT = 'Testing'
                    } else if (BRANCH_NAME == 'Staging') {
                        env.ENVIRONMENT = 'Staging'
                    } else {
                        // For any branch not explicitly mentioned, you can choose to skip the build
                        echo "Branch not configured for CI/CD. Skipping build."
                        currentBuild.result = 'NOT_BUILT'
                        return // Skip further stages
                    }
                    echo "Environment set to ${env.ENVIRONMENT}"
                }
            }
        }
        stage('Checkout Code') {
            agent any
            steps {
                checkout scm
            }
        }

        stage('Clean Workspace') {
            agent any
            steps {
                 script {
                    if (fileExists('.')) {
                        deleteDir()
                    } else {
                        echo "Workspace directory does not exist, no need to delete."
                    }
                 }
             }
        }

        stage('Use Artifacts') {
            agent any
            steps {
                script {
                    if (currentBuild.previousBuild != null && currentBuild.previousBuild.result == 'SUCCESS') {
                        try { 
                            copyArtifacts(projectName: "For-Green2/main", selector: lastSuccessful(), filter: 'lint-results.txt');
                        } catch (Exception e) {
                            echo "Warning: Failed to copy artifacts. Proceeding without them."
                        }
                    } else {
                        echo "No previous successful build found. Skipping artifact copy."
                    }
                }
            }
        }

        stage('Stash Client') {
            agent any
            steps {
                dir('client') {
                    stash includes: '**', name: 'client-src'
                }
            }
        }

        stage('Prepare and Build') {
            agent any
            steps {
                script {
                    unstash 'client-src'
                    dir('client') {
                        // Assuming the build commands are here
                        sh 'npm install'
                        sh 'npm run build'
                        // Stash the build artifacts, excluding the node_modules directory
                        stash excludes: 'node_modules/**', includes: '**', name: 'build-artifacts'
                    }
                }
            }
        }


        // SonarQube Analysis and Snyk Security Scan 
       //stage('SonarQube Analysis') {
         //   agent any
           // steps {
             //   withSonarQubeEnv('Sonarqube') { // 'Sonarcube-cred' from |should match the SonarQube configuration in Jenkins
               //     sh """
                 //     sonar-scanner \
                   //   -Dsonar.projectKey=ProjectGreenFrontend \
                     // -Dsonar.sources=. \
                     // -Dsonar.host.url=http://54.145.1.89:9000/ \
                     // -Dsonar.login=$SONARQUBE_TOKEN
                    //"""
                //}
           // }
        //}

        stage('Snyk Security Scan') {
            agent any
            steps {
                dir('client') {
        //        snykSecurity failOnError: false, failOnIssues: false, organisation: 'arunbabu6', projectName: 'For-Green2', snykInstallation: 'Snyk', snykTokenId: 'snyk-token', targetFile: 'package.json'
                snykSecurity failOnError: false, failOnIssues: false, organisation: 'arunbabu6', projectName: 'For-Green2', snykInstallation: 'Snyk', snykTokenId: 'snyk-token'
                }

            }
        }

        stage('Lint') {
            agent any
            steps {
                dir('client') { 
                                // Execute the lint script and allow the build not to fail on lint errors
                  script {
                     // Run lint script and capture the exit code
                     def lintExitCode = sh(script: 'npm run lint:ci || true', returnStatus: true)

                     // Check if the lint report exists
                      if (fileExists('eslint-report.xml')) {
                     // Archive the eslint report
                          archiveArtifacts artifacts: 'eslint-report.json', onlyIfSuccessful: true
                    } else {
                          echo "No eslint-report.xml found"
                    }

                // If the lint script exited with an error (non-zero exit code), fail the build
                      if (lintExitCode != 0) {
                           error("Linting failed with exit code: ${lintExitCode}")
                     }
                   }
               }
           }
        }
 
        stage('Build and Push Docker Image') {
            agent any
            steps {
                script {
                    // Create a directory 'artifacts' in the Jenkins workspace to hold the unstashed files
                    sh "mkdir -p artifacts"
                    dir('artifacts') {
                        // Unstash the build artifacts into this 'artifacts' directory
                        unstash 'build-artifacts'
                        }
                        sshagent(['sshtoaws']) {
                            // Clear the 'artifacts' directory on the Docker host

                            sh "ssh -v -i /var/jenkins_home/greenworld.pem ubuntu@10.3.1.91 'rm -rf ${PROJECT_DIR}/artifacts/*'"
                            sh "scp -v -rp artifacts/* ubuntu@10.3.1.91:${PROJECT_DIR}/artifacts/"
                            sh "ssh -v -i /var/jenkins_home/greenworld.pem ubuntu@10.3.1.91 'ls -la ${PROJECT_DIR}/artifacts/'"

                            // Build the Docker image on the Docker host
                            sh "ssh -v -i /var/jenkins_home/greenworld.pem ubuntu@10.3.1.91 'cd ${PROJECT_DIR} && docker build -f Dockerfile -t ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-frontend-${env.BUILD_NUMBER} .'"

                        }
                        // Log in to DockerHub and push the image
                        withCredentials([usernamePassword(credentialsId: 'dockerhub1', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                            sh """
                                echo '${DOCKER_PASSWORD}' | ssh -i /var/jenkins_home/greenworld.pem ubuntu@10.3.1.91 'docker login -u ${DOCKER_USERNAME} --password-stdin' > /dev/null 2>&1
                                ssh -i /var/jenkins_home/greenworld.pem ubuntu@10.3.1.91 'docker push ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-frontend-${env.BUILD_NUMBER}'
                            """
                        }

                    }
            }
        }


        stage('Trivy Vulnerability Scan') {
            agent any
            steps {
                script {
                    // Wrapping the SSH commands in a single SSH session
                    sshagent(['sshtoaws']) {
                        // Execute Trivy scan and echo the scanning process
                        sh "ssh -i /var/jenkins_home/greenworld.pem ubuntu@10.3.1.91 'trivy image --download-db-only && \
                        echo \"Scanning ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-frontend-${env.BUILD_NUMBER} with Trivy...\" && \
                        trivy image --format json --output \"/opt/docker-green/Trivy/trivy-report--${env.BUILD_NUMBER}.json\" ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-frontend-${env.BUILD_NUMBER}'"
                        // Correctly execute scp within a sh command block
                        sh "scp ubuntu@10.3.1.91:/opt/docker-green/Trivy/trivy-report--${env.BUILD_NUMBER}.json ."

                        // Use double quotes for string interpolation
                        archiveArtifacts artifacts: "trivy-report--${env.BUILD_NUMBER}.json", onlyIfSuccessful: true
                    }
                }
            }
        }

        stage('Deploy') {      
            agent any  
            steps {
                script {
                    switch (ENVIRONMENT) {
                        case 'Demo':
                        withCredentials([string(credentialsId: 'MONGO_URI', variable: 'MONGO_URI_SECRET')]) {
                            sshagent(['sshtoaws']) {
                                sh """
                                    ssh -o StrictHostKeyChecking=no ab@host.docker.internal '
                                    docker pull ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-frontend-${env.BUILD_NUMBER} &&
                                    docker rm globalgreen-frontend-v4 || true &&
                                    docker run -d --name globalgreen-frontend-v4 -p 8090:80 ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-frontend-${env.BUILD_NUMBER}
                                    '
                            """
                            }
                        }
                        break
              
                        case 'Testing':
                        withCredentials([string(credentialsId: 'MONGO_URI', variable: 'MONGO_URI_SECRET')]) {
                            sshagent(['sshtoaws']) {
                                sh """
                                    ssh -o StrictHostKeyChecking=no ubuntu@3.149.249.31 '
                                    docker pull ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-frontend-${env.BUILD_NUMBER} &&
                                    docker stop globalgreen-frontend-v4 || true &&
                                    docker rm globalgreen-frontend-v4 || true &&
                                    docker run -d --name globalgreen-frontend-v4 -p 8090:80 ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-frontend-${env.BUILD_NUMBER}
                                    '
                            """
                            }
                        }
                        break
                           
                        case 'Production':
                        withCredentials([string(credentialsId: 'MONGO_URI', variable: 'MONGO_URI_SECRET')]) {
                            sshagent(['sshtoaws']) {
                                sh """
                                    ssh -o StrictHostKeyChecking=no ubuntu@18.191.147.35 '
                                    docker pull ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-frontend-${env.BUILD_NUMBER} &&
                                    docker stop globalgreen-frontend-v4 || true &&
                                    docker rm globalgreen-frontend-v4 || true &&
                                    docker run -d --name globalgreen-frontend-v4 -p 8090:80 ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-frontend-${env.BUILD_NUMBER}
                                    '
                            """
                            }
                        }
                        break
                            
                        case 'Staging':
                        withCredentials([string(credentialsId: 'MONGO_URI', variable: 'MONGO_URI_SECRET')]) {
                            sshagent(['sshtoaws']) {
                                sh """
                                    ssh -o StrictHostKeyChecking=no ubuntu@3.145.52.166 '
                                    docker pull ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-frontend-${env.BUILD_NUMBER} &&
                                    docker stop globalgreen-frontend-v4 || true &&
                                    docker rm globalgreen-frontend-v4 || true &&
                                    docker run -d --name globalgreen-frontend-v4 -p 8090:80 ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-frontend-${env.BUILD_NUMBER}
                                    '
                            """
                            }
                        }
                        break
                            
                        default:
                            echo "Environment configuration not found"
                            return

                    }

                }
            }
        }
    }

    post {
        always {
            script{
                   
                if (env.ENVIRONMENT) {
                    echo "Pipeline execution completed for ${env.ENVIRONMENT}"
                } else {
                    echo "Pipeline execution completed, but ENVIRONMENT was not set."
                }
            }
        }
    }
}

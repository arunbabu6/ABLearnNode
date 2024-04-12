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

        stage('Stash Backend') {
            agent any
            steps {
                dir('backend') {
                    stash includes: '**', name: 'backend-src'
                }
            }
        }

        stage('Prepare and Build') {
            agent any
            steps {
                script {
                    unstash 'backend-src'
                    dir('backend') {
                        // Assuming the build commands are here [ @Chandan verify this]
                    //    sh 'cp ${WORKSPACE}/.env .'
                        sh 'npm install'
                        // Stash the build artifacts, excluding the node_modules directory
                        stash excludes: 'node_modules/**', includes: '**', name: 'build-artifactsb'
                    }
                }
            }
        }

stage('Generate Documentation') {
    agent any
    steps {
        script {
            // Create a temporary directory in the Jenkins workspace to hold the unstashed files
            sh "mkdir -p temp_backend"
            // Unstash the backend source code into this temporary directory
            dir('temp_backend') {
                unstash 'backend-src'
            }
            // Use SSH Agent to handle the SSH keys and connections
            sshagent(['sshtoaws']) {
                def projectDir = '/opt/docker-green'
                // Clear the remote documentation directory before copying new files
                sh "ssh -i /var/jenkins_home/greenworld.pem ubuntu@3.23.92.68 'rm -rf ${projectDir}/backenddocs/*'"
                sh "ssh -i /var/jenkins_home/greenworld.pem ubuntu@3.23.92.68 'mkdir -p ${projectDir}/backenddocs/docs'"
                // Copy the source code to the 'backenddocs' directory on the Docker host
                sh "scp -rp temp_backend/* ubuntu@3.23.92.68:${projectDir}/backenddocs"
                // Generate the documentation on the Docker host
                sh """
                ssh -i /var/jenkins_home/greenworld.pem ubuntu@3.23.92.68 'source ~/.nvm/nvm.sh && cd /opt/docker-green/backenddocs && /home/ubuntu/.nvm/versions/node/v21.7.3/bin/jsdoc -c jsdoc.conf.json -r . -d=./docs'
                """
                // Optionally archive the generated documentation in Jenkins, copy it back from the Docker host
                sh "scp -rp ubuntu@3.23.92.68:${projectDir}/backenddocs/docs ./docs-backend"
            }
            // Archive the documentation if copied back
            archiveArtifacts artifacts: 'docs-backend/**', allowEmptyArchive: true
        }
    }
}



        // SonarQube Analysis and Snyk Security Scan 
       // stage('SonarQube Analysis') {
         //   agent any
           // steps {
             //   withSonarQubeEnv('Sonarqube') { // 'Sonarcube-cred' from |should match the SonarQube configuration in Jenkins
               //     sh """
                 //     sonar-scanner \
                   //   -Dsonar.projectKey=ProjectGreenBackend-Production \
                     // -Dsonar.sources=. \
                      //-Dsonar.host.url=http://172.19.0.4:9000/ \
                      //-Dsonar.login=$SONARQUBE_TOKEN
                    //"""
                //}
            //}
        //}

        stage('Snyk Security Scan') {
            agent any
            steps {
                dir('client') {
        //        snykSecurity failOnError: false, failOnIssues: false, organisation: 'arunbabu6', projectName: 'For-Green2', snykInstallation: 'Snyk', snykTokenId: 'snyk-token', targetFile: 'package.json'
                snykSecurity failOnError: false, failOnIssues: false, organisation: 'arunbabu6', projectName: 'For-Green2-Backend', snykInstallation: 'Snyk', snykTokenId: 'snyk-token'
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
                    sh "mkdir -p artifactsb"
                    dir('artifactsb') {
                        // Unstash the build artifacts into this 'artifacts' directory
                        unstash 'build-artifactsb'
                        }
                        sshagent(['sshtoaws']) {
                            // Clear the 'artifacts' directory on the Docker host
                            sh "ssh -v -i /var/jenkins_home/greenworld.pem ubuntu@3.23.92.68 'rm -rf ${PROJECT_DIR}/artifactsb/*'"
                            sh "scp -v -rp artifactsb/* ubuntu@3.23.92.68:${PROJECT_DIR}/artifactsb/"
                            sh "ssh -v -i /var/jenkins_home/greenworld.pem ubuntu@3.23.92.68 'ls -la ${PROJECT_DIR}/artifactsb/'"

                            // Build the Docker image on the Docker host
                            sh "ssh -v -i /var/jenkins_home/greenworld.pem ubuntu@3.23.92.68 'cd ${PROJECT_DIR} && docker build -f backend.Dockerfile -t ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-backend-${env.BUILD_NUMBER} .'"

                        }
                        // Log in to DockerHub and push the image
                        withCredentials([usernamePassword(credentialsId: 'dockerhub1', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                            sh """
                                echo '${DOCKER_PASSWORD}' | ssh -i /var/jenkins_home/greenworld.pem ubuntu@3.23.92.68 'docker login -u ${DOCKER_USERNAME} --password-stdin' > /dev/null 2>&1
                                ssh -i /var/jenkins_home/greenworld.pem ubuntu@3.23.92.68 'docker push ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-backend-${env.BUILD_NUMBER}'
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
                        sh "ssh -i /var/jenkins_home/greenworld.pem ubuntu@3.23.92.68 'trivy image --download-db-only && \
                        echo \"Scanning ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-backend-${env.BUILD_NUMBER} with Trivy...\" && \
                        trivy image --format json --output \"/opt/docker-green/Trivy/trivy-report--${env.BUILD_NUMBER}.json\" ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-backend-${env.BUILD_NUMBER}'"
                        // Correctly execute scp within a sh command block
                        sh "scp ubuntu@3.23.92.68:/opt/docker-green/Trivy/trivy-report--${env.BUILD_NUMBER}.json ."

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
                                    docker pull ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-backend-${env.BUILD_NUMBER} &&
                                    docker stop globalgreen-backend-v4 || true &&
                                    docker rm globalgreen-backend-v4 || true &&
                                    docker run -d --name globalgreen-backend-v4 -p 6969:6969 -e MONGO_URI="${MONGO_URI}" ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-backend-${env.BUILD_NUMBER}
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
                                    docker pull ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-backend-${env.BUILD_NUMBER} &&
                                    docker stop globalgreen-backend-v4 || true &&
                                    docker rm globalgreen-backend-v4 || true &&
                                    docker run -d --name globalgreen-backend-v4 -p 6969:6969 -e MONGO_URI="${MONGO_URI}" ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-backend-${env.BUILD_NUMBER}
                                    '
                                """
                            }
                        }
                        break
                           
                        case 'Production':
                        withCredentials([string(credentialsId: 'MONGO_URI', variable: 'MONGO_URI_SECRET')]) {
                            sshagent(['sshtoaws']) {
                                sh """
                                    ssh -o StrictHostKeyChecking=no ubuntu@18.227.81.136 '
                                    docker pull ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-backend-${env.BUILD_NUMBER} &&
                                    docker stop globalgreen-backend-v4 || true &&
                                    docker rm globalgreen-backend-v4 || true &&
                                    docker run -d --name globalgreen-backend-v4 -p 6969:6969 -e MONGO_URI="${MONGO_URI}" ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-backend-${env.BUILD_NUMBER}
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
                                    docker pull ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-backend-${env.BUILD_NUMBER} &&
                                    docker stop globalgreen-backend-v4 || true &&
                                    docker rm globalgreen-backend-v4 || true &&
                                    docker run -d --name globalgreen-backend-v4 -p 6969:6969 -e MONGO_URI="${MONGO_URI}" ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-backend-${env.BUILD_NUMBER}
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

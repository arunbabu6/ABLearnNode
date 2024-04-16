pipeline {
    agent any

    environment {
        DOCKER_IMAGEE = 'arunthopil/pro-green-v4' // Corrected variable name
       // SONARQUBE_TOKEN = credentials('sonar-aws')
        DOCKERHUB_CREDENTIALS = credentials('dockerhub1')
        MONGO_URI = credentials('MONGO_URI')
        // SSH credentials for each environment
        PROJECT_DIR = '/opt/docker-green'
        OWASP_KEY = credentials('dependency-track')
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
            sshagent(['jenkinaccess']) {
                def projectDir = '/opt/docker-green'
                // Clear the remote documentation directory before copying new files
                sh "ssh ab@host.docker.internal 'rm -rf ${projectDir}/backenddocs/*'"
                sh "ssh ab@host.docker.internal 'mkdir -p ${projectDir}/backenddocs/docs'"
                // Copy the source code to the 'backenddocs' directory on the Docker host
                sh "scp -rp temp_backend/* ab@host.docker.internal:${projectDir}/backenddocs"
                // Generate the documentation on the Docker host
                sh """
                ssh ab@host.docker.internal 'source ~/.nvm/nvm.sh && cd /opt/docker-green/backenddocs && /home/ab/.nvm/versions/node/v21.7.3/bin/jsdoc -c jsdoc.conf.json -r . -d ./docs'
                """
                // Optionally archive the generated documentation in Jenkins, copy it back from the Docker host
                sh "scp -rp ab@host.docker.internal:${projectDir}/backenddocs/docs ./docs-backend"
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
                        sshagent(['jenkinaccess']) {
                            // Clear the 'artifacts' directory on the Docker host
                            sh "ssh -v ab@host.docker.internal 'rm -rf ${PROJECT_DIR}/artifactsb/*'"
                            sh "scp -v -rp artifactsb/* ab@host.docker.internal:${PROJECT_DIR}/artifactsb/"
                            sh "ssh -v ab@host.docker.internal 'ls -la ${PROJECT_DIR}/artifactsb/'"

                            // Build the Docker image on the Docker host
                            sh "ssh -v ab@host.docker.internal 'cd ${PROJECT_DIR} && docker build -f backend.Dockerfile -t ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-backend-${env.BUILD_NUMBER} .'"

                        }
                        // Log in to DockerHub and push the image
                        withCredentials([usernamePassword(credentialsId: 'dockerhub1', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                            sh """
                                echo '${DOCKER_PASSWORD}' | ssh ab@host.docker.internal 'docker login -u ${DOCKER_USERNAME} --password-stdin' > /dev/null 2>&1
                                ssh ab@host.docker.internal 'docker push ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-backend-${env.BUILD_NUMBER}'
                            """
                        }

                    }
            }
        }

stage('Trivy Vulnerability Scan') {
    agent any
    steps {
        script {
            sshagent(['jenkinaccess']) {
                // Combine commands into one SSH session and handle command execution properly
                sh """
                ssh ab@host.docker.internal '
                    # Ensure the Trivy database is up to date
                    trivy image --download-db-only &&

                    # Use the pre-placed custom HTML template for the scan
                    echo "Scanning ${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-backend-${env.BUILD_NUMBER} with Trivy..." &&
                    trivy image --format template --template "@/opt/docker-green/Trivy/html.tpl" --output "/opt/docker-green/Trivy/trivy-report-html--${env.BUILD_NUMBER}.html" "${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-backend-${env.BUILD_NUMBER}"
                '
                """

                // Copy the HTML report file to the Jenkins workspace
                sh "scp ab@host.docker.internal:/opt/docker-green/Trivy/trivy-report-html--${env.BUILD_NUMBER}.html ."
                
                // Archive the HTML report as an artifact
                archiveArtifacts artifacts: "trivy-report-html--${env.BUILD_NUMBER}.html", onlyIfSuccessful: true
                
                // Publish the HTML report to the Jenkins UI
                publishHTML target: [
                    reportName: 'Trivy Vulnerability HTML Report',
                    reportDir: '.',
                    reportFiles: 'trivy-report-html--${env.BUILD_NUMBER}.html',
                    alwaysLinkToLastBuild: true,
                    keepAll: true
                ]
            }
        }
    }
}

stage('Generate SBOM') {
    agent any
    steps {
        script {
            sshagent(['jenkinaccess']) {
                // Directly use Syft since it's installed in a standard location
                def imageName = "${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-backend-${env.BUILD_NUMBER}"
                sh """
                ssh ab@host.docker.internal '
                    # Generate SBOM and save it on the Docker host
                    syft $imageName -o cyclonedx-json=/opt/docker-green/syft-sbom-${env.BUILD_NUMBER}.json
                '
                """

                // Copy the SBOM file back to Jenkins workspace
                sh "scp ab@host.docker.internal:/opt/docker-green/syft-sbom-${env.BUILD_NUMBER}.json ."

                // Archive the SBOM file as an artifact
                archiveArtifacts artifacts: "syft-sbom-${env.BUILD_NUMBER}.json", onlyIfSuccessful: true
            }
        }
    }
}

stage('Generate SBOM Table Output') {
    agent any
    steps {
        script {
            sshagent(['jenkinaccess']) {
                def imageName = "${env.DOCKER_IMAGEE}:${env.ENVIRONMENT.toLowerCase()}-backend-${env.BUILD_NUMBER}"
                // Generate SBOM in table format and save it to a file on the Docker host
                sh """
                ssh ab@host.docker.internal '
                    syft $imageName -o table > /opt/docker-green/syft-sbom-${env.BUILD_NUMBER}-table.txt
                '
                """

                // Copy the table output file back to Jenkins workspace
                sh "scp ab@host.docker.internal:/opt/docker-green/syft-sbom-${env.BUILD_NUMBER}-table.txt ."

                // Archive the table output as an artifact
                archiveArtifacts artifacts: "syft-sbom-${env.BUILD_NUMBER}-table.txt", onlyIfSuccessful: true
            }
        }
    }
}

stage('Dependency-Check') {
    steps {
        script {
            dependencyCheck additionalArguments: '',
                scanPath: '.', 
                includeHtmlReports: true,
                includeCsvReports: false,
                includeJsonReports: true, // Ensure JSON report is enabled
                includeVulnReports: true
        }
    }
}


stage('Publish Dependency-Check Report') {
    steps {
        dependencyCheckPublisher pattern: '**/dependency-check-report.*'
        // No failure or instability thresholds are set
    }
}

stage('Review Dependency-Check Results') {
    steps {
        script {
            // Load the JSON report generated by Dependency-Check
            def report = readJSON file: 'dependency-check-report/dependency-check-report.json'
            // Check for the presence of vulnerabilities
            if (report?.dependencies.any { it.vulnerabilities?.size() > 0 }) {
                echo "Vulnerabilities found, please review the report"
                // Here, you can add any specific logging or notification logic
            } else {
                echo "No vulnerabilities found."
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
                            sshagent(['jenkinaccess']) {
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
                            sshagent(['jenkinaccess']) {
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
                            sshagent(['jenkinaccess']) {
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
                            
                        case 'Staging':
                        withCredentials([string(credentialsId: 'MONGO_URI', variable: 'MONGO_URI_SECRET')]) {
                            sshagent(['jenkinaccess']) {
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

@echo off
echo ========================================
echo Google Cloud Authentication Setup
echo ========================================
echo.
echo This will set up authentication using your personal Google account
echo instead of a service account (which is blocked by your organization).
echo.
echo Step 1: Login with your Google account
echo ----------------------------------------
gcloud auth login

echo.
echo Step 2: Set up Application Default Credentials
echo ----------------------------------------
gcloud auth application-default login

echo.
echo Step 3: Set the project
echo ----------------------------------------
gcloud config set project rare-result-471417-k0

echo.
echo Step 4: Enable required APIs
echo ----------------------------------------
gcloud services enable aiplatform.googleapis.com
gcloud services enable vision.googleapis.com

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Your authentication is now configured.
echo The credentials will be stored in:
echo   %APPDATA%\gcloud\application_default_credentials.json
echo.
echo You can now use Vertex AI with your personal credentials.
pause
@echo off
echo Deploying to GitHub repository...

git init
git add .
git commit -m "Initial commit: ETF Recovery Analyzer for GitHub Pages"
git branch -M main
git remote add origin https://github.com/kator-pixel/etf-research.git
git push -u origin main --force

echo.
echo Deployment complete!
echo.
echo Next steps:
echo 1. Go to https://github.com/kator-pixel/etf-research/settings/pages
echo 2. Under "Source", select "GitHub Actions"
echo 3. Wait a few minutes for deployment
echo 4. Access your app at: https://kator-pixel.github.io/etf-research/
echo.
pause
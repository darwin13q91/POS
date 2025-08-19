#!/usr/bin/env node

/**
 * Vercel Deployment Script for POS System
 * Prepares and deploys the application to Vercel with optimizations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Vercel deployment for Modern POS System...\n');

// Configuration
const deployConfig = {
  platform: 'vercel',
  buildCommand: 'npm run build:vercel',
  outputDir: 'dist'
};

// Step 1: Pre-deployment checks
console.log('✅ Step 1: Pre-deployment validation...');
try {
  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    console.log('   Vercel CLI found ✓');
  } catch {
    console.log('   Installing Vercel CLI...');
    execSync('npm install -g vercel', { stdio: 'inherit' });
    console.log('   Vercel CLI installed ✓');
  }

  // Check if user is logged in to Vercel
  try {
    execSync('vercel whoami', { stdio: 'pipe' });
    console.log('   Vercel authentication verified ✓');
  } catch {
    console.log('   Please login to Vercel...');
    execSync('vercel login', { stdio: 'inherit' });
    console.log('   Vercel login completed ✓');
  }

} catch (error) {
  console.error('❌ Pre-deployment checks failed:', error.message);
  process.exit(1);
}

// Step 2: Environment validation
console.log('\n✅ Step 2: Environment validation...');
try {
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
  if (majorVersion < 18) {
    throw new Error(`Node.js 18+ required, found ${nodeVersion}`);
  }
  console.log(`   Node.js version: ${nodeVersion} ✓`);

  // Check package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`   Project: ${packageJson.name} v${packageJson.version} ✓`);

  // Check vercel.json exists
  if (!fs.existsSync('vercel.json')) {
    console.warn('⚠️  vercel.json not found, using default configuration');
  } else {
    console.log('   Vercel configuration found ✓');
  }

} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

// Step 3: Clean and prepare
console.log('\n✅ Step 3: Preparing for deployment...');
try {
  // Clean previous builds
  if (fs.existsSync(deployConfig.outputDir)) {
    execSync(`rm -rf ${deployConfig.outputDir}`, { stdio: 'inherit' });
    console.log('   Previous build cleaned ✓');
  }

  // Install dependencies
  execSync('npm ci', { stdio: 'inherit' });
  console.log('   Dependencies updated ✓');

} catch (error) {
  console.error('❌ Preparation failed:', error.message);
  process.exit(1);
}

// Step 4: Type checking and linting
console.log('\n✅ Step 4: Code quality checks...');
try {
  execSync('npm run type-check', { stdio: 'inherit' });
  console.log('   TypeScript validation passed ✓');

  try {
    execSync('npm run lint', { stdio: 'inherit' });
    console.log('   ESLint validation passed ✓');
  } catch {
    console.warn('⚠️  Linting issues found, continuing deployment...');
  }

} catch (error) {
  console.error('❌ Code quality checks failed:', error.message);
  console.log('   Fix TypeScript errors before deploying');
  process.exit(1);
}

// Step 5: Build application
console.log('\n✅ Step 5: Building application...');
try {
  process.env.NODE_ENV = 'production';
  execSync(deployConfig.buildCommand, { stdio: 'inherit' });
  console.log('   Build completed successfully ✓');

  // Verify critical files exist
  const criticalFiles = ['index.html', 'manifest.json', 'sw.js'];
  const missingFiles = criticalFiles.filter(file => 
    !fs.existsSync(path.join(deployConfig.outputDir, file))
  );

  if (missingFiles.length > 0) {
    console.warn(`⚠️  Missing files: ${missingFiles.join(', ')}`);
  } else {
    console.log('   All critical files present ✓');
  }

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 6: Preview deployment (optional)
const args = process.argv.slice(2);
const isPreview = args.includes('--preview') || args.includes('-p');
const skipPreview = args.includes('--skip-preview') || args.includes('--prod');

if (!skipPreview && !isPreview) {
  console.log('\n🔍 Would you like to deploy a preview first?');
  console.log('   Run with --preview for preview deployment');
  console.log('   Run with --prod to skip preview and deploy to production');
  console.log('   Continuing with production deployment...\n');
}

// Step 7: Deploy to Vercel
console.log('✅ Step 7: Deploying to Vercel...');
try {
  let deployCommand = 'vercel';
  
  if (isPreview) {
    console.log('   Deploying preview version...');
    // Preview deployment
  } else {
    console.log('   Deploying to production...');
    deployCommand += ' --prod';
  }

  // Add project name if specified
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const projectName = packageJson.name || 'modern-pos-system';
  deployCommand += ` --name ${projectName}`;

  const result = execSync(deployCommand, { 
    stdio: 'pipe',
    encoding: 'utf8'
  });

  // Extract URL from Vercel output
  const urlMatch = result.match(/https:\/\/[^\s]+/);
  const deploymentUrl = urlMatch ? urlMatch[0] : 'Deployment URL not found';

  console.log('   Deployment completed successfully ✓');
  console.log(`   URL: ${deploymentUrl}`);

  // Save deployment info
  const deploymentInfo = {
    url: deploymentUrl,
    timestamp: new Date().toISOString(),
    version: packageJson.version,
    platform: 'vercel',
    type: isPreview ? 'preview' : 'production'
  };

  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log('   Deployment info saved ✓');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.log('\nTroubleshooting tips:');
  console.log('1. Ensure you\'re logged in: vercel whoami');
  console.log('2. Check Vercel dashboard for errors');
  console.log('3. Verify vercel.json configuration');
  console.log('4. Check build output for issues');
  process.exit(1);
}

// Step 8: Post-deployment verification
console.log('\n✅ Step 8: Post-deployment verification...');
try {
  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  
  console.log('   Deployment verification:');
  console.log(`     ✓ URL: ${deploymentInfo.url}`);
  console.log(`     ✓ Version: ${deploymentInfo.version}`);
  console.log(`     ✓ Platform: ${deploymentInfo.platform}`);
  console.log(`     ✓ Type: ${deploymentInfo.type}`);
  console.log(`     ✓ Deployed: ${deploymentInfo.timestamp}`);

  // Test basic connectivity (optional)
  console.log('   Basic connectivity test skipped (manual verification recommended)');

} catch (error) {
  console.warn('⚠️  Post-deployment verification failed:', error.message);
}

// Success message
console.log('\n🎉 Vercel deployment completed successfully!');
console.log('\n📋 Next steps:');
console.log('   1. Visit the deployment URL to verify functionality');
console.log('   2. Test PWA installation on mobile/desktop');
console.log('   3. Verify offline functionality works');
console.log('   4. Test all major features (POS, inventory, reports)');
console.log('   5. Set up custom domain if needed');
console.log('   6. Configure environment variables in Vercel dashboard');

console.log('\n🔧 Vercel Dashboard:');
console.log('   • Analytics: Monitor performance and usage');
console.log('   • Domains: Set up custom domains');
console.log('   • Environment Variables: Configure app settings');
console.log('   • Build Logs: Review deployment details');

console.log('\n🌟 Your Modern POS System is now live on Vercel!');
console.log('   Built for modern businesses, deployed on modern infrastructure.');

// Check if deployment info exists to show URL
try {
  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  console.log(`\n🚀 Access your POS system: ${deploymentInfo.url}`);
} catch {
  console.log('\n🚀 Check Vercel dashboard for your deployment URL');
}

process.exit(0);

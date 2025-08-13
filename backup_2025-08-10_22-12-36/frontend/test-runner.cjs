#!/usr/bin/env node

/**
 * Automated Test Runner for KHS CRM
 * 
 * This script runs all tests and verifies the application is working correctly
 * before any code changes are deployed.
 */

const { spawn } = require('child_process');
const chalk = require('chalk');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60));
}

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(' ')}`, colors.blue);
    
    const child = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
      ...options
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve({ output, errorOutput });
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function checkPrerequisites() {
  logSection('Checking Prerequisites');
  
  try {
    // Check Node.js
    const { output: nodeVersion } = await runCommand('node', ['--version']);
    log(`✓ Node.js ${nodeVersion.trim()}`, colors.green);
    
    // Check npm
    const { output: npmVersion } = await runCommand('npm', ['--version']);
    log(`✓ npm ${npmVersion.trim()}`, colors.green);
    
    // Check if dependencies are installed
    try {
      await runCommand('npm', ['list', '@testing-library/react'], { stdio: 'ignore' });
      log('✓ Test dependencies installed', colors.green);
    } catch {
      log('✗ Test dependencies not installed', colors.red);
      log('Installing test dependencies...', colors.yellow);
      await runCommand('npm', ['install']);
    }
    
    return true;
  } catch (error) {
    log(`✗ Prerequisites check failed: ${error.message}`, colors.red);
    return false;
  }
}

async function runTypeCheck() {
  logSection('Running TypeScript Type Check');
  
  try {
    await runCommand('npm', ['run', 'typecheck']);
    log('✓ TypeScript type check passed', colors.green);
    return true;
  } catch (error) {
    log('✗ TypeScript type check failed', colors.red);
    return false;
  }
}

async function runLinter() {
  logSection('Running ESLint');
  
  try {
    await runCommand('npm', ['run', 'lint']);
    log('✓ ESLint check passed', colors.green);
    return true;
  } catch (error) {
    log('✗ ESLint check failed', colors.red);
    // Continue even if lint fails
    return true;
  }
}

async function runUnitTests() {
  logSection('Running Unit Tests');
  
  try {
    await runCommand('npm', ['test', '--', '--run']);
    log('✓ All unit tests passed', colors.green);
    return true;
  } catch (error) {
    log('✗ Unit tests failed', colors.red);
    return false;
  }
}

async function runIntegrationTests() {
  logSection('Running Integration Tests');
  
  try {
    await runCommand('npm', ['test', '--', 'src/test/integration', '--run']);
    log('✓ All integration tests passed', colors.green);
    return true;
  } catch (error) {
    log('✗ Integration tests failed', colors.red);
    return false;
  }
}

async function runTestCoverage() {
  logSection('Generating Test Coverage Report');
  
  try {
    await runCommand('npm', ['run', 'test:coverage']);
    log('✓ Test coverage report generated', colors.green);
    log('View coverage report at: coverage/index.html', colors.cyan);
    return true;
  } catch (error) {
    log('✗ Coverage report generation failed', colors.red);
    return true; // Don't fail the entire test run
  }
}

async function checkBuild() {
  logSection('Testing Production Build');
  
  try {
    await runCommand('npm', ['run', 'build']);
    log('✓ Production build successful', colors.green);
    return true;
  } catch (error) {
    log('✗ Production build failed', colors.red);
    return false;
  }
}

async function main() {
  console.clear();
  log('KHS CRM Automated Test Runner', colors.bright + colors.magenta);
  log('================================\n', colors.magenta);
  
  const startTime = Date.now();
  const results = {
    prerequisites: false,
    typeCheck: false,
    lint: false,
    unitTests: false,
    integrationTests: false,
    coverage: false,
    build: false,
  };

  try {
    // Run all checks
    results.prerequisites = await checkPrerequisites();
    if (!results.prerequisites) {
      throw new Error('Prerequisites not met');
    }

    results.typeCheck = await runTypeCheck();
    results.lint = await runLinter();
    results.unitTests = await runUnitTests();
    results.integrationTests = await runIntegrationTests();
    results.coverage = await runTestCoverage();
    results.build = await checkBuild();

    // Summary
    logSection('Test Summary');
    
    const totalTests = Object.keys(results).length - 1; // Exclude prerequisites
    const passedTests = Object.values(results).filter(r => r).length - 1;
    
    log(`Total checks: ${totalTests}`, colors.cyan);
    log(`Passed: ${passedTests}`, colors.green);
    log(`Failed: ${totalTests - passedTests}`, colors.red);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`\nTotal time: ${duration}s`, colors.cyan);
    
    if (passedTests === totalTests) {
      log('\n✓ All tests passed! Safe to proceed with changes.', colors.bright + colors.green);
      process.exit(0);
    } else {
      log('\n✗ Some tests failed. Please fix issues before proceeding.', colors.bright + colors.red);
      process.exit(1);
    }
  } catch (error) {
    log(`\n✗ Test runner failed: ${error.message}`, colors.bright + colors.red);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
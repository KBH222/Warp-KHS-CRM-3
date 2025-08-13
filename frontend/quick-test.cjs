#!/usr/bin/env node

/**
 * Quick Test Script for KHS CRM
 * Run this before making any code changes to ensure everything is working
 */

const { spawn } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function runCommand(command, args = []) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const child = spawn(command, args, { shell: true, stdio: 'inherit' });
    
    child.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      resolve({ code, duration });
    });
    
    child.on('error', () => {
      resolve({ code: 1, duration: 0 });
    });
  });
}

async function main() {
  console.clear();
  log('🚀 KHS CRM Quick Test', colors.bright + colors.cyan);
  log('====================\n', colors.cyan);
  
  const tests = [
    { name: 'TypeScript Check', cmd: 'npm', args: ['run', 'typecheck'] },
    { name: 'ESLint', cmd: 'npm', args: ['run', 'lint'] },
    { name: 'Unit Tests', cmd: 'npm', args: ['test', '--', '--run'] },
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    log(`\n📋 Running ${test.name}...`, colors.blue);
    const { code, duration } = await runCommand(test.cmd, test.args);
    
    if (code === 0) {
      log(`✅ ${test.name} passed (${duration}s)`, colors.green);
    } else {
      log(`❌ ${test.name} failed`, colors.red);
      allPassed = false;
    }
  }
  
  log('\n' + '='.repeat(40), colors.cyan);
  
  if (allPassed) {
    log('✅ All tests passed! Safe to make changes.', colors.bright + colors.green);
    log('\n💡 Run "node test-runner.js" for comprehensive testing', colors.yellow);
  } else {
    log('❌ Some tests failed. Fix issues before making changes.', colors.bright + colors.red);
    log('\n💡 Run individual test commands to see detailed errors', colors.yellow);
  }
  
  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  main();
}
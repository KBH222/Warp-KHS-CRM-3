#!/usr/bin/env node

/**
 * Component Verification Script for KHS CRM
 * Tests component functionality without integration tests
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
  log('🚀 KHS CRM Component Tests', colors.bright + colors.cyan);
  log('=========================\n', colors.cyan);
  log('Testing component functionality without full integration tests\n', colors.yellow);
  
  const tests = [
    { name: 'TypeScript Check', cmd: 'npm', args: ['run', 'typecheck'] },
    { name: 'ESLint', cmd: 'npm', args: ['run', 'lint'] },
    { name: 'Component Tests', cmd: 'npm', args: ['test', '--', 'src/pages/__tests__', '--run'] },
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
    log('✅ All component tests passed!', colors.bright + colors.green);
    log('\n💡 Note: Integration tests are excluded due to routing issues in test environment', colors.yellow);
    log('💡 Run manual verification for full app testing', colors.yellow);
  } else {
    log('❌ Some tests failed. Fix issues before making changes.', colors.bright + colors.red);
  }
  
  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  main();
}
#!/usr/bin/env node

/**
 * Build script that ensures proper dependency order for monorepo packages
 * This handles the workspace build dependencies that Turborepo isn't handling correctly
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');

function log(message) {
    console.log(`\x1b[32m[BUILD]\x1b[0m ${message}`);
}

function error(message) {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`);
}

function runCommand(command, cwd = ROOT_DIR) {
    try {
        log(`Running: ${command} (in ${path.relative(ROOT_DIR, cwd)})`);
        execSync(command, {
            cwd,
            stdio: 'inherit',
            shell: true
        });
        return true;
    } catch (err) {
        error(`Command failed: ${command}`);
        error(err.message);
        return false;
    }
}

function buildPackage(packageName) {
    const packageDir = path.join(PACKAGES_DIR, packageName);

    if (!existsSync(packageDir)) {
        error(`Package directory not found: ${packageDir}`);
        return false;
    }

    log(`Building package: ${packageName}`);

    // Clean first
    if (!runCommand('pnpm clean', packageDir)) {
        return false;
    }

    // Build
    if (!runCommand('pnpm build', packageDir)) {
        return false;
    }

    log(`✅ Successfully built: ${packageName}`);
    return true;
}

function main() {
    log('Starting monorepo build process...');

    // Build order: shared -> backend -> frontend
    const buildOrder = ['shared', 'backend'];

    for (const packageName of buildOrder) {
        if (!buildPackage(packageName)) {
            error(`Failed to build package: ${packageName}`);
            process.exit(1);
        }
    }

    log('🎉 All packages built successfully!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
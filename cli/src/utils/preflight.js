import { execSync } from 'child_process';
import os from 'os';
import { log } from './logger.js';

/**
 * Universal Pre-Flight & Provisioning Engine
 * Inspects host environment, evaluates manifest requirements,
 * and orchestrates automated dependency resolution.
 */

export function detectHostEnvironment() {
  const platform = os.platform(); // 'darwin', 'linux', 'win32'
  const arch = os.arch();         // 'arm64', 'x64'
  const totalRamGb = Math.round((os.totalmem() / (1024 ** 3)) * 10) / 10;

  const pkgManagers = [];

  const checkCommand = (cmd) => {
    try {
      const probe = platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
      execSync(probe, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  };

  if (platform === 'darwin' || platform === 'linux') {
    if (checkCommand('brew')) pkgManagers.push('brew');
  }
  if (platform === 'linux') {
    if (checkCommand('apt-get')) pkgManagers.push('apt');
    if (checkCommand('pacman')) pkgManagers.push('pacman');
    if (checkCommand('dnf')) pkgManagers.push('dnf');
  }
  if (platform === 'win32') {
    if (checkCommand('winget')) pkgManagers.push('winget');
    if (checkCommand('choco')) pkgManagers.push('choco');
  }

  // Universal language toolchains
  if (checkCommand('uv')) pkgManagers.push('uv');
  if (checkCommand('pip') || checkCommand('pip3')) pkgManagers.push('pip');
  if (checkCommand('npm')) pkgManagers.push('npm');
  if (checkCommand('cargo')) pkgManagers.push('cargo');

  return {
    platform,
    arch,
    totalRamGb,
    pkgManagers,
    checkCommand,
  };
}

export function checkBinary(binaryReq, host) {
  const { name, min_version, version_command, install } = binaryReq;
  const isInstalled = host.checkCommand(name);

  if (!isInstalled) {
    let suggestedInstallCmd = null;
    if (install) {
      for (const pm of host.pkgManagers) {
        if (install[pm]) {
          suggestedInstallCmd = install[pm];
          break;
        }
      }
    }

    return {
      name,
      installed: false,
      suggestedInstallCmd,
      manualUrl: install?.manual || null,
    };
  }

  let version = null;
  if (version_command) {
    try {
      const output = execSync(version_command, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      version = output.trim().split('\n')[0];
    } catch {
      // version check failed but binary exists
    }
  }

  return {
    name,
    installed: true,
    version,
    min_version: min_version || null,
  };
}

export function checkService(serviceReq, host) {
  const { name, probe_command, probe_url, auto_start } = serviceReq;
  let active = false;

  if (probe_command) {
    try {
      execSync(probe_command, { stdio: 'ignore' });
      active = true;
    } catch {
      active = false;
    }
  }

  let autoStartCmd = null;
  if (!active && auto_start) {
    if (typeof auto_start === 'string') {
      autoStartCmd = auto_start;
    } else if (typeof auto_start === 'object' && auto_start[host.platform]) {
      autoStartCmd = auto_start[host.platform];
    }
  }

  return {
    name,
    active,
    probe_command,
    probe_url,
    autoStartCmd,
  };
}

export async function runPreflight(manifest, options = {}) {
  const host = detectHostEnvironment();
  const requirements = manifest.requirements || {};

  const report = {
    host,
    ok: true,
    platform: { ok: true, errors: [] },
    binaries: [],
    services: [],
    secrets: [],
  };

  // 1. Platform checks
  if (requirements.platform) {
    const { os: reqOs, arch: reqArch, min_ram_gb } = requirements.platform;
    if (reqOs && !reqOs.includes(host.platform)) {
      report.platform.ok = false;
      report.platform.errors.push(`OS '${host.platform}' not supported. Required: ${reqOs.join(', ')}`);
    }
    if (reqArch && !reqArch.includes(host.arch)) {
      report.platform.ok = false;
      report.platform.errors.push(`Architecture '${host.arch}' not supported. Required: ${reqArch.join(', ')}`);
    }
    if (min_ram_gb && host.totalRamGb < min_ram_gb) {
      report.platform.ok = false;
      report.platform.errors.push(`Insufficient RAM: ${host.totalRamGb} GB available, ${min_ram_gb} GB required`);
    }
    if (!report.platform.ok) report.ok = false;
  }

  // 2. Binaries checks
  if (requirements.binaries && Array.isArray(requirements.binaries)) {
    for (const b of requirements.binaries) {
      const res = checkBinary(b, host);
      report.binaries.push(res);
      if (!res.installed) report.ok = false;
    }
  }

  // 3. Runtimes checks (mapped to binaries)
  if (requirements.runtimes && Array.isArray(requirements.runtimes)) {
    for (const r of requirements.runtimes) {
      const res = checkBinary({
        name: r.name,
        min_version: r.min_version,
        version_command: r.version_command || `${r.name} --version`,
      }, host);
      report.binaries.push(res);
      if (!res.installed) report.ok = false;
    }
  }

  // 4. Services checks
  if (requirements.services && Array.isArray(requirements.services)) {
    for (const s of requirements.services) {
      const res = checkService(s, host);
      report.services.push(res);
      if (!res.active) report.ok = false;
    }
  }

  // 5. Secrets checks
  if (requirements.secrets && Array.isArray(requirements.secrets)) {
    for (const sec of requirements.secrets) {
      const val = process.env[sec.id];
      const isSet = Boolean(val && val.trim().length > 0);
      report.secrets.push({
        id: sec.id,
        label: sec.label || sec.id,
        required: sec.required !== false,
        isSet,
        validation_regex: sec.validation_regex,
      });
      if (sec.required !== false && !isSet) {
        report.ok = false;
      }
    }
  }

  return report;
}

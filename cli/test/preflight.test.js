import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { detectHostEnvironment, checkBinary, checkService, runPreflight } from '../src/utils/preflight.js';

describe('Universal Pre-Flight & System Audit Engine', () => {
  test('detectHostEnvironment correctly returns OS, arch, and package managers', () => {
    const host = detectHostEnvironment();
    assert.ok(['darwin', 'linux', 'win32'].includes(host.platform), 'Platform should be darwin, linux or win32');
    assert.ok(['arm64', 'x64', 'ia32'].includes(host.arch), 'Arch should be valid');
    assert.ok(host.totalRamGb > 0, 'RAM should be greater than 0');
    assert.ok(Array.isArray(host.pkgManagers), 'pkgManagers must be an array');
  });

  test('checkBinary identifies installed and missing binaries', () => {
    const host = detectHostEnvironment();

    // node should always be installed in this runner
    const nodeCheck = checkBinary({ name: 'node', version_command: 'node --version' }, host);
    assert.equal(nodeCheck.installed, true);
    assert.ok(nodeCheck.version.includes('v'), 'Should capture node version');

    // non-existent binary should be detected as missing with suggested install
    const fakeCheck = checkBinary({
      name: 'completely_fake_binary_xyz',
      install: { brew: 'brew install fake', apt: 'apt install fake' }
    }, host);
    assert.equal(fakeCheck.installed, false);
    if (host.pkgManagers.includes('brew')) {
      assert.equal(fakeCheck.suggestedInstallCmd, 'brew install fake');
    }
  });

  test('runPreflight evaluates full manifest requirements', async () => {
    const manifest = {
      requirements: {
        platform: { os: [process.platform], min_ram_gb: 2 },
        binaries: [{ name: 'node' }],
        secrets: [{ id: 'TEST_SECRET_VAR_123', required: false }]
      }
    };

    const report = await runPreflight(manifest);
    assert.equal(report.platform.ok, true);
    assert.equal(report.binaries[0].installed, true);
    assert.equal(report.secrets[0].isSet, false);
    assert.equal(report.ok, true, 'Report should be ok since secret is optional');
  });
});

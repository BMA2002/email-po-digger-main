const ClamScan = require('clamscan');

export interface VirusScanResult {
  isInfected: boolean;
  viruses?: string[];
  filePath: string;
}

/**
 * Scans a file for viruses using ClamAV.
 * If a virus is detected, logs an alert and exits the process.
 * @param filePath - The path to the file to scan
 * @throws Error if ClamAV is not available or scanning fails
 */
export async function scanFileForVirus(filePath: string): Promise<void> {
  try {
    // Initialize ClamAV scanner
    const scanner = new ClamScan();
    await scanner.init({
      remove_infected: false, // Don't remove infected files automatically
      quarantine_infected: false, // Don't quarantine
      scan_log: null, // Disable scan log
      debug_mode: false,
      file_list: null,
      scan_recursively: false,
      clamscan: {
        path: '/usr/bin/clamscan', // Default path, will be overridden on Windows
        db: null,
        scan_archives: true,
        active: true
      },
      clamdscan: {
        socket: false,
        host: false,
        port: false,
        timeout: 60000,
        local_fallback: true,
        path: '/usr/bin/clamdscan',
        config_file: null,
        multiscan: true,
        reload_db: false,
        active: true,
        bypass_test: false
      },
      preference: 'clamdscan' // Prefer clamdscan for performance
    });

    // Scan the file
    const result = await scanner.scan_file(filePath);

    if (result.is_infected) {
      const virusList = result.viruses ? result.viruses.join(', ') : 'Unknown virus';
      console.error(`🚨 VIRUS ALERT: File "${filePath}" is infected with: ${virusList}`);
      console.error('Process terminated due to virus detection.');
      process.exit(1);
    } else {
      console.log(`✅ File "${filePath}" is clean.`);
    }
  } catch (error: any) {
    if (error.message.includes('clamscan') || error.message.includes('clamdscan') || error.message.includes('command not found')) {
      throw new Error('ClamAV is not installed or not found. Please install ClamAV to use virus scanning. On Windows, download from https://www.clamav.net/downloads');
    }
    throw new Error(`Virus scan failed: ${error.message}`);
  }
}

/**
 * Scans a file and returns the result without exiting the process.
 * Useful for custom handling of infected files.
 * @param filePath - The path to the file to scan
 * @returns Promise<VirusScanResult>
 */
export async function scanFile(filePath: string): Promise<VirusScanResult> {
  try {
    const scanner = new ClamScan();
    await scanner.init({
      remove_infected: false,
      quarantine_infected: false,
      scan_log: null,
      debug_mode: false,
      file_list: null,
      scan_recursively: false,
      clamscan: {
        path: '/usr/bin/clamscan',
        db: null,
        scan_archives: true,
        active: true
      },
      clamdscan: {
        socket: false,
        host: false,
        port: false,
        timeout: 60000,
        local_fallback: true,
        path: '/usr/bin/clamdscan',
        config_file: null,
        multiscan: true,
        reload_db: false,
        active: true,
        bypass_test: false
      },
      preference: 'clamdscan'
    });

    const result = await scanner.scan_file(filePath);

    return {
      isInfected: result.is_infected,
      viruses: result.viruses,
      filePath
    };
  } catch (error: any) {
    throw new Error(`Virus scan failed: ${error.message}`);
  }
}
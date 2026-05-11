# Virus Scanner

A TypeScript package for scanning files for viruses using ClamAV.

## Installation

```bash
npm install virus-scanner
```

## Prerequisites

You must have ClamAV installed on your system.

### Installing ClamAV

### Installing ClamAV

- **Linux**: `sudo apt install clamav` or equivalent for your distro
- **macOS**: `brew install clamav`
- **Windows**: 
  1. Download the Windows installer from [https://www.clamav.net/downloads](https://www.clamav.net/downloads)
  2. Install ClamAV
  3. Add the installation directory (usually `C:\Program Files\ClamAV`) to your system PATH
  4. Update the virus database: Run `freshclam` in Command Prompt

## Usage

### Scan and Exit on Virus

```typescript
import { scanFileForVirus } from 'virus-scanner';

async function processFile(filePath: string) {
  await scanFileForVirus(filePath);
  // If no virus, continue processing
  console.log('File is safe, proceeding...');
}
```

This function will scan the file and if a virus is detected:
- Log an alert message
- Exit the process with code 1

### Scan and Handle Result

```typescript
import { scanFile } from 'virus-scanner';

async function processFile(filePath: string) {
  const result = await scanFile(filePath);

  if (result.isInfected) {
    console.error(`Virus detected: ${result.viruses?.join(', ')}`);
    // Handle infected file (delete, quarantine, etc.)
  } else {
    console.log('File is clean');
    // Proceed with processing
  }
}
```

## API

### `scanFileForVirus(filePath: string): Promise<void>`

Scans a file for viruses. If infected, logs alert and exits process.

### `scanFile(filePath: string): Promise<VirusScanResult>`

Scans a file and returns the result.

#### `VirusScanResult`

```typescript
interface VirusScanResult {
  isInfected: boolean;
  viruses?: string[];
  filePath: string;
}
```

## Building

```bash
npm run build
```

## License

MIT
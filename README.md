# Cycurid SDK

A TypeScript SDK for integrating Cycurid verification services into web applications.

## Installation

```bash
npm install cycurid-sdk
```

## Usage

```typescript
import { initCycurid } from 'cycurid-sdk';

// Initialize the verification process
const result = await initCycurid(
  'your-merchant-key',
  'user-id',
  'verification-type'
);

if (result.status === 'success') {
  console.log('Verification completed:', result.data);
} else {
  console.error('Verification failed:', result.error);
}
```

## API Reference

### `initCycurid(merchantKey: string, userId: string, type: string): Promise<CycuridResult>`

Initializes a Cycurid verification session.

**Parameters:**
- `merchantKey`: Your merchant API key
- `userId`: Unique identifier for the user
- `type`: Type of verification to perform

**Returns:** Promise that resolves with a `CycuridResult` object

### `CycuridResult`

```typescript
interface CycuridResult {
  status: 'success' | 'error' | 'exit';
  data?: any;
  error?: string;
}
```

## License

MIT 
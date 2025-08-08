# Cycurid SDK

A TypeScript SDK for integrating Cycurid verification services into web applications.

## Installation

```bash
npm install cycurid-sdk
```

## Verification Types

### `isHuman`
Performs a humanity check to verify if a person is real. This verification confirms the existence of a real person without performing full liveness verification based on identity.

**Use Cases:**
- **Basic Identity Verification**: Quick check for user existence in your verification process
- **Fraud Prevention**: Additional layer to ensure interactions involve real individuals, not bots
- **Initial Authentication**: Filter out potential fraudulent activities during early authentication stages

### `onboarding`
Verifies if a user is new to the system. Returns `true` if the user hasn't signed up before and their face is unique to the system, `false` for returning users.

**Use Cases:**
- **User Uniqueness Check**: Quickly determine if a user has already gone through the verification process or is new to your system

## Usage

### Basic Example

```typescript
import { initCycurid } from 'cycurid-sdk';

try {
  // Initialize the verification process
  const result = await initCycurid(
    'your-merchant-api-key',
    'user-id',
    'verification-type' // 'isHuman' or 'onboarding'
  );
  
  console.log('Verification completed:', result.data);
} catch (error) {
  console.error('Verification failed:', error);
}
```

### Complete Integration Example

This example shows how to integrate Cycurid SDK with your backend verification:

```typescript
// Frontend code
import { initCycurid } from 'cycurid-sdk';

async function verifyUser(userId) {
  try {
    // Step 1: Initialize Cycurid verification on frontend
    const result = await initCycurid(
      'your-merchant-api-key',
      userId,
      'onboarding' // or 'isHuman'
    );
    
    // Step 2: On success, notify your backend to verify the result
    const backendResponse = await fetch('/api/verify-cycurid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId,
        sessionId: result.sessionId // Pass session ID to backend
      })
    });

    const data = await backendResponse.json();
    
    if (data.verified) {
      console.log('User verified successfully!');
      // Proceed with authenticated user flow
    }
  } catch (error) {
    console.error('Verification failed:', error);
    // Handle verification failure
  }
}
```

```javascript
// Backend code (Node.js example)
app.post('/api/verify-cycurid', async (req, res) => {
  const { userId, sessionId } = req.body;
  
  try {
    // Verify the result directly with Cycurid API
    const response = await fetch(
      `https://api2.cycurid.com/v2/sdk/session/verification-result/${sessionId}`,
      {
        headers: {
          'x-api-key': process.env.CYCURID_MERCHANT_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const result = await response.json();
    
    if (result.status === 'success') {
      // Update user verification status in your database
      await updateUserVerificationStatus(userId, true);
      
      res.json({ verified: true });
    } else {
      res.json({ verified: false, reason: result.status });
    }
  } catch (error) {
    console.error('Backend verification error:', error);
    res.status(500).json({ error: 'Verification check failed' });
  }
});
```

### How it Works

- **Desktop**: Displays a QR code that users scan with their mobile device to complete verification
- **Mobile**: Opens an embedded iframe with camera access for direct verification
- The SDK automatically detects the device type and shows the appropriate interface
- Polls the server for verification status and returns results once complete

## Checking Verification Results Directly

You can also check the verification result directly using the API endpoint:

### Endpoint
```
GET https://api2.cycurid.com/v2/sdk/session/verification-result/{sessionId}
```

### Headers
```
x-api-key: {merchantKey}
Content-Type: application/json
```

### Response
```json
{
  "status": "success" | "expired" | "cancelled" | "pending"
}
```

**Status Values:**
- `success`: Verification completed successfully
- `expired`: Token has expired
- `cancelled`: User cancelled the verification
- `pending`: Verification still in progress

## API Reference

### `initCycurid(merchantKey: string, userId: string, type: string): Promise<void>`

Initializes a Cycurid verification session.

**Parameters:**
- `merchantKey`: Your merchant API key
- `userId`: Unique identifier for the user  
- `type`: Type of verification to perform (`'isHuman'` or `'onboarding'`)

**Returns:** Promise that resolves on successful verification or rejects with an error

**Possible Rejection Statuses:**
- `failure`: Verification failed
- `expired`: Token expired
- `cancelled`: User cancelled the verification
- `error`: General error occurred

### Interfaces

```typescript
interface CycuridInitParams {
  merchantKey: string;
  secretKey: string;
  userId: string;
}

interface CycuridResult {
  status: string;
  data?: any;
  error?: string;
}
```

## License

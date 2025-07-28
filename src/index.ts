import axios from 'axios';
import WebSocket from 'ws';

const API_BASE_URL = 'https://api2.cycurid.com/v2/sdk/session/web-new';
const IFRAME_BASE_URL = "https://websdk.cycurid.com"//'https://1a42076f524d.ngrok.app'; "https://websdk.cycurid.com"


export interface CycuridInitParams {
  merchantKey: string;
  secretKey: string;
  userId: string;
}

export interface CycuridResult {
  status: string;
  data?: any;
  error?: string;
}

/**
 * Initializes Cycurid session.
 * @param merchantKey Merchant key
 * @param secretKey Secret key
 * @param userId User ID
 * @returns Promise that resolves with the result from the WebSocket server
 */
export function initCycurid(
  merchantKey: string,
  userId: string,
  type: string
): Promise<CycuridResult> {
  return new Promise(async (resolve, reject) => {
    try {
        
      const response = await axios.post(API_BASE_URL,{}, { //'https://api.cycurid.com/v2/sdk/session/web-new'
        headers: {
            'x-api-key': merchantKey,
            'Content-Type': 'application/json',
        },
      });
    //   resolve({ status: 'success', data: response });
    //   console.log("response from server sdk: ", response)

      const token = response.data?.token;
      const sdkId = response.data?.sdk_id;
      if (!token) {
        return reject({ status: 'error', error: 'Missing sessionId in response' });
      }

      const iframe = document.createElement('iframe');
      iframe.src = `${IFRAME_BASE_URL}/?token=${token}&sdkId=${sdkId}&type=${encodeURIComponent(type)}&userId=${encodeURIComponent(userId)}`;

      iframe.allow = 'camera';
      iframe.style.position = 'fixed';
      iframe.style.top = '50%';
      iframe.style.left = '50%';
      iframe.style.transform = 'translate(-50%, -50%)';
      iframe.style.width = '90vw'; // or fixed width like '600px'
      iframe.style.maxWidth = '600px';
      iframe.style.height = '80vh';
      iframe.style.border = '1px solid #ccc';
      iframe.style.borderRadius = '12px';
      iframe.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
      iframe.style.zIndex = '10000';
      iframe.id = 'cycurid-iframe';
      document.body.appendChild(iframe);

      const messageHandler = (event: MessageEvent) => {
        if (
          event.origin !== IFRAME_BASE_URL ||
          !event.data ||
          typeof event.data !== 'object'
        ) {
          return;
        }

        const { status, data, error } = event.data;
        console.log("Status and data: ", status, data)
        if (status === 'success') {
          cleanup();
          resolve({ status, data });
        } 
        else if (status === 'exit') {
          cleanup();
          reject({ status, error: 'User exited the verification process.' });
        } 
        else if (status === 'error') {
          cleanup();
          reject({ status, error });
        }
      };

      const cleanup = () => {
        window.removeEventListener('message', messageHandler);
        const existing = document.getElementById('cycurid-iframe');
        if (existing) existing.remove();
      };

      window.addEventListener('message', messageHandler);

    } catch (err: any) {
      reject({ status: 'error', error: err.message });
    }
  });
} 
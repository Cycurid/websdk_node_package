import axios from 'axios';
import WebSocket from 'ws';
import QRCode from 'qrcode';

const API_BASE_URL = 'https://api2.cycurid.com/v2/sdk/session/' //"http://localhost:3000/v2/sdk/session/"
const IFRAME_BASE_URL = 'https://websdk.cycurid.com'//"http://localhost:5173";

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

function isMobileDevice(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

export function initCycurid(
  merchantKey: string,
  userId: string,
  type: string
): Promise<CycuridResult> {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Create session
      const response = await axios.post(`${API_BASE_URL}web-new`, { user_id: userId, type: "web" }, {
        headers: {
          'x-api-key': merchantKey,
          'Content-Type': 'application/json',
        },
      });

      const token = response.data?.token;
      const sdkId = response.data?.sdk_id;
      const sessionId = response.data?.session_id;
      const sandboxMode = response.data?.sandbox_mode;

      if (!token || !sessionId) {
        return reject({ status: 'error', error: 'Missing sessionId or token in response' });
      }

      const targetUrl = `${IFRAME_BASE_URL}/?token=${token}&sdkId=${sdkId}&sessionId=${sessionId}&type=${encodeURIComponent(type)}&userId=${encodeURIComponent(userId)}&sandboxMode=${sandboxMode}`;

      if (!isMobileDevice()) {
        const qrContainer = document.createElement('div');
        Object.assign(qrContainer.style, {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '20px',
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          zIndex: '10000',
          maxWidth: '300px',
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif'
        });
        qrContainer.id = 'cycurid-qr-container';
        document.body.appendChild(qrContainer);
      
        const title = document.createElement('h2');
        title.innerText = "Liveness Verification";
        Object.assign(title.style, {
          fontSize: '20px',
          margin: '10px 0',
          color: '#333'
        });
        qrContainer.appendChild(title);
      
        const subtitle = document.createElement('p');
        subtitle.innerText = "Scan the QR code on your camera with your mobile device to begin the verification process.";
        Object.assign(subtitle.style, {
          fontSize: '14px',
          margin: '0 0 15px 0',
          color: '#555',
          lineHeight: '1.4'
        });
        qrContainer.appendChild(subtitle);
 
        const qrCanvas = document.createElement('canvas');
        qrContainer.appendChild(qrCanvas);
        await QRCode.toCanvas(qrCanvas, targetUrl, { width: 250 });
      } else {
        const iframe = document.createElement('iframe');
        iframe.src = targetUrl
        iframe.allow = 'camera';
        Object.assign(iframe.style, {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90vw',
          maxWidth: '600px',
          height: '80vh',
          border: '1px solid #ccc',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          zIndex: '10000',
        });
        iframe.id = 'cycurid-iframe';
        document.body.appendChild(iframe);
      }

      const POLL_INTERVAL = 5000;
      let pollingTimer: number;

      const pollServer = async () => {
        try {
          const statusResp = await axios.get(`${API_BASE_URL}verification-result/${sessionId}`, {
            headers: { 'x-api-key': merchantKey }
          });
          const { status, result, error } = statusResp.data;

        //   console.log("Polling result:", status);

          if (status === 'success') {
            cleanup();
            resolve(status);
          } else if (status === 'failure') {
            cleanup();
            reject({ status, error: error || 'Verification failed.' });
          } else if (status == "cancelled") {
            cleanup();
            reject({ status, error: error || 'User Cancelled.' });
          }
        } catch (err: any) {
          cleanup();
          reject(`Error: ${err}`);
        }
      };

      pollingTimer = window.setInterval(pollServer, POLL_INTERVAL);
      pollServer();

      const cleanup = () => {
        clearInterval(pollingTimer);
        const existing = document.getElementById('cycurid-iframe');
        if (existing) existing.remove();
      };

    } catch (err: any) {
      reject({ status: 'error', error: err.message });
    }
  });
}

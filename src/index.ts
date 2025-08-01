import axios from 'axios';
import WebSocket from 'ws';

const API_BASE_URL = "http://localhost:3000/v2/sdk/session/" //web-new";
const IFRAME_BASE_URL = "http://localhost:5173";

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

      if (!token || !sessionId) {
        return reject({ status: 'error', error: 'Missing sessionId or token in response' });
      }

      const iframe = document.createElement('iframe');
      iframe.src = `${IFRAME_BASE_URL}/?token=${token}&sdkId=${sdkId}&sessionId=${sessionId}&type=${encodeURIComponent(type)}&userId=${encodeURIComponent(userId)}`;
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

      const POLL_INTERVAL = 5000;
      let pollingTimer: number;

      const pollServer = async () => {
        try {
          const statusResp = await axios.get(`${API_BASE_URL}verification-result/${sessionId}`, {
            headers: { 'x-api-key': merchantKey }
          });
          const { status, result, error } = statusResp.data;

          console.log("Polling result:", status);

          if (status === 'success') {
            cleanup();
            resolve(status);
          } else if (status === 'failure') {
            cleanup();
            reject({ status, error: error || 'Verification failed.' });
          } else if (status == "cancelled") {
            console.log("Inside polling result cancelled. . .")
            cleanup();
            reject({ status, error: error || 'User Cancelled.' });
          }
        } catch (err: any) {
          console.warn("Polling error:", err.message);
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

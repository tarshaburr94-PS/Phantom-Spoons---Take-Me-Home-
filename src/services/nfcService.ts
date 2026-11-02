// Web NFC Service supporting real NDEFReader and simulated fallback

export interface NFCScanResult {
  serialNumber: string;
  records: Array<{
    recordType: string;
    mediaType?: string;
    id?: string;
    data: string;
  }>;
}

export interface NFCWritePayload {
  itemId: string;
  itemName: string;
  homeName: string;
  room: string;
  url: string;
}

// Check if hardware Web NFC is supported
export function isWebNFCSupported(): boolean {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
}

// Interface for NDEF reader typing
interface NDEFMessage {
  records: Array<{
    recordType: string;
    mediaType?: string;
    id?: string;
    data?: BufferSource;
    encoding?: string;
    lang?: string;
  }>;
}

interface NDEFReadingEvent extends Event {
  serialNumber: string;
  message: NDEFMessage;
}

declare global {
  interface Window {
    NDEFReader?: new () => {
      scan: (options?: { signal?: AbortSignal }) => Promise<void>;
      write: (message: unknown, options?: { signal?: AbortSignal; overwrite?: boolean }) => Promise<void>;
      addEventListener: (type: string, listener: (event: NDEFReadingEvent) => void) => void;
      removeEventListener: (type: string, listener: (event: NDEFReadingEvent) => void) => void;
    };
  }
}

export class NFCController {
  private abortController: AbortController | null = null;
  private readerInstance: InstanceType<NonNullable<Window['NDEFReader']>> | null = null;

  async startListening(
    onReading: (result: NFCScanResult) => void,
    onError: (err: Error) => void
  ): Promise<boolean> {
    if (!isWebNFCSupported() || !window.NDEFReader) {
      onError(new Error('Web NFC is not supported on this device/browser. Please use the NFC Simulator below.'));
      return false;
    }

    try {
      this.abortController = new AbortController();
      this.readerInstance = new window.NDEFReader();

      await this.readerInstance.scan({ signal: this.abortController.signal });

      this.readerInstance.addEventListener('reading', (event: NDEFReadingEvent) => {
        const serialNumber = event.serialNumber || 'UNKNOWN_UID';
        const records: NFCScanResult['records'] = [];

        if (event.message && event.message.records) {
          for (const record of event.message.records) {
            let dataStr = '';
            if (record.data) {
              const decoder = new TextDecoder(record.encoding || 'utf-8');
              dataStr = decoder.decode(record.data);
            }
            records.push({
              recordType: record.recordType,
              mediaType: record.mediaType,
              id: record.id,
              data: dataStr,
            });
          }
        }

        onReading({
          serialNumber,
          records,
        });
      });

      return true;
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }

  stopListening() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.readerInstance = null;
  }

  async writeTag(payload: NFCWritePayload): Promise<{ success: boolean; message: string }> {
    if (!isWebNFCSupported() || !window.NDEFReader) {
      return {
        success: false,
        message: 'Hardware Web NFC is unavailable on this device. Tag programming simulated successfully!',
      };
    }

    try {
      const writer = new window.NDEFReader();
      // Format NDEF records:
      // Record 1: Deep Link URL so any phone without the app installed can open the item locator
      // Record 2: JSON payload with item and home location metadata
      const records = [
        {
          recordType: 'url',
          data: payload.url,
        },
        {
          recordType: 'text',
          data: JSON.stringify({
            app: 'PhantomSpoons',
            itemId: payload.itemId,
            name: payload.itemName,
            home: payload.homeName,
            room: payload.room,
          }),
        },
      ];

      await writer.write({ records }, { overwrite: true });
      return { success: true, message: `Successfully programmed NTAG tag for "${payload.itemName}"!` };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to write to NFC tag.',
      };
    }
  }
}

export const nfcController = new NFCController();

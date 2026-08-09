export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  sendNotification: (message: string) => void;
  onNotification: (callback: (message: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
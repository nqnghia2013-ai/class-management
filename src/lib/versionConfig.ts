export const CURRENT_APP_VERSION = '1.2.0';

export interface ServerVersionInfo {
  version: string;
  releaseDate?: string;
  changelog: string[];
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  changelog: string[];
  error?: string;
}

/**
 * Truys vấn trực tiếp tệp /version.json từ máy chủ Web (Netlify/Vercel)
 * để kiểm tra xem có bản deploy mới nào hay không.
 */
export async function checkServerVersion(): Promise<UpdateCheckResult> {
  try {
    const installedVersion = localStorage.getItem('installedAppVersion') || CURRENT_APP_VERSION;
    const postponedVersion = localStorage.getItem('postponedAppVersion');

    // Fetch /version.json với timestamp để bỏ qua browser & CDN cache
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: ServerVersionInfo = await response.json();
    const serverVersion = data.version || CURRENT_APP_VERSION;
    const changelog = data.changelog || [];

    // Kiểm tra nếu phiên bản trên server khác phiên bản đang cài đặt và không bị người dùng bấm "Để sau"
    const hasUpdate = serverVersion !== installedVersion && postponedVersion !== serverVersion;

    return {
      hasUpdate,
      currentVersion: installedVersion,
      latestVersion: serverVersion,
      changelog,
    };
  } catch (error: any) {
    console.warn('Không thể kiểm tra phiên bản trên máy chủ:', error);
    return {
      hasUpdate: false,
      currentVersion: localStorage.getItem('installedAppVersion') || CURRENT_APP_VERSION,
      latestVersion: CURRENT_APP_VERSION,
      changelog: [],
      error: error?.message || 'Lỗi kết nối'
    };
  }
}

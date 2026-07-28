/**
 * Phiên bản mã nguồn JavaScript (Client Bundle) hiện tại đang chạy trong trình duyệt.
 * Khi nhà phát triển ra bản cập nhật mới trên /version.json, APP_BUILD_VERSION của bundle cũ sẽ thấp hơn server.
 */
export const APP_BUILD_VERSION = '1.1.0';

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
  isPostponed: boolean;
  error?: string;
}

/**
 * Truy vấn trực tiếp tệp /version.json từ máy chủ Web (Netlify/Vercel)
 * để kiểm tra xem có bản deploy mới nào trên server hay không.
 * 
 * @param isManual boolean - Nếu true (người dùng chủ động bấm Kiểm tra), sẽ bỏ qua trạng thái "Để sau" trước đó.
 */
export async function checkServerVersion(isManual = false): Promise<UpdateCheckResult> {
  try {
    // 1. Lấy phiên bản người dùng đang cài đặt (nếu chưa có thì lấy phiên bản mã nguồn hiện tại)
    let installedVersion = localStorage.getItem('installedAppVersion');
    if (!installedVersion) {
      installedVersion = APP_BUILD_VERSION;
      localStorage.setItem('installedAppVersion', APP_BUILD_VERSION);
    }

    const postponedVersion = localStorage.getItem('postponedAppVersion');

    // 2. Truy vấn tệp /version.json từ máy chủ Web với timestamp chống cache
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
    const serverVersion = data.version || APP_BUILD_VERSION;
    const changelog = data.changelog || [];

    // 3. Kiểm tra xem phiên bản trên server có mới hơn phiên bản đang cài đặt/đang chạy không
    const isNewVersionAvailable = serverVersion !== installedVersion;
    const isPostponed = postponedVersion === serverVersion;

    // Nếu kiểm tra tự động: có bản mới VÀ người dùng chưa bấm "Để sau" đối với bản này
    // Nếu kiểm tra thủ công (người dùng bấm nút): hiện bản mới regardless of postponed
    const hasUpdate = isManual 
      ? isNewVersionAvailable 
      : (isNewVersionAvailable && !isPostponed);

    return {
      hasUpdate,
      currentVersion: installedVersion,
      latestVersion: serverVersion,
      changelog,
      isPostponed,
    };
  } catch (error: any) {
    console.warn('Không thể kiểm tra phiên bản trên máy chủ:', error);
    const fallbackVersion = localStorage.getItem('installedAppVersion') || APP_BUILD_VERSION;
    return {
      hasUpdate: false,
      currentVersion: fallbackVersion,
      latestVersion: fallbackVersion,
      changelog: [],
      isPostponed: false,
      error: error?.message || 'Lỗi kết nối'
    };
  }
}

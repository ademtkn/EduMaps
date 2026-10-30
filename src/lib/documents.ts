/** Where a document link leads, in words a visitor understands ("Google Drive", "school-site.kg"). */
export function documentHost(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host === "drive.google.com" || host === "docs.google.com" || host.endsWith(".googleusercontent.com")) return "Google Drive";
    if (host.endsWith("dropbox.com")) return "Dropbox";
    if (host === "1drv.ms" || host.endsWith("onedrive.live.com") || host.endsWith("sharepoint.com")) return "OneDrive";
    if (host === "disk.yandex.ru" || host === "disk.yandex.com" || host === "yadi.sk") return "Yandex Disk";
    if (host === "cloud.mail.ru") return "Mail.ru Cloud";
    return host;
  } catch {
    return "";
  }
}

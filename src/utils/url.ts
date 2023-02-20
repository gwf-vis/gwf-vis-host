export function obtainActualUrl(url: string, baseUrl: string = ".") {
  return url?.startsWith("@") ? url.replace("@", baseUrl) : url;
}

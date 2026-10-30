import Image, { type ImageProps } from "next/image";

function shouldSkipOptimizer(src: string): boolean {
  if (src.endsWith(".svg")) return true;
  try {
    const host = new URL(src).hostname;
    return host === "127.0.0.1" || host === "localhost";
  } catch {
    return false;
  }
}

/** next/image that serves SVGs and local-storage images directly (the optimizer only handles public raster hosts). */
export function MediaImage(props: Omit<ImageProps, "src"> & { src: string }) {
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image {...props} unoptimized={props.unoptimized ?? shouldSkipOptimizer(props.src)} />;
}

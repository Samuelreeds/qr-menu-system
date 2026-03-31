import { useState, useRef, useEffect } from 'react';

export default function LazyImage({ src, alt, className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => { if (imgRef.current?.complete) setLoaded(true); }, [src]);
  return (
    <>
      {!loaded && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
      <img {...props} ref={imgRef} src={src} alt={alt || ""} loading="lazy" decoding="async" className={`${className || ''} transition-opacity duration-500 ease-in-out ${loaded ? 'opacity-100' : 'opacity-0'}`} onLoad={(e) => { setLoaded(true); if (props.onLoad) props.onLoad(e); }} onError={(e) => { setLoaded(true); if (props.onError) props.onError(e); }} />
    </>
  );
}
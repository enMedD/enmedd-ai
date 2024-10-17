import { useState } from "react";
import { FullImageModal } from "./FullImageModal";
import { buildImgUrl } from "./utils";

export function InMessageImage({ fileId }: { fileId: string }) {
  const [fullImageShowing, setFullImageShowing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <>
      <FullImageModal
        fileId={fileId}
        open={fullImageShowing}
        onOpenChange={(open) => setFullImageShowing(open)}
      />

      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}

      <img
        width={1200}
        height={1200}
        alt="Chat Message Image"
        onLoad={() => setImageLoaded(true)}
        className={`
          max-w-lg 
          rounded-regular 
          bg-transparent 
          cursor-pointer 
          transition-opacity 
          duration-300 
          opacity-100`}
        onClick={() => setFullImageShowing(true)}
        src={buildImgUrl(fileId)}
        loading="lazy"
      />
    </>
  );
}

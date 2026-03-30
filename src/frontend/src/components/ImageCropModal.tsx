import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Crop, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ImageCropModalProps {
  imageSrc: string;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const MIN_CROP = 40;

type Handle = "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r" | null;

export default function ImageCropModal({
  imageSrc,
  onConfirm,
  onCancel,
}: ImageCropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Image pan/zoom state
  const [imgOffset, setImgOffset] = useState<Point>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // Crop box state (in container coords)
  const [cropBox, setCropBox] = useState<CropBox>({
    x: 20,
    y: 20,
    w: 240,
    h: 240,
  });
  const [containerSize, setContainerSize] = useState({ w: 320, h: 320 });

  // Interaction tracking
  const dragging = useRef<{ startPt: Point; startOffset: Point } | null>(null);
  const resizing = useRef<{
    handle: Handle;
    startPt: Point;
    startBox: CropBox;
  } | null>(null);
  const pinching = useRef<{ startDist: number; startScale: number } | null>(
    null,
  );

  const [imageLoaded, setImageLoaded] = useState(false);

  // Load image and initialize
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Measure container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const w = rect.width || 320;
    const h = rect.height || 320;
    setContainerSize({ w, h });
    // Initial crop: center 70% of container
    const cw = Math.round(w * 0.7);
    const ch = Math.round(h * 0.7);
    setCropBox({
      x: Math.round((w - cw) / 2),
      y: Math.round((h - ch) / 2),
      w: cw,
      h: ch,
    });
  });

  // Draw to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imageLoaded) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = containerSize;
    canvas.width = w;
    canvas.height = h;

    // Draw image with pan/zoom
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(imgOffset.x, imgOffset.y);
    ctx.scale(scale, scale);
    // Center the image initially
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const fitScale = Math.max(w / iw, h / ih);
    const ox = (w / fitScale - iw) / 2;
    const oy = (h / fitScale - ih) / 2;
    ctx.drawImage(img, ox, oy, iw, ih);
    ctx.restore();

    // Dim outside crop area
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);
    ctx.restore();

    // Crop frame border
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);

    // Rule of thirds lines
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    const tx = cropBox.w / 3;
    const ty = cropBox.h / 3;
    ctx.beginPath();
    ctx.moveTo(cropBox.x + tx, cropBox.y);
    ctx.lineTo(cropBox.x + tx, cropBox.y + cropBox.h);
    ctx.moveTo(cropBox.x + tx * 2, cropBox.y);
    ctx.lineTo(cropBox.x + tx * 2, cropBox.y + cropBox.h);
    ctx.moveTo(cropBox.x, cropBox.y + ty);
    ctx.lineTo(cropBox.x + cropBox.w, cropBox.y + ty);
    ctx.moveTo(cropBox.x, cropBox.y + ty * 2);
    ctx.lineTo(cropBox.x + cropBox.w, cropBox.y + ty * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Corner handles
    const hs = 10;
    ctx.strokeStyle = "rgba(255,255,255,1)";
    ctx.lineWidth = 3;
    const corners: [number, number, number, number][] = [
      [cropBox.x, cropBox.y, hs, 0],
      [cropBox.x + cropBox.w, cropBox.y, -hs, 0],
      [cropBox.x, cropBox.y + cropBox.h, hs, 0],
      [cropBox.x + cropBox.w, cropBox.y + cropBox.h, -hs, 0],
    ];
    const cornerDirs: [number, number][] = [
      [0, hs],
      [0, hs],
      [0, -hs],
      [0, -hs],
    ];
    corners.forEach(([cx, cy, dx], i) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + dx, cy);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy + cornerDirs[i][1]);
      ctx.stroke();
    });
    ctx.restore();
  }, [imageLoaded, imgOffset, scale, cropBox, containerSize]);

  const getHandle = useCallback(
    (pt: Point): Handle => {
      const { x, y, w, h } = cropBox;
      const HIT = 18;
      const inX = pt.x >= x - HIT && pt.x <= x + w + HIT;
      const inY = pt.y >= y - HIT && pt.y <= y + h + HIT;
      if (!inX || !inY) return null;

      const nearL = Math.abs(pt.x - x) < HIT;
      const nearR = Math.abs(pt.x - (x + w)) < HIT;
      const nearT = Math.abs(pt.y - y) < HIT;
      const nearB = Math.abs(pt.y - (y + h)) < HIT;

      if (nearL && nearT) return "tl";
      if (nearR && nearT) return "tr";
      if (nearL && nearB) return "bl";
      if (nearR && nearB) return "br";
      if (nearT) return "t";
      if (nearB) return "b";
      if (nearL) return "l";
      if (nearR) return "r";
      return null;
    },
    [cropBox],
  );

  const isInsideCrop = useCallback(
    (pt: Point) => {
      const { x, y, w, h } = cropBox;
      return pt.x > x && pt.x < x + w && pt.y > y && pt.y < y + h;
    },
    [cropBox],
  );

  const getEventPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const pt = getEventPoint(e);
    const handle = getHandle(pt);
    if (handle) {
      resizing.current = { handle, startPt: pt, startBox: { ...cropBox } };
      return;
    }
    if (isInsideCrop(pt)) {
      // Move crop box
      resizing.current = {
        handle: null,
        startPt: pt,
        startBox: { ...cropBox },
      };
      return;
    }
    // Pan image
    dragging.current = { startPt: pt, startOffset: { ...imgOffset } };
  };

  const applyResize = (
    handle: Handle | null,
    pt: Point,
    startPt: Point,
    startBox: CropBox,
    cw: number,
    ch: number,
  ): CropBox => {
    const dx = pt.x - startPt.x;
    const dy = pt.y - startPt.y;
    let { x, y, w, h } = startBox;

    if (handle === null) {
      // Move crop
      x = Math.max(0, Math.min(cw - w, x + dx));
      y = Math.max(0, Math.min(ch - h, y + dy));
      return { x, y, w, h };
    }

    if (handle === "tl") {
      x += dx;
      y += dy;
      w -= dx;
      h -= dy;
    } else if (handle === "tr") {
      y += dy;
      w += dx;
      h -= dy;
    } else if (handle === "bl") {
      x += dx;
      w -= dx;
      h += dy;
    } else if (handle === "br") {
      w += dx;
      h += dy;
    } else if (handle === "t") {
      y += dy;
      h -= dy;
    } else if (handle === "b") {
      h += dy;
    } else if (handle === "l") {
      x += dx;
      w -= dx;
    } else if (handle === "r") {
      w += dx;
    }

    // Clamp
    if (w < MIN_CROP) {
      if (handle?.includes("l")) x = startBox.x + startBox.w - MIN_CROP;
      w = MIN_CROP;
    }
    if (h < MIN_CROP) {
      if (handle?.includes("t")) y = startBox.y + startBox.h - MIN_CROP;
      h = MIN_CROP;
    }
    x = Math.max(0, x);
    y = Math.max(0, y);
    if (x + w > cw) w = cw - x;
    if (y + h > ch) h = ch - y;

    return { x, y, w, h };
  };

  const onPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e && (e as React.TouchEvent).touches.length === 2) return;
    const pt = getEventPoint(e);

    if (resizing.current !== undefined && resizing.current !== null) {
      const { handle, startPt, startBox } = resizing.current;
      const next = applyResize(
        handle,
        pt,
        startPt,
        startBox,
        containerSize.w,
        containerSize.h,
      );
      setCropBox(next);
      return;
    }

    if (dragging.current) {
      const dx = pt.x - dragging.current.startPt.x;
      const dy = pt.y - dragging.current.startPt.y;
      setImgOffset({
        x: dragging.current.startOffset.x + dx,
        y: dragging.current.startOffset.y + dy,
      });
    }
  };

  const onPointerUp = () => {
    dragging.current = null;
    resizing.current = null;
    pinching.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.max(0.5, Math.min(5, s - e.deltaY * 0.001)));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      pinching.current = { startDist: dist, startScale: scale };
    } else {
      onPointerDown(e);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinching.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinching.current.startDist;
      setScale(Math.max(0.5, Math.min(5, pinching.current.startScale * ratio)));
    } else {
      onPointerMove(e);
    }
  };

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;

    const offscreen = document.createElement("canvas");
    offscreen.width = cropBox.w;
    offscreen.height = cropBox.h;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    // Replicate the canvas drawing math to map crop box back to image coords
    const { w: cw, h: ch } = containerSize;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const fitScale = Math.max(cw / iw, ch / ih);

    // Image drawn at: translate(imgOffset.x, imgOffset.y) scale(scale) then drawImage at (ox*fitScale, oy*fitScale, iw*fitScale, ih*fitScale)
    // Actual pixel in container: imgOffset + scale * (fitScale * imagePixel + centering)
    // Reverse: imagePixel = (containerPixel - imgOffset) / scale / fitScale - centering
    const ox = (cw / fitScale - iw) / 2;
    const oy = (ch / fitScale - ih) / 2;

    // Map crop box corners to image pixel space
    const mapToImg = (cx: number, cy: number) => {
      const ix = (cx - imgOffset.x) / scale / fitScale - ox;
      const iy = (cy - imgOffset.y) / scale / fitScale - oy;
      return { ix, iy };
    };

    const topLeft = mapToImg(cropBox.x, cropBox.y);
    const srcW = cropBox.w / scale / fitScale;
    const srcH = cropBox.h / scale / fitScale;

    ctx.drawImage(
      img,
      topLeft.ix,
      topLeft.iy,
      srcW,
      srcH,
      0,
      0,
      cropBox.w,
      cropBox.h,
    );

    const dataUrl = offscreen.toDataURL("image/jpeg", 0.92);
    onConfirm(dataUrl);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        className="max-w-[90vw] w-[380px] p-4 gap-3"
        data-ocid="crop_modal.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Crop className="w-4 h-4" />
            Crop & Adjust
          </DialogTitle>
        </DialogHeader>

        <div className="text-xs text-muted-foreground -mt-1">
          Drag to pan · Scroll/pinch to zoom · Drag edges or corners to resize
          crop
        </div>

        <div
          ref={containerRef}
          className="relative w-full rounded-xl overflow-hidden bg-black select-none"
          style={{ height: "320px", touchAction: "none" }}
        >
          {imageLoaded ? (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair"
              style={{ touchAction: "none" }}
              onMouseDown={onPointerDown}
              onMouseMove={onPointerMove}
              onMouseUp={onPointerUp}
              onMouseLeave={onPointerUp}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onPointerUp}
              onWheel={onWheel}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}
        </div>

        <DialogFooter className="flex-row gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="gap-1.5"
            data-ocid="crop_modal.cancel_button"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            className="gap-1.5"
            data-ocid="crop_modal.confirm_button"
          >
            <Crop className="w-3.5 h-3.5" />
            Crop & Use
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

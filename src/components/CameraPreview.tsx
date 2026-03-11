import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, Maximize2, Minimize2 } from 'lucide-react';
import { HandTrackingData } from '../hooks/useHandTracking';

interface CameraPreviewProps {
  handData: HandTrackingData;
}

const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;
const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 240;

export const CameraPreview = ({ handData }: CameraPreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: window.innerHeight - DEFAULT_HEIGHT - 24 });
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const resizeCorner = useRef<string>('');
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });

  const clampPosition = useCallback((x: number, y: number, w: number, h: number) => {
    return {
      x: Math.max(0, Math.min(window.innerWidth - w, x)),
      y: Math.max(0, Math.min(window.innerHeight - h, y)),
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (isResizing.current) return;

    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  }, [position]);

  const handleResizeStart = useCallback((corner: string) => (e: React.MouseEvent) => {
    isResizing.current = true;
    resizeCorner.current = corner;
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      posX: position.x,
      posY: position.y,
    };
    e.preventDefault();
    e.stopPropagation();
  }, [size, position]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const newPos = clampPosition(
          e.clientX - dragOffset.current.x,
          e.clientY - dragOffset.current.y,
          size.width,
          size.height
        );
        setPosition(newPos);
      }

      if (isResizing.current) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        const corner = resizeCorner.current;
        let newWidth = resizeStart.current.width;
        let newHeight = resizeStart.current.height;
        let newX = resizeStart.current.posX;
        let newY = resizeStart.current.posY;

        if (corner.includes('r')) newWidth = Math.max(MIN_WIDTH, resizeStart.current.width + dx);
        if (corner.includes('l')) {
          newWidth = Math.max(MIN_WIDTH, resizeStart.current.width - dx);
          newX = resizeStart.current.posX + resizeStart.current.width - newWidth;
        }
        if (corner.includes('b')) newHeight = Math.max(MIN_HEIGHT, resizeStart.current.height + dy);
        if (corner.includes('t')) {
          newHeight = Math.max(MIN_HEIGHT, resizeStart.current.height - dy);
          newY = resizeStart.current.posY + resizeStart.current.height - newHeight;
        }

        const clamped = clampPosition(newX, newY, newWidth, newHeight);
        setSize({ width: newWidth, height: newHeight });
        setPosition(clamped);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      isResizing.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [size, clampPosition]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 bg-gradient-to-r from-blue-500/80 to-cyan-500/80 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-md border border-white/20"
        title="Open camera preview"
      >
        <Camera size={24} />
      </button>
    );
  }

  const resetSize = () => {
    if (size.width === DEFAULT_WIDTH && size.height === DEFAULT_HEIGHT) {
      setSize({ width: 480, height: 360 });
    } else {
      setSize({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
    }
  };

  const resizeHandleClass = 'absolute w-3 h-3 z-10 opacity-0 hover:opacity-100 transition-opacity';

  return (
    <div
      ref={containerRef}
      className="fixed bg-black/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden select-none"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
    >
      <div
        className="flex items-center justify-between p-3 border-b border-white/10 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <h3 className="text-white text-sm font-light tracking-wide pointer-events-none">Camera Preview</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={resetSize}
            className="text-white/40 hover:text-white/80 transition-colors"
            title="Toggle size"
          >
            {size.width > DEFAULT_WIDTH ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="relative w-full bg-black" style={{ height: `calc(100% - 44px)` }}>
        <canvas
          id="camera-canvas"
          className="w-full h-full object-cover"
        />

        {!handData.isInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <p className="text-white/60 text-xs">Initializing camera...</p>
          </div>
        )}

        {handData.isInitialized && !handData.leftHand.isDetected && !handData.rightHand.isDetected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <p className="text-white/40 text-xs">No hands detected</p>
          </div>
        )}
      </div>

      <div
        className={`${resizeHandleClass} top-0 left-0 cursor-nw-resize`}
        onMouseDown={handleResizeStart('tl')}
      >
        <div className="w-2 h-2 bg-white/40 rounded-full mt-0.5 ml-0.5" />
      </div>
      <div
        className={`${resizeHandleClass} top-0 right-0 cursor-ne-resize`}
        onMouseDown={handleResizeStart('tr')}
      >
        <div className="w-2 h-2 bg-white/40 rounded-full mt-0.5 ml-auto mr-0.5" />
      </div>
      <div
        className={`${resizeHandleClass} bottom-0 left-0 cursor-sw-resize`}
        onMouseDown={handleResizeStart('bl')}
      >
        <div className="w-2 h-2 bg-white/40 rounded-full mt-auto mb-0.5 ml-0.5" />
      </div>
      <div
        className={`${resizeHandleClass} bottom-0 right-0 cursor-se-resize`}
        onMouseDown={handleResizeStart('br')}
      >
        <div className="w-2 h-2 bg-white/40 rounded-full mt-auto mb-0.5 ml-auto mr-0.5" />
      </div>

      <div
        className="absolute top-0 left-3 right-3 h-1 cursor-n-resize"
        onMouseDown={handleResizeStart('t')}
      />
      <div
        className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize"
        onMouseDown={handleResizeStart('b')}
      />
      <div
        className="absolute left-0 top-3 bottom-3 w-1 cursor-w-resize"
        onMouseDown={handleResizeStart('l')}
      />
      <div
        className="absolute right-0 top-3 bottom-3 w-1 cursor-e-resize"
        onMouseDown={handleResizeStart('r')}
      />
    </div>
  );
};

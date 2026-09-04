/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../hooks/useRedux";
import {
  updateShape,
  addShape,
  selectShape,
  deleteShape,
} from "../store/canvasSlice";
import {
  drawRect,
  drawCircle,
  drawLine,
  drawText,
  drawFreehand,
} from "../canvas/shapes";
import type { DrawingShape } from "../types";
import { v4 as uuidv4 } from "uuid";

type Tool = "select" | "rect" | "circle" | "line" | "text" | "freehand" | "eraser";

interface CanvasProps {
  projectId?: string;
  onShapeUpdate?: (shape: DrawingShape) => void;
}

interface TextPlacement {
  x: number;
  y: number;
  value: string;
}

const TOOLS: { id: Tool; label: string }[] = [
  { id: "select", label: "Select" },
  { id: "rect", label: "Rect" },
  { id: "circle", label: "Circle" },
  { id: "freehand", label: "Pen" },
  { id: "line", label: "Line" },
  { id: "text", label: "Text" },
  { id: "eraser", label: "Eraser" },
];

export const Canvas: React.FC<CanvasProps> = ({ onShapeUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispatch = useAppDispatch();
  const { shapes, selectedShapeId, zoom, panX, panY } = useAppSelector(
    (state) => state.canvas
  );

  const [currentTool, setCurrentTool] = useState<Tool>("select");
  const [currentColor, setCurrentColor] = useState("#6366f1");

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [freehandPoints, setFreehandPoints] = useState<{ x: number; y: number }[]>([]);
  const [textInput, setTextInput] = useState<TextPlacement | null>(null);

  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number } | null>(null);

  // Redraw the canvas whenever its inputs change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background + grid
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 0.5;
    const gridSize = 20;
    for (let x = gridSize; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = gridSize; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Apply pan/zoom then draw shapes
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    shapes.forEach((shape) => {
      ctx.save();
      ctx.translate(shape.x + shape.width / 2, shape.y + shape.height / 2);
      ctx.rotate((shape.rotation * Math.PI) / 180);
      ctx.translate(-(shape.x + shape.width / 2), -(shape.y + shape.height / 2));
      ctx.globalAlpha = shape.opacity ?? 1;

      if (shape.type === "rect") {
        drawRect(ctx, shape.x, shape.y, shape.width, shape.height, shape.fill, shape.stroke, shape.strokeWidth);
      } else if (shape.type === "circle") {
        drawCircle(ctx, shape.x, shape.y, shape.width, shape.height, shape.fill, shape.stroke, shape.strokeWidth);
      } else if (shape.type === "line") {
        drawLine(ctx, shape.x, shape.y, shape.width, shape.height, shape.stroke, shape.strokeWidth);
      } else if (shape.type === "text") {
        drawText(ctx, shape.x, shape.y, shape.data?.text || "Text", shape.fill, shape.data?.fontSize || 24);
      } else if (shape.type === "freehand") {
        drawFreehand(ctx, shape.data?.points || [], shape.stroke, shape.strokeWidth);
      }

      // Selection highlight
      if (shape.id === selectedShapeId && shape.type !== "freehand") {
        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([6 / zoom, 4 / zoom]);
        const pad = 6;
        ctx.strokeRect(shape.x - pad, shape.y - pad, shape.width + pad * 2, shape.height + pad * 2);
        ctx.setLineDash([]);
      }

      ctx.restore();
    });

    ctx.restore();
  }, [shapes, selectedShapeId, zoom, panX, panY]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - panX) / zoom;
    const y = (e.clientY - rect.top - panY) / zoom;
    return { x, y };
  };

  const hitTest = (coords: { x: number; y: number }) => {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      if (s.type === "freehand") {
        const pts: { x: number; y: number }[] = s.data?.points || [];
        for (const p of pts) {
          if (Math.abs(p.x - coords.x) < 8 && Math.abs(p.y - coords.y) < 8) return s;
        }
        continue;
      }
      const pad = 8;
      if (
        coords.x >= s.x - pad &&
        coords.x <= s.x + s.width + pad &&
        coords.y >= s.y - pad &&
        coords.y <= s.y + s.height + pad
      ) {
        return s;
      }
    }
    return undefined;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);

    if (currentTool === "text") {
      if (textInput) {
        handleTextSubmit();
      } else {
        setTextInput({ x: coords.x, y: coords.y, value: "" });
      }
      return;
    }

    setStartPos(coords);
    setCurrentPos(coords);
    setIsDrawing(true);

    if (currentTool === "freehand") {
      setFreehandPoints([coords]);
    } else if (currentTool === "select" || currentTool === "eraser") {
      const hit = hitTest(coords);
      if (currentTool === "eraser" && hit) {
        dispatch(deleteShape(hit.id));
        if (selectedShapeId === hit.id) dispatch(selectShape(null));
        setIsDrawing(false);
        return;
      }
      if (currentTool === "select" && hit) {
        dispatch(selectShape(hit.id));
        setDragOffset({ dx: coords.x - hit.x, dy: coords.y - hit.y });
      } else {
        dispatch(selectShape(null));
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setCurrentPos(coords);

    if (!isDrawing || !startPos) return;

    if (currentTool === "freehand") {
      setFreehandPoints((prev) => [...prev, coords]);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.save();
        ctx.translate(panX, panY);
        ctx.scale(zoom, zoom);
        ctx.beginPath();
        const last = freehandPoints[freehandPoints.length - 1];
        ctx.moveTo(last?.x ?? coords.x, last?.y ?? coords.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();
      }
    } else if (currentTool === "select" && dragOffset && selectedShapeId) {
      const shape = shapes.find((s) => s.id === selectedShapeId);
      if (shape) {
        dispatch(
          updateShape({
            ...shape,
            x: coords.x - dragOffset.dx,
            y: coords.y - dragOffset.dy,
          })
        );
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !startPos) return;
    setIsDrawing(false);

    const endX = currentPos?.x ?? startPos.x;
    const endY = currentPos?.y ?? startPos.y;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    // Clear any live preview stroke
    if (canvas && ctx) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    if (currentTool === "freehand") {
      if (freehandPoints.length > 1) {
        const points = [...freehandPoints, { x: endX, y: endY }];
        const shape: DrawingShape = {
          id: uuidv4(),
          type: "freehand",
          x: 0, y: 0, width: 0, height: 0, rotation: 0,
          fill: "transparent",
          stroke: currentColor,
          strokeWidth: 2,
          opacity: 1,
          zIndex: shapes.length,
          data: { points },
        };
        dispatch(addShape(shape));
        onShapeUpdate?.(shape);
      }
      setFreehandPoints([]);
      setStartPos(null);
      setCurrentPos(null);
      dispatch(selectShape(null));
      return;
    }

    if (currentTool !== "select" && currentTool !== "eraser") {
      const width = Math.abs(endX - startPos.x);
      const height = Math.abs(endY - startPos.y);
      const x = Math.min(endX, startPos.x);
      const y = Math.min(endY, startPos.y);

      if (currentTool === "line" && width > 0 && height > 0) {
        const shape: DrawingShape = {
          id: uuidv4(),
          type: "line",
          x, y, width, height, rotation: 0,
          fill: "transparent",
          stroke: currentColor,
          strokeWidth: 2,
          opacity: 1,
          zIndex: shapes.length,
        };
        dispatch(addShape(shape));
        onShapeUpdate?.(shape);
      } else if (currentTool !== "line" && width > 2 && height > 2) {
        const shape: DrawingShape = {
          id: uuidv4(),
          type: currentTool,
          x, y, width, height, rotation: 0,
          fill: currentTool === "text" ? "transparent" : currentColor,
          stroke: currentColor,
          strokeWidth: 2,
          opacity: 1,
          zIndex: shapes.length,
        };
        dispatch(addShape(shape));
        onShapeUpdate?.(shape);
      }
    }

    setStartPos(null);
    setCurrentPos(null);
    setDragOffset(null);
  };

  const handleTextSubmit = () => {
    if (!textInput) return;
    const value = textInput.value.trim();
    if (value) {
      const shape: DrawingShape = {
        id: uuidv4(),
        type: "text",
        x: textInput.x,
        y: textInput.y,
        width: Math.max(60, value.length * 14),
        height: 32,
        rotation: 0,
        fill: currentColor,
        stroke: currentColor,
        strokeWidth: 1,
        opacity: 1,
        zIndex: shapes.length,
        data: { text: value, fontSize: 24 },
      };
      dispatch(addShape(shape));
      onShapeUpdate?.(shape);
    }
    setTextInput(null);
    setCurrentTool("select");
  };

  return (
    <div className="flex flex-col gap-4 relative h-full">
      <div className="flex gap-2 bg-slate-100 p-2 rounded-lg overflow-x-auto items-center">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            title={tool.label}
            onClick={() => setCurrentTool(tool.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium shadow-sm border-2 transition-all whitespace-nowrap ${
              currentTool === tool.id
                ? "bg-indigo-600 text-white border-indigo-700"
                : "bg-white text-slate-900 border-slate-300 hover:border-slate-500 hover:bg-slate-50"
            }`}
          >
            {tool.label}
          </button>
        ))}
        <input
          title="Color Picker"
          type="color"
          value={currentColor}
          onChange={(e) => setCurrentColor(e.target.value)}
          className="ml-auto w-9 h-9 cursor-pointer rounded-lg border-2 border-slate-300 shadow-sm"
        />
      </div>
      <div className="relative flex-1 min-h-[400px] overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1200}
          height={660}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="border-2 border-slate-300 cursor-crosshair bg-white rounded-lg block w-full"
          style={{ maxWidth: "100%" }}
        />
        {textInput && (
          <input
            autoFocus
            type="text"
            placeholder="Type text and press Enter"
            value={textInput.value}
            onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTextSubmit();
              if (e.key === "Escape") {
                setTextInput(null);
                setCurrentTool("select");
              }
            }}
            className="absolute p-2 border-2 border-indigo-500 rounded shadow-lg bg-white text-slate-900"
            style={{
              left: textInput.x * zoom + panX + "px",
              top: textInput.y * zoom + panY + "px",
              zIndex: 1000,
              minWidth: "180px",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Canvas;

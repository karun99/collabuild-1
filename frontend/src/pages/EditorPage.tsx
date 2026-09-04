/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { Canvas } from "../components/Canvas";
import { projectService } from "../services/api";
import type { Project, DrawingShape } from "../types";
import { io, Socket } from "socket.io-client";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { updateShape, upsertShape, selectShape } from "../store/canvasSlice";

const WS_URL = (import.meta as any).env?.VITE_WS_URL || "http://localhost:3000";

interface EditorPageProps {
  projectId: string;
  onBack?: () => void;
}

export const EditorPage: React.FC<EditorPageProps> = ({ projectId, onBack }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const dispatch = useAppDispatch();
  const { shapes, selectedShapeId } = useAppSelector((state) => state.canvas);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const newSocket = io(WS_URL, {
      auth: { token: `Bearer ${token}` },
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket");
      newSocket.emit("project:join", projectId);
    });

    newSocket.on("drawing:updated", (shape: DrawingShape) => {
      dispatch(upsertShape(shape));
      setHistory(prev => [`Remote update: ${shape.type}`, ...prev.slice(0, 49)]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await projectService.get(projectId);
      setProject(response.data);
    } catch (error) {
      console.error("Failed to fetch project:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShapeUpdate = (shape: DrawingShape) => {
    if (socket) {
      socket.emit("drawing:update", { projectId, ...shape });
    }
    setHistory(prev => [`Added ${shape.type}`, ...prev.slice(0, 49)]);
  };

  const selectedShape = shapes.find((s) => s.id === selectedShapeId);

  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handlePropertyChange = (field: keyof DrawingShape, value: any) => {
    if (selectedShape) {
      const updatedShape = { ...selectedShape, [field]: value };
      dispatch(updateShape(updatedShape));
      if (socket) {
        socket.emit("drawing:update", { projectId, ...updatedShape });
      }
      // Debounce history? Or just log key events? Logging every slide is too much.
      // For now, simpler is better.
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading project...</div>;
  }

  if (!project) {
    return <div className="text-center py-12">Project not found</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Live
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            {copyFeedback && <span className="text-sm text-green-600 font-medium">Link Copied!</span>}
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 font-medium"
            >
              Share
            </button>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Layers & History */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-lg">Layers</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {[...shapes].reverse().map((shape, i) => (
                <div
                  key={shape.id}
                  onClick={() => dispatch(selectShape(shape.id))}
                  className={`p-2 rounded cursor-pointer text-sm flex items-center justify-between ${selectedShapeId === shape.id ? 'bg-blue-100 text-blue-700' : 'text-gray-900 hover:bg-gray-100'}`}
                >
                  <span className="capitalize">{shape.type} {shapes.length - i}</span>
                  {selectedShapeId === shape.id && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                </div>
              ))}
              {shapes.length === 0 && <div className="text-gray-400 text-sm text-center py-4">No drawing items</div>}
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 bg-gray-50 h-1/3 flex flex-col">
            <h3 className="font-semibold text-sm mb-2 text-gray-500 uppercase tracking-wider">History Log</h3>
            <div className="flex-1 overflow-y-auto space-y-1">
              {history.map((entry, i) => (
                <div key={i} className="text-xs text-gray-600 font-mono border-l-2 border-gray-300 pl-2 py-0.5">
                  {entry}
                </div>
              ))}
              {history.length === 0 && <div className="text-gray-400 text-xs italic">No activity yet</div>}
            </div>
          </div>
        </div>

        <div className="flex-1 relative">
          <Canvas onShapeUpdate={handleShapeUpdate} />
        </div>

        {/* Properties Panel */}
        {selectedShape && (
          <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-semibold text-lg mb-4">Properties</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Stroke Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedShape.stroke}
                    onChange={(e) => handlePropertyChange("stroke", e.target.value)}
                    className="w-full h-8 cursor-pointer rounded border border-gray-300"
                  />
                  <span className="text-xs text-gray-500">{selectedShape.stroke}</span>
                </div>
              </div>

              {(selectedShape.type === "rect" || selectedShape.type === "circle" || selectedShape.type === "text") && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Fill Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedShape.fill === "transparent" ? "#ffffff" : selectedShape.fill}
                      onChange={(e) => handlePropertyChange("fill", e.target.value)}
                      className="w-full h-8 cursor-pointer rounded border border-gray-300"
                    />
                    <button
                      onClick={() => handlePropertyChange("fill", "transparent")}
                      className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                    >
                      None
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-600 mb-1">Stroke Width</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={selectedShape.strokeWidth}
                  onChange={(e) => handlePropertyChange("strokeWidth", parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-right text-xs text-gray-500">{selectedShape.strokeWidth}px</div>
              </div>

              {/* Opacity Slider */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedShape.opacity ?? 1}
                  onChange={(e) => handlePropertyChange("opacity", parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-right text-xs text-gray-500">{Math.round((selectedShape.opacity ?? 1) * 100)}%</div>
              </div>

              {selectedShape.type === "text" && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Text Content</label>
                  <textarea
                    value={selectedShape.data?.text || ""}
                    onChange={(e) => handlePropertyChange("data", { ...selectedShape.data, text: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    rows={3}
                  />
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-400">ID: {selectedShape.id.slice(0, 8)}...</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

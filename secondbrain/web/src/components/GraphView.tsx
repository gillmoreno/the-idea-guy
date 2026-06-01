"use client";

import { useEffect, useRef } from "react";
import { forceCenter, forceLink, forceManyBody, forceSimulation } from "d3-force";
import { select } from "d3-selection";
import { NoteStore } from "@/lib/store";

interface GraphViewProps {
  store: NoteStore;
  activeNoteId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

interface SimNode {
  id: string;
  title: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink {
  source: string | SimNode;
  target: string | SimNode;
}

export function GraphView({ store, activeNoteId, onSelect, onClose }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const notes = store.listNotes();
  const edges = store.getGraphEdges();

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || notes.length === 0) return;

    const width = svg.clientWidth || 600;
    const height = svg.clientHeight || 400;

    const nodes: SimNode[] = notes.map((n) => ({
      id: n.id,
      title: n.title || "Untitled",
    }));
    const links: SimLink[] = edges
      .filter((e) => nodes.some((n) => n.id === e.source) && nodes.some((n) => n.id === e.target))
      .map((e) => ({ source: e.source, target: e.target }));

    const simulation = forceSimulation(nodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(80),
      )
      .force("charge", forceManyBody().strength(-120))
      .force("center", forceCenter(width / 2, height / 2));

    const sel = select(svg);
    sel.selectAll("*").remove();

    const link = sel
      .append("g")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 1.5)
      .selectAll("line")
      .data(links)
      .join("line");

    const node = sel
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer")
      .on("click", (_ev, d) => onSelect(d.id));

    node
      .append("circle")
      .attr("r", (d) => (d.id === activeNoteId ? 10 : 7))
      .attr("fill", (d) => (d.id === activeNoteId ? "#4f46e5" : "#94a3b8"));

    node
      .append("text")
      .text((d) => d.title.slice(0, 20))
      .attr("x", 12)
      .attr("y", 4)
      .attr("font-size", 11)
      .attr("fill", "#334155");

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0);
      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [notes, edges, activeNoteId, onSelect]);

  return (
    <div className="graph-panel">
      <div className="graph-header">
        <h3>Note graph</h3>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>
          Close
        </button>
      </div>
      {notes.length === 0 ? (
        <div className="empty">Create notes and links to see the graph.</div>
      ) : (
        <svg ref={svgRef} className="graph-svg" />
      )}
    </div>
  );
}

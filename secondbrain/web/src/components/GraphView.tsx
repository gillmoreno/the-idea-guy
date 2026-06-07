"use client";

import { useEffect, useRef } from "react";
import { forceCenter, forceLink, forceManyBody, forceSimulation } from "d3-force";
import { select } from "d3-selection";
import { Network, X } from "lucide-react";
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

    const styles = getComputedStyle(document.documentElement);
    const primary = styles.getPropertyValue("--primary").trim() || "#0d9488";
    const muted = styles.getPropertyValue("--muted").trim() || "#94a3b8";
    const border = styles.getPropertyValue("--border").trim() || "#e2e8f0";
    const accent = styles.getPropertyValue("--accent").trim() || "#6366f1";

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
          .distance(100),
      )
      .force("charge", forceManyBody().strength(-180))
      .force("center", forceCenter(width / 2, height / 2));

    const sel = select(svg);
    sel.selectAll("*").remove();

    const defs = sel.append("defs");
    const glow = defs
      .append("filter")
      .attr("id", "node-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    glow.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "blur");
    const merge = glow.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    const link = sel
      .append("g")
      .attr("stroke", border)
      .attr("stroke-opacity", 0.8)
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
      .attr("r", (d) => (d.id === activeNoteId ? 12 : 8))
      .attr("fill", (d) => (d.id === activeNoteId ? primary : muted))
      .attr("filter", (d) => (d.id === activeNoteId ? "url(#node-glow)" : null))
      .attr("stroke", (d) => (d.id === activeNoteId ? accent : "none"))
      .attr("stroke-width", 2);

    node
      .append("text")
      .text((d) => d.title.slice(0, 24))
      .attr("x", 14)
      .attr("y", 4)
      .attr("font-size", 11)
      .attr("font-weight", (d) => (d.id === activeNoteId ? 700 : 500))
      .attr("fill", (d) => (d.id === activeNoteId ? primary : muted));

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
        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Network size={18} />
          Note graph
        </h3>
        <button className="icon-btn" onClick={onClose} aria-label="Close graph">
          <X size={16} />
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

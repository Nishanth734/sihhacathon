"""
Vector-Geometric CAD Pre-Scrutiny Engine
SIH26130 - UdyogSetu

Parses vector CAD (DXF) files using ezdxf.
Extracts geometric entities from designated layers:
  - 'PLOT_BOUNDARY'
  - 'CHEMICAL_STORAGE'
Calculates the exact shortest geometric Euclidean setback distance between polylines
and verifies compliance against MIDC Development Control Regulations (15.0 meter statutory setback).
"""
import io
import math
from typing import Any, Dict, List, Optional, Tuple
import ezdxf
from ezdxf.document import Drawing

MINIMUM_STATUTORY_SETBACK_METERS = 15.0

# ---------------------------------------------------------------------------
# 2D Vector Geometry Helpers
# ---------------------------------------------------------------------------
Point2D = Tuple[float, float]
Segment2D = Tuple[Point2D, Point2D]

def distance_point_to_point(p1: Point2D, p2: Point2D) -> float:
    return math.hypot(p1[0] - p2[0], p1[1] - p2[1])

def distance_point_to_segment(p: Point2D, seg: Segment2D) -> float:
    """Computes the shortest Euclidean distance from a point to a line segment."""
    a, b = seg
    ab_x = b[0] - a[0]
    ab_y = b[1] - a[1]
    ab_len_sq = ab_x * ab_x + ab_y * ab_y

    if ab_len_sq == 0.0:
        return distance_point_to_point(p, a)

    # Projection factor t of point p onto line ab
    ap_x = p[0] - a[0]
    ap_y = p[1] - a[1]
    t = (ap_x * ab_x + ap_y * ab_y) / ab_len_sq
    t = max(0.0, min(1.0, t))  # Clamp to segment bounds

    closest_x = a[0] + t * ab_x
    closest_y = a[1] + t * ab_y
    return distance_point_to_point(p, (closest_x, closest_y))

def ccw(a: Point2D, b: Point2D, c: Point2D) -> bool:
    return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0])

def segments_intersect(seg1: Segment2D, seg2: Segment2D) -> bool:
    """Determines whether two line segments intersect in 2D plane."""
    p1, q1 = seg1
    p2, q2 = seg2
    return (ccw(p1, p2, q2) != ccw(q1, p2, q2)) and (ccw(p1, q1, p2) != ccw(p1, q1, q2))

def distance_segment_to_segment(seg1: Segment2D, seg2: Segment2D) -> float:
    """Calculates the minimum distance between two 2D line segments."""
    if segments_intersect(seg1, seg2):
        return 0.0

    p1, p2 = seg1
    q1, q2 = seg2

    return min(
        distance_point_to_segment(p1, seg2),
        distance_point_to_segment(p2, seg2),
        distance_point_to_segment(q1, seg1),
        distance_point_to_segment(q2, seg1),
    )

# ---------------------------------------------------------------------------
# DXF Polyline Extractor
# ---------------------------------------------------------------------------
def extract_segments_from_entity(entity: Any) -> List[Segment2D]:
    """Extracts line segments from DXF entities (LWPOLYLINE, POLYLINE, LINE)."""
    segments: List[Segment2D] = []
    dxftype = entity.dxftype()

    if dxftype == "LWPOLYLINE":
        pts = [(p[0], p[1]) for p in entity.get_points(format="xy")]
        if not pts:
            return segments
        is_closed = entity.is_closed
        for i in range(len(pts) - 1):
            segments.append((pts[i], pts[i + 1]))
        if is_closed and len(pts) > 2:
            segments.append((pts[-1], pts[0]))

    elif dxftype == "POLYLINE":
        pts = [(v.dxf.location.x, v.dxf.location.y) for v in entity.vertices]
        if not pts:
            return segments
        is_closed = entity.is_closed
        for i in range(len(pts) - 1):
            segments.append((pts[i], pts[i + 1]))
        if is_closed and len(pts) > 2:
            segments.append((pts[-1], pts[0]))

    elif dxftype == "LINE":
        start = (entity.dxf.start.x, entity.dxf.start.y)
        end = (entity.dxf.end.x, entity.dxf.end.y)
        segments.append((start, end))

    return segments

def extract_layer_segments(doc: Drawing, layer_name: str) -> Tuple[List[Segment2D], List[Point2D]]:
    """
    Searches modelspace for entities matching the layer name (case-insensitive).
    Returns all boundary line segments and vertex coordinates.
    """
    msp = doc.modelspace()
    matched_segments: List[Segment2D] = []
    matched_points: List[Point2D] = []
    target_layer_normalized = layer_name.strip().upper()

    for entity in msp:
        entity_layer = entity.dxf.layer.strip().upper() if hasattr(entity.dxf, "layer") else ""
        if entity_layer == target_layer_normalized:
            segs = extract_segments_from_entity(entity)
            matched_segments.extend(segs)
            for s in segs:
                matched_points.extend([s[0], s[1]])

    return matched_segments, matched_points

# ---------------------------------------------------------------------------
# Setback Scrutiny Analysis
# ---------------------------------------------------------------------------
def compute_cad_setback_compliance(dxf_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Parses a DXF CAD drawing, finds 'PLOT_BOUNDARY' and 'CHEMICAL_STORAGE' layers,
    and calculates the shortest geometric distance (setback).

    Returns a structured compliance evaluation against MIDC DCR standards (15m threshold).
    """
    # 1. Parse DXF file with ezdxf
    try:
        stream = io.StringIO(dxf_bytes.decode("utf-8", errors="replace"))
        doc = ezdxf.read(stream)
    except Exception as e:
        raise ValueError(f"Failed to parse DXF file format: {str(e)}")

    # 2. Extract and inspect available layers in the CAD drawing
    available_layers = [layer.dxf.name for layer in doc.layers]
    available_layers_upper = {name.upper(): name for name in available_layers}

    plot_layer_name = available_layers_upper.get("PLOT_BOUNDARY")
    chem_layer_name = available_layers_upper.get("CHEMICAL_STORAGE")

    # Error if designated layers are missing
    missing_layers = []
    if not plot_layer_name:
        missing_layers.append("PLOT_BOUNDARY")
    if not chem_layer_name:
        missing_layers.append("CHEMICAL_STORAGE")

    if missing_layers:
        raise ValueError(
            f"Required CAD layer(s) missing: {missing_layers}. "
            f"Available layers in '{filename}': {available_layers}"
        )

    # 3. Extract boundary segments for both layers
    plot_segments, plot_points = extract_layer_segments(doc, plot_layer_name)
    chem_segments, chem_points = extract_layer_segments(doc, chem_layer_name)

    if not plot_segments:
        raise ValueError(f"Layer '{plot_layer_name}' found, but contains no valid geometric polylines/lines.")
    if not chem_segments:
        raise ValueError(f"Layer '{chem_layer_name}' found, but contains no valid geometric polylines/lines.")

    # 4. Calculate shortest geometric distance between the two polylines
    min_distance = float("inf")
    closest_pair: Optional[Tuple[Point2D, Point2D]] = None

    for seg_p in plot_segments:
        for seg_c in chem_segments:
            dist = distance_segment_to_segment(seg_p, seg_c)
            if dist < min_distance:
                min_distance = dist
                closest_pair = (seg_p[0], seg_c[0])
                if min_distance == 0.0:
                    break
        if min_distance == 0.0:
            break

    shortest_setback_meters = round(min_distance, 3)

    # 5. Verify against MIDC statutory requirement (15.0 meters)
    is_compliant = shortest_setback_meters >= MINIMUM_STATUTORY_SETBACK_METERS
    deficit_meters = round(max(0.0, MINIMUM_STATUTORY_SETBACK_METERS - shortest_setback_meters), 3)

    # Calculate bounding boxes for spatial context
    plot_min_x = min(p[0] for p in plot_points)
    plot_max_x = max(p[0] for p in plot_points)
    plot_min_y = min(p[1] for p in plot_points)
    plot_max_y = max(p[1] for p in plot_points)

    chem_min_x = min(p[0] for p in chem_points)
    chem_max_x = max(p[0] for p in chem_points)
    chem_min_y = min(p[1] for p in chem_points)
    chem_max_y = max(p[1] for p in chem_points)

    compliance_message = (
        f"PASSED: Chemical storage setback is {shortest_setback_meters:.2f}m, "
        f"satisfying the MIDC DCR statutory threshold of {MINIMUM_STATUTORY_SETBACK_METERS:.2f}m."
        if is_compliant
        else f"VIOLATION: Hazardous chemical storage setback is {shortest_setback_meters:.2f}m, "
             f"violating the statutory minimum requirement of {MINIMUM_STATUTORY_SETBACK_METERS:.2f}m "
             f"(Deficit: {deficit_meters:.2f}m). Physical layout redesign required."
    )

    return {
        "status": "COMPLIANT" if is_compliant else "NON_COMPLIANT",
        "is_compliant": is_compliant,
        "calculated_setback_meters": shortest_setback_meters,
        "required_setback_meters": MINIMUM_STATUTORY_SETBACK_METERS,
        "setback_deficit_meters": deficit_meters,
        "compliance_message": compliance_message,
        "regulation_reference": "MIDC Development Control Regulations (DCR) - Hazardous Material Buffer Standard",
        "spatial_metadata": {
            "plot_boundary_layer": plot_layer_name,
            "plot_segments_count": len(plot_segments),
            "plot_extent": {"min_x": plot_min_x, "max_x": plot_max_x, "min_y": plot_min_y, "max_y": plot_max_y},
            "chemical_storage_layer": chem_layer_name,
            "chemical_segments_count": len(chem_segments),
            "chemical_extent": {"min_x": chem_min_x, "max_x": chem_max_x, "min_y": chem_min_y, "max_y": chem_max_y}
        }
    }

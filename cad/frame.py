"""
Machine frame — side walls, cross beams, legs/feet.
Matches the 3D simulation structure.
"""
import cadquery as cq
from .parameters import (
    CONV_LENGTH, CONV_WIDTH, FRAME_T, FRAME_H, SIDE_T,
    ROLLER_D,
)

WALL_H = FRAME_H + ROLLER_D / 2 + 5  # side wall total height


def _side_walls() -> cq.Workplane:
    """Two side walls along X."""
    near = (
        cq.Workplane("XY")
        .box(CONV_LENGTH, SIDE_T, WALL_H, centered=False)
    )
    far = (
        cq.Workplane("XY")
        .transformed(offset=(0, CONV_WIDTH - SIDE_T, 0))
        .box(CONV_LENGTH, SIDE_T, WALL_H, centered=False)
    )
    return near.union(far)


def _cross_beams() -> cq.Workplane:
    """Horizontal cross beams between side walls for rigidity."""
    xs = [30, CONV_LENGTH / 2, CONV_LENGTH - 40]
    result = cq.Workplane("XY")
    for bx in xs:
        result = result.union(
            cq.Workplane("XY")
            .transformed(offset=(bx, SIDE_T, FRAME_H * 0.3))
            .box(FRAME_T, CONV_WIDTH - 2 * SIDE_T, FRAME_T, centered=False)
        )
    return result


def _legs() -> cq.Workplane:
    """Four leg pads + foot plates at bottom of side walls."""
    positions = [
        (20, 0), (20, CONV_WIDTH - SIDE_T),
        (CONV_LENGTH - 40, 0), (CONV_LENGTH - 40, CONV_WIDTH - SIDE_T),
    ]
    result = cq.Workplane("XY")
    for lx, ly in positions:
        # Leg pad
        result = result.union(
            cq.Workplane("XY")
            .transformed(offset=(lx, ly, 0))
            .box(SIDE_T + 4, SIDE_T, FRAME_H * 0.3, centered=False)
        )
        # Foot plate
        result = result.union(
            cq.Workplane("XY")
            .transformed(offset=(lx, ly, 0))
            .box(SIDE_T + 10, SIDE_T, FRAME_T, centered=False)
        )
    return result


def make_frame() -> cq.Workplane:
    """Complete machine frame. Origin at bottom-left-front corner."""
    frame = _side_walls()
    frame = frame.union(_cross_beams())
    frame = frame.union(_legs())
    return frame

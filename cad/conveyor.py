"""
Conveyor module — drive/idler rollers with belt wraps, belt runs,
sensors S1-S3, motor M2.
Matches the 3D simulation (סימולציה_3D_v2.html).
"""
import cadquery as cq
import math
from .parameters import (
    CONV_LENGTH, CONV_WIDTH, SIDE_T, FRAME_T, FRAME_H,
    BELT_W, BELT_T, ROLLER_D, ROLLER_GAP,
    ROLLER_CZ, BELT_TOP_Z, IDLER_X, DRIVE_X,
    CY, S1_X, S2_X, S3_X,
    NEMA, NEMA_DEPTH, NEMA_SHAFT_D,
    SENSOR_D,
)


# ──────────────────────────────────────────────────────────
#  Rollers
# ──────────────────────────────────────────────────────────

def _roller(cx: float) -> cq.Workplane:
    """Conveyor roller at X=cx, centred at CY, Z=ROLLER_CZ, axis=Y."""
    roller = (
        cq.Workplane("XZ")
        .transformed(offset=(cx, CY, ROLLER_CZ))
        .cylinder(CONV_WIDTH - 2 * SIDE_T, ROLLER_D / 2)
    )
    shaft = (
        cq.Workplane("XZ")
        .transformed(offset=(cx, CY, ROLLER_CZ))
        .cylinder(CONV_WIDTH + 10, 4)
    )
    return roller.union(shaft)


# ──────────────────────────────────────────────────────────
#  Belt with semi-circular wraps
# ──────────────────────────────────────────────────────────

def _belt() -> cq.Workplane:
    """Top and bottom belt runs (flat sections between rollers)."""
    span = DRIVE_X - IDLER_X
    top = (
        cq.Workplane("XY")
        .transformed(offset=(IDLER_X, CY - BELT_W / 2, BELT_TOP_Z))
        .box(span, BELT_W, BELT_T, centered=False)
    )
    bot = (
        cq.Workplane("XY")
        .transformed(offset=(IDLER_X, CY - BELT_W / 2,
                             ROLLER_CZ - ROLLER_D / 2 - BELT_T))
        .box(span, BELT_W, BELT_T, centered=False)
    )
    return top.union(bot)


def _belt_wrap(cx: float) -> cq.Workplane:
    """
    Semi-circular belt wrap around a roller — built as a hollow
    half-cylinder (outer ring minus inner ring).
    For idler: wraps the left (negative X) side.
    For drive: wraps the right (positive X) side.
    """
    r_outer = ROLLER_D / 2 + BELT_T
    r_inner = ROLLER_D / 2

    # Full cylindrical shell then cut in half
    outer_cyl = (
        cq.Workplane("XZ")
        .transformed(offset=(cx, CY, ROLLER_CZ))
        .cylinder(BELT_W, r_outer)
    )
    inner_cyl = (
        cq.Workplane("XZ")
        .transformed(offset=(cx, CY, ROLLER_CZ))
        .cylinder(BELT_W + 2, r_inner)
    )
    shell = outer_cyl.cut(inner_cyl)

    # Cut away the half we don't want
    cut_len = r_outer * 2 + 2
    if cx == IDLER_X:
        # Keep left half — cut away right half (positive X)
        cutter = (
            cq.Workplane("XY")
            .transformed(offset=(cx, CY - BELT_W / 2 - 1,
                                 ROLLER_CZ - r_outer - 1))
            .box(cut_len, BELT_W + 2, cut_len, centered=False)
        )
    else:
        # Keep right half — cut away left half (negative X)
        cutter = (
            cq.Workplane("XY")
            .transformed(offset=(cx - cut_len, CY - BELT_W / 2 - 1,
                                 ROLLER_CZ - r_outer - 1))
            .box(cut_len, BELT_W + 2, cut_len, centered=False)
        )
    return shell.cut(cutter)


# ──────────────────────────────────────────────────────────
#  Sensors S1, S2, S3
# ──────────────────────────────────────────────────────────

def _sensor(sx: float) -> cq.Workplane:
    """Through-beam sensor bridge across the card path."""
    # Sensor bridge bar
    bar = (
        cq.Workplane("XY")
        .transformed(offset=(sx - 2, SIDE_T, BELT_TOP_Z + BELT_T))
        .box(4, CONV_WIDTH - 2 * SIDE_T, 15, centered=False)
    )
    # Emitter (near side)
    em = (
        cq.Workplane("XZ")
        .transformed(offset=(sx, SIDE_T + 5, BELT_TOP_Z + BELT_T + 8))
        .cylinder(12, SENSOR_D / 2)
    )
    # Receiver (far side)
    rx = (
        cq.Workplane("XZ")
        .transformed(offset=(sx, CONV_WIDTH - SIDE_T - 5,
                             BELT_TOP_Z + BELT_T + 8))
        .cylinder(12, SENSOR_D / 2)
    )
    return bar.union(em).union(rx)


# ──────────────────────────────────────────────────────────
#  Motor M2 (drives belt drive roller)
# ──────────────────────────────────────────────────────────

def _motor_m2() -> cq.Workplane:
    body = (
        cq.Workplane("XY")
        .transformed(offset=(DRIVE_X - NEMA / 2, CONV_WIDTH + 15,
                             ROLLER_CZ - NEMA / 2))
        .box(NEMA, NEMA_DEPTH, NEMA, centered=False)
    )
    shaft = (
        cq.Workplane("XZ")
        .transformed(offset=(DRIVE_X, CONV_WIDTH + 10, ROLLER_CZ))
        .cylinder(15, NEMA_SHAFT_D / 2)
    )
    return body.union(shaft)


# ══════════════════════════════════════════════════════════
#  PUBLIC API
# ══════════════════════════════════════════════════════════

def make_conveyor() -> cq.Workplane:
    """Complete conveyor module (belt, rollers, wraps, sensors)."""
    conv = _roller(IDLER_X)
    conv = conv.union(_roller(DRIVE_X))
    conv = conv.union(_belt())
    conv = conv.union(_belt_wrap(IDLER_X))
    conv = conv.union(_belt_wrap(DRIVE_X))
    # Sensors
    conv = conv.union(_sensor(S1_X))
    conv = conv.union(_sensor(S2_X))
    conv = conv.union(_sensor(S3_X))
    return conv


def make_conveyor_motor() -> cq.Workplane:
    """M2 motor."""
    return _motor_m2()

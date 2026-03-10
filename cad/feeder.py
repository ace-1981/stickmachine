"""
Card feeder module — magazine housing, friction feed roller,
separation pad, card stack, exit slot, guide ramp, motor M1.
Matches the 3D simulation (סימולציה_3D_v2.html).
"""
import cadquery as cq
from .parameters import (
    CONV_WIDTH, SIDE_T, FRAME_T,
    MAG_H, MAG_WALL, MAG_IN_L, MAG_IN_W,
    MAG_X0, MAG_X1, MAG_OUTER_L, MAG_OUTER_W,
    MAG_IN_X0, MAG_IN_Y0, MAG_BZ,
    FEED_D, FEED_W, FEED_CX, FEED_CZ,
    SEP_PAD_L, SEP_PAD_W, SEP_PAD_T, EXIT_SLOT_H,
    CARD_L, CARD_W, CARD_T, CARD_STACK_COUNT,
    BELT_TOP_Z, BELT_T, CY, FEEDER_X,
    RAMP_LEN,
    NEMA, NEMA_DEPTH, NEMA_SHAFT_D,
)


# ──────────────────────────────────────────────────────────
#  Magazine housing
# ──────────────────────────────────────────────────────────

def _magazine_housing() -> cq.Workplane:
    """
    Magazine structure matching simulation:
    - Bottom plate with roller slot cut-out
    - Back wall (full height)
    - Front wall (above exit slot only)
    - Side walls (thin)
    - Top beam
    - Exit slot highlight
    """
    mw = MAG_WALL
    mgL = MAG_IN_L
    mgW = MAG_IN_W

    # Roller slot boundaries
    roller_slot_start = FEED_CX - FEED_D / 2 - 3
    roller_slot_end = FEED_CX + FEED_D / 2 + 3

    # Bottom plate — left section (before roller slot)
    left_w = roller_slot_start - MAG_X0 + mw
    bp_left = (
        cq.Workplane("XY")
        .transformed(offset=(MAG_X0 - mw, MAG_IN_Y0 - mw, MAG_BZ - 6))
        .box(max(left_w, 1), mgW + 2 * mw, 6, centered=False)
    )
    # Bottom plate — right section (after roller slot, if space exists)
    right_w = MAG_X0 + MAG_OUTER_L + mw - roller_slot_end
    bp_right = None
    if right_w > 1:
        bp_right = (
            cq.Workplane("XY")
            .transformed(offset=(roller_slot_end, MAG_IN_Y0 - mw, MAG_BZ - 6))
            .box(right_w, mgW + 2 * mw, 6, centered=False)
        )

    # Back wall (full height)
    back_wall = (
        cq.Workplane("XY")
        .transformed(offset=(MAG_X0 - mw, MAG_IN_Y0 - mw, MAG_BZ))
        .box(mw, mgW + 2 * mw, MAG_H, centered=False)
    )

    # Front wall — upper part (above exit slot)
    front_wall = (
        cq.Workplane("XY")
        .transformed(offset=(MAG_X0 + MAG_OUTER_L - mw, MAG_IN_Y0 - mw,
                             MAG_BZ + EXIT_SLOT_H))
        .box(mw, mgW + 2 * mw, MAG_H - EXIT_SLOT_H, centered=False)
    )

    # Exit slot highlight
    exit_slot = (
        cq.Workplane("XY")
        .transformed(offset=(MAG_X0 + MAG_OUTER_L - mw - 1, MAG_IN_Y0,
                             MAG_BZ))
        .box(mw + 2, mgW, EXIT_SLOT_H, centered=False)
    )

    # Side walls (thin — glass-like in simulation)
    side_near = (
        cq.Workplane("XY")
        .transformed(offset=(MAG_X0, MAG_IN_Y0 - mw, MAG_BZ))
        .box(MAG_OUTER_L - 2 * mw, mw, MAG_H, centered=False)
    )
    side_far = (
        cq.Workplane("XY")
        .transformed(offset=(MAG_X0, MAG_IN_Y0 + mgW, MAG_BZ))
        .box(MAG_OUTER_L - 2 * mw, mw, MAG_H, centered=False)
    )

    # Top beam
    top_beam = (
        cq.Workplane("XY")
        .transformed(offset=(MAG_X0 - mw, MAG_IN_Y0 - mw, MAG_BZ + MAG_H))
        .box(MAG_OUTER_L + 2 * mw, mgW + 2 * mw, mw, centered=False)
    )

    result = bp_left
    if bp_right is not None:
        result = result.union(bp_right)
    result = result.union(back_wall).union(front_wall)
    result = result.union(exit_slot).union(side_near).union(side_far)
    result = result.union(top_beam)
    return result


# ──────────────────────────────────────────────────────────
#  Feed roller with rubber grip rings
# ──────────────────────────────────────────────────────────

def _feed_roller() -> cq.Workplane:
    """Friction feed roller with grip rings and bearing mounts."""
    # Main roller body
    roller = (
        cq.Workplane("XZ")
        .transformed(offset=(FEED_CX, CY, FEED_CZ))
        .cylinder(FEED_W, FEED_D / 2)
    )
    # Shaft
    shaft = (
        cq.Workplane("XZ")
        .transformed(offset=(FEED_CX, CY, FEED_CZ))
        .cylinder(MAG_IN_W + 20, NEMA_SHAFT_D / 2)
    )
    result = roller.union(shaft)

    # Rubber grip rings (7 rings, matching sim)
    for i in range(-3, 4):
        ring = (
            cq.Workplane("XZ")
            .transformed(offset=(FEED_CX, CY + i * 5, FEED_CZ))
            .cylinder(2, (FEED_D + 1.5) / 2)
        )
        result = result.union(ring)

    # Bearing mounts on both sides
    mw = MAG_WALL
    for y_off in [MAG_IN_Y0 - mw - 5, MAG_IN_Y0 + MAG_IN_W + mw]:
        mount = (
            cq.Workplane("XY")
            .transformed(offset=(FEED_CX - 7, y_off, FEED_CZ - 7))
            .box(14, 5, 14, centered=False)
        )
        result = result.union(mount)

    return result


# ──────────────────────────────────────────────────────────
#  Separation pad (prevents double-feed)
# ──────────────────────────────────────────────────────────

def _separation_pad() -> cq.Workplane:
    """High-friction separation pad above the feed roller."""
    pad_x = FEED_CX - SEP_PAD_L / 2

    # Pad surface
    pad = (
        cq.Workplane("XY")
        .transformed(offset=(pad_x, CY - SEP_PAD_W / 2, MAG_BZ))
        .box(SEP_PAD_L, SEP_PAD_W, SEP_PAD_T, centered=False)
    )

    # Textured surface lines (5 ridges)
    for i in range(5):
        ridge = (
            cq.Workplane("XY")
            .transformed(offset=(pad_x + 2 + i * 6, CY - SEP_PAD_W / 2 + 2,
                                 MAG_BZ + SEP_PAD_T))
            .box(4, SEP_PAD_W - 4, 0.3, centered=False)
        )
        pad = pad.union(ridge)

    # Mount bracket underneath
    bracket = (
        cq.Workplane("XY")
        .transformed(offset=(pad_x - 2, CY - SEP_PAD_W / 2 - 2, MAG_BZ - 6))
        .box(SEP_PAD_L + 4, SEP_PAD_W + 4, 6, centered=False)
    )
    return pad.union(bracket)


# ──────────────────────────────────────────────────────────
#  Card stack in magazine
# ──────────────────────────────────────────────────────────

def _card_stack() -> cq.Workplane:
    """Stack of cards inside the magazine."""
    result = None
    for i in range(CARD_STACK_COUNT):
        card_z = MAG_BZ + SEP_PAD_T + 0.5 + i * (CARD_T + 0.2)
        card = (
            cq.Workplane("XY")
            .transformed(offset=(FEEDER_X - CARD_L / 2, CY - CARD_W / 2,
                                 card_z))
            .box(CARD_L, CARD_W, CARD_T, centered=False)
        )
        result = card if result is None else result.union(card)
    return result


# ──────────────────────────────────────────────────────────
#  Guide ramp (feeder → belt transition)
# ──────────────────────────────────────────────────────────

def _guide_ramp() -> cq.Workplane:
    """Ramp from magazine exit to belt."""
    ramp_x = MAG_X1
    return (
        cq.Workplane("XY")
        .transformed(offset=(ramp_x, MAG_IN_Y0, MAG_BZ - 1))
        .box(RAMP_LEN, MAG_IN_W, 1.5, centered=False)
    )


# ──────────────────────────────────────────────────────────
#  Motor M1 (feeder motor)
# ──────────────────────────────────────────────────────────

def _motor_m1() -> cq.Workplane:
    """NEMA-17 motor for the feeder, mounted on near side."""
    mx = FEED_CX - NEMA / 2
    my = MAG_IN_Y0 - MAG_WALL - NEMA_DEPTH - 5
    mz = FEED_CZ - NEMA / 2
    body = (
        cq.Workplane("XY")
        .transformed(offset=(mx, my, mz))
        .box(NEMA, NEMA_DEPTH, NEMA, centered=False)
    )
    shaft = (
        cq.Workplane("XZ")
        .transformed(offset=(FEED_CX, MAG_IN_Y0 - MAG_WALL - 3, FEED_CZ))
        .cylinder(15, NEMA_SHAFT_D / 2)
    )
    return body.union(shaft)


# ══════════════════════════════════════════════════════════
#  PUBLIC API
# ══════════════════════════════════════════════════════════

def make_feeder() -> cq.Workplane:
    """Complete card-feeder assembly."""
    feeder = _magazine_housing()
    feeder = feeder.union(_feed_roller())
    feeder = feeder.union(_separation_pad())
    feeder = feeder.union(_card_stack())
    feeder = feeder.union(_guide_ramp())
    return feeder


def make_feeder_motor() -> cq.Workplane:
    """M1 motor (separate for assembly colour)."""
    return _motor_m1()

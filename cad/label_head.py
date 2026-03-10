"""
Label head module — pillar frame, label roll, guide rollers,
peel plate with wedge tip, pressure roller, liner take-up spool,
ribbon paths, motor M3.
Matches the 3D simulation (סימולציה_3D_v2.html).
"""
import cadquery as cq
import math
from .parameters import (
    CONV_WIDTH, SIDE_T, FRAME_T,
    BELT_TOP_Z, BELT_T, CARD_T, CARD_W,
    CY, LH_X0, LH_X1, LH_CX,
    LH_FRAME_L, LH_FRAME_H, LH_BASE_Z,
    LABEL_ROLL_D, LABEL_ROLL_CORE, LABEL_ROLL_W,
    ROLL_X, ROLL_Z,
    PEEL_L, PEEL_T, PEEL_X, PEEL_Z,
    PRESS_D,
    G1_X, G1_Z, G2_X, G2_Z, G3_X, G3_Z, G4_X, G4_Z,
    TAKEUP_X, TAKEUP_Z,
    NEMA, NEMA_DEPTH, NEMA_SHAFT_D,
)


# ──────────────────────────────────────────────────────────
#  Pillars + top beams
# ──────────────────────────────────────────────────────────

def _pillars() -> cq.Workplane:
    """4 corner pillars + top beams matching simulation."""
    positions = [
        (LH_X0, 0),
        (LH_X0 + LH_FRAME_L - FRAME_T, 0),
        (LH_X0, CONV_WIDTH - SIDE_T),
        (LH_X0 + LH_FRAME_L - FRAME_T, CONV_WIDTH - SIDE_T),
    ]
    result = None
    for px, py in positions:
        post = (
            cq.Workplane("XY")
            .transformed(offset=(px, py, LH_BASE_Z))
            .box(FRAME_T, SIDE_T, LH_FRAME_H, centered=False)
        )
        result = post if result is None else result.union(post)

    top_z = LH_BASE_Z + LH_FRAME_H - FRAME_T

    # Top beams — across X at near and far sides
    for py in (0, CONV_WIDTH - SIDE_T):
        beam = (
            cq.Workplane("XY")
            .transformed(offset=(LH_X0, py, top_z))
            .box(LH_FRAME_L, SIDE_T, FRAME_T, centered=False)
        )
        result = result.union(beam)
    # Top beams — across Y at left and right pillars
    for px in (LH_X0, LH_X0 + LH_FRAME_L - FRAME_T):
        beam = (
            cq.Workplane("XY")
            .transformed(offset=(px, 0, top_z))
            .box(FRAME_T, CONV_WIDTH, FRAME_T, centered=False)
        )
        result = result.union(beam)
    return result


# ──────────────────────────────────────────────────────────
#  Label roll with concentric layers
# ──────────────────────────────────────────────────────────

def _label_roll() -> cq.Workplane:
    """Label roll as concentric ring layers (sticker/liner alternating)."""
    # Core tube
    outer = (
        cq.Workplane("XZ")
        .transformed(offset=(ROLL_X, CY, ROLL_Z))
        .cylinder(LABEL_ROLL_W, LABEL_ROLL_D / 2)
    )
    core = (
        cq.Workplane("XZ")
        .transformed(offset=(ROLL_X, CY, ROLL_Z))
        .cylinder(LABEL_ROLL_W + 2, LABEL_ROLL_CORE / 2)
    )
    roll = outer.cut(core)

    # Shaft through roll
    shaft = (
        cq.Workplane("XZ")
        .transformed(offset=(ROLL_X, CY, ROLL_Z))
        .cylinder(CONV_WIDTH + 6, 4)
    )

    # Flange discs on each side
    for y_off in [SIDE_T + 3, CONV_WIDTH - SIDE_T - 3]:
        flange = (
            cq.Workplane("XZ")
            .transformed(offset=(ROLL_X, y_off, ROLL_Z))
            .cylinder(1.5, (LABEL_ROLL_D + 6) / 2)
        )
        roll = roll.union(flange)

    return roll.union(shaft)


# ──────────────────────────────────────────────────────────
#  Guide rollers
# ──────────────────────────────────────────────────────────

def _guide_roller(cx: float, cz: float, dia: float = 12) -> cq.Workplane:
    roller = (
        cq.Workplane("XZ")
        .transformed(offset=(cx, CY, cz))
        .cylinder(LABEL_ROLL_W + 4, dia / 2)
    )
    shaft = (
        cq.Workplane("XZ")
        .transformed(offset=(cx, CY, cz))
        .cylinder(CONV_WIDTH - 2 * SIDE_T, 2.5)
    )
    return roller.union(shaft)


# ──────────────────────────────────────────────────────────
#  Peel plate with wedge tip
# ──────────────────────────────────────────────────────────

def _peel_plate() -> cq.Workplane:
    """Flat peel plate with sharp wedge tip (matches sim)."""
    plate_w = CONV_WIDTH - 2 * SIDE_T - 4
    plate = (
        cq.Workplane("XY")
        .transformed(offset=(PEEL_X, SIDE_T + 2, PEEL_Z))
        .box(PEEL_L, plate_w, PEEL_T, centered=False)
    )
    # Wedge tip — tapered thinner extension
    tip = (
        cq.Workplane("XY")
        .transformed(offset=(PEEL_X + PEEL_L, SIDE_T + 2, PEEL_Z))
        .box(13, plate_w, PEEL_T * 0.4, centered=False)
    )
    return plate.union(tip)


# ──────────────────────────────────────────────────────────
#  Press roller
# ──────────────────────────────────────────────────────────

def _press_roller() -> cq.Workplane:
    """Pressure roller just above peel plate for label application."""
    press_x = PEEL_X - 5
    press_z = PEEL_Z + CARD_T + 1 + PRESS_D / 2
    roller = (
        cq.Workplane("XZ")
        .transformed(offset=(press_x, CY, press_z))
        .cylinder(CONV_WIDTH - 2 * SIDE_T - 4, PRESS_D / 2)
    )
    return roller


# ──────────────────────────────────────────────────────────
#  Take-up spool
# ──────────────────────────────────────────────────────────

def _takeup_spool() -> cq.Workplane:
    spool = (
        cq.Workplane("XZ")
        .transformed(offset=(TAKEUP_X, CY, TAKEUP_Z))
        .cylinder(LABEL_ROLL_W, 20)
    )
    core = (
        cq.Workplane("XZ")
        .transformed(offset=(TAKEUP_X, CY, TAKEUP_Z))
        .cylinder(LABEL_ROLL_W + 2, 9)
    )
    spool = spool.cut(core)
    shaft = (
        cq.Workplane("XZ")
        .transformed(offset=(TAKEUP_X, CY, TAKEUP_Z))
        .cylinder(LABEL_ROLL_W + 4, 4)
    )
    return spool.union(shaft)


# ──────────────────────────────────────────────────────────
#  Label web ribbon paths
# ──────────────────────────────────────────────────────────

def _ribbon(x1, z1, x2, z2, width=LABEL_ROLL_W, t=0.5) -> cq.Workplane:
    """Flat ribbon from (x1,z1) to (x2,z2) centred at CY."""
    dx = x2 - x1
    dz = z2 - z1
    length = math.sqrt(dx * dx + dz * dz)
    angle = math.degrees(math.atan2(dz, dx))
    ribbon = (
        cq.Workplane("XY")
        .transformed(offset=((x1 + x2) / 2, CY, (z1 + z2) / 2),
                     rotate=(0, -angle, 0))
        .box(length, width, t, centered=True)
    )
    return ribbon


def _label_strips() -> cq.Workplane:
    """All label + liner ribbon paths (matches sim routing)."""
    peel_tip_x = PEEL_X + PEEL_L + 13

    # Label feed path: roll → G1 → G2 → peel plate
    strips = _ribbon(ROLL_X, ROLL_Z - LABEL_ROLL_D / 2, G1_X, G1_Z)
    strips = strips.union(_ribbon(G1_X, G1_Z, G2_X, G2_Z))
    strips = strips.union(_ribbon(G2_X, G2_Z, PEEL_X, PEEL_Z + 1.5))
    # Sticker on peel plate
    strips = strips.union(_ribbon(PEEL_X, PEEL_Z + 1.5, peel_tip_x, PEEL_Z + 1))
    # Liner return path: peel tip → G3 → G4 → takeup
    strips = strips.union(_ribbon(peel_tip_x, PEEL_Z + 1, G3_X, G3_Z))
    strips = strips.union(_ribbon(G3_X, G3_Z, G4_X, G4_Z))
    strips = strips.union(_ribbon(G4_X, G4_Z, TAKEUP_X, TAKEUP_Z - 20))
    return strips


# ──────────────────────────────────────────────────────────
#  Motor M3
# ──────────────────────────────────────────────────────────

def _motor_m3() -> cq.Workplane:
    mx = ROLL_X - NEMA / 2
    mz = ROLL_Z - NEMA / 2
    body = (
        cq.Workplane("XY")
        .transformed(offset=(mx, CONV_WIDTH + 10, mz))
        .box(NEMA, NEMA_DEPTH, NEMA, centered=False)
    )
    shaft = (
        cq.Workplane("XZ")
        .transformed(offset=(ROLL_X, CONV_WIDTH + 5, ROLL_Z))
        .cylinder(20, NEMA_SHAFT_D / 2)
    )
    return body.union(shaft)


# ══════════════════════════════════════════════════════════
#  PUBLIC API
# ══════════════════════════════════════════════════════════

def make_label_head() -> cq.Workplane:
    """Complete label-head assembly."""
    lh = _pillars()
    lh = lh.union(_label_roll())
    lh = lh.union(_guide_roller(G1_X, G1_Z))
    lh = lh.union(_guide_roller(G2_X, G2_Z))
    lh = lh.union(_guide_roller(G3_X, G3_Z))
    lh = lh.union(_guide_roller(G4_X, G4_Z))
    lh = lh.union(_peel_plate())
    lh = lh.union(_press_roller())
    lh = lh.union(_takeup_spool())
    lh = lh.union(_label_strips())
    return lh


def make_label_motor() -> cq.Workplane:
    """M3 motor."""
    return _motor_m3()

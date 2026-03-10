"""
Full machine assembly — combines all modules, adds sloped exit ramp,
builds CadQuery Assembly with simulation-matching colours,
and provides export functions (STEP, STL, glTF).

Run:  python -m cad.machine
"""
import cadquery as cq
import math
import os
import sys

try:
    from .parameters import *
    from .frame import make_frame
    from .feeder import make_feeder, make_feeder_motor
    from .conveyor import make_conveyor, make_conveyor_motor
    from .label_head import make_label_head, make_label_motor
except ImportError:
    from parameters import *
    from frame import make_frame
    from feeder import make_feeder, make_feeder_motor
    from conveyor import make_conveyor, make_conveyor_motor
    from label_head import make_label_head, make_label_motor


# ──────────────────────────────────────────────────────────
#  Sloped exit ramp (matches sim: big 20mm drop over 60mm)
# ──────────────────────────────────────────────────────────

def _exit_ramp() -> cq.Workplane:
    """Sloped exit ramp — approximated as a wedge shape."""
    # Use a simple box at the midpoint of the slope
    mid_z = BELT_TOP_Z - EXIT_DROP / 2
    ramp = (
        cq.Workplane("XY")
        .transformed(offset=(EXIT_X0, 0, mid_z))
        .box(EXIT_LEN, CONV_WIDTH, 2, centered=False)
    )
    # End wall stop
    end_wall = (
        cq.Workplane("XY")
        .transformed(offset=(EXIT_X0 + EXIT_LEN, 0,
                             BELT_TOP_Z - EXIT_DROP))
        .box(FRAME_T, CONV_WIDTH, 15, centered=False)
    )
    return ramp.union(end_wall)


# ──────────────────────────────────────────────────────────
#  Sample credit card
# ──────────────────────────────────────────────────────────

def _credit_card(x: float) -> cq.Workplane:
    """Credit card at position x on the belt."""
    card_z = BELT_TOP_Z + BELT_T + 0.2
    return (
        cq.Workplane("XY")
        .transformed(offset=(x - CARD_L / 2, CY - CARD_W / 2, card_z))
        .box(CARD_L, CARD_W, CARD_T, centered=False)
    )


# ══════════════════════════════════════════════════════════
#  ASSEMBLY (colours match simulation)
# ══════════════════════════════════════════════════════════

def build_assembly() -> cq.Assembly:
    assy = cq.Assembly(name="StickerMachine")

    # Frame (dark grey — 0x333333)
    assy.add(make_frame(), name="frame",
             color=cq.Color(0.20, 0.20, 0.20, 1.0))

    # Conveyor (green belt — 0x228B22 + blue rollers — 0x4169E1 merged)
    assy.add(make_conveyor(), name="conveyor",
             color=cq.Color(0.13, 0.55, 0.13, 1.0))

    # Feeder (brown rubber — 0xD2691E / grey housing)
    assy.add(make_feeder(), name="feeder",
             color=cq.Color(0.55, 0.27, 0.08, 1.0))

    # Label head (red/pink — 0xe94560)
    assy.add(make_label_head(), name="label_head",
             color=cq.Color(0.91, 0.27, 0.37, 1.0))

    # Motors (grey — 0x555555)
    assy.add(make_feeder_motor(), name="motor_M1",
             color=cq.Color(0.33, 0.33, 0.33, 1.0))
    assy.add(make_conveyor_motor(), name="motor_M2",
             color=cq.Color(0.33, 0.33, 0.33, 1.0))
    assy.add(make_label_motor(), name="motor_M3",
             color=cq.Color(0.33, 0.33, 0.33, 1.0))

    # Exit ramp (green — 0x2ecc71)
    assy.add(_exit_ramp(), name="exit_ramp",
             color=cq.Color(0.18, 0.80, 0.44, 0.6))

    # Sample card at label station (cyan — 0x4ecdc4)
    assy.add(_credit_card(S2_X), name="card_sample",
             color=cq.Color(0.30, 0.80, 0.77, 0.8))

    return assy


# ══════════════════════════════════════════════════════════
#  MOTION PREVIEW
# ══════════════════════════════════════════════════════════

def motion_preview_card_positions():
    steps = [
        ("in_magazine",     FEEDER_X),
        ("feed_exit",       MAG_X1 + 10),
        ("belt_entry",      IDLER_X + 20),
        ("at_S1",           S1_X),
        ("travelling",      (IDLER_X + DRIVE_X) / 2),
        ("at_label_stop",   S2_X),
        ("exiting",         DRIVE_X + 10),
        ("on_exit_ramp",    EXIT_X0 + EXIT_LEN / 2),
    ]
    return steps


# ══════════════════════════════════════════════════════════
#  CLEARANCE CHECK
# ══════════════════════════════════════════════════════════

def check_clearances():
    results = []

    # Belt width vs card width (card may overhang by ~1mm each side — OK)
    ok = BELT_W >= CARD_W - 4
    results.append((
        "belt_width",
        ok,
        f"Belt {BELT_W} mm vs card {CARD_W} mm (overhang {(CARD_W-BELT_W)/2:.1f}mm/side)"
    ))

    # Magazine inner dimensions vs card
    ok_l = MAG_IN_L >= CARD_L + 1
    ok_w = MAG_IN_W >= CARD_W + 1
    results.append((
        "magazine_fit",
        ok_l and ok_w,
        f"Mag {MAG_IN_L:.1f}x{MAG_IN_W:.1f} vs card {CARD_L}x{CARD_W}"
    ))

    # Label roll bottom clearance above belt
    lbl_bottom = ROLL_Z - LABEL_ROLL_D / 2
    card_top = BELT_TOP_Z + BELT_T + CARD_T
    gap = lbl_bottom - card_top
    ok = gap > 15
    results.append((
        "label_roll_clearance",
        ok,
        f"Roll bottom Z={lbl_bottom:.1f}, card top Z={card_top:.1f}, gap={gap:.1f} mm"
    ))

    return results


# ══════════════════════════════════════════════════════════
#  EXPORT
# ══════════════════════════════════════════════════════════

def export_step(assy, path="sticker_machine.step"):
    assy.save(path)
    print(f"  ✓ STEP → {path}")

def export_stl(assy, path="sticker_machine.stl"):
    compound = assy.toCompound()
    cq.exporters.export(compound, path)
    print(f"  ✓ STL  → {path}")

def export_gltf(assy, path="sticker_machine.glb"):
    try:
        assy.save(path, exportType="GLTF")
        print(f"  ✓ glTF → {path}")
    except Exception as e:
        fallback = path.replace(".glb", ".step")
        print(f"  ⚠ glTF failed ({e}), saving STEP instead.")
        assy.save(fallback)
        print(f"  ✓ STEP → {fallback}")


# ══════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════

def main():
    print("╔══════════════════════════════════════════════════╗")
    print("║  Credit Card Sticker Applicator — CadQuery Build ║")
    print("╚══════════════════════════════════════════════════╝")

    print("\n── Clearance checks ──")
    for name, ok, msg in check_clearances():
        status = "✓" if ok else "✗"
        print(f"  {status} {name}: {msg}")

    print("\n── Building assembly ──")
    assy = build_assembly()
    print(f"  Assembly built: {len(assy.objects)} parts")

    out_dir = os.path.join(os.path.dirname(__file__), "..", "exports")
    os.makedirs(out_dir, exist_ok=True)

    print("\n── Exporting ──")
    export_step(assy, os.path.join(out_dir, "sticker_machine.step"))
    export_stl(assy, os.path.join(out_dir, "sticker_machine.stl"))
    export_gltf(assy, os.path.join(out_dir, "sticker_machine.glb"))

    print("\n── Motion preview positions ──")
    for name, x in motion_preview_card_positions():
        print(f"  {name:20s}  X = {x:7.1f} mm")

    print("\nDone.")


if __name__ == "__main__":
    main()

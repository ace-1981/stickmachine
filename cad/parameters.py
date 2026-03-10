"""
Shared parameters for the credit card sticker applicator machine.
All dimensions in millimeters.
Matches the 3D simulation (סימולציה_3D_v2.html).
"""

# ── Credit card ───────────────────────────────────────────
CARD_L = 85.6       # length (mm)
CARD_W = 54.0       # width (mm)
CARD_T = 0.8        # thickness (mm) — matches simulation

# ── Main conveyor ─────────────────────────────────────────
CONV_LENGTH   = 400   # total conveyor frame length
CONV_WIDTH    = 60     # frame width (matches sim)
BELT_W        = 52     # belt width (matches sim)
BELT_T        = 1.5    # belt thickness
ROLLER_D      = 30     # drive & idler roller diameter (matches sim)
ROLLER_GAP    = 2      # roller inset from frame end (matches sim)
FRAME_T       = 4      # base plate thickness
FRAME_H       = 50     # side wall height
SIDE_T        = 3      # side wall thickness
LEG_H         = 0      # no separate legs in sim — frame sits on table
LEG_W         = 8      # leg square size (for foot pads)

# ── Card feeder magazine ──────────────────────────────────
MAG_H         = 80     # magazine height
MAG_WALL      = 3      # wall thickness
MAG_IN_L      = CARD_L + 2   # inner length  (card + 2mm play)
MAG_IN_W      = CARD_W + 2   # inner width   (card + 2mm play)

FEED_D        = 20     # feed roller diameter (matches sim)
FEED_W        = 40     # feed roller width
SEP_PAD_L     = 30     # separation pad length (matches sim)
SEP_PAD_W     = 40     # separation pad width
SEP_PAD_T     = 3      # separation pad thickness
EXIT_SLOT_H   = 2.0    # exit slot height (~1 card)

# ── Label head ────────────────────────────────────────────
LH_FRAME_L      = 140    # label head frame length along X (matches sim)
LH_FRAME_H      = 170    # label head height above belt (matches sim)
LABEL_ROLL_D    = 100    # label roll outer diameter (matches sim)
LABEL_ROLL_CORE = 40     # core tube ID (matches sim)
LABEL_ROLL_W    = 56     # roll width
PEEL_L          = 35     # peel plate length (matches sim)
PEEL_T          = 2.5    # peel plate thickness
PRESS_D         = 20     # pressure / tamp roller diameter (matches sim)
STICKER_SIZE    = 28     # sticker size on strip

# ── Motors (NEMA-17) ──────────────────────────────────────
NEMA           = 42.3   # face width
NEMA_DEPTH     = 47     # body depth
NEMA_SHAFT_D   = 5      # shaft diameter
NEMA_SHAFT_L   = 24     # shaft protrusion
NEMA_BOSS_D    = 22     # pilot boss diameter
NEMA_BOSS_L    = 2
NEMA_HOLE_SPACING = 31  # mounting hole c-to-c
NEMA_HOLE_D    = 3      # M3

# ── Sensors ───────────────────────────────────────────────
SENSOR_D       = 3      # sensor barrel diameter (matches sim)
SENSOR_L       = 12     # sensor body length

# ── Exit / output ─────────────────────────────────────────
EXIT_LEN       = 60     # exit ramp length (matches sim)
EXIT_DROP      = 20     # ramp drop (matches sim — big slope)
OUT_CONV_LEN   = 200    # output conveyor length
OUT_CONV_W     = 80     # output conveyor width

# ── Feeder position ──────────────────────────────────────
FEEDER_X       = 30     # feeder centre X (matches sim)

# ── Derived geometry ──────────────────────────────────────
CY = CONV_WIDTH / 2                              # Y centreline

MAG_OUTER_L = MAG_IN_L + 2 * MAG_WALL
MAG_OUTER_W = MAG_IN_W + 2 * MAG_WALL
# Magazine centred at FEEDER_X
MAG_X0 = FEEDER_X - MAG_IN_L / 2 - MAG_WALL
MAG_X1 = MAG_X0 + MAG_OUTER_L

ROLLER_CZ = FRAME_H + ROLLER_D / 2               # roller centre Z
BELT_TOP_Z = ROLLER_CZ + ROLLER_D / 2             # top of belt
BELT_BOT_Z = ROLLER_CZ - ROLLER_D / 2             # bottom of belt (return run)
MAG_BZ     = BELT_TOP_Z + BELT_T                  # magazine floor Z

IDLER_X = ROLLER_D / 2 + ROLLER_GAP               # idler roller centre X (matches sim)
DRIVE_X = CONV_LENGTH - ROLLER_D / 2 - ROLLER_GAP # drive roller centre X

MAG_IN_X0 = MAG_X0 + MAG_WALL
MAG_IN_Y0 = CY - MAG_IN_W / 2

# Feed roller position — centred in magazine, shifted right
FEED_CX   = FEEDER_X + MAG_IN_L / 2 - 5
FEED_CZ   = MAG_BZ - CARD_T                      # top of roller at magazine base

# Ramp from feeder to belt
RAMP_LEN  = 20

# Sensor X positions (matches sim layout)
S1_X = MAG_X0 + MAG_OUTER_L + MAG_WALL + RAMP_LEN + 10
LABEL_X_OFFSET = 200                               # label head X origin (matches sim)
S2_X = LABEL_X_OFFSET - 10
S3_X = LABEL_X_OFFSET + 80

# Label head geometry
LH_X0 = LABEL_X_OFFSET
LH_X1 = LABEL_X_OFFSET + LH_FRAME_L
LH_CX = LH_X0 + LH_FRAME_L / 2
LH_BASE_Z = BELT_TOP_Z + BELT_T

# Roll position (matches sim: rollZ = lhBaseZ + lhH - 60)
ROLL_X = LH_CX
ROLL_Z = LH_BASE_Z + LH_FRAME_H - 60

# Peel plate position
PEEL_X = LH_CX + 10
PEEL_Z = LH_BASE_Z + 5

# Guide roller positions (match sim)
G1_X = ROLL_X + 8;   G1_Z = ROLL_Z - LABEL_ROLL_D / 2 - 10
G2_X = ROLL_X - 15;  G2_Z = LH_BASE_Z + 12
G3_X = LH_X1 - 12;   G3_Z = LH_BASE_Z + 30
G4_X = LH_X1 - 8;    G4_Z = ROLL_Z - 25

# Take-up spool
TAKEUP_X = G4_X + 5;  TAKEUP_Z = G4_Z + 8

# Hard stop
HARD_STOP_X = PEEL_X + PEEL_L + 12

# Guide Y positions
GUIDE_Y0 = CY - CARD_W / 2 - 2
GUIDE_Y1 = CY + CARD_W / 2 + 2

# Exit
EXIT_X0 = CONV_LENGTH

# Number of cards in magazine stack
CARD_STACK_COUNT = 12

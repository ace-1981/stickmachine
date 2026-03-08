// ============================================================
//  מכונת הדבקת מדבקות V2 — עיצוב מודולרי פשוט
//  Sticker Labeling Machine V2 — Simple Modular Design
// ============================================================
//
//  עקרון: מסוע ראשי אחד שעובר לכל אורך המכונה.
//  הכרטיסים יורדים מהמחסנית ישירות על המסוע ונעים קדימה.
//  בדרך עוברים מתחת לראש ההדבקה ויוצאים בקצה.
//
//  מודולים:
//  A — מסוע ראשי (Main Conveyor) — הבסיס של כל המכונה
//  B — מחסנית כרטיסים (Card Magazine) — יושבת מעל המסוע
//  C — ראש הדבקה (Label Head) — יושב מעל המסוע  
//  D — מגש יציאה (Exit Tray) — בקצה המסוע
//
//  צבעים:
//  שחור  — חלקי מכונה (מודפסים)
//  ירוק  — רצועות (מסוע + GT2)
//  כחול  — גלגלים ורולרים
//  אפור  — חלקי תמיכה ומסגרת
// ============================================================

$fn = 80;

// =============================================
//  פרמטרים
// =============================================

// כרטיס
card_l = 85.6;
card_w = 54.0;
card_t = 0.8;

// מסוע ראשי
conv_length    = 400;       // אורך כולל מסוע
conv_width     = 60;        // רוחב מסגרת מסוע
belt_w         = 52;        // רוחב רצועה (מעט צרה מכרטיס)
belt_t         = 1.5;       // עובי רצועה
roller_d       = 30;        // קוטר רולרים (drive + idler)
roller_gap     = 2;         // רווח רולר מקצה מסגרת
frame_t        = 4;         // עובי מסגרת
frame_h        = 50;        // גובה צד מסגרת (מתחת לרצועה)
side_t         = 3;         // עובי דופן צד

// מחסנית
mag_h          = 80;        // גובה מחסנית
mag_wall       = 3;         // עובי דפנות מחסנית
mag_x_offset   = 40;        // מיקום מחסנית על המסוע (מהתחלה)

// ראש הדבקה
label_roll_d   = 100;       // קוטר גליל מדבקות (מלא)
label_roll_core = 40;       // קוטר ליבה
label_strip_w  = 56;        // רוחב רצועת מדבקות
label_x_offset = 200;       // מיקום ראש הדבקה על המסוע
peel_angle     = 160;       // זווית peel (מעלות)
press_roller_d = 20;        // קוטר רולר לחץ

// מנועים
nema17         = 42.3;      // רוחב NEMA17
nema17_shaft   = 5;         // קוטר ציר NEMA17
nema17_boss    = 22;        // קוטר boss NEMA17
nema17_holes   = 31;        // מרחק חורי NEMA17
nema17_depth   = 47;        // עומק NEMA17

// חיישנים
sensor_d       = 3;         // קוטר פייבר

// יציאה
exit_length    = 60;
exit_drop      = 20;

// =============================================
//  חישובים
// =============================================

belt_top_z     = frame_h + roller_d/2;           // גובה משטח עליון רצועה
belt_bottom_z  = frame_h + roller_d/2 - roller_d; // גובה חלק תחתון רצועה — return
idler_x        = roller_d/2 + roller_gap;         // מרכז רולר idler
drive_x        = conv_length - roller_d/2 - roller_gap; // מרכז רולר drive
roller_cx      = frame_h + roller_d/2;            // גובה מרכז רולרים

// =============================================
//  הרכבה ראשית
// =============================================

assembly();

module assembly() {
    
    // === A: מסוע ראשי ===
    module_A_conveyor();
    
    // === B: מחסנית כרטיסים (מעל המסוע) ===
    translate([mag_x_offset, 0, belt_top_z + belt_t])
        module_B_magazine();
    
    // === C: ראש הדבקה (מעל המסוע) ===
    translate([label_x_offset, 0, belt_top_z + belt_t])
        module_C_label_head();
    
    // === D: מגש יציאה ===
    translate([conv_length, 0, belt_top_z])
        module_D_exit();
    
    // === כרטיס לדוגמה (על המסוע) ===
    color("White", 0.5)
        translate([mag_x_offset + card_l + 20, (conv_width - card_w)/2, belt_top_z + belt_t])
            cube([card_l, card_w, card_t]);
    
    // === מנוע מסוע (M1) — מתחת לרולר drive ===
    translate([drive_x, conv_width + 15, roller_cx])
        motor_assembly("M1 CONV");
    
    // === חיישנים ===
    // חיישן 1 — אחרי המחסנית (כרטיס הגיע למסוע)
    sensor_fiber(mag_x_offset + card_l + 5, "S1");
    // חיישן 2 — לפני ראש הדבקה (כרטיס מגיע)
    sensor_fiber(label_x_offset - 10, "S2");
    // חיישן 3 — אחרי ראש הדבקה (כרטיס יצא)
    sensor_fiber(label_x_offset + 80, "S3");
}


// ============================================================
//  מודול A — מסוע ראשי (Main Conveyor)
//  הבסיס של כל המכונה. רצועה שטוחה על 2 רולרים.
// ============================================================

module module_A_conveyor() {
    
    // --- מסגרת צד שמאל ---
    color("DimGray", 0.9)
        conveyor_side_frame(0);
    
    // --- מסגרת צד ימין ---
    color("DimGray", 0.9)
        conveyor_side_frame(conv_width - side_t);
    
    // --- רגליים / תמיכה תחתית ---
    color("DimGray", 0.7) {
        // רגל קדמית שמאל
        translate([20, 0, 0])
            support_leg();
        // רגל קדמית ימין
        translate([20, conv_width - side_t, 0])
            support_leg();
        // רגל אחורית שמאל
        translate([conv_length - 40, 0, 0])
            support_leg();
        // רגל אחורית ימין
        translate([conv_length - 40, conv_width - side_t, 0])
            support_leg();
    }
    
    // --- קורות חיבור רוחביות (תחתון) ---
    color("DimGray", 0.6) {
        // קורה קדמית
        translate([30, side_t, frame_h * 0.3])
            cube([frame_t, conv_width - 2*side_t, frame_t]);
        // קורה אמצעית
        translate([conv_length/2 - frame_t/2, side_t, frame_h * 0.3])
            cube([frame_t, conv_width - 2*side_t, frame_t]);
        // קורה אחורית
        translate([conv_length - 40, side_t, frame_h * 0.3])
            cube([frame_t, conv_width - 2*side_t, frame_t]);
    }
    
    // --- רולר IDLER (כניסה) ---
    color("RoyalBlue", 0.9)
        translate([idler_x, side_t, roller_cx])
            rotate([-90, 0, 0])
                cylinder(d=roller_d, h=conv_width - 2*side_t);
    // ציר
    color("Silver")
        translate([idler_x, -5, roller_cx])
            rotate([-90, 0, 0])
                cylinder(d=8, h=conv_width + 10);
    
    // --- רולר DRIVE (יציאה) ---
    color("RoyalBlue", 0.9)
        translate([drive_x, side_t, roller_cx])
            rotate([-90, 0, 0])
                cylinder(d=roller_d, h=conv_width - 2*side_t);
    // ציר
    color("Silver")
        translate([drive_x, -5, roller_cx])
            rotate([-90, 0, 0])
                cylinder(d=8, h=conv_width + 10);
    
    // --- חריצי מתיחה לרולר idler ---
    // (חריצים אובליים במסגרת לכוונון מתח רצועה)
    
    // --- רצועת מסוע (ירוק) ---
    color("ForestGreen", 0.75)
        conveyor_belt();
    
    // --- תוויות ---
    color("White")
        translate([idler_x, -8, roller_cx + roller_d/2 + 5])
            rotate([90, 0, 0])
                linear_extrude(0.5) text("IDLER", size=5, halign="center", font="Arial:style=Bold");
    color("White")
        translate([drive_x, -8, roller_cx + roller_d/2 + 5])
            rotate([90, 0, 0])
                linear_extrude(0.5) text("DRIVE", size=5, halign="center", font="Arial:style=Bold");
    
    // --- חץ כיוון תנועה ---
    color("White")
        translate([conv_length/2, -8, belt_top_z + belt_t + 8])
            rotate([90, 0, 0])
                linear_extrude(0.5) text("→→→  CARD FLOW  →→→", size=5, halign="center", font="Arial:style=Bold");
}

// מסגרת צד אחת
module conveyor_side_frame(y_pos) {
    translate([0, y_pos, 0]) {
        difference() {
            union() {
                // לוח צד ראשי
                cube([conv_length, side_t, frame_h + roller_d/2 + 5]);
            }
            
            // חריץ רולר idler (אובלי — לכוונון מתח)
            translate([idler_x, -1, roller_cx])
                rotate([-90, 0, 0])
                    hull() {
                        cylinder(d=roller_d + 4, h=side_t + 2);
                        translate([-8, 0, 0])
                            cylinder(d=roller_d + 4, h=side_t + 2);
                    }
            
            // חריץ רולר drive
            translate([drive_x, -1, roller_cx])
                rotate([-90, 0, 0])
                    cylinder(d=roller_d + 4, h=side_t + 2);
            
            // חורי חיבור M4 (למודולים שיושבים מעל)
            for (x = [60, 120, 180, 250, 330])
                translate([x, -1, frame_h + roller_d/2])
                    rotate([-90, 0, 0])
                        cylinder(d=4.4, h=side_t + 2);
        }
    }
}

// רגל תמיכה
module support_leg() {
    // רגל אנכית
    cube([side_t + 4, side_t, frame_h * 0.3]);
    // רגל רחבה למטה
    cube([side_t + 10, side_t, frame_t]);
}

// רצועת מסוע — רנדור ויזואלי
module conveyor_belt() {
    bw = belt_w;
    y0 = (conv_width - bw) / 2;
    r  = roller_d / 2;
    ix = idler_x;
    dx = drive_x;
    cz = roller_cx;
    
    // חלק עליון (כרטיסים נעים כאן)
    translate([ix, y0, cz + r])
        cube([dx - ix, bw, belt_t]);
    
    // חלק תחתון (return)
    translate([ix, y0, cz - r - belt_t])
        cube([dx - ix, bw, belt_t]);
    
    // עיגול סביב רולר idler
    translate([ix, y0, cz])
        rotate([-90, 0, 0])
            difference() {
                cylinder(r=r + belt_t, h=bw);
                translate([0, 0, -1])
                    cylinder(r=r, h=bw + 2);
                // חתוך חצי ימני
                translate([0, -r - belt_t - 1, -1])
                    cube([r + belt_t + 1, (r + belt_t) * 2 + 2, bw + 2]);
            }
    
    // עיגול סביב רולר drive
    translate([dx, y0, cz])
        rotate([-90, 0, 0])
            difference() {
                cylinder(r=r + belt_t, h=bw);
                translate([0, 0, -1])
                    cylinder(r=r, h=bw + 2);
                // חתוך חצי שמאלי
                translate([-r - belt_t - 1, -r - belt_t - 1, -1])
                    cube([r + belt_t + 1, (r + belt_t) * 2 + 2, bw + 2]);
            }
    
    // חצים על הרצועה (כיוון תנועה)
    num_arrows = 5;
    arrow_spacing = (dx - ix) / (num_arrows + 1);
    for (i = [1 : num_arrows]) {
        ax = ix + i * arrow_spacing;
        color("DarkGreen")
            translate([ax, y0 + bw/2, cz + r + belt_t + 0.1])
                linear_extrude(0.3)
                    text("▶", size=8, halign="center", valign="center");
    }
}


// ============================================================
//  מודול B — מחסנית כרטיסים (Card Magazine)
//  יושבת מעל המסוע. כרטיסים נופלים ישירות על הרצועה.
//  גלגל פידר (feed wheel) דוחף את הכרטיס התחתון.
// ============================================================

module module_B_magazine() {
    mw = card_w + 2 * mag_wall + 2;  // רוחב חוץ מחסנית
    ml = card_l + 2 * mag_wall + 2;  // אורך חוץ מחסנית
    
    // מרכוז על המסוע
    y_off = (conv_width - mw) / 2;
    
    translate([0, y_off, 0]) {
        
        // --- דפנות מחסנית (שחור) ---
        color("Black", 0.85) {
            difference() {
                union() {
                    // קיר אחורי
                    cube([mag_wall, mw, mag_h]);
                    // קיר קדמי (נמוך — חריץ יציאה לכרטיס)
                    translate([ml - mag_wall, 0, card_t + 3])
                        cube([mag_wall, mw, mag_h - card_t - 3]);
                    // קיר שמאל
                    cube([ml, mag_wall, mag_h]);
                    // קיר ימין
                    translate([0, mw - mag_wall, 0])
                        cube([ml, mag_wall, mag_h]);
                    // תקרה חלקית (מונעת כרטיסים מלצאת למעלה)
                    translate([0, 0, mag_h - mag_wall])
                        cube([ml, mw, mag_wall]);
                }
                // חלון בתקרה (למילוי כרטיסים)
                translate([mag_wall + 5, mag_wall + 5, mag_h - mag_wall - 1])
                    cube([ml - 2*mag_wall - 10, mw - 2*mag_wall - 10, mag_wall + 2]);
                
                // חריץ יציאה קדמי (כרטיס יוצא כאן)
                translate([ml - mag_wall - 1, mag_wall, -1])
                    cube([mag_wall + 2, card_w + 2, card_t + 3 + 1]);
                
                // חור לגלגל פידר (מלמטה)
                translate([ml/2, mw/2, -1])
                    cylinder(d=22, h=5);
            }
        }
        
        // --- גלגל פידר (כחול, TPU) ---
        // גלגל גומי שמסתובב ודוחף את הכרטיס התחתון החוצה
        color("RoyalBlue", 0.9)
            translate([ml/2, mw/2, -1])
                feed_wheel();
        
        // --- ערמת כרטיסים (שקוף) ---
        color("Cyan", 0.15)
            translate([mag_wall + 1, mag_wall + 1, 1])
                cube([card_l, card_w, 30]);
        
        // --- מנוע פידר M2 (מתחת למחסנית) ---
        // ציר מנוע עולה דרך חור לגלגל
        color("Black", 0.7)
            translate([ml/2, -20, -nema17_depth/2])
                rotate([-90, 0, 0])
                    nema17_motor();
        color("White")
            translate([ml/2 - 15, -25, 10])
                rotate([90, 0, 0])
                    linear_extrude(0.5) text("M2 FEED", size=5, font="Arial:style=Bold");
        
        // --- תוויות ---
        color("White")
            translate([ml/2, mw + 3, mag_h/2])
                rotate([90, 0, 0])
                    linear_extrude(0.5)
                        text("MAGAZINE", size=6, halign="center", font="Arial:style=Bold");
        color("White")
            translate([ml + 3, mw/2, mag_h - 15])
                rotate([90, 0, 90])
                    linear_extrude(0.5)
                        text("50+ CARDS", size=5, halign="center");
    }
}

// גלגל פידר (TPU)
module feed_wheel() {
    fw_d = 20;
    fw_h = 12;
    
    difference() {
        union() {
            cylinder(d=fw_d, h=fw_h);
            // שיניים/חריצי גריפ
            for (a = [0 : 45 : 359])
                rotate([0, 0, a])
                    translate([fw_d/2 - 1, -1.5, 0])
                        cube([2, 3, fw_h]);
        }
        // חור ציר
        translate([0, 0, -1])
            cylinder(d=5.2, h=fw_h + 2);
    }
}


// ============================================================
//  מודול C — ראש הדבקה (Label Head)
//  יושב מעל המסוע. כרטיס עובר מתחת, מדבקה נדבקת עליו.
// ============================================================

module module_C_label_head() {
    
    // --- מסגרת ראש הדבקה (שחור) ---
    lh_w = conv_width;      // אותו רוחב כמו המסוע
    lh_l = 100;             // אורך מודול
    lh_h = 120;             // גובה (צריך מקום לגליל)
    
    // עמודי תמיכה (שחור)
    color("Black", 0.85) {
        // עמוד שמאל קדמי
        translate([0, 0, 0])
            cube([frame_t, side_t, lh_h]);
        // עמוד שמאל אחורי  
        translate([lh_l - frame_t, 0, 0])
            cube([frame_t, side_t, lh_h]);
        // עמוד ימין קדמי
        translate([0, lh_w - side_t, 0])
            cube([frame_t, side_t, lh_h]);
        // עמוד ימין אחורי
        translate([lh_l - frame_t, lh_w - side_t, 0])
            cube([frame_t, side_t, lh_h]);
        
        // קורה עליונה קדמית
        translate([0, 0, lh_h - frame_t])
            cube([frame_t, lh_w, frame_t]);
        // קורה עליונה אחורית
        translate([lh_l - frame_t, 0, lh_h - frame_t])
            cube([frame_t, lh_w, frame_t]);
        // קורה עליונה צדית שמאל
        translate([0, 0, lh_h - frame_t])
            cube([lh_l, side_t, frame_t]);
        // קורה עליונה צדית ימין
        translate([0, lh_w - side_t, lh_h - frame_t])
            cube([lh_l, side_t, frame_t]);
    }
    
    // --- גליל מדבקות (ורוד) ---
    roll_z = lh_h - 30;
    roll_x = lh_l / 2;
    roll_y = lh_w / 2;
    
    color("HotPink", 0.6)
        translate([roll_x, side_t + 2, roll_z])
            rotate([-90, 0, 0])
                difference() {
                    cylinder(d=label_roll_d, h=label_strip_w);
                    translate([0, 0, -1])
                        cylinder(d=label_roll_core, h=label_strip_w + 2);
                }
    color("White")
        translate([roll_x, -5, roll_z])
            rotate([90, 0, 0])
                linear_extrude(0.5) text("LABEL ROLL", size=4, halign="center", font="Arial:style=Bold");
    
    // ציר גליל
    color("Silver")
        translate([roll_x, -3, roll_z])
            rotate([-90, 0, 0])
                cylinder(d=8, h=lh_w + 6);
    
    // --- Peel Plate (צהוב — נקודת היפרדות מדבקה) ---
    peel_x = lh_l / 2 + 10;
    peel_z = 5;  // ממש מעל הכרטיס
    
    color("Gold", 0.8)
        translate([peel_x, side_t, peel_z])
            cube([40, lh_w - 2*side_t, 2]);
    color("Gold", 0.8)
        translate([peel_x + 40, side_t, peel_z])
            rotate([0, 30, 0])
                cube([15, lh_w - 2*side_t, 2]);
    color("White")
        translate([peel_x + 20, -5, peel_z + 5])
            rotate([90, 0, 0])
                linear_extrude(0.5) text("PEEL PLATE", size=3.5, halign="center");
    
    // --- רולר לחץ (כחול — לוחץ מדבקה על כרטיס) ---
    press_x = peel_x - 5;
    press_z = peel_z + card_t + 1;
    
    color("RoyalBlue", 0.85)
        translate([press_x, side_t + 2, press_z])
            rotate([-90, 0, 0])
                cylinder(d=press_roller_d, h=lh_w - 2*side_t - 4);
    color("White")
        translate([press_x, -5, press_z + press_roller_d/2 + 3])
            rotate([90, 0, 0])
                linear_extrude(0.5) text("PRESS ROLLER", size=3.5, halign="center");
    
    // --- נתיב רצועת מדבקות (ירוק) ---
    // מהגליל → למטה → סביב peel plate → חזרה למעלה → לסליל liner
    label_path_width = label_strip_w;
    lp_y = (lh_w - label_path_width) / 2;
    
    color("ForestGreen", 0.6) {
        // קטע אנכי — מגליל למטה
        translate([roll_x - 1, lp_y, peel_z + 2])
            cube([2, label_path_width, roll_z - peel_z - 2]);
        
        // קטע אופקי — מתחת ל-peel plate (מדבקה מופרדת כאן)
        translate([peel_x, lp_y, peel_z - 2])
            cube([roll_x - peel_x, label_path_width, 2]);
        
        // קטע עולה — liner חוזר למעלה לסליל
        translate([peel_x + 42, lp_y, peel_z])
            rotate([0, -60, 0])
                cube([2, label_path_width, 50]);
    }
    
    // --- סליל liner (חום) ---
    liner_x = peel_x + 60;
    liner_z = roll_z - 20;
    color("Peru", 0.7)
        translate([liner_x, lp_y, liner_z])
            rotate([-90, 0, 0])
                difference() {
                    cylinder(d=35, h=label_path_width);
                    translate([0, 0, -1])
                        cylinder(d=20, h=label_path_width + 2);
                }
    color("White")
        translate([liner_x, -5, liner_z])
            rotate([90, 0, 0])
                linear_extrude(0.5) text("LINER", size=3.5, halign="center");
    
    // --- מנוע גליל M3 ---
    color("Black", 0.7)
        translate([roll_x, lh_w + 10, roll_z])
            rotate([-90, 0, 0])
                nema17_motor();
    color("White")
        translate([roll_x - 15, lh_w + 15, roll_z + 20])
            rotate([90, 0, 0])
                linear_extrude(0.5) text("M3 LABEL", size=5, font="Arial:style=Bold");
    
    // --- תווית מודול ---
    color("White")
        translate([lh_l/2, -8, lh_h])
            rotate([90, 0, 0])
                linear_extrude(0.5)
                    text("MODULE C: LABEL HEAD", size=5, halign="center", font="Arial:style=Bold");
}


// ============================================================
//  מודול D — מגש יציאה (Exit Tray)
// ============================================================

module module_D_exit() {
    
    color("Black", 0.85) {
        // בסיס משופע
        difference() {
            hull() {
                cube([5, conv_width, frame_t]);
                translate([exit_length, 0, -exit_drop])
                    cube([5, conv_width, frame_t]);
            }
            // חריץ מרכזי (הקלה במשקל)
            translate([10, side_t + 5, -exit_drop])
                cube([exit_length - 15, conv_width - 2*side_t - 10, frame_t + exit_drop + 10]);
        }
        
        // דפנות צד
        hull() {
            translate([0, 0, 0])
                cube([5, side_t, 15]);
            translate([exit_length, 0, -exit_drop])
                cube([5, side_t, 10]);
        }
        hull() {
            translate([0, conv_width - side_t, 0])
                cube([5, side_t, 15]);
            translate([exit_length, conv_width - side_t, -exit_drop])
                cube([5, side_t, 10]);
        }
        
        // מעצור קדמי
        translate([exit_length, 0, -exit_drop])
            cube([frame_t, conv_width, 15]);
    }
    
    // תווית
    color("White")
        translate([exit_length/2, -8, 10])
            rotate([90, 0, 0])
                linear_extrude(0.5) text("EXIT TRAY", size=5, halign="center", font="Arial:style=Bold");
}


// ============================================================
//  מודול עזר — מנוע NEMA17
// ============================================================

module nema17_motor() {
    s = nema17;
    
    // גוף מנוע
    color("Black", 0.7)
        translate([-s/2, -s/2, 0])
            cube([s, s, nema17_depth]);
    
    // Boss קדמי
    color("DimGray")
        cylinder(d=nema17_boss, h=2);
    
    // ציר
    color("Silver")
        translate([0, 0, -12])
            cylinder(d=nema17_shaft, h=36);
    
    // ברגים (רק ויזואלי)
    for (dx = [-1, 1])
        for (dy = [-1, 1])
            color("DimGray")
                translate([dx * nema17_holes/2, dy * nema17_holes/2, 0])
                    cylinder(d=3, h=1);
}

// הרכבת מנוע עם תווית
module motor_assembly(label) {
    rotate([90, 0, 0])
        rotate([0, 0, 90])
            nema17_motor();
    color("White")
        translate([-20, 5, 25])
            rotate([90, 0, 0])
                linear_extrude(0.5) text(label, size=5, font="Arial:style=Bold");
}


// ============================================================
//  חיישן פייבר אופטי
// ============================================================

module sensor_fiber(x_pos, label) {
    sz = belt_top_z + belt_t + 15;
    
    // סוגר עליון (שחור)
    color("Black", 0.8) {
        translate([x_pos - 2, side_t, belt_top_z + belt_t])
            cube([4, conv_width - 2*side_t, 15]);
    }
    
    // פייבר אופטי (ירוק זוהר)
    color("Lime", 0.9) {
        // צד שמאל
        translate([x_pos, side_t + 5, belt_top_z + belt_t + 2])
            cylinder(d=sensor_d, h=12);
        // צד ימין
        translate([x_pos, conv_width - side_t - 5, belt_top_z + belt_t + 2])
            cylinder(d=sensor_d, h=12);
    }
    
    // תווית
    color("Lime")
        translate([x_pos, -8, sz + 5])
            rotate([90, 0, 0])
                linear_extrude(0.5) text(label, size=5, halign="center", font="Arial:style=Bold");
}


// ============================================================
//  מקרא (Legend)
// ============================================================

module legend() {
    lx = conv_length + exit_length + 60;
    lz = 0;
    
    color("White", 0.1)
        translate([lx - 5, -5, lz - 5])
            cube([110, 2, 180]);
    
    color("White") translate([lx, 0, lz + 165])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("LEGEND", size=8, font="Arial:style=Bold");
    
    color("Black") translate([lx, 0, lz + 148])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("■ Machine Parts (3D Print)", size=5);
    
    color("ForestGreen") translate([lx, 0, lz + 134])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("■ Belts (Conveyor + Label)", size=5);
    
    color("RoyalBlue") translate([lx, 0, lz + 120])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("■ Rollers & Wheels", size=5);
   
    color("DimGray") translate([lx, 0, lz + 106])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("■ Frame & Support", size=5);
    
    color("Silver") translate([lx, 0, lz + 92])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("■ Shafts & Hardware", size=5);
    
    color("HotPink") translate([lx, 0, lz + 78])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("■ Label Roll", size=5);
    
    color("Gold") translate([lx, 0, lz + 64])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("■ Peel Plate", size=5);
    
    color("Lime") translate([lx, 0, lz + 50])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("■ Fiber Optic Sensors", size=5);
    
    color("Cyan") translate([lx, 0, lz + 36])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("■ Credit Card", size=5);
    
    color("White") translate([lx, 0, lz + 18])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("MODULES:", size=5, font="Arial:style=Bold");
    color("White") translate([lx, 0, lz + 6])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("A:Conveyor  B:Magazine", size=4);
    color("White") translate([lx, 0, lz - 6])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("C:Label Head  D:Exit", size=4);
}

// הוספת legend לassembly
legend();

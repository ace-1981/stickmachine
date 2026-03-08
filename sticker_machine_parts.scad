// ============================================================
//  מכונת הדבקת מדבקות — חלקים להדפסה תלת-ממדית
//  Sticker Labeling Machine — 3D Printable Parts
// ============================================================
//  
//  OpenSCAD Parametric Design
//  חומר: PETG (גוף) + TPU (חלקי גומי)
//  מדפסת: 220×220mm bed (Ender 3 / Prusa Mini+)
//
//  הוראות:
//  1. פתח קובץ זה ב-OpenSCAD
//  2. שנה את part_number למספר החלק הרצוי (1-15)
//  3. לחץ F6 (Render) ואז F7 (Export STL)
//
//  או: השתמש ב-Customizer (Window → Customizer)
//
// ============================================================

// =============================================
//  בחירת חלק להדפסה
// =============================================

/* [Part Selection] */
// Which part to render (0 = ALL PARTS, 1-15 = single part)
part_number = 0; // [0:All Parts, 1:Feeder Base, 2:Magazine Walls, 3:Feed Wheel (TPU), 4:Rail Base Left, 5:Rail Base Right, 6:Rail Side Guide, 7:Roller Housing, 8:Label Head Frame, 9:Roll Holder Spindle, 10:Peel Plate, 11:Pressure Roller Arm, 12:Liner Takeup Spool, 13:Exit Tray, 14:Electronics Box Base, 15:Electronics Box Lid]

// Show assembly preview (slow!)
show_assembly = true;

// =============================================
//  פרמטרים כלליים — ניתן לשינוי!
// =============================================

/* [Card Dimensions] */
card_length = 85.6;    // mm
card_width  = 54.0;    // mm
card_thick  = 0.8;     // mm

/* [Machine Parameters] */
wall_thick      = 3.0;    // עובי דפנות
base_thick      = 4.0;    // עובי בסיס
clearance       = 0.5;    // סטייה / רווח
screw_m3_hole   = 3.4;    // חור לבורג M3
screw_m4_hole   = 4.4;    // חור לבורג M4
insert_m3_hole  = 4.6;    // חור ל-heat insert M3
insert_m4_hole  = 5.8;    // חור ל-heat insert M4
bearing_608_od  = 22.0;   // 608 bearing OD
bearing_608_id  = 8.0;    // 608 bearing ID
bearing_608_w   = 7.0;    // 608 bearing width
shaft_d         = 8.0;    // קוטר ציר

/* [Feeder Parameters] */
magazine_inner_w = card_width + 2;   // = 56mm
magazine_inner_l = card_length + 2;  // = 87.6mm (round to 88)
magazine_height  = 100;             // גובה מחסנית (50+ כרטיסים)
feed_wheel_d     = 20;              // קוטר גלגל פידר
feed_wheel_w     = 15;              // רוחב גלגל פידר

/* [Rail Parameters] */
rail_length    = 350;      // אורך מסילה (ארוך יותר — כולל מסוע)
rail_width     = card_width + 2*wall_thick + 2*clearance;  // ~63mm
rail_height    = 20;       // גובה דפנות מסילה
roller_d       = 28;       // קוטר רולר מסוע
roller_w       = 60;       // רוחב רולר (כולל bearings)
nema17_w       = 42.3;     // רוחב NEMA17
nema17_hole_sp = 31;       // מרחק חורי NEMA17

/* [Conveyor Belt] */
conv_belt_w    = 50;       // רוחב רצועת מסוע (מעט צרה מהכרטיס)
conv_roller_d  = 28;       // קוטר רולרי מסוע (drive + idler)
conv_belt_thick = 1.5;     // עובי רצועת PU/סיליקון

/* [Label Head Parameters] */
roll_max_d     = 200;      // קוטר מקסימלי גליל מדבקות
roll_core_d    = 76;       // קוטר ליבת גליל
roll_strip_w   = 56;       // רוחב רצועה
peel_plate_w   = 60;       // רוחב peel plate
peel_plate_l   = 40;       // אורך peel plate
peel_angle     = 30;       // זווית peel plate
pressure_roller_d = 28;    // קוטר רולר לחץ
liner_spool_d  = 50;       // קוטר סליל liner

/* [Exit Parameters] */
exit_length    = 80;       // אורך מודול יציאה
exit_angle     = 15;       // זווית מגש יציאה

/* [Electronics Box] */
ebox_l = 180;  // אורך קופסת אלקטרוניקה
ebox_w = 120;  // רוחב
ebox_h = 60;   // גובה

// =============================================
//  Render
// =============================================

$fn = 60;  // רזולוציית עיגולים

if (show_assembly) {
    assembly();
} else if (part_number == 0) {
    show_all_parts();
} else {
    render_part(part_number);
}

module render_part(n) {
    if (n == 1)  part_01_feeder_base();
    if (n == 2)  part_02_magazine_walls();
    if (n == 3)  part_03_feed_wheel();
    if (n == 4)  part_04_rail_base_left();
    if (n == 5)  part_05_rail_base_right();
    if (n == 6)  part_06_rail_side_guide();
    if (n == 7)  part_07_roller_housing();
    if (n == 8)  part_08_label_head_frame();
    if (n == 9)  part_09_roll_holder();
    if (n == 10) part_10_peel_plate();
    if (n == 11) part_11_pressure_arm();
    if (n == 12) part_12_liner_spool();
    if (n == 13) part_13_exit_tray();
    if (n == 14) part_14_ebox_base();
    if (n == 15) part_15_ebox_lid();
}

// ============================================================
//  הצגת כל החלקים על רשת
// ============================================================

module show_all_parts() {
    gap = 15;  // רווח בין חלקים
    
    // שורה 1: מודול פידר
    color("DodgerBlue", 0.8)   translate([0, 0, 0])     part_01_feeder_base();
    color("SteelBlue", 0.8)    translate([110, 0, 0])   part_02_magazine_walls();
    color("OrangeRed", 0.9)    translate([220, 25, 0])  part_03_feed_wheel();
    
    // שורה 2: מסילה + מכוונים
    color("LimeGreen", 0.7)    translate([0, -90, 0])   part_04_rail_base_left();
    color("LimeGreen", 0.7)    translate([150, -90, 0]) part_05_rail_base_right();
    color("Gold", 0.8)         translate([300, -70, 0]) part_06_rail_side_guide();
    
    // שורה 3: רולרים + ראש הדבקה
    color("MediumPurple", 0.8) translate([0, -180, 0])  part_07_roller_housing();
    color("Crimson", 0.7)      translate([80, -180, 0]) part_08_label_head_frame();
    color("Coral", 0.8)        translate([140, -160, 0]) part_09_roll_holder();
    
    // שורה 4: חלקי הדבקה
    color("Yellow", 0.8)       translate([0, -300, 0])  part_10_peel_plate();
    color("Salmon", 0.8)       translate([80, -300, 0]) part_11_pressure_arm();
    color("Peru", 0.8)         translate([170, -280, 0]) part_12_liner_spool();
    
    // שורה 5: יציאה + אלקטרוניקה
    color("MediumSeaGreen", 0.8) translate([0, -400, 0])  part_13_exit_tray();
    color("SlateGray", 0.7)    translate([120, -400, 0]) part_14_ebox_base();
    color("SlateGray", 0.5)    translate([320, -400, 0]) part_15_ebox_lid();
}

// ============================================================
//  חלק 1: בסיס פידר — Feeder Base
//  מכיל: חור לגלגל פידר, mount למנוע NEMA17
// ============================================================

module part_01_feeder_base() {
    fb_l = magazine_inner_l + 2*wall_thick;  // ~94mm
    fb_w = magazine_inner_w + 2*wall_thick;  // ~62mm
    fb_h = base_thick + nema17_w/2 + 10;     // ~35mm

    difference() {
        union() {
            // בסיס
            cube([fb_l, fb_w, base_thick]);
            
            // קיר אחורי (mount מנוע)
            translate([0, 0, 0])
                cube([wall_thick, fb_w, fb_h]);
            
            // קירות צד (תמיכה למחסנית)
            cube([fb_l, wall_thick, rail_height]);
            translate([0, fb_w - wall_thick, 0])
                cube([fb_l, wall_thick, rail_height]);
        }
        
        // חור לגלגל פידר (במרכז הבסיס)
        translate([fb_l/2, fb_w/2, -1])
            cylinder(d=feed_wheel_d + 4, h=base_thick + 2);
        
        // חור ציר מנוע NEMA17
        translate([-1, fb_w/2, base_thick + nema17_w/2])
            rotate([0, 90, 0])
                cylinder(d=22+1, h=wall_thick+2);
        
        // חורי NEMA17 (4 ברגים)
        for (dx = [-nema17_hole_sp/2, nema17_hole_sp/2])
            for (dz = [-nema17_hole_sp/2, nema17_hole_sp/2])
                translate([-1, fb_w/2 + dx, base_thick + nema17_w/2 + dz])
                    rotate([0, 90, 0])
                        cylinder(d=screw_m3_hole, h=wall_thick+2);
        
        // חורי חיבור למסילה (2 חורים בצד הקדמי)
        for (dy = [fb_w*0.25, fb_w*0.75])
            translate([fb_l - 10, dy, -1])
                cylinder(d=insert_m4_hole, h=base_thick+2);
        
        // חורי סיב אופטי S1 (2 חורים קטנים ⌀2mm — TX + RX)
        translate([fb_l*0.7, fb_w/2 - 2, -1])
            cylinder(d=2.2, h=base_thick+2);
        translate([fb_l*0.7, fb_w/2 + 2, -1])
            cylinder(d=2.2, h=base_thick+2);
    }
}

// ============================================================
//  חלק 2: דפנות מחסנית — Magazine Walls
//  ארבע דפנות המחזיקות ערמת כרטיסים
// ============================================================

module part_02_magazine_walls() {
    mw = wall_thick;
    ml = magazine_inner_l;
    mw2 = magazine_inner_w;
    mh = magazine_height;
    
    difference() {
        union() {
            // קיר שמאל
            cube([ml + 2*mw, mw, mh]);
            // קיר ימין
            translate([0, mw2 + mw, 0])
                cube([ml + 2*mw, mw, mh]);
            // קיר אחורי
            translate([0, 0, 0])
                cube([mw, mw2 + 2*mw, mh]);
            // קיר קדמי (נמוך — לראות כמה כרטיסים)
            translate([ml + mw, 0, 0])
                cube([mw, mw2 + 2*mw, mh * 0.5]);
            
            // לשוניות חיבור לבסיס (tabs)
            for (dy = [mw, mw2])
                translate([ml/2, dy, 0])
                    cylinder(d=8, h=5);
        }
        
        // חורי ברגים בלשוניות
        for (dy = [mw, mw2])
            translate([ml/2, dy, -1])
                cylinder(d=screw_m3_hole, h=7);
        
        // חריצי אצבע (להוציא כרטיסים)
        translate([mw + ml*0.3, -1, mh*0.4])
            cube([ml*0.4, mw+2, mh*0.6+1]);
        translate([mw + ml*0.3, mw2 + mw -1, mh*0.4])
            cube([ml*0.4, mw+2, mh*0.6+1]);
    }
}

// ============================================================
//  חלק 3: גלגל פידר — Feed Wheel (TPU!)
//  הדפסה ב-TPU לגריפ על כרטיסים
// ============================================================

module part_03_feed_wheel() {
    difference() {
        union() {
            // גוף הגלגל
            cylinder(d=feed_wheel_d, h=feed_wheel_w);
            // פלנגה עליונה
            cylinder(d=feed_wheel_d + 4, h=2);
            translate([0, 0, feed_wheel_w - 2])
                cylinder(d=feed_wheel_d + 4, h=2);
        }
        
        // חור ציר (D-shaft 5mm)
        translate([0, 0, -1])
            cylinder(d=5.2, h=feed_wheel_w + 2);
        // שטח D
        translate([1.8, -5, -1])
            cube([5, 10, feed_wheel_w + 2]);
        
        // חריצי גריפ (טקסטורה)
        for (a = [0:30:330])
            rotate([0, 0, a])
                translate([feed_wheel_d/2 - 0.5, -0.5, 2])
                    cube([1.5, 1, feed_wheel_w - 4]);
    }
}

// ============================================================
//  חלק 4: בסיס מסילה שמאל — Rail Base Left
//  מחצית שמאלית של המסילה
// ============================================================

module part_04_rail_base_left() {
    rl = rail_length / 2;  // 130mm (מתאים למדפסת 220mm)
    rw = rail_width;
    
    difference() {
        union() {
            // בסיס
            cube([rl, rw, base_thick]);
            
            // דפנות צד
            cube([rl, wall_thick, base_thick + rail_height]);
            translate([0, rw - wall_thick, 0])
                cube([rl, wall_thick, base_thick + rail_height]);
            
            // תמיכות רולר (2 גשרים)
            translate([15, 0, 0])
                roller_bridge(rw);
            translate([rl - 25, 0, 0])
                roller_bridge(rw);
        }
        
        // חור 608 bearing בכל גשר
        translate([15, rw/2, base_thick + rail_height/2 + 3])
            rotate([0, 0, 0])
                bearing_608_hole();
        translate([rl - 25, rw/2, base_thick + rail_height/2 + 3])
            bearing_608_hole();
        
        // חורי חיבור (מחבר שני חצאים)
        for (dy = [rw*0.25, rw*0.75])
            translate([rl - 5, dy, -1])
                cylinder(d=insert_m4_hole, h=base_thick+2);
        
        // חורי חיבור לפידר
        for (dy = [rw*0.25, rw*0.75])
            translate([5, dy, -1])
                cylinder(d=screw_m4_hole, h=base_thick+2);

        // חריץ כרטיס (שקע במסילה)
        translate([0, wall_thick + clearance, base_thick - card_thick])
            cube([rl+1, card_width + 2*clearance, card_thick + 1]);
    }
}

// ============================================================
//  חלק 5: בסיס מסילה ימין — Rail Base Right (mirror)
// ============================================================

module part_05_rail_base_right() {
    mirror([1, 0, 0])
        part_04_rail_base_left();
}

// ============================================================
//  חלק 6: מכוון צד — Rail Side Guide
//  שני מכוונים מתכווננים (אותו חלק ×2)
// ============================================================

module part_06_rail_side_guide() {
    sg_l = 40;
    sg_h = rail_height;
    
    difference() {
        union() {
            // גוף
            cube([sg_l, wall_thick + 5, sg_h]);
            // לשונית חיבור עם חריץ
            translate([0, 0, 0])
                cube([sg_l, 15, base_thick]);
        }
        
        // חריץ (slot) לכוונון
        translate([sg_l/2, 7, -1])
            hull() {
                cylinder(d=screw_m3_hole, h=base_thick+2);
                translate([0, 5, 0])
                    cylinder(d=screw_m3_hole, h=base_thick+2);
            }
    }
}

// ============================================================
//  חלק 7: בית רולר — Roller Housing
//  מחזיק 2× מיסב 608 + ציר ⌀8 (×2 נדרש)
// ============================================================

module part_07_roller_housing() {
    rh_w = roller_w + 2*wall_thick;  // ~66mm
    rh_h = roller_d/2 + bearing_608_od/2 + base_thick + 5;
    
    difference() {
        union() {
            // בסיס
            cube([30, rh_w, base_thick]);
            
            // עמודי bearing
            translate([15, wall_thick + bearing_608_w/2, 0])
                cylinder(d=bearing_608_od + 6, h=rh_h);
            translate([15, rh_w - wall_thick - bearing_608_w/2, 0])
                cylinder(d=bearing_608_od + 6, h=rh_h);
        }
        
        // חורי 608 bearing
        translate([15, wall_thick + bearing_608_w/2, rh_h - bearing_608_w])
            cylinder(d=bearing_608_od + 0.2, h=bearing_608_w + 1);
        translate([15, rh_w - wall_thick - bearing_608_w/2, rh_h - bearing_608_w])
            cylinder(d=bearing_608_od + 0.2, h=bearing_608_w + 1);
        
        // חור ציר דרך
        translate([15, -1, rh_h - bearing_608_w/2])
            rotate([-90, 0, 0])
                cylinder(d=shaft_d + 0.5, h=rh_w + 2);
        
        // חורי חיבור לבסיס
        for (dx = [5, 25])
            for (dy = [5, rh_w - 5])
                translate([dx, dy, -1])
                    cylinder(d=screw_m3_hole, h=base_thick+2);
    }
}

// ============================================================
//  חלק 8: מסגרת ראש הדבקה — Label Head Frame
//  מחזיק: גליל מדבקות, peel plate, רולר לחץ
// ============================================================

module part_08_label_head_frame() {
    lf_w = roll_strip_w + 2*wall_thick + 10;  // ~72mm
    lf_h = roll_max_d/2 + 50;                 // ~150mm
    lf_d = 30;  // עומק מסגרת (צד אחד)
    
    difference() {
        union() {
            // לוח צד (L-shape)
            // חלק אנכי
            cube([lf_d, wall_thick, lf_h]);
            // חלק אופקי (בסיס)
            cube([lf_d, 40, base_thick]);
            
            // Boss לציר גליל מדבקות
            translate([lf_d/2, wall_thick, lf_h * 0.65])
                rotate([-90, 0, 0])
                    cylinder(d=20, h=wall_thick);
            
            // Boss לציר רולר לחץ
            translate([lf_d - 8, wall_thick, base_thick + 15])
                rotate([-90, 0, 0])
                    cylinder(d=15, h=wall_thick);
            
            // Boss לציר liner take-up
            translate([8, wall_thick, lf_h * 0.35])
                rotate([-90, 0, 0])
                    cylinder(d=15, h=wall_thick);
        }
        
        // חור ציר גליל מדבקות (⌀8)
        translate([lf_d/2, -1, lf_h * 0.65])
            rotate([-90, 0, 0])
                cylinder(d=shaft_d + 0.5, h=wall_thick + 4);
        
        // חור ציר רולר לחץ (⌀8)
        translate([lf_d - 8, -1, base_thick + 15])
            rotate([-90, 0, 0])
                cylinder(d=shaft_d + 0.5, h=wall_thick + 4);
        
        // חור ציר liner (⌀8)
        translate([8, -1, lf_h * 0.35])
            rotate([-90, 0, 0])
                cylinder(d=shaft_d + 0.5, h=wall_thick + 4);
        
        // חורי חיבור בסיס
        for (dx = [8, lf_d - 8])
            translate([dx, 20, -1])
                cylinder(d=insert_m4_hole, h=base_thick+2);
    }
}

// ============================================================
//  חלק 9: ציר מחזיק גליל — Roll Holder Spindle
//  ציר שנכנס ללב הגליל (⌀76mm)
// ============================================================

module part_09_roll_holder() {
    // ציר עם פלנגה
    spindle_d = roll_core_d - 2;  // ~74mm
    spindle_h = roll_strip_w + 5;  // ~61mm
    
    difference() {
        union() {
            // פלנגה (מונע גליל מלהחליק)
            cylinder(d=spindle_d + 10, h=3);
            // ציר
            cylinder(d=spindle_d, h=spindle_h);
        }
        
        // חלול מבפנים (חסכון חומר + מקום לציר מתכת)
        translate([0, 0, -1])
            cylinder(d=spindle_d - 8, h=spindle_h + 2);
        
        // חור ציר מרכזי (⌀8)
        translate([0, 0, -1])
            cylinder(d=shaft_d + 0.5, h=spindle_h + 2);
        
        // חור לבורג נעילה
        translate([spindle_d/2 - 2, 0, spindle_h/2])
            rotate([0, 90, 0])
                cylinder(d=screw_m3_hole, h=10);
    }
}

// ============================================================
//  חלק 10: Peel Plate — לוח קילוף
//  לוח דק בזווית חדה שמקלף את המדבקה
// ============================================================

module part_10_peel_plate() {
    pp_w = peel_plate_w;
    pp_l = peel_plate_l;
    pp_thick = 1.5;  // דק!
    
    // Peel plate with sharp edge
    difference() {
        union() {
            // לוח ראשי
            cube([pp_l, pp_w, pp_thick]);
            
            // אוזני חיבור
            translate([-5, 3, 0])
                cube([5, 8, pp_thick + 3]);
            translate([-5, pp_w - 11, 0])
                cube([5, 8, pp_thick + 3]);
        }
        
        // קצה חד (chamfer)
        translate([pp_l, 0, pp_thick])
            rotate([0, -5, 0])
                cube([3, pp_w, 2]);
        
        // חורי חיבור
        translate([-2.5, 7, -1])
            cylinder(d=screw_m3_hole, h=pp_thick + 5);
        translate([-2.5, pp_w - 7, -1])
            cylinder(d=screw_m3_hole, h=pp_thick + 5);
    }
}

// ============================================================
//  חלק 11: זרוע רולר לחץ — Pressure Roller Arm
//  זרוע עם קפיץ שלוחצת את המדבקה על הכרטיס
// ============================================================

module part_11_pressure_arm() {
    arm_l = 50;
    arm_w = 15;
    arm_h = 8;
    
    difference() {
        union() {
            // זרוע
            cube([arm_l, arm_w, arm_h]);
            
            // עיגול ציר (בקצה אחד)
            translate([0, arm_w/2, arm_h/2])
                rotate([0, 90, 0])
                    cylinder(d=arm_w, h=arm_h);
            
            // בית bearing לרולר (בקצה השני)
            translate([arm_l, arm_w/2, arm_h/2])
                rotate([0, 90, 0])
                    cylinder(d=bearing_608_od + 6, h=bearing_608_w + 2);
        }
        
        // חור ציר (pivot)
        translate([-1, arm_w/2, arm_h/2])
            rotate([0, 90, 0])
                cylinder(d=shaft_d + 0.5, h=arm_h + 2);
        
        // חור 608 bearing
        translate([arm_l, arm_w/2, arm_h/2])
            rotate([0, 90, 0])
                cylinder(d=bearing_608_od + 0.2, h=bearing_608_w + 3);
        
        // חור לקפיץ
        translate([arm_l * 0.4, arm_w + 1, arm_h/2])
            rotate([90, 0, 0])
                cylinder(d=3, h=arm_w + 2);
    }
}

// ============================================================
//  חלק 12: סליל Liner — Liner Take-up Spool
//  סליל שאוסף את הנייר הנושא (liner) אחרי קילוף המדבקה
// ============================================================

module part_12_liner_spool() {
    sp_d = liner_spool_d;
    sp_w = roll_strip_w + 4;  // ~60mm
    flange_d = sp_d + 10;
    
    difference() {
        union() {
            // פלנגה תחתונה
            cylinder(d=flange_d, h=2);
            // ליבת סליל
            cylinder(d=sp_d, h=sp_w);
            // פלנגה עליונה
            translate([0, 0, sp_w - 2])
                cylinder(d=flange_d, h=2);
        }
        
        // חלול
        translate([0, 0, -1])
            cylinder(d=sp_d - 6, h=sp_w + 2);
        
        // חור ציר
        translate([0, 0, -1])
            cylinder(d=shaft_d + 0.5, h=sp_w + 2);
        
        // חריץ לתפיסת קצה הרצועה
        translate([sp_d/2 - 2, -1.5, 2])
            cube([5, 3, sp_w - 4]);
    }
}

// ============================================================
//  חלק 13: מגש יציאה — Exit Tray
// ============================================================

module part_13_exit_tray() {
    et_l = exit_length;
    et_w = card_width + 2*wall_thick + 2*clearance;
    
    difference() {
        union() {
            // בסיס משופע
            hull() {
                cube([et_l, et_w, base_thick]);
                translate([et_l, 0, -exit_angle*et_l/57.3])
                    cube([1, et_w, base_thick]);
            }
            
            // דפנות צד
            cube([et_l, wall_thick, rail_height]);
            translate([0, et_w - wall_thick, 0])
                cube([et_l, wall_thick, rail_height]);
        }
        
        // חורי חיבור
        for (dy = [et_w*0.25, et_w*0.75])
            translate([5, dy, -20])
                cylinder(d=screw_m4_hole, h=30);
        
        // חורי סיב אופטי S3 (2 חורים קטנים ⌀2mm)
        translate([et_l * 0.3, et_w/2 - 2, -1])
            cylinder(d=2.2, h=base_thick + 2);
        translate([et_l * 0.3, et_w/2 + 2, -1])
            cylinder(d=2.2, h=base_thick + 2);
    }
}

// ============================================================
//  חלק 14: קופסת אלקטרוניקה — בסיס
// ============================================================

module part_14_ebox_base() {
    difference() {
        union() {
            // תחתית
            cube([ebox_l, ebox_w, base_thick]);
            // דפנות
            difference() {
                cube([ebox_l, ebox_w, ebox_h]);
                translate([wall_thick, wall_thick, base_thick])
                    cube([ebox_l - 2*wall_thick, 
                          ebox_w - 2*wall_thick, 
                          ebox_h]);
            }
            
            // עמודי ברגים לארדואינו (4 פינות)
            for (pos = [[10, 15], [10+96, 15], [10, 15+51], [10+96, 15+51]])
                translate([pos[0], pos[1], base_thick])
                    cylinder(d=6, h=5);
        }
        
        // חורי ברגים ארדואינו
        for (pos = [[10, 15], [10+96, 15], [10, 15+51], [10+96, 15+51]])
            translate([pos[0], pos[1], -1])
                cylinder(d=screw_m3_hole, h=base_thick + 7);
        
        // חור USB (בדופן קדמית)
        translate([-1, ebox_w/2 - 6, base_thick + 15])
            cube([wall_thick + 2, 12, 11]);
        
        // חורי אוורור (דפנות צד)
        for (z = [base_thick+15 : 8 : ebox_h-10])
            for (x = [20 : 12 : ebox_l-20])
                translate([x, -1, z])
                    rotate([-90, 0, 0])
                        cylinder(d=4, h=wall_thick+2);
        
        // חורים לכבלים (דופן אחורית, 6 חורים)
        for (i = [0:5])
            translate([ebox_l - wall_thick - 1, 15 + i*16, base_thick + 20])
                rotate([0, 90, 0])
                    cylinder(d=8, h=wall_thick+2);
        
        // חור ספק חשמל (תחתית)
        translate([ebox_l/2 - 5, ebox_w - wall_thick - 1, base_thick + 10])
            cube([10, wall_thick + 2, 15]);
        
        // חורי L-bracket לחיבור למכונה
        for (dy = [10, ebox_w - 10])
            translate([-1, dy, ebox_h - 10])
                rotate([0, 90, 0])
                    cylinder(d=screw_m4_hole, h=wall_thick+2);
    }
}

// ============================================================
//  חלק 15: קופסת אלקטרוניקה — מכסה
// ============================================================

module part_15_ebox_lid() {
    lip = 2;  // שפה פנימית
    
    difference() {
        union() {
            // מכסה
            cube([ebox_l, ebox_w, wall_thick]);
            // שפה פנימית
            translate([wall_thick + clearance, wall_thick + clearance, -lip])
                cube([ebox_l - 2*(wall_thick + clearance), 
                      ebox_w - 2*(wall_thick + clearance), 
                      lip]);
        }
        
        // חורי ברגים (4 פינות)
        for (dx = [10, ebox_l-10])
            for (dy = [10, ebox_w-10])
                translate([dx, dy, -lip-1])
                    cylinder(d=screw_m3_hole, h=wall_thick + lip + 2);
        
        // חורי אוורור
        for (x = [30:15:ebox_l-30])
            for (y = [30:15:ebox_w-30])
                translate([x, y, -lip-1])
                    cylinder(d=4, h=wall_thick + lip + 2);
    }
}

// ============================================================
//  מודולי עזר
// ============================================================

module roller_bridge(width) {
    // גשר שמחזיק 608 bearing מעל המסילה
    bridge_w = 12;
    bridge_h = base_thick + rail_height + roller_d/2;
    
    difference() {
        cube([bridge_w, width, bridge_h]);
        // חור ציר
        translate([bridge_w/2, -1, bridge_h - 5])
            rotate([-90, 0, 0])
                cylinder(d=shaft_d + 0.5, h=width + 2);
    }
}

module bearing_608_hole() {
    // חור ל-608 bearing (press fit)
    cylinder(d=bearing_608_od + 0.2, h=bearing_608_w + 1);
}

// ============================================================
//  מודולי עזר — מנועים, רצועות, חיישנים
// ============================================================

// מנוע NEMA17 (לתצוגה בלבד)
module nema17_motor() {
    // גוף מנוע
    difference() {
        // גוף ריבועי
        translate([-nema17_w/2, -nema17_w/2, 0])
            cube([nema17_w, nema17_w, 47]);
        // חיתוך פינות
        for (a = [0:90:270])
            rotate([0, 0, a])
                translate([nema17_w/2 + 3, nema17_w/2 + 3, -1])
                    cylinder(r=6, h=49);
    }
    // ציר מנוע
    translate([0, 0, -24])
        cylinder(d=5, h=24);
    // פלנגה קדמית
    translate([0, 0, -2])
        cylinder(d=22, h=2);
}

// פולי GT2 (20 שיניים, ⌀12.7mm)
module gt2_pulley_20t() {
    difference() {
        union() {
            // גוף פולי
            cylinder(d=12.7, h=7);
            // פלנגות
            cylinder(d=16, h=1);
            translate([0, 0, 6])
                cylinder(d=16, h=1);
        }
        // חור ציר 5mm
        translate([0, 0, -1])
            cylinder(d=5.2, h=9);
    }
}

// פולי GT2 (60 שיניים, ⌀38mm, עם ציר 8mm)
module gt2_pulley_60t() {
    difference() {
        union() {
            cylinder(d=38, h=7);
            cylinder(d=42, h=1);
            translate([0, 0, 6])
                cylinder(d=42, h=1);
        }
        translate([0, 0, -1])
            cylinder(d=8.2, h=9);
    }
}

// רצועת GT2 בין שני פולים — לולאה מלאה ובולטת
// p1, p2 = מרכזי הפולים [x,z]
// r1, r2 = רדיוסי הפולים
// belt_color = צבע הרצועה
module gt2_belt_visible(p1, p2, r1, r2, belt_color="Red") {
    belt_w = 6;
    belt_thick = 2;  // עובי רצועה בולט
    
    dist = sqrt(pow(p2[0]-p1[0], 2) + pow(p2[1]-p1[1], 2));
    angle = atan2(p2[1]-p1[1], p2[0]-p1[0]);
    
    color(belt_color, 0.85) {
        // === צד ימין (חיצוני) ===
        hull() {
            translate([p1[0] + cos(angle+90)*r1, 0, p1[1] + sin(angle+90)*r1])
                rotate([-90, 0, 0])
                    cylinder(d=belt_thick, h=belt_w, center=true);
            translate([p2[0] + cos(angle+90)*r2, 0, p2[1] + sin(angle+90)*r2])
                rotate([-90, 0, 0])
                    cylinder(d=belt_thick, h=belt_w, center=true);
        }
        // === צד שמאל (פנימי) ===
        hull() {
            translate([p1[0] + cos(angle-90)*r1, 0, p1[1] + sin(angle-90)*r1])
                rotate([-90, 0, 0])
                    cylinder(d=belt_thick, h=belt_w, center=true);
            translate([p2[0] + cos(angle-90)*r2, 0, p2[1] + sin(angle-90)*r2])
                rotate([-90, 0, 0])
                    cylinder(d=belt_thick, h=belt_w, center=true);
        }
        
        // === עיטוף פולי קטן (מנוע) — חצי עיגול ===
        translate([p1[0], 0, p1[1]])
            rotate([-90,0,0])
                translate([0,0,-belt_w/2])
                    rotate_extrude(angle=180, $fn=30)
                        translate([r1, 0, 0])
                            square([belt_thick, belt_w]);
        
        // === עיטוף פולי גדול (רולר) — חצי עיגול ===
        translate([p2[0], 0, p2[1]])
            rotate([-90,0,0])
                rotate([0,0,180])
                    translate([0,0,-belt_w/2])
                        rotate_extrude(angle=180, $fn=30)
                            translate([r2, 0, 0])
                                square([belt_thick, belt_w]);
    }
    
    // === חץ כיוון סיבוב (על הרצועה) ===
    mid_x = (p1[0] + p2[0]) / 2;
    mid_z = (p1[1] + p2[1]) / 2;
    color("White")
        translate([mid_x + cos(angle+90)*max(r1,r2)*0.7, 0, mid_z + sin(angle+90)*max(r1,r2)*0.7])
            rotate([90, 0, 0])
                linear_extrude(1)
                    text("▼", size=5, halign="center", valign="center");
}

// סיב אופטי (צינור דק)
module fiber_optic_cable(points, d=1.0) {
    // מחבר רשימת נקודות בצינור דק
    for (i = [0: len(points)-2]) {
        hull() {
            translate(points[i])
                sphere(d=d);
            translate(points[i+1])
                sphere(d=d);
        }
    }
}

// מגבר סיב אופטי (קופסה קטנה 30×10×20mm)
module fiber_amplifier() {
    difference() {
        cube([30, 10, 20]);
        // חור LED
        translate([5, -1, 10])
            rotate([-90, 0, 0])
                cylinder(d=3, h=3);
        // חור סיב כניסה
        translate([10, -1, 5])
            rotate([-90, 0, 0])
                cylinder(d=2, h=3);
        // חור סיב יציאה
        translate([20, -1, 5])
            rotate([-90, 0, 0])
                cylinder(d=2, h=3);
    }
}

// רולר עם ציר (לתצוגת הרכבה)
module assy_roller(d, w) {
    // רולר
    rotate([90, 0, 0])
        translate([0, 0, -w/2]) {
            difference() {
                cylinder(d=d, h=w);
                translate([0, 0, -1])
                    cylinder(d=d-6, h=w+2);
            }
            // ציר
            translate([0, 0, -10])
                cylinder(d=shaft_d, h=w+20);
        }
}

// ============================================================
//  מסוע — Conveyor Belt
//  רצועה שטוחה (PU/סיליקון) בין רולר מניע ורולר סרק
// ============================================================

// רולר מסוע עם פולי GT2 להנעה
module conveyor_drive_roller(d, w) {
    rotate([90, 0, 0])
        translate([0, 0, -w/2]) {
            // רולר עם חיפוי גומי
            difference() {
                cylinder(d=d, h=w);
                translate([0,0,-1])
                    cylinder(d=d-8, h=w+2);
            }
            // ציר
            translate([0,0,-15])
                cylinder(d=shaft_d, h=w+30);
        }
}

// רולר סרק (idler) עם מתח קפיצי
module conveyor_idler_roller(d, w) {
    rotate([90, 0, 0])
        translate([0, 0, -w/2]) {
            difference() {
                cylinder(d=d, h=w);
                translate([0,0,-1])
                    cylinder(d=d-6, h=w+2);
            }
            // ציר
            translate([0,0,-10])
                cylinder(d=shaft_d, h=w+20);
        }
}

// רצועת מסוע שטוחה (flat belt) בין שני רולרים
// cx1, cx2 = מיקום X לרולר 1 ו-2
// cz = גובה מרכז הרולרים
// rd = קוטר רולרים
// bw = רוחב רצועה
module conveyor_flat_belt(cx1, cx2, cz, rd, bw) {
    r = rd/2;
    belt_t = conv_belt_thick;
    
    // === צד עליון (כרטיס נוסע כאן) ===
    color("SaddleBrown", 0.7)
        translate([cx1, -bw/2, cz + r])
            cube([cx2 - cx1, bw, belt_t]);
    
    // === צד תחתון (חזרה) ===
    color("SaddleBrown", 0.5)
        translate([cx1, -bw/2, cz - r - belt_t])
            cube([cx2 - cx1, bw, belt_t]);
    
    // === עיטוף רולר ימני (drive) — חצי עיגול ===
    color("SaddleBrown", 0.6)
        translate([cx2, 0, cz])
            rotate([-90, 0, 0])
                translate([0, 0, -bw/2])
                    rotate_extrude(angle=180, $fn=40)
                        translate([r, 0, 0])
                            square([belt_t, bw]);
    
    // === עיטוף רולר שמאלי (idler) — חצי עיגול ===
    color("SaddleBrown", 0.6)
        translate([cx1, 0, cz])
            rotate([-90, 180, 0])
                translate([0, 0, -bw/2])
                    rotate_extrude(angle=180, $fn=40)
                        translate([r, 0, 0])
                            square([belt_t, bw]);
    
    // === חיצי כיוון על המסוע ===
    for (fx = [cx1 + 40 : 80 : cx2 - 40])
        color("White", 0.5)
            translate([fx, 0, cz + r + belt_t + 0.5])
                rotate([0, 0, 0])
                    linear_extrude(0.5)
                        text("→", size=8, halign="center", valign="center");
    
    // === תווית ===
    color("SaddleBrown")
        translate([(cx1+cx2)/2, -bw/2 - 8, cz + r + 5])
            linear_extrude(0.5)
                text("CONVEYOR BELT", size=5, halign="center");
}

// ============================================================
//  Assembly Preview — הרכבה מלאה
//  כולל: מנועים, רצועות GT2, חיישני סיב אופטי, ניתוב סיבים
// ============================================================

module assembly() {
    rw = card_width + 2*wall_thick + 2*clearance;  // ~63mm
    fb_l = magazine_inner_l + 2*wall_thick;  // ~94mm
    fb_w = magazine_inner_w + 2*wall_thick;  // ~62mm
    
    motor_side_y = -25;  // מנועים בצד השמאלי (מתחת)
    
    // ========================================================
    //  מודול A: פידר
    // ========================================================
    
    // 1 - בסיס פידר
    color("DodgerBlue", 0.7)
        part_01_feeder_base();
    
    // 2 - דפנות מחסנית
    color("SteelBlue", 0.5)
        translate([wall_thick, wall_thick, base_thick])
            part_02_magazine_walls();
    
    // 3 - גלגל פידר TPU
    color("OrangeRed", 0.9)
        translate([fb_l/2, fb_w/2, -feed_wheel_d/2 + 2])
            part_03_feed_wheel();
    
    // === M1 — מנוע פידר + רצועה ===
    m1_x = fb_l/2;
    m1_z = -35;
    
    // מנוע M1 (מתחת, בצד)
    color("DarkSlateGray", 0.8)
        translate([m1_x, motor_side_y, m1_z])
            rotate([90, 0, 0])
                rotate([0, 0, 0])
                    nema17_motor();
    // תווית M1
    color("White") translate([m1_x - 25, motor_side_y - 5, m1_z + 20])
        linear_extrude(1) text("M1", size=6, halign="center");
    
    // פולי מנוע M1 (20T על ציר המנוע)
    color("Silver", 0.9)
        translate([m1_x, motor_side_y, m1_z])
            rotate([90, 0, 0])
                gt2_pulley_20t();
    
    // פולי גדול על ציר גלגל הפידר (60T)
    color("Silver", 0.8)
        translate([m1_x, motor_side_y + 18, -feed_wheel_d/2 + 2])
            rotate([90, 0, 0])
                gt2_pulley_60t();
    
    // רצועת GT2 M1 (אדום — פידר)
    translate([0, motor_side_y + 10, 0])
        gt2_belt_visible(
            [m1_x, m1_z],                    // מנוע
            [m1_x, -feed_wheel_d/2 + 2],     // רולר
            6.35,   // רדיוס פולי 20T
            19,      // רדיוס פולי 60T
            "Red"
        );
    // תיאור הנעה M1
    color("Red") translate([m1_x + 22, motor_side_y + 10, (m1_z + (-feed_wheel_d/2 + 2))/2])
        rotate([90, 0, 0])
            linear_extrude(0.5)
                text("Belt M1→Feed", size=4, halign="left");
    // קו חיבור מנוע→פולי
    color("Red", 0.5)
        translate([m1_x - 22, motor_side_y - 5, m1_z - 5])
            rotate([90, 0, 0])
                linear_extrude(0.5) text("20T", size=3);
    color("Red", 0.5)
        translate([m1_x - 22, motor_side_y - 5, -feed_wheel_d/2 + 15])
            rotate([90, 0, 0])
                linear_extrude(0.5) text("60T", size=3);
    
    // ========================================================
    //  מודול B: מסילה + מסוע ראשי
    // ========================================================
    rail_start = fb_l + 5;
    
    // 4 - מסילה שמאל
    color("LimeGreen", 0.6)
        translate([rail_start, 0, 0])
            part_04_rail_base_left();
    
    // 5 - מסילה ימין
    color("LimeGreen", 0.6)
        translate([rail_start + rail_length, 0, 0])
            part_05_rail_base_right();
    
    // 6 - מכווני צד
    color("Gold", 0.8)
        translate([rail_start + 50, -2, base_thick])
            part_06_rail_side_guide();
    color("Gold", 0.8)
        translate([rail_start + 50, rw - wall_thick - 3, base_thick])
            mirror([0, 1, 0])
                part_06_rail_side_guide();
    color("Gold", 0.8)
        translate([rail_start + rail_length - 80, -2, base_thick])
            part_06_rail_side_guide();
    color("Gold", 0.8)
        translate([rail_start + rail_length - 80, rw - wall_thick - 3, base_thick])
            mirror([0, 1, 0])
                part_06_rail_side_guide();
    
    // ========================================================
    //  מסוע ראשי — Flat Belt Conveyor
    //  רולר מניע (drive) בקצה היציאה
    //  רולר סרק (idler) בקצה הכניסה
    //  רצועה שטוחה PU מחברת ביניהם
    // ========================================================
    
    conv_z = base_thick;   // גובה מרכז רולרי המסוע
    idler_x = rail_start + 20;                    // רולר סרק — התחלה
    drive_x = rail_start + rail_length - 20;      // רולר מניע — סוף
    
    // === רולר סרק (idler) — צד כניסה ===
    color("DimGray", 0.8)
        translate([idler_x, rw/2, conv_z])
            conveyor_idler_roller(conv_roller_d, conv_belt_w + 4);
    color("White") translate([idler_x, rw/2 + conv_belt_w/2 + 8, conv_z])
        rotate([90, 0, 0])
            linear_extrude(0.5) text("IDLER", size=4, halign="center");
    
    // === רולר מניע (drive) — צד יציאה ===
    color("DarkGoldenrod", 0.8)
        translate([drive_x, rw/2, conv_z])
            conveyor_drive_roller(conv_roller_d, conv_belt_w + 4);
    color("White") translate([drive_x, rw/2 + conv_belt_w/2 + 8, conv_z])
        rotate([90, 0, 0])
            linear_extrude(0.5) text("DRIVE", size=4, halign="center");
    
    // 7 - בתי רולר (מחזיקי מיסבים לרולרי המסוע)
    color("MediumPurple", 0.7)
        translate([idler_x - 15, 0, 0])
            part_07_roller_housing();
    color("MediumPurple", 0.7)
        translate([drive_x - 15, 0, 0])
            part_07_roller_housing();
    
    // === רצועת מסוע שטוחה ===
    translate([0, rw/2, 0])
        conveyor_flat_belt(idler_x, drive_x, conv_z, conv_roller_d, conv_belt_w);
    
    // === רולר לחץ עליון (מעל, מחזיק כרטיס נגד הרצועה) ===
    // רולר לחץ ליד הכניסה
    color("Tomato", 0.5)
        translate([idler_x + 30, rw/2, conv_z + conv_roller_d/2 + card_thick + 5])
            assy_roller(18, conv_belt_w - 10);
    color("White") translate([idler_x + 30, rw/2 + conv_belt_w/2 + 5, conv_z + conv_roller_d/2 + 12])
        rotate([90, 0, 0])
            linear_extrude(0.5) text("PRESS", size=3);
    
    // רולר לחץ ליד היציאה
    color("Tomato", 0.5)
        translate([drive_x - 30, rw/2, conv_z + conv_roller_d/2 + card_thick + 5])
            assy_roller(18, conv_belt_w - 10);
    
    // === M2 — מנוע מסוע (מניע את רולר ה-drive) ===
    m2_x = drive_x;
    m2_z = -35;
    
    // מנוע M2 (מתחת לרולר המניע)
    color("DarkSlateGray", 0.8)
        translate([m2_x, motor_side_y, m2_z])
            rotate([90, 0, 0])
                nema17_motor();
    color("White") translate([m2_x - 25, motor_side_y - 5, m2_z + 20])
        linear_extrude(1) text("M2", size=6, halign="center");
    
    // פולי 20T על M2
    color("Silver", 0.9)
        translate([m2_x, motor_side_y, m2_z])
            rotate([90, 0, 0])
                gt2_pulley_20t();
    
    // פולי 60T על ציר רולר מניע
    color("Silver", 0.8)
        translate([m2_x, motor_side_y + 18, conv_z])
            rotate([90, 0, 0])
                gt2_pulley_60t();
    
    // רצועת GT2 M2 (ירוק — מנוע→רולר מניע)
    translate([0, motor_side_y + 10, 0])
        gt2_belt_visible(
            [m2_x, m2_z],
            [m2_x, conv_z],
            6.35, 19,
            "LimeGreen"
        );
    color("LimeGreen") translate([m2_x + 22, motor_side_y + 10, (m2_z + conv_z)/2])
        rotate([90, 0, 0])
            linear_extrude(0.5)
                text("GT2 M2→Drive Roller", size=4, halign="left");
    color("LimeGreen", 0.5)
        translate([m2_x - 22, motor_side_y - 5, m2_z - 5])
            rotate([90, 0, 0])
                linear_extrude(0.5) text("20T", size=3);
    color("LimeGreen", 0.5)
        translate([m2_x - 22, motor_side_y - 5, conv_z + 15])
            rotate([90, 0, 0])
                linear_extrude(0.5) text("60T", size=3);
    
    // ========================================================
    //  מודול C: ראש הדבקה
    // ========================================================
    label_x = rail_start + rail_length * 0.6;
    label_frame_h = roll_max_d/2 + 50;
    
    // 8 - מסגרת ראש הדבקה (×2)
    color("Crimson", 0.6)
        translate([label_x, -5, 0])
            part_08_label_head_frame();
    color("Crimson", 0.6)
        translate([label_x, rw + 5, 0])
            mirror([0, 1, 0])
                part_08_label_head_frame();
    
    // 9 - מחזיק גליל מדבקות
    color("Coral", 0.8)
        translate([label_x + 15, rw/2, label_frame_h * 0.65])
            rotate([90, 0, 0])
                translate([0, 0, -roll_strip_w/2])
                    part_09_roll_holder();
    
    // גליל מדבקות (שקוף)
    color("HotPink", 0.25)
        translate([label_x + 15, rw/2, label_frame_h * 0.65])
            rotate([90, 0, 0])
                cylinder(d=roll_max_d * 0.7, h=roll_strip_w, center=true);
    
    // 10 - Peel Plate
    color("Yellow", 0.8)
        translate([label_x + 20, rw/2 - peel_plate_w/2, base_thick + rail_height + 5])
            rotate([0, -peel_angle, 0])
                part_10_peel_plate();
    
    // 11 - זרוע רולר לחץ
    color("Salmon", 0.8)
        translate([label_x + 10, rw/2 - 7.5, base_thick + rail_height + 2])
            part_11_pressure_arm();
    
    // 12 - סליל Liner
    color("Peru", 0.7)
        translate([label_x + 8, rw/2, label_frame_h * 0.35])
            rotate([90, 0, 0])
                translate([0, 0, -roll_strip_w/2])
                    part_12_liner_spool();
    
    // === M3 — מנוע הדבקה (מניע את גליל המדבקות) + רצועה ===
    m3_x = label_x + 15;
    m3_z = label_frame_h * 0.65;
    m3_motor_z = m3_z + 60;
    
    // מנוע M3 (בצד המסגרת, למעלה)
    color("DarkSlateGray", 0.8)
        translate([m3_x, motor_side_y, m3_motor_z])
            rotate([90, 0, 0])
                nema17_motor();
    color("White") translate([m3_x - 25, motor_side_y - 5, m3_motor_z + 10])
        linear_extrude(1) text("M3", size=6, halign="center");
    
    // פולי 20T על M3
    color("Silver", 0.9)
        translate([m3_x, motor_side_y, m3_motor_z])
            rotate([90, 0, 0])
                gt2_pulley_20t();
    
    // פולי 60T על ציר גליל מדבקות
    color("Silver", 0.8)
        translate([m3_x, motor_side_y + 18, m3_z])
            rotate([90, 0, 0])
                gt2_pulley_60t();
    
    // רצועת GT2 M3 (כתום — הדבקה)
    translate([0, motor_side_y + 10, 0])
        gt2_belt_visible(
            [m3_x, m3_motor_z],
            [m3_x, m3_z],
            6.35, 19,
            "Orange"
        );
    // תיאור הנעה M3
    color("Orange") translate([m3_x + 22, motor_side_y + 10, (m3_motor_z + m3_z)/2])
        rotate([90, 0, 0])
            linear_extrude(0.5)
                text("Belt M3→Label", size=4, halign="left");
    color("Orange", 0.5)
        translate([m3_x - 22, motor_side_y - 5, m3_motor_z - 5])
            rotate([90, 0, 0])
                linear_extrude(0.5) text("20T", size=3);
    color("Orange", 0.5)
        translate([m3_x - 22, motor_side_y - 5, m3_z + 15])
            rotate([90, 0, 0])
                linear_extrude(0.5) text("60T", size=3);
    
    // ===== רצועת מדבקות (נתיב מהגליל ← peel plate ← liner) =====
    // נתיב רצועה (מפושט)
    color("White", 0.3) {
        // מגליל ← peel plate
        hull() {
            translate([label_x + 15, rw/2, label_frame_h * 0.65 - roll_max_d * 0.35])
                rotate([90, 0, 0]) cylinder(d=2, h=roll_strip_w - 10, center=true);
            translate([label_x + 20, rw/2, base_thick + rail_height + 15])
                rotate([90, 0, 0]) cylinder(d=2, h=roll_strip_w - 10, center=true);
        }
        // peel plate ← liner spool
        hull() {
            translate([label_x + 20 + peel_plate_l - 10, rw/2, base_thick + rail_height + 3])
                rotate([90, 0, 0]) cylinder(d=1.5, h=roll_strip_w - 10, center=true);
            translate([label_x + 8, rw/2, label_frame_h * 0.35])
                rotate([90, 0, 0]) cylinder(d=1.5, h=roll_strip_w - 10, center=true);
        }
    }
    
    // ========================================================
    //  מודול D: יציאה
    // ========================================================
    exit_x = rail_start + rail_length + 5;
    
    // 13 - מגש יציאה
    color("MediumSeaGreen", 0.7)
        translate([exit_x, 0, 0])
            part_13_exit_tray();
    
    // ========================================================
    //  חיישני סיב אופטי — 3× מתחת למסילה
    // ========================================================
    fiber_d = 1.0;     // קוטר סיב אופטי
    fiber_z = -2;      // גובה הסיב (מתחת לבסיס)
    
    // מיקום 3 חיישנים (חור בבסיס, סיב עובר מלמטה ↑ למעלה)
    s1_x = fb_l * 0.7 + 5;          // S1 — פידר
    s2_x = rail_start + rail_length * 0.6 - 10;  // S2 — אזור הדבקה
    s3_x = exit_x + exit_length * 0.3 + 5;       // S3 — יציאה
    
    // ===== ראשי סיב אופטי (עולים מתחת למסילה) =====
    // S1 — ראש סיב בפידר
    color("Lime", 0.9) {
        translate([s1_x, rw/2 - 2, -2])
            cylinder(d=2.5, h=base_thick + 3);
        translate([s1_x, rw/2 + 2, -2])
            cylinder(d=2.5, h=base_thick + 3);
    }
    color("White") translate([s1_x, rw/2, base_thick + 2])
        linear_extrude(0.5) text("S1", size=4, halign="center");
    
    // S2 — ראש סיב באזור הדבקה
    color("Lime", 0.9) {
        translate([s2_x, rw/2 - 2, -2])
            cylinder(d=2.5, h=base_thick + 3);
        translate([s2_x, rw/2 + 2, -2])
            cylinder(d=2.5, h=base_thick + 3);
    }
    color("White") translate([s2_x, rw/2, base_thick + 2])
        linear_extrude(0.5) text("S2", size=4, halign="center");
    
    // S3 — ראש סיב ביציאה
    color("Lime", 0.9) {
        translate([s3_x, rw/2 - 2, -2])
            cylinder(d=2.5, h=base_thick + 3);
        translate([s3_x, rw/2 + 2, -2])
            cylinder(d=2.5, h=base_thick + 3);
    }
    color("White") translate([s3_x, rw/2, base_thick + 2])
        linear_extrude(0.5) text("S3", size=4, halign="center");
    
    // ===== ניתוב סיבים אופטיים — מהחיישנים לקופסת אלקטרוניקה =====
    ebox_x = rail_start + rail_length/2 - ebox_l/2;
    ebox_y = -ebox_w - 15;
    ebox_center_y = ebox_y + ebox_w/2;
    fiber_entry_z = base_thick + 20;
    
    // סיב S1 (ירוק — 2 סיבים: TX + RX)
    color("Lime", 0.6)
        fiber_optic_cable([
            [s1_x, rw/2, fiber_z],          // מהחיישן
            [s1_x, rw/2, -8],               // למטה
            [s1_x, 0, -10],                 // פינה
            [s1_x, ebox_y + ebox_w, -10],   // לכיוון הקופסה
            [ebox_x + 25, ebox_y + ebox_w, -5],  // לאורך הקופסה
            [ebox_x + 25, ebox_y + ebox_w - 3, fiber_entry_z], // כניסה
        ], fiber_d);
    
    // סיב S2 (צהוב)
    color("Yellow", 0.6)
        fiber_optic_cable([
            [s2_x, rw/2, fiber_z],
            [s2_x, rw/2, -8],
            [s2_x, 0, -10],
            [s2_x, ebox_y + ebox_w, -10],
            [ebox_x + 65, ebox_y + ebox_w, -5],
            [ebox_x + 65, ebox_y + ebox_w - 3, fiber_entry_z],
        ], fiber_d);
    
    // סיב S3 (כתום)
    color("Orange", 0.6)
        fiber_optic_cable([
            [s3_x, rw/2, fiber_z],
            [s3_x, rw/2, -8],
            [s3_x, 0, -10],
            [s3_x, ebox_y + ebox_w, -10],
            [ebox_x + 105, ebox_y + ebox_w, -5],
            [ebox_x + 105, ebox_y + ebox_w - 3, fiber_entry_z],
        ], fiber_d);
    
    // ========================================================
    //  קופסת אלקטרוניקה (מתחת, עם מגברי סיב אופטי)
    // ========================================================
    
    // 14 - בסיס קופסה
    color("SlateGray", 0.5)
        translate([ebox_x, ebox_y, 0])
            part_14_ebox_base();
    
    // 15 - מכסה (מעט מוזז למעלה כדי לראות פנימה)
    color("SlateGray", 0.2)
        translate([ebox_x, ebox_y, ebox_h + 5])
            part_15_ebox_lid();
    
    // === רכיבים בתוך הקופסה ===
    
    // Arduino Mega (ייצוג מפושט)
    color("DarkGreen", 0.8)
        translate([ebox_x + 8, ebox_y + 10, base_thick + 5])
            cube([101, 53, 2]);
    color("Silver") translate([ebox_x + 6, ebox_y + 30, base_thick + 7])
        cube([12, 11, 10]);  // USB connector
    color("White") translate([ebox_x + 55, ebox_y + 12, base_thick + 8])
        linear_extrude(0.5) text("Arduino Mega", size=5);
    
    // 3× TMC2209 Driver boards
    for (i = [0:2]) {
        color("Purple", 0.7)
            translate([ebox_x + 120, ebox_y + 10 + i*22, base_thick + 5])
                cube([15, 20, 2]);
        color("White") translate([ebox_x + 123, ebox_y + 15 + i*22, base_thick + 8])
            linear_extrude(0.4) text("D", size=4);
    }
    color("White") translate([ebox_x + 118, ebox_y + 75, base_thick + 8])
        linear_extrude(0.5) text("TMC2209×3", size=4);
    
    // 3× מגברי סיב אופטי (Fiber Optic Amplifiers)
    color("DodgerBlue", 0.8)
        translate([ebox_x + 20, ebox_y + ebox_w - 35, base_thick + 5])
            fiber_amplifier();
    color("DodgerBlue", 0.8)
        translate([ebox_x + 60, ebox_y + ebox_w - 35, base_thick + 5])
            fiber_amplifier();
    color("DodgerBlue", 0.8)
        translate([ebox_x + 100, ebox_y + ebox_w - 35, base_thick + 5])
            fiber_amplifier();
    color("White") translate([ebox_x + 15, ebox_y + ebox_w - 18, base_thick + 8])
        linear_extrude(0.5) text("Fiber Amp ×3", size=4);
    
    // LM2596 Buck converter
    color("DarkRed", 0.7)
        translate([ebox_x + 145, ebox_y + 80, base_thick + 5])
            cube([25, 15, 5]);
    color("White") translate([ebox_x + 145, ebox_y + 78, base_thick + 11])
        linear_extrude(0.4) text("24→5V", size=3.5);
    
    // ========================================================
    //  כרטיס אשראי (שקוף, על המסוע)
    // ========================================================
    card_on_belt_z = conv_z + conv_roller_d/2 + conv_belt_thick;
    color("Cyan", 0.3)
        translate([rail_start + 80, rw/2 - card_width/2, card_on_belt_z])
            cube([card_length, card_width, card_thick]);
    
    // ===== כבלי מנועים (מהמנועים לקופסה) =====
    cable_d = 3;
    // כבל M1
    color("Blue", 0.4)
        fiber_optic_cable([
            [m1_x, motor_side_y, m1_z + 30],
            [m1_x, motor_side_y, -15],
            [m1_x, ebox_y + ebox_w, -12],
            [ebox_x + ebox_l - 3, ebox_y + ebox_w, fiber_entry_z],
        ], cable_d);
    // כבל M2
    color("Blue", 0.4)
        fiber_optic_cable([
            [m2_x, motor_side_y, m2_z + 30],
            [m2_x, motor_side_y, -15],
            [m2_x, ebox_y + ebox_w, -12],
            [ebox_x + ebox_l - 3, ebox_y + ebox_w - 16, fiber_entry_z],
        ], cable_d);
    // כבל M3
    color("Blue", 0.4)
        fiber_optic_cable([
            [m3_x, motor_side_y, m3_motor_z + 30],
            [m3_x, motor_side_y, -15],
            [m3_x, ebox_y + ebox_w, -12],
            [ebox_x + ebox_l - 3, ebox_y + ebox_w - 32, fiber_entry_z],
        ], cable_d);
    
    // ========================================================
    //  מקרא (Legend) — לוח תיאור צבעים
    // ========================================================
    legend_x = exit_x + exit_length + 30;
    legend_z = 100;
    
    color("White", 0.15)
        translate([legend_x - 5, -5, legend_z - 35])
            cube([95, 2, 160]);
    
    color("White") translate([legend_x, 0, legend_z + 115])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("LEGEND", size=7, font="Arial:style=Bold");
    
    // רצועות
    color("Red") translate([legend_x, 0, legend_z + 100])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("■ Belt M1→Feed", size=5);
    color("LimeGreen") translate([legend_x, 0, legend_z + 88])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("■ GT2 M2→Drive Roller", size=5);
    color("Orange") translate([legend_x, 0, legend_z + 76])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("■ Belt M3→Label Roll", size=5);
    
    // מסוע
    color("SaddleBrown") translate([legend_x, 0, legend_z + 64])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("■ Conveyor Belt (PU)", size=5);
    color("Tomato") translate([legend_x, 0, legend_z + 52])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("■ Pressure Rollers", size=5);
    
    // מנועים
    color("DarkSlateGray") translate([legend_x, 0, legend_z + 36])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("■ NEMA17 Motors", size=5);
    color("Silver") translate([legend_x, 0, legend_z + 24])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("■ GT2 Pulleys", size=5);
    
    // חיישנים
    color("Lime") translate([legend_x, 0, legend_z + 8])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("■ Fiber Optic Sensors", size=5);
    color("DodgerBlue") translate([legend_x, 0, legend_z - 4])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("■ Fiber Amplifiers", size=5);
    color("Blue") translate([legend_x, 0, legend_z - 16])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("■ Motor Cables", size=5);
    color("HotPink") translate([legend_x, 0, legend_z - 28])
        rotate([90, 0, 0]) linear_extrude(0.5)
            text("■ Label Roll", size=5);
}

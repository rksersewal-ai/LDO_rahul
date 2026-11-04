# -*- coding: utf-8 -*-
"""Group M: Measuring, marking-out and inspection instruments."""

GROUP_M = {
    "letter": "M",
    "title": "Group 2 \u2014 Measuring, Marking-out and Inspection Instruments",
    "intro": "Metrology is where a trainee moves from 'making something' to 'making something to "
             "specification'. The CTS learning outcomes state tolerances explicitly \u2014 basic fitting "
             "to \u00b1 0.25 mm in the first year, fits and interference work to \u00b1 0.04 mm and "
             "30 minutes of arc, precision fitting to \u00b1 0.02 mm at CITS level \u2014 and the CITS "
             "outcomes add comparators, sine bar, dial test indicator, digital instruments and the "
             "coordinate measuring machine. Instruments in this group are precision items: they must be "
             "calibrated, handled as instruments and never used as tools.",
    "items": [
        {
            "code": "M-001", "name": "Vernier caliper (analogue)",
            "aka": "Vernier 150/200/300 mm, least count 0.02 mm",
            "identify": "A steel rule with a fixed jaw and a sliding jaw carrying a vernier scale, with "
                        "inside jaws, outside jaws, a depth rod and a locking screw. Least count is "
                        "normally 0.02 mm (or 0.05 mm on cheaper types). Shop issue in Fitter, Turner, "
                        "Machinist, Motor Vehicle and Welding trades.",
            "operate": "Close the jaws and check the zero reading. Open the jaws slightly wider than the "
                       "work, then close them with light contact, lock, and read the main scale before "
                       "the vernier zero plus the vernier division that coincides, multiplied by the "
                       "least count. Read from directly in front of the scale. Use the inside jaws for "
                       "bores and the depth rod for depths.",
            "safety": "Do not use the caliper as a pair of pliers, a scribing tool or a clamp; the jaws "
                      "are ground and easily sprung. Do not measure a moving or hot workpiece.",
            "care": "Wipe the jaws and beam before and after use; keep the slide very lightly oiled; "
                    "store in the case, jaws slightly open; check zero at every use and have the "
                    "instrument calibrated annually.",
            "trades": "Fitter, Turner, Machinist, Tool & Die Maker, Mechanic Motor Vehicle, Welder, "
                      "Millwright, Instrument Mechanic",
            "ppe": "None beyond normal shop PPE",
        },
        {
            "code": "M-002", "name": "Digital vernier caliper",
            "aka": "Digital caliper 150/200 mm, resolution 0.01 mm",
            "identify": "Same layout as the analogue caliper, with a battery-powered LCD readout, an "
                        "on/zero/off key and a mm/inch key; some have a data output port.",
            "operate": "Switch on, close the jaws and zero the display, then measure as for the analogue "
                       "caliper. Use the hold function for reading in a confined position. Re-zero after "
                       "changing the battery.",
            "safety": "The electronics and the glass scale are fragile and sensitive to coolant and "
                      "magnetic fields \u2014 do not immerse, and keep away from welding current and "
                      "magnet chucks.",
            "care": "Remove the battery for long storage; wipe the beam free of ferrous dust; store in the "
                    "case; recalibrate against a gauge block.",
            "trades": "Fitter, Turner, Machinist, Motor Vehicle, Sheet Metal, CITS Fitter",
            "ppe": "None",
        },
        {
            "code": "M-003", "name": "Vernier height gauge",
            "aka": "Height gauge 300 mm with scriber",
            "identify": "A heavy base with a vertical beam and a sliding measuring head carrying a "
                        "scriber or a dial/digital indicator, used on a surface plate. Vernier or dial "
                        "type, least count 0.02 mm.",
            "operate": "Place on a clean surface plate, zero the scriber on the plate, set the height "
                       "required with the fine adjustment, lock, then scribe or check a height. Read "
                       "against the vernier as for a caliper.",
            "safety": "The scriber is sharp and the base is heavy \u2014 carry with two hands and never let "
                      "the gauge topple. Do not use the scriber to cut deeply.",
            "care": "Clean the plate and the base before use; oil the beam lightly; store upright in the "
                    "case.",
            "trades": "Fitter, Tool & Die Maker, Machinist, CITS Fitter",
            "ppe": "Safety glasses, safety shoes",
        },
        {
            "code": "M-004", "name": "Vernier depth gauge and depth micrometer",
            "aka": "Depth gauge 0\u2013200 mm; depth micrometer 0\u2013100 mm",
            "identify": "The depth gauge has a flat base bar and a sliding rule or rod; the depth "
                        "micrometer has a series of interchangeable rods and a micrometer head with a "
                        "flat base.",
            "operate": "Seat the base firmly on the reference surface, extend the rod until it touches "
                       "the bottom, and read. Take three readings around the feature and use the largest "
                       "for a blind hole depth.",
            "safety": "Do not force the rod against a rough or tapered bottom; the reading will be wrong "
                      "and the rod may bend.",
            "care": "Wipe the rods and the base; oil; store in the case with the rods in their slots.",
            "trades": "Fitter, Tool & Die Maker, Machinist, Mechanic Machine Tools Maintenance",
            "ppe": "None",
        },
        {
            "code": "M-005", "name": "Outside micrometer",
            "aka": "Micrometer 0\u201325, 25\u201350, 50\u201375 mm with setting standards",
            "identify": "A C-shaped frame with a fixed anvil, a spindle driven by a precision screw, a "
                        "barrel with a datum line, and a thimble graduated to 0.01 mm with a ratchet or "
                        "friction stop. Shop issue in sets of 0\u201325, 25\u201350 and 50\u201375 mm with "
                        "test pieces.",
            "operate": "Clean the anvils, check zero with the anvils closed (or with the setting standard "
                       "for larger sizes), open beyond the work and close with the ratchet until it "
                       "slips three clicks, then read the barrel plus the thimble. Take several readings "
                       "along and around the work to detect taper and ovality.",
            "safety": "Never close the micrometer hard on the work or use the thimble as a vice \u2014 the "
                      "screw is precision and does not tolerate force. Do not drop it; a fall of a few "
                      "centimetres can put it out of adjustment.",
            "care": "Wipe the anvils with a clean cloth and light oil before storage, keep the anvils very "
                    "slightly open, store in the case, and have it checked with gauge blocks annually.",
            "trades": "Fitter, Turner, Machinist, Tool & Die Maker, Motor Vehicle, Millwright",
            "ppe": "None",
        },
        {
            "code": "M-006", "name": "Inside micrometer and telescopic (T-) gauge",
            "aka": "Inside micrometer 25\u201350 mm; telescopic gauge up to 150 mm",
            "identify": "The inside micrometer uses extension rods and a micrometer head with spherical "
                        "anvils; the telescopic gauge has a spring-loaded plunger that locks and is then "
                        "measured with an outside micrometer.",
            "operate": "For the inside micrometer, set the size approximately on the head, insert and "
                       "rock gently to find the true diameter, then read. For the telescopic gauge, "
                       "collapse the plunger, insert, expand until it touches both walls, lock, withdraw "
                       "and measure across the plunger ends with an outside micrometer. Rock the gauge "
                       "in two planes to find the maximum.",
            "safety": "Insert and withdraw with care in a blind bore; a jammed gauge can be damaged or "
                      "can damage the bore.",
            "care": "Oil the plunger and screw; keep the anvils clean; store in the case.",
            "trades": "Fitter, Turner, Machinist, Motor Vehicle, Millwright, Refrigeration & AC "
                      "(compressor bores)",
            "ppe": "None",
        },
        {
            "code": "M-007", "name": "Digital micrometer and digital dial indicator",
            "aka": "Digital outside micrometer 0\u201325 mm; digital lever-type dial test indicator",
            "identify": "Micrometer or indicator with an LCD display, zero-set and mm/inch keys, and a "
                        "data output on better types. CITS Fitter requires digital micrometer, digital "
                        "caliper, digital height gauge and digital dial test indicator.",
            "operate": "Zero the instrument on its standard before use, take the reading on the display "
                       "and use the hold key where the display cannot be seen. Treat the measurement "
                       "exactly as you would an analogue one \u2014 verify with a second instrument when "
                       "the tolerance is tight.",
            "safety": "Batteries and electronics are sensitive to coolant and impact; do not use near "
                      "welding or induction heating.",
            "care": "Remove the battery for long storage; keep clean and dry; recalibrate with gauge "
                    "blocks.",
            "trades": "Fitter, Tool & Die Maker, Machinist, CITS Fitter",
            "ppe": "None",
        },
        {
            "code": "M-008", "name": "Screw thread micrometer and three-wire method",
            "aka": "Thread micrometer with V-anvil and cone; three-wire set",
            "identify": "A micrometer with a 60 degree V-anvil and a matching cone for measuring the pitch "
                        "diameter of a thread, or three hardened wires of known diameter used with a "
                        "standard micrometer.",
            "operate": "For the thread micrometer, seat the V on one flank and the cone in the opposite "
                       "groove and read the pitch diameter directly. For the three-wire method, place one "
                       "wire in one groove and two in the opposite grooves, measure over the wires and "
                       "calculate the pitch diameter from the wire diameter, thread angle and pitch.",
            "safety": "Wires are tiny and easily lost or bent; keep them in the holder and do not force "
                      "them into a damaged thread.",
            "care": "Keep the V-anvil free of swarf; oil; replace bent wires; store in the case.",
            "trades": "Fitter, Turner, Machinist, Tool & Die Maker, Instrument Mechanic",
            "ppe": "None",
        },
        {
            "code": "M-009", "name": "Screw pitch gauge",
            "aka": "Thread pitch gauge, metric and BSW set",
            "identify": "A folding set of thin hardened leaves, each cut with a known thread form and "
                        "pitch, marked in millimetres or threads per inch.",
            "operate": "Offer leaves to the thread until one seats fully across the crests with no light "
                       "gap; read the pitch from the leaf marking. Use it with a thread table or a "
                       "standard to identify the thread series.",
            "safety": "The thin leaves bend and cut; open only the leaf in use.",
            "care": "Wipe off oil and swarf; close the set; do not force a leaf into a dirty thread.",
            "trades": "Fitter, Turner, Machinist, Motor Vehicle, Plumber, Millwright",
            "ppe": "None",
        },
        {
            "code": "M-010", "name": "Thread plug gauge and thread ring gauge (Go / No-Go)",
            "aka": "Go and No-Go plug gauge; ring gauge; caliper gauge",
            "identify": "Hardened, lapped gauges made to the limits of the thread. The Go plug must enter "
                        "the full thread by hand; the No-Go plug must not enter more than two turns. Ring "
                        "gauges do the same for external threads.",
            "operate": "Clean the thread and the gauge, apply light oil, and screw the Go gauge in by hand "
                       "\u2014 it must pass. Then try the No-Go, which must not pass. Never use a wrench.",
            "safety": "Gauges are expensive reference standards; a dropped or forced gauge is scrap. "
                      "Never use a thread gauge to clean a thread.",
            "care": "Oil and case after use; keep separate from production tooling; recertify on schedule; "
                    "never regrind.",
            "trades": "Fitter, Turner, Machinist, Tool & Die Maker",
            "ppe": "None",
        },
        {
            "code": "M-011", "name": "Limit gauges \u2014 plug, snap, ring and caliper",
            "aka": "Plug gauge single-ended 5\u201355 mm; snap gauge Go/No-Go 25\u201350 mm",
            "identify": "Plain (non-threaded) hardened gauges: plug gauges for holes, snap or gap gauges "
                        "for shafts, ring gauges for cylinders. The Go end is made to the maximum "
                        "material limit, the No-Go to the minimum.",
            "operate": "Insert or apply without force \u2014 the Go must pass freely and the No-Go must not. "
                       "The judgement is by feel and by weight of the gauge, not by pressure.",
            "safety": "Do not force or hammer a gauge into a hole; it will seize and both parts will be "
                      "damaged.",
            "care": "Clean, oil and store in a wooden case; handle by the insulated or knurled part to "
                    "avoid warming the gauge.",
            "trades": "Fitter, Turner, Machinist, Tool & Die Maker, Motor Vehicle",
            "ppe": "None",
        },
        {
            "code": "M-012", "name": "Dial test indicator with magnetic base",
            "aka": "DTI 0.01 mm; plunger or lever type; magnetic stand",
            "identify": "A small precision instrument with a spring-loaded plunger or lever that drives a "
                        "needle over a graduated dial, mounted on an articulated arm and a magnetic or "
                        "mechanical base. Least count 0.01 mm, travel typically 0\u201310 mm.",
            "operate": "Mount rigidly on the base, set the stylus approximately perpendicular to the "
                       "surface, pre-load the needle by about half a revolution, zero the bezel, and "
                       "rotate or move the work to read runout, squareness or alignment. For centring "
                       "work in a four-jaw chuck, adjust jaws until the needle deflection is halved.",
            "safety": "Never let the plunger snap back; the mechanism is delicate. Keep the magnetic base "
                      "away from watches, cards and electronic instruments.",
            "care": "Release the stylus gently, store in the case, avoid coolant ingress, and have it "
                    "calibrated. Check repeatability on a known surface.",
            "trades": "Fitter, Turner, Machinist, Tool & Die Maker, Millwright, Mechanic Machine Tools "
                      "Maintenance",
            "ppe": "None",
        },
        {
            "code": "M-013", "name": "Comparators \u2014 mechanical, electrical, pneumatic and stand "
                             "mounted",
            "aka": "Dial comparator stand; Sigma comparators; air gauge",
            "identify": "A comparator does not measure an absolute size; it measures the difference "
                        "between the work and a setting master. Mechanical types use a lever and gear "
                        "train, electrical types a transducer, pneumatic types an air jet and back "
                        "pressure.",
            "operate": "Set the comparator to zero using a gauge block or setting master of nominal size, "
                       "then present the work and read the deviation. Magnification can be high, so a "
                       "small deviation reads clearly.",
            "safety": "Setting masters and gauge blocks are reference standards; handle with tongs or "
                      "gloves and never leave them on a bench.",
            "care": "Keep the measuring head and stand clean; protect the air supply from moisture on "
                    "pneumatic types; calibrate against a master at each shift.",
            "trades": "Fitter, Tool & Die Maker, Machinist, Mechanic Machine Tools Maintenance, "
                      "Instrument Mechanic",
            "ppe": "None",
        },
        {
            "code": "M-014", "name": "Vernier bevel protractor",
            "aka": "Universal bevel protractor, least count 5 minutes",
            "identify": "A protractor head with a vernier scale and an adjustable blade, used with a "
                        "stock and a clamp for measuring and setting angles.",
            "operate": "Set the blade against one face of the angle and the stock against the other, lock, "
                       "and read the degree scale plus the vernier minutes. Use the acute angle "
                       "attachment for small angles.",
            "safety": "The blade is sharp; do not force it into a rough corner \u2014 the reading will be "
                      "wrong.",
            "care": "Oil the slide; keep the scale legible; store in the case.",
            "trades": "Fitter, Tool & Die Maker, Machinist, Millwright",
            "ppe": "None",
        },
        {
            "code": "M-015", "name": "Sine bar and sine centre",
            "aka": "Sine bar 100/200 mm with rollers; sine centre",
            "identify": "A hardened steel bar with two accurately ground rollers at a known centre "
                        "distance; the angle is set by raising one roller on slip gauges. CITS Fitter "
                        "requires sine bar and its safety precautions explicitly.",
            "operate": "Place the bar on a surface plate with one roller on the plate and the other on a "
                       "slip gauge stack of height h; the angle is the arcsine of h divided by the roller "
                       "centre distance L. Check the setting with a dial indicator along the work.",
            "safety": "The sine bar is a reference standard and must not be clamped in a vice or used as "
                      "a support; a bent bar is useless. Keep slip gauges wringing-free of grit.",
            "care": "Handle by the ends, oil, store in the case; keep the roller centres clean; protect "
                    "from rust.",
            "trades": "Tool & Die Maker, Fitter (advanced), Machinist, Instrument Mechanic",
            "ppe": "None",
        },
        {
            "code": "M-016", "name": "Slip gauge (gauge block) set",
            "aka": "Johansson metric set, grade 0/1/2",
            "identify": "A set of hardened, lapped rectangular blocks of precise thickness supplied in a "
                        "wooden case; blocks wring together to build a dimension. CITS Fitter lists a "
                        "Johnson metric set.",
            "operate": "Wring blocks together by sliding one over the other with light pressure after "
                       "cleaning, build the required dimension from the largest blocks downward, and "
                       "use the stack to set a height gauge, sine bar or comparator.",
            "safety": "The lapped faces are easily scratched; a single particle of grit ruins the wring. "
                      "Never leave a stack assembled for long, as it can seize.",
            "care": "Wipe with a soft cloth and a volatile solvent, apply the supplied anti-corrosion "
                    "oil, and return each block to its slot; keep the case closed; recertify "
                    "periodically.",
            "trades": "Tool & Die Maker, Fitter (advanced), Machinist, Instrument Mechanic, Metrology lab",
            "ppe": "Handle with cotton gloves where specified",
        },
        {
            "code": "M-017", "name": "Feeler (thickness) gauge",
            "aka": "Feeler gauge 10 or 13 blades; spark plug gauge",
            "identify": "A set of thin, hardened, marked leaves of known thickness on a pivot.",
            "operate": "Insert the leaf between the surfaces and note whether it enters with a light drag; "
                       "combine leaves to build a thickness. Used for tappet clearances, bearing "
                       "clearances and contact breaker gaps.",
            "safety": "The leaves kink permanently if forced; a kinked leaf gives a false reading. Do not "
                      "use a feeler gauge to clean a gap.",
            "care": "Wipe off oil and grit, keep the leaves straight, and close the set.",
            "trades": "Mechanic Motor Vehicle, Diesel, Two Wheeler, Refrigeration & AC, Millwright",
            "ppe": "None",
        },
        {
            "code": "M-018", "name": "Radius gauge and fillet gauge",
            "aka": "Radius gauge set 1\u201325 mm; fillet or screw thread radius gauge",
            "identify": "A folding set of leaves with convex and concave radiused ends, marked in "
                        "millimetres.",
            "operate": "Match the leaf to the radius until no light shows through; use the convex leaf for "
                       "an internal fillet and the concave leaf for an external radius.",
            "safety": "Thin leaves bend easily; use the correct leaf and do not force it around a burr.",
            "care": "Wipe and oil; close the set; replace bent leaves.",
            "trades": "Fitter, Tool & Die Maker, Machinist, Sheet Metal",
            "ppe": "None",
        },
        {
            "code": "M-019", "name": "Wire gauge and sheet metal gauge",
            "aka": "Standard wire gauge (SWG); Birmingham gauge; metric sheet gauge",
            "identify": "A circular steel plate with slots of graded width, marked with gauge numbers or "
                        "millimetres, used to size wire and sheet.",
            "operate": "Insert the wire or sheet edge into the slot that it fits without slack; read the "
                       "gauge number and convert to millimetres using the standard table.",
            "safety": "The sheet edge is sharp; wear gloves when gauging a cut edge.",
            "care": "Keep the slots free of burrs and rust; check against a vernier for worn slots.",
            "trades": "Electrician, Electronics Mechanic, Sheet Metal Worker, Welder",
            "ppe": "Gloves for sheet edges",
        },
        {
            "code": "M-020", "name": "Surface roughness comparator plates",
            "aka": "Roughness standard N1\u2013N12; Rubert gauge",
            "identify": "Plates or blocks carrying machined specimens of known roughness, marked in Ra or "
                        "N grades, used visually and by touch.",
            "operate": "Compare the work surface with the standard under good light, by eye and with a "
                       "fingernail, and match the closest grade. CITS Fitter lists the N1\u2013N12 set.",
            "safety": "Finger contact with a rough surface can cut; use a light touch or a fingernail.",
            "care": "Keep clean and oiled to prevent corrosion of the reference surfaces.",
            "trades": "Fitter, Machinist, Tool & Die Maker, CITS Fitter",
            "ppe": "None",
        },
        {
            "code": "M-021", "name": "Spirit level and precision level",
            "aka": "Level 150/300/600 mm; engineer's precision level 0.02 mm/m",
            "identify": "A sealed glass vial with an air bubble in a metal or wooden frame; the bubble "
                        "centres when the base is horizontal. Precision types are graduated and read "
                        "0.02 mm per metre.",
            "operate": "Place on the surface, read the bubble position, then reverse the level end-for-end "
                       "and re-read to cancel any error in the level itself. Use for machine installation, "
                       "levelling and checking twist.",
            "safety": "Do not drop or heat the level; the vial is fragile and the frame distorts if "
                      "clamped.",
            "care": "Wipe the base free of grit; store in the case; check the vial is not loose.",
            "trades": "Millwright, Mechanic Machine Tools Maintenance, Fitter, Lift & Escalator, "
                      "Refrigeration & AC, Masonry",
            "ppe": "None",
        },
        {
            "code": "M-022", "name": "Straight edge and feeler for flatness",
            "aka": "Steel straight edge 450/1000 mm; knife edge",
            "identify": "A hardened, ground straight bar with a bevelled or knife edge for checking "
                        "flatness against a light source.",
            "operate": "Place the edge on the surface, view against a light source, and estimate the gap "
                       "or measure it with a feeler gauge. Check in several directions.",
            "safety": "The knife edge is sharp and the bar can spring; handle with both hands.",
            "care": "Oil and store hanging or flat on a padded support; never use as a lever.",
            "trades": "Fitter, Millwright, Machinist, Sheet Metal",
            "ppe": "None",
        },
        {
            "code": "M-023", "name": "Bore gauge (dial and telescopic)",
            "aka": "Dial bore gauge 18\u2013150 mm; cylinder bore gauge",
            "identify": "A dial indicator mounted on a body with a measuring plunger and a centralising "
                        "bridge, set to a known size with a micrometer or a setting ring.",
            "operate": "Zero the gauge in the setting master, insert into the bore, rock gently to find "
                       "the minimum, and read the deviation. Measure at several depths and in two "
                       "directions at 90 degrees to detect taper and ovality.",
            "safety": "Insert with the plunger compressed; forcing it into a rough or stepped bore damages "
                      "the anvil.",
            "care": "Oil the plunger; keep the setting ring clean; store in the case; recalibrate.",
            "trades": "Mechanic Motor Vehicle, Diesel, Fitter, Millwright, Refrigeration & AC",
            "ppe": "None",
        },
        {
            "code": "M-024", "name": "Coordinate measuring machine (CMM)",
            "aka": "CMM with touch probe; bridge or cantilever type",
            "identify": "A granite table carrying a moving bridge or column with a touch-trigger probe, "
                        "driven by software that records X, Y, Z coordinates and computes size, form and "
                        "position. CITS Fitter requires demonstration of CMM operation and its safety "
                        "precautions.",
            "operate": "Clean the table and the work, establish the part datum, qualify the probe with a "
                       "reference sphere, and then run the measuring programme or take manual points. "
                       "Interpret the report \u2014 size, position, concentricity, flatness \u2014 against "
                       "the drawing.",
            "safety": "Keep hands clear of the moving bridge, use the speed override and the emergency "
                      "stop, never lean on the granite table, and control the environment so that "
                      "temperature variation does not invalidate the measurement. Do not touch the probe "
                      "stylus.",
            "care": "Keep the machine clean and covered, the air supply dry and filtered, and the probe "
                    "calibrated; a CMM room is normally temperature controlled around 20 \u00b1 2 degrees C.",
            "trades": "Tool & Die Maker, Fitter (advanced), Machinist, CITS Fitter, Quality inspection",
            "ppe": "None; avoid loose clothing near moving axes",
        },
        {
            "code": "M-025", "name": "Optical profile projector and toolmaker's microscope",
            "aka": "Profile projector 300/500 mm screen; toolmaker's microscope",
            "identify": "An optical instrument that projects a magnified silhouette of a small part onto "
                        "a screen with measuring graticules, or a microscope with a measuring stage.",
            "operate": "Focus the profile, align the feature with the graticule or the stage coordinates, "
                       "and measure lengths and angles by moving the stage. Use for small profiles, "
                       "threads, form tools and inserts.",
            "safety": "Do not look at the light source directly; keep fingers out of the stage mechanism; "
                      "handle the part with tweezers as it is hot after machining.",
            "care": "Keep the optics covered and dust-free; clean lenses only with lens tissue; protect "
                    "the stage from swarf.",
            "trades": "Tool & Die Maker, Machinist (advanced), Fitter, Quality inspection",
            "ppe": "None",
        },
        {
            "code": "M-026", "name": "Brinell / Rockwell hardness tester",
            "aka": "Brinell hardness tester with ball indenter; Rockwell tester",
            "identify": "A machine that applies a known load through a ball or diamond indenter and "
                        "measures the indentation, either optically (Brinell) or by depth (Rockwell). "
                        "CITS Fitter lists a Brinell hardness tester.",
            "operate": "Prepare a flat, clean surface, select the load and indenter for the material and "
                       "thickness, raise the specimen to the anvil, apply the load, and read the "
                       "indentation. Take three readings and average.",
            "safety": "The load mechanism can crush fingers \u2014 keep hands clear of the anvil during "
                      "application, and support thin specimens so that the anvil does not punch through.",
            "care": "Keep the indenter and anvil clean; verify with a certified test block; service the "
                    "hydraulic or load cell system.",
            "trades": "Fitter, Forger & Heat Treater, Tool & Die Maker, Metallurgy lab",
            "ppe": "None; keep hands clear",
        },
        {
            "code": "M-027", "name": "Dumpy level, auto level and levelling staff",
            "aka": "Surveying level with tripod; telescopic staff 3 m",
            "identify": "A telescope with a spirit level and a levelling head on a tripod; the auto level "
                        "uses a compensator. The staff is graduated in metres and millimetres and is read "
                        "through the telescope.",
            "operate": "Set the tripod firm, level the instrument with the foot screws (or rely on the "
                       "compensator), take a backsight on a known reduced level, then foresights, and "
                       "reduce the levels by height of instrument or rise and fall method.",
            "safety": "Do not look at the sun through the telescope; carry the tripod over the shoulder "
                      "and tighten the head; keep the staff clear of overhead power lines.",
            "care": "Wipe the optics, keep the tripod screws oiled, store the instrument in its case with "
                    "desiccant.",
            "trades": "Surveyor, Draughtsman (Civil), Mason (Building Constructor), Architectural "
                      "Draughtsman",
            "ppe": "Safety shoes, high-visibility vest",
        },
        {
            "code": "M-028", "name": "Theodolite and total station",
            "aka": "Electronic theodolite; total station with EDM and data logger",
            "identify": "A precision angle-measuring instrument on a tribrach, with horizontal and "
                        "vertical circles; a total station adds an electronic distance meter, an on-board "
                        "computer and a data store.",
            "operate": "Set up over the station point, centre and level with the optical plummet and foot "
                       "screws, orient to a reference bearing, then observe angles and distances. Use the "
                       "instrument's programmes for setting out, traversing and coordinate measurement.",
            "safety": "Never look at the sun or a laser through the telescope; keep the instrument away "
                      "from traffic and always use a warning triangle; secure it against wind and "
                      "theft.",
            "care": "Keep dry, charge the battery properly, clean the optics, and have it calibrated. "
                    "Store in the case, not on the tripod.",
            "trades": "Surveyor, Draughtsman (Civil), Architectural Draughtsman, Mining",
            "ppe": "High-visibility vest, safety shoes, sun protection",
        },
        {
            "code": "M-029", "name": "Laser level, line laser and rotary laser",
            "aka": "Cross-line laser; self-levelling rotary laser with detector",
            "identify": "A battery-powered diode unit on a tripod or bracket that projects a levelled "
                        "line, cross or rotating plane; some have a receiver for outdoor use.",
            "operate": "Set on a firm base, allow the unit to self-level, and use the projected line for "
                       "setting heights, partitions, suspended ceilings, tiling and machine alignment.",
            "safety": "Never stare into the beam or point it at anyone's eyes. Most ITI units are class 2 "
                      "or class 3R; treat any laser as an eye hazard, do not use it on scaffolding in "
                      "wind, and never look through binoculars at the beam.",
            "care": "Remove the battery, store in the case, protect from shock, and check calibration "
                    "against a known level periodically.",
            "trades": "Mason, Carpenter, Plumber, Electrician, Interior Design, Refrigeration & AC",
            "ppe": "Laser safety glasses where specified",
        },
        {
            "code": "M-030", "name": "Plumb bob, square, bevel and marking gauge (building and wood)",
            "aka": "Plumb bob 250/500 g; try square; sliding bevel; mortise gauge",
            "identify": "The plumb bob is a pointed weight on a cord; the sliding bevel has an adjustable "
                        "blade for transferring angles; the mortise gauge has two adjustable spurs for "
                        "marking parallel lines on timber.",
            "operate": "Suspend the plumb bob from a line to establish verticality; set the bevel from a "
                       "protractor or the work and transfer angles; set the gauge to the timber thickness "
                       "and mark with the head against the face side.",
            "safety": "The plumb bob point is sharp and the weight can swing into the face; keep the cord "
                      "clear of people.",
            "care": "Oil the gauge screw and the bevel lock; keep the spur sharp; store the bob in its "
                    "case.",
            "trades": "Carpenter, Mason, Interior Design, Building Maintenance",
            "ppe": "Safety glasses, safety shoes",
        },
        {
            "code": "M-031", "name": "Tachometer and stroboscope",
            "aka": "Contact / optical tachometer; stroboscope",
            "identify": "The tachometer measures rotational speed by contact wheel, optical reflective "
                        "mark or magnetic pickup; the stroboscope flashes a xenon or LED lamp at an "
                        "adjustable rate to freeze a rotating part.",
            "operate": "For contact types apply the tip to the shaft centre and hold for a steady reading; "
                       "for optical types place a reflective mark and aim. For the stroboscope, adjust the "
                       "flash rate until the mark appears stationary.",
            "safety": "Contact tachometers put a hand near rotating shafts \u2014 keep sleeves clear and "
                      "use an optical type where possible. Stroboscopes can trigger photosensitive "
                      "epilepsy, and the apparent frozen motion is an illusion: never touch a part "
                      "believing it is stopped.",
            "care": "Keep the optical window clean; check the reflective tape; store dry.",
            "trades": "Mechanic Motor Vehicle, Millwright, Refrigeration & AC, Mechanic Machine Tools "
                      "Maintenance",
            "ppe": "Safety glasses, hearing protection",
        },
        {
            "code": "M-032", "name": "Vibration meter, sound level meter and lux meter",
            "aka": "Vibration pen; sound level meter dB(A); lux meter",
            "identify": "Battery-powered hand-held instruments with a sensor \u2014 an accelerometer, a "
                        "microphone or a photodiode \u2014 and a digital display of the measured quantity.",
            "operate": "Hold or mount the instrument at the measuring point, select the correct range and "
                       "weighting (for example dB(A) for hearing risk), and record the steady value. Use "
                       "for condition monitoring, noise surveys and lighting checks.",
            "safety": "Measurement is not a substitute for control \u2014 if noise exceeds about 85 dB(A), "
                      "hearing protection is required whatever the meter reads.",
            "care": "Calibrate with the reference source; protect the microphone from wind and dust; "
                    "remove the battery for storage.",
            "trades": "Health Safety & Environment, Millwright, Mechanic Machine Tools Maintenance, "
                      "Electrical maintenance",
            "ppe": "Hearing protection while measuring in noise",
        },
        {
            "code": "M-033", "name": "Handheld thermometer, infrared thermometer and pyrometer",
            "aka": "Dial thermometer; IR gun; thermocouple pyrometer",
            "identify": "A temperature sensor \u2014 bimetal dial, thermocouple, resistance thermometer or "
                        "infrared detector \u2014 with a display, sometimes with a laser sighting dot.",
            "operate": "For contact types place the probe in the medium or against the surface with good "
                       "contact; for infrared types set the emissivity, hold at the correct distance to "
                       "fill the field of view, and scan. Use for bearing temperatures, oven and furnace "
                       "checks, motor and panel temperatures, and refrigerant line temperatures.",
            "safety": "Infrared thermometers cannot measure through glass or shiny metal reliably, and the "
                      "laser sighting dot is an eye hazard. Do not touch a hot surface to 'confirm' a "
                      "reading.",
            "care": "Protect the lens; keep the probe clean; check against a known reference (ice point or "
                    "boiling water) periodically.",
            "trades": "Refrigeration & AC, Mechanic Motor Vehicle, Welder, Forger & Heat Treater, "
                      "Electrical maintenance, Food trades",
            "ppe": "Heat-resistant gloves near hot surfaces",
        },
        {
            "code": "M-034", "name": "Trammel and large-diameter measuring tools",
            "aka": "Trammel bar; inside/outside caliper for large work; pi tape",
            "identify": "A long bar with two adjustable, hardened points for scribing large circles and "
                        "transferring large distances; a pi tape measures circumference and reads "
                        "diameter directly.",
            "operate": "Set the points to the radius with a rule, lock, and scribe by rotating about a "
                       "centre; for pi tape wrap squarely around the diameter and read the diameter "
                       "scale.",
            "safety": "Long bars need two people or a support; a swinging point can injure the hand.",
            "care": "Oil the points and the lock screw; keep the tape clean and free of kinks.",
            "trades": "Sheet Metal, Welder/Fabricator, Fitter, Millwright, Plumber (large pipe)",
            "ppe": "Gloves, safety glasses",
        },
    ],
}

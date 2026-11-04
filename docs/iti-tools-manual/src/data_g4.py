# -*- coding: utf-8 -*-
"""Group T: Machine tools and machine-shop accessories."""

GROUP_T = {
    "letter": "T",
    "title": "Group 4 \u2014 Machine Tools and Machine-shop Accessories",
    "intro": "The machine tool turns a cutting edge into a controlled process, and it is where the "
             "largest share of serious injuries in an ITI occurs. The CTS Fitter outcome for the first "
             "year requires plain turning, facing, step turning, parting, chamfering, grooving, knurling, "
             "boring, taper turning and external V threading to specification; the CITS outcome adds CNC "
             "turning, part programming, DNC and machine erection and alignment. Each machine below "
             "assumes the machine-tool rules of Chapter 5 as a baseline, and the item notes only the "
             "specific hazards.",
    "items": [
        {
            "code": "T-001", "name": "Centre lathe (all-geared headstock)",
            "aka": "Lathe 1000 mm between centres, 150 mm centre height; SS and SC lathe",
            "identify": "A bed with V and flat ways carrying a headstock with a geared spindle, a tailstock, "
                        "a carriage with apron, cross slide and compound rest, a tool post, a lead screw "
                        "and a feed shaft. The CITS Fitter Annexure specifies an all-geared centre lathe "
                        "with 150 mm centre height, 1000 mm centre distance, three- and four-jaw chucks, "
                        "auto feed, safety guard, motorised coolant and lighting.",
            "operate": "Check the oil level and the chuck guard, select the spindle speed and feed from the "
                       "chart, mount the work in the chuck or between centres, set the tool height on "
                       "centre, and take a trial cut. Use the correct cutting speed for the material and "
                       "the tool, apply coolant, and measure with the machine stopped. Perform facing, "
                       "plain and step turning, parting, chamfering, grooving, knurling, boring, taper "
                       "turning and threading with the appropriate tool and feed.",
            "safety": "Remove the chuck key before starting \u2014 every time. Never leave a chuck key, "
                      "spanner or file on the machine. No gloves, no loose sleeves, no rings or watches; "
                      "tie back hair. Never reach across a rotating workpiece, and never measure, polish "
                      "or clear chips while the spindle turns. Guard the chuck, keep the workholding "
                      "tight, and clamp the toolbit with minimum overhang. Beware of long stringy swarf "
                      "\u2014 use a hook, not hands. Never brake the chuck by hand.",
            "care": "Oil the ways and the apron daily, top up the headstock oil, clean the coolant tank and "
                    "filter, brush the chips from the ways and the tray, check the belt tension and the "
                    "gib adjustment, and level the machine periodically.",
            "trades": "Turner, Fitter, Machinist, Tool & Die Maker, Mechanic Machine Tools Maintenance",
            "ppe": "Safety glasses, close-fitting coverall, safety shoes, no gloves",
        },
        {
            "code": "T-002", "name": "Lathe chucks \u2014 three-jaw self-centring and four-jaw independent",
            "aka": "3-jaw scroll chuck 125/160 mm; 4-jaw independent chuck; collet chuck",
            "identify": "The three-jaw chuck has a scroll plate that moves all jaws together for round and "
                        "hexagonal work; the four-jaw has independent screws for irregular work and for "
                        "accurate setting with a dial indicator. Collets grip small round work accurately.",
            "operate": "Mount on a clean spindle nose, tighten all jaws in sequence, and check that the work "
                       "runs true. For the four-jaw, set each jaw with the chuck key and clock the work "
                       "with a dial indicator, halving the error at each adjustment. Support long work "
                       "with the tailstock or a steady.",
            "safety": "A chuck is heavy \u2014 use a chuck cradle or a second person and never lift it by the "
                      "jaws. Ensure the jaws and the work do not project beyond the safe margin. Never "
                      "start the spindle with the chuck key in place. Do not grip work on a rough cast "
                      "surface without soft jaws or packing.",
            "care": "Strip, clean and grease the scroll and jaws periodically; keep the jaw threads free of "
                    "swarf; check for bell-mouthed jaws; store chucks on a wooden rack.",
            "trades": "Turner, Fitter, Machinist, Tool & Die Maker",
            "ppe": "Safety glasses, safety shoes, gloves only for handling the chuck when the machine is "
                   "isolated",
        },
        {
            "code": "T-003", "name": "Lathe cutting tools \u2014 HSS and carbide inserts",
            "aka": "HSS bit 6/8/10 x 100 mm; brazed carbide tool; indexable insert holder",
            "identify": "A single-point tool with a ground cutting edge: HSS bits ground to the correct "
                        "rake, clearance and nose radius, brazed carbide tips, or indexable inserts in a "
                        "holder with the manufacturer's grade and geometry. The CITS Annexure lists HSS "
                        "lathe tool sets and bits.",
            "operate": "Select the tool geometry for the material and operation, set the tool exactly on "
                       "centre with a gauge, use minimum overhang, and choose the speed, feed and depth of "
                       "cut. Grind HSS tools on a bench grinder with a slight nose radius and hone the "
                       "edge on an oilstone.",
            "safety": "A tool that is below centre or has excessive overhang will dig in and can break or "
                      "throw the work. Keep hands clear when setting the tool and never touch a tool or "
                      "chip straight after cutting \u2014 it is hot.",
            "care": "Hone HSS edges frequently, replace a chipped insert and the seat, keep the tool post "
                    "and shims clean, and store tools in a rack with the edges protected.",
            "trades": "Turner, Fitter, Machinist, Tool & Die Maker",
            "ppe": "Safety glasses; heat-resistant gloves when handling hot tools",
        },
        {
            "code": "T-004", "name": "Tailstock, live centre, dead centre and steady rest",
            "aka": "Revolving centre; dead centre; fixed steady; travelling steady",
            "identify": "The tailstock slides on the bed and carries a quill with a Morse taper socket; the "
                        "live centre rotates with the work, the dead centre is fixed and needs lubrication; "
                        "the fixed steady supports long work from the bed and the travelling steady "
                        "follows the carriage.",
            "operate": "Drill and countersink the work end, lubricate a dead centre, bring the tailstock up "
                       "and lock it, and apply light pressure with the quill. Set the steady fingers to a "
                       "running fit with oil.",
            "safety": "A loose tailstock or a dry dead centre will seize and burn the centre hole or throw "
                      "the work. Do not over-tighten the quill, which bows the work.",
            "care": "Keep the tapers clean and dry, oil the quill, check the centre point for damage, and "
                    "adjust the steady fingers for the work diameter.",
            "trades": "Turner, Fitter, Machinist",
            "ppe": "Safety glasses",
        },
        {
            "code": "T-005", "name": "Vertical milling machine and horizontal milling machine",
            "aka": "Turret / knee-type vertical mill; horizontal mill; universal mill",
            "identify": "A machine with a vertically or horizontally oriented rotating spindle carrying a "
                        "milling cutter, on a table with X, Y and Z movement, with a quill, a drawbar and a "
                        "spindle taper (R8, ISO 30/40).",
            "operate": "Clamp the work in a machine vice or on the table with clamps and a dial indicator, "
                       "set the spindle speed and feed for the cutter and material, select up-cut or "
                       "down-cut milling direction, and use coolant. Use an edge finder or a dial test "
                       "indicator for setting the datum, and take a trial cut with the cutter clear.",
            "safety": "Milling cutters are multi-tooth and grab; keep hands well away, use a brush to clear "
                      "chips and never reach across the table while the spindle turns. Ensure the drawbar "
                      "is tight and the cutter rotates in the correct direction. Wear glasses or a face "
                      "shield and never use gloves near the cutter.",
            "care": "Oil the ways and the lead screws, keep the table and T-slots clean, check the gib "
                    "adjustment, and clean the coolant system.",
            "trades": "Machinist, Tool & Die Maker, Fitter (advanced), Millwright",
            "ppe": "Safety glasses or face shield, hearing protection, no gloves",
        },
        {
            "code": "T-006", "name": "Milling cutters and arbors",
            "aka": "End mill; slot drill; face mill; side and face cutter; slitting saw; boring head",
            "identify": "Multi-tooth cutters in HSS, cobalt or carbide: end mills cut on the end and the "
                        "periphery, slot drills can plunge, face mills plane a surface, side and face "
                        "cutters cut slots, slitting saws part off, and the boring head fits the spindle "
                        "for accurate hole sizing.",
            "operate": "Select the cutter for the feature and the material, mount it with minimum overhang "
                       "in a clean arbor or collet, and set the speed for the cutter diameter and material. "
                       "Climb mill only with backlash eliminators, otherwise conventional mill.",
            "safety": "Cutters are sharp and brittle \u2014 handle with a cloth, and never with the machine "
                      "running. A cutter that is too large for the arbor or too long in overhang will "
                      "vibrate and shatter.",
            "care": "Clean the flutes, protect the edges in a rack, and have cutters reground when the "
                    "edges dull; keep the arbors and spacers clean.",
            "trades": "Machinist, Tool & Die Maker, Fitter",
            "ppe": "Safety glasses, no gloves, hearing protection",
        },
        {
            "code": "T-007", "name": "Shaping machine and planing machine",
            "aka": "Shaper with clapper box; planer; slotter",
            "identify": "The shaper drives a single-point tool in a reciprocating ram over a stationary "
                        "workpiece on a cross-sliding table; the planer moves the work under a stationary "
                        "tool; the slotter cuts internal keyways with a vertical ram.",
            "operate": "Clamp the work, set the stroke length and position, set the table feed, and use the "
                       "clapper box so that the tool lifts on the return stroke. Take light finishing "
                       "cuts with a round-nosed tool.",
            "safety": "The ram and the table move under power \u2014 keep clear of the full stroke, guard "
                      "the drive and check the tool is clear before starting. Chips are hot and sharp; a "
                      "shaper can throw them some distance.",
            "care": "Oil the ram ways and the lead screws, check the stroke adjustment and the clapper "
                    "spring, and clean the swarf from the table.",
            "trades": "Machinist, Fitter, Tool & Die Maker, Millwright",
            "ppe": "Safety glasses or face shield, no gloves",
        },
        {
            "code": "T-008", "name": "Grinding machines \u2014 surface, cylindrical and tool and cutter",
            "aka": "Surface grinder with magnetic chuck; cylindrical grinder; tool and cutter grinder",
            "identify": "A precision machine with a high-speed grinding wheel spindle, a work table and, on "
                        "cylindrical types, a workhead and tailstock. The surface grinder usually has a "
                        "magnetic chuck.",
            "operate": "Dress the wheel, set the depth of cut at a few hundredths of a millimetre, balance "
                       "the wheel, and use copious coolant. For the surface grinder, check the magnet is "
                       "energised, place the work with a stop block for small parts, and use down-feed in "
                       "small increments.",
            "safety": "Grinding dust is a respiratory hazard and wheel burst is the critical hazard. Check "
                      "the wheel speed rating, ring-test, use the guard and the eye shield, stand to one "
                      "side when starting, and never grind on the side of a straight wheel. Beware of "
                      "residual magnetism and of the work being thrown if the magnet fails.",
            "care": "Balance and dress wheels, change the coolant and clean the settling tank, check the "
                    "magnetic chuck for holding force, and keep the ways oiled.",
            "trades": "Machinist (Grinder), Tool & Die Maker, Fitter (advanced), Mechanic Machine Tools "
                      "Maintenance",
            "ppe": "Safety glasses or face shield, dust mask or LEV, hearing protection, no gloves",
        },
        {
            "code": "T-009", "name": "CNC lathe (turning centre)",
            "aka": "CNC lathe with Fanuc/Siemens control; teach lathe",
            "identify": "A lathe with a servo-driven carriage and cross slide, a turret with multiple tools, "
                        "an enclosure with a sliding door and interlock, a control panel with a screen, and "
                        "an RS-232, USB or network interface. CITS Fitter requires CNC turning practice, "
                        "classification of CNC systems, part programming and DNC.",
            "operate": "Power up and reference the axes, load the programme, set the tool offsets and the "
                       "work offset (G54), run a dry run with rapid override reduced and single block, "
                       "then machine. Inspect the first component and use tool-wear offsets to correct "
                       "size. Write simple G-code programmes with G00, G01, G02/G03, canned cycles and "
                       "tool changes.",
            "safety": "Never open the enclosure door while the spindle turns \u2014 the interlock should "
                      "prevent it, and it must never be bypassed. Verify tool offsets before the first cut "
                      "because a wrong offset drives the tool into the chuck. Keep the door closed, the "
                      "panel clean and hands clear of the turret. Know the feed hold, single block and "
                      "emergency stop before running any programme.",
            "care": "Change the way-lube oil and hydraulic oil, clean the coolant and the chip conveyor, "
                    "back up programmes and parameters, and preserve the batteries that hold the "
                    "parameters.",
            "trades": "Turner, Fitter (advanced), Machinist, Operator Advanced Machine Tools",
            "ppe": "Safety glasses, safety shoes, no loose clothing; follow the enclosure",
        },
        {
            "code": "T-010", "name": "CNC machining centre (vertical and horizontal)",
            "aka": "VMC with automatic tool changer; HMC; turn-mill centre",
            "identify": "A CNC mill in an enclosure with a tool magazine and automatic tool changer, a "
                        "spindle with a taper, coolant through nozzles, a chip conveyor and a control "
                        "panel.",
            "operate": "Reference the axes, load the programme and tool table, set the work offset with an "
                       "edge finder or probe, simulate, run single block with reduced feed and rapid, then "
                       "run. Always verify the tool length and diameter offsets.",
            "safety": "The tool changer moves fast and without warning \u2014 stay out of the enclosure. "
                      "Never bypass the door interlock. Verify the programme and the offsets before the "
                      "first cut; most collisions and injuries come from a wrong offset or a wrong tool.",
            "care": "Clean the taper, check the coolant concentration, clean the chip conveyor, and back "
                    "up the parameters.",
            "trades": "Machinist, Tool & Die Maker, Operator Advanced Machine Tools, Additive Manufacturing",
            "ppe": "Safety glasses, safety shoes",
        },
        {
            "code": "T-011", "name": "Machine vice, angle plate and clamping kit",
            "aka": "Machine vice 100/150 mm; step clamps and T-nuts; angle plate; parallel blocks",
            "identify": "A precision vice with a screw and a fixed jaw, bolted to the T-slots; a clamping "
                        "kit with step clamps, T-nuts, studs and a clamp bar; hardened parallel blocks to "
                        "raise the work.",
            "operate": "Clean the table and the T-slots, align the vice with a dial test indicator, seat the "
                       "work on parallels so it is not rocked by chips, and tighten the clamp nearest the "
                       "cut first. Tap the work down with a soft mallet while tightening.",
            "safety": "Work that is not seated or clamped can be thrown from the machine \u2014 always check "
                      "that the jaws bear on the full face and that the clamps are clear of the cutter "
                      "path. Do not over-tighten and distort thin work.",
            "care": "Stone any burrs from the table and the vice base, oil the screw and the T-nuts, and "
                    "store clamps in a tray.",
            "trades": "Machinist, Fitter, Tool & Die Maker, Millwright",
            "ppe": "Gloves when handling heavy vices, safety shoes",
        },
        {
            "code": "T-012", "name": "Arbor press and broaching press",
            "aka": "Hand arbor press; broaching machine",
            "identify": "A press with a rack and pinion or a hydraulic ram, used with broaches, bearing "
                        "installation tools and presses.",
            "operate": "Centre the work and the tool under the ram, apply pressure slowly and straight, and "
                       "use the correct broach and shims.",
            "safety": "Broaches are hard and brittle; a misaligned broach shatters. Use a guard and keep "
                      "hands clear.",
            "care": "Oil the rack and the ram, keep the broach guides clean, and store broaches in their "
                    "holders.",
            "trades": "Fitter, Tool & Die Maker, Mechanic Machine Tools Maintenance",
            "ppe": "Safety glasses, gloves",
        },
        {
            "code": "T-013", "name": "Machine tool alignment tools",
            "aka": "Test mandrel; dial test indicator; precision level; laser alignment kit",
            "identify": "Precision instruments used to check that a machine is level, that the spindle is "
                        "true, that the tailstock is aligned with the headstock, and that the ways are "
                        "straight.",
            "operate": "Level the bed with a precision level in both directions, sweep the spindle taper "
                       "with a dial indicator on a test mandrel to check runout, and turn a test bar "
                       "between centres to check tailstock alignment.",
            "safety": "Isolate and lock off the machine before making alignment checks, and remove all "
                      "instruments before restarting.",
            "care": "Calibrate the instruments, keep them in cases, and clean the mounting surfaces.",
            "trades": "Mechanic Machine Tools Maintenance, Millwright, Fitter, Lift & Escalator",
            "ppe": "None beyond normal shop PPE",
        },
        {
            "code": "T-014", "name": "Coolant system, chip conveyor and swarf handling",
            "aka": "Coolant pump and tank; suds; chip conveyor; swarf bin",
            "identify": "A pump, tank and nozzle system delivering cutting fluid to the cutting zone; a "
                        "conveyor or auger to remove chips from the machine; a swarf bin for collection.",
            "operate": "Check the level and concentration, direct the nozzle at the cutting zone, and clean "
                       "the tank and strainer on schedule. Never use compressed air to clear chips.",
            "safety": "Coolant mist is a respiratory irritant and can cause dermatitis \u2014 keep the "
                      "concentration correct, use local exhaust or a mask, and wear gloves. Wet floors "
                      "around machines are a serious slip hazard; mop up and use drip trays.",
            "care": "Skim tramp oil, change the coolant periodically, clean the tank, and dispose of used "
                    "coolant and swarf as hazardous or recyclable waste per the local rules.",
            "trades": "All machine shop trades",
            "ppe": "Gloves, apron, safety shoes, mask where mist forms",
        },
        {
            "code": "T-015", "name": "Additive manufacturing (3D printer) and accessory tools",
            "aka": "FDM printer; resin (SLA) printer; filament dryer; deburring and support-removal tools",
            "identify": "A computer-controlled machine that builds parts layer by layer from filament "
                        "(FDM) or resin (SLA); accessories include nozzles, build plates, scrapers, "
                        "flush cutters, tweezers, IPA for resin cleaning and a post-cure unit. The Additive "
                        "Manufacturing trade and the CITS emerging-technology outcome both require it.",
            "operate": "Prepare the model in the slicer, check the bed levelling and the filament, start the "
                       "print, and monitor the first layer. Remove supports with flush cutters and "
                       "deburring tools and post-cure resin parts as specified.",
            "safety": "The nozzle and the heated bed reach 200\u2013300 degrees C and cause serious burns. "
                      "Resin is a skin sensitiser and an eye irritant \u2014 wear nitrile gloves and "
                      "goggles, keep the printer ventilated, and never pour resin down a drain. Enclosure "
                      "fumes from ABS and ASA need extraction. Keep fingers out of moving axes and never "
                      "reach into a printer that is running.",
            "care": "Clean the nozzle, level the bed, store filament dry, filter the resin, clean the "
                    "screen, and dispose of waste per the resin manufacturer's instructions.",
            "trades": "Additive Manufacturing, Tool & Die Maker (prototyping), Draughtsman, "
                      "CITS emerging technology",
            "ppe": "Nitrile gloves, goggles, ventilation; heat-resistant gloves for hot parts",
        },
    ],
}

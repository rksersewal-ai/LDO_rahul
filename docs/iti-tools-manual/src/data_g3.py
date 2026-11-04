# -*- coding: utf-8 -*-
"""Group C: Cutting, drilling, sawing, shearing and grinding."""

GROUP_C = {
    "title": "Group 3 \u2014 Cutting, Drilling, Sawing, Shearing and Grinding",
    "letter": "C",
    "intro": "This group is where the hand tool becomes a powered tool and where the injury severity "
             "rises sharply: rotating spindles, abrasive wheels that burst, blades that grab. The CTS "
             "curriculum places drilling, reaming, tapping and dieing within the first year of every "
             "engineering trade and introduces power saws, pedestal grinders and lathes under specific "
             "learning outcomes on machine operation and overhauling. Everything here requires the "
             "power-tool and machine-tool rules of Chapter 5 in addition to the item-specific notes.",
    "items": [
        {
            "code": "C-001", "name": "Twist drill (straight and taper shank)",
            "aka": "HSS drill 1.5\u201325 mm straight shank; Morse taper shank 6\u201325 mm",
            "identify": "A fluted cylindrical cutter with two helical flutes, a 118 degree point angle "
                        "(135 degrees for harder materials), a chisel edge and either a straight shank for "
                        "a chuck or a tapered shank to fit a spindle sleeve.",
            "operate": "Select the drill for the material and the tapping size, centre-punch and start with "
                       "a pilot drill for large sizes, set the correct spindle speed \u2014 slower for "
                       "larger diameters and harder materials \u2014 and use coolant. Clear the flutes by "
                       "withdrawing the drill (peck drilling) in deep holes. Sharpen on a bench grinder at "
                       "the correct point angle and with equal lip lengths.",
            "safety": "Never hold the work by hand; use a machine vice or clamp. Wear glasses and keep "
                      "sleeves and hair clear of the rotating drill. Do not use a drill with a bent shank "
                      "or a chipped point. Ease the pressure as the drill breaks through so that it does "
                      "not screw into the work.",
            "care": "Wipe off coolant and swarf, oil lightly, store in a drill index so that the edges are "
                    "protected, and re-point when the margins show wear.",
            "trades": "All engineering trades",
            "ppe": "Safety glasses, no gloves near the spindle, hearing protection for high-speed work",
        },
        {
            "code": "C-002", "name": "Drill chuck, key and Morse taper sleeve",
            "aka": "Key type and keyless chuck 0\u201313 mm; drill sleeve MT1\u2013MT2\u2013MT3; drift",
            "identify": "A three-jaw scroll chuck with a taper shank; the key or a knurled collar tightens "
                        "the jaws. Sleeves adapt a smaller taper shank to a larger spindle socket; a "
                        "drift removes taper-shank tools.",
            "operate": "Insert the drill fully into the jaws and tighten all three holes of a key chuck "
                       "in turn. For taper shanks, clean both tapers, seat firmly with a light tap, and "
                       "remove with a drift through the slot.",
            "safety": "Remove the chuck key immediately after tightening and never leave it in the chuck "
                      "\u2014 this is the single most common drill-press injury. Use the correct sleeve; "
                      "a mismatched taper spins and scores the spindle.",
            "care": "Keep the jaws and tapers clean and dry (never oil a Morse taper); replace a chuck with "
                    "worn jaws; store keys on a chain at the machine.",
            "trades": "All engineering trades",
            "ppe": "Safety glasses",
        },
        {
            "code": "C-003", "name": "Portable electric drill",
            "aka": "Hand drill 6/10/13 mm; hammer drill; impact driver",
            "identify": "A pistol or body-grip power tool with a chuck, a trigger switch and often a "
                        "variable speed control and a reversing switch. Hammer drills add a percussion "
                        "action; impact drivers use a rotary impact mechanism with a hex bit holder.",
            "operate": "Select the correct bit and speed, mark and centre-punch the hole, hold the drill "
                       "square with both hands, start slowly to establish the hole, then increase "
                       "pressure. Use the hammer action only for masonry. Clear the flutes "
                       "periodically.",
            "safety": "Use an RCD-protected supply, check the cable and plug, and never drill into a wall "
                      "without checking for concealed cables and pipes. Keep the bit sharp; a blunt bit "
                      "needs force and can snap. Watch for reaction torque when a large bit grabs, and "
                      "never wear loose gloves or sleeves. Wear hearing and eye protection.",
            "care": "Clean the chuck and vents of dust; do not use the cable to carry the tool; have "
                    "brushes and the cable replaced by a competent person.",
            "trades": "Electrician, Plumber, Carpenter, Fitter, Fabricator, Refrigeration & AC",
            "ppe": "Safety glasses, ear plugs, dust mask, no loose clothing",
        },
        {
            "code": "C-004", "name": "Pillar (bench) drilling machine",
            "aka": "Pillar drill 13/20 mm capacity; radial drill",
            "identify": "A vertical column carrying a table and a head with a spindle, driven by a belt or "
                        "gearbox giving several speeds, with a feed handle. A radial drill has a rotating "
                        "arm for large work.",
            "operate": "Clamp the work to the table or in a machine vice, set the spindle speed from the "
                       "chart for the material and drill size, set the depth stop, align the drill with "
                       "the punch mark, and feed steadily with coolant. Retract to clear chips on deep "
                       "holes.",
            "safety": "Never hold work by hand \u2014 it will spin. Guard the belt and pulley, keep the "
                      "chuck key on its chain, and never brake the spindle with the hand. Clamp the "
                      "table and the head before drilling, and make sure the drill is clear of the "
                      "table before starting.",
            "care": "Lubricate the spindle and the column, keep the table T-slots clean, change the "
                    "coolant, and check the belt tension.",
            "trades": "Fitter, Turner, Machinist, Fabricator, Tool & Die Maker",
            "ppe": "Safety glasses, hearing protection, no gloves",
        },
        {
            "code": "C-005", "name": "Radial arm drill and gang drill",
            "aka": "Radial drilling machine; multi-spindle gang drill",
            "identify": "A heavy drill with a horizontal arm that swings and slides on a column, allowing "
                        "the spindle to be positioned over large work; the gang drill mounts several "
                        "spindles on one table for sequential operations.",
            "operate": "Clamp the work to the base or a table, release the arm clamps, position the "
                       "spindle, re-clamp the arm and head before drilling, then drill with the correct "
                       "speed and feed.",
            "safety": "Always lock the arm and the head before the drill engages \u2014 an unlocked arm "
                      "will swing under load. Large work needs a crane or two people; never lift it by "
                      "hand.",
            "care": "Lubricate the arm ways and the column; keep the locks adjusted; check the coolant "
                    "system.",
            "trades": "Fabrication, Heavy engineering, Fitter, Machinist",
            "ppe": "Safety glasses, hearing protection, steel-toe boots",
        },
        {
            "code": "C-006", "name": "Hole saw, annular cutter and step drill",
            "aka": "Bi-metal hole saw 14\u2013150 mm; annular cutter; cone/step drill",
            "identify": "The hole saw is a toothed cup on an arbor with a pilot drill; the annular cutter "
                        "is a hollow, multi-tooth cutter for thick plate; the step drill is a conical "
                        "fluted drill that enlarges a hole in thin sheet in steps.",
            "operate": "Use a low speed and steady pressure with cutting fluid, and start with the pilot "
                       "drill. For an annular cutter use a magnetic base drill with the safety chain "
                       "attached. Support thin sheet with a backing board.",
            "safety": "Hole saws grab badly at breakthrough \u2014 use a support and keep both hands on "
                      "the tool. Annular cutters on a magnetic drill must always be used with the safety "
                      "chain and with the magnet confirmed on clean steel.",
            "care": "Remove the swarf from the teeth, oil, replace the pilot drill when worn, and do not "
                    "overheat the teeth.",
            "trades": "Electrician, Plumber, Fabricator, Refrigeration & AC, Carpenter",
            "ppe": "Safety glasses, face shield, hearing protection, gloves away from the spindle",
        },
        {
            "code": "C-007", "name": "Magnetic base drilling machine",
            "aka": "Mag drill with annular cutter; electromagnetic drill press",
            "identify": "A portable drill with an electromagnetic base that clamps to steel plate when "
                        "energised, on a slide with a feed lever and a coolant bottle.",
            "operate": "Clean the steel surface, position the magnet, energise and confirm the holding "
                       "force, attach the safety chain, then drill with an annular cutter at the "
                       "recommended speed and feed.",
            "safety": "If the power fails the magnet releases \u2014 always fit the safety chain. Do not "
                      "use on non-magnetic steel or on a painted or rusty surface. Keep the cable clear "
                      "of the cutter and do not drill overhead without a secondary restraint.",
            "care": "Clean the magnet face; check the chain; oil the slide; replace cutters when dull.",
            "trades": "Fabrication, Welder, Electrician (busbar and panel work), Millwright",
            "ppe": "Safety glasses, face shield, hearing protection",
        },
        {
            "code": "C-008", "name": "Abrasive cut-off saw (chop saw)",
            "aka": "Cut-off machine 355 mm with abrasive or carbide blade",
            "identify": "A bench or floor machine with a hinged head carrying a large abrasive or toothed "
                        "blade in a guard, with a vice for clamping the section.",
            "operate": "Clamp the work firmly, set the mitre if needed, allow the blade to reach full speed "
                       "before contact, and cut with a light, steady pressure, letting the blade do the "
                       "work. Do not cut thin material without support.",
            "safety": "The blade must be rated for the machine speed and be undamaged. Always use the "
                      "guard and the vice; never cut freehand. Sparks and hot burrs fly far \u2014 clear "
                      "the area of flammables and wear a face shield and hearing protection. A cut-off "
                      "blade can shatter if it is side-loaded.",
            "care": "Inspect the blade for cracks and missing segments, check the guard and the vice, "
                    "clean the spark deflector, and earth the machine.",
            "trades": "Welder/Fabricator, Fitter, Plumber, Electrician, Refrigeration & AC",
            "ppe": "Face shield, hearing protection, gloves, apron",
        },
        {
            "code": "C-009", "name": "Power hacksaw and band saw",
            "aka": "Hydraulic power hacksaw; horizontal band saw; vertical band saw",
            "identify": "A machine that feeds a toothed blade through clamped work under hydraulic or "
                        "gravity pressure; the horizontal band saw uses a continuous blade loop and is "
                        "faster and quieter; vertical types are used for contour cutting.",
            "operate": "Clamp the work, select the blade pitch and the cutting speed for the material, set "
                       "the feed and coolant, position the blade clear of the vice, and start. Allow the "
                       "machine to finish the cut and lift the head before unloading.",
            "safety": "Keep hands clear of the blade path and never reach into the cut to clear chips "
                      "while the blade runs. Keep the blade guard and the wheel covers fitted. A blade "
                      "that is too coarse for thin work will strip teeth.",
            "care": "Check the blade tension and guide alignment, brush the chips from the machine, top up "
                    "the coolant, and change the blade when it is dull or has missing teeth.",
            "trades": "Fitter, Turner, Fabricator, Tool & Die Maker, Mechanic Machine Tools Maintenance",
            "ppe": "Safety glasses, hearing protection, no gloves near the blade",
        },
        {
            "code": "C-010", "name": "Bench grinder and pedestal grinder",
            "aka": "Double-ended grinder 150/200 mm; tool grinder",
            "identify": "One or two abrasive wheels on a common spindle driven by a motor, with adjustable "
                        "tool rests, spark deflectors and eye shields, mounted on a bench or pedestal.",
            "operate": "Stand to one side while starting, check the wheel runs true, set the rest to within "
                       "about 2 mm of the wheel and the tongue guard within about 3 mm, hold the work "
                       "against the rest and apply light pressure, quenching carbon-steel tools "
                       "frequently in water. Use the correct wheel grade for the material.",
            "safety": "Ring-test bonded wheels and match the wheel's rated speed to the machine. Wear "
                      "goggles or a face shield, never wear gloves or loose sleeves, and grind on the "
                      "face of the wheel only. Do not grind aluminium or wood on a standard wheel "
                      "\u2014 it loads the wheel, which then bursts. Never stand in line with the wheel "
                      "when starting.",
            "care": "Dress the wheel with a wheel dresser to keep it true and free-cutting, adjust the "
                    "rests as the wheel wears, keep the coolant clean, and replace a wheel that is "
                    "cracked, out of balance or worn below the marked minimum.",
            "trades": "All engineering, fabrication and maintenance trades",
            "ppe": "Goggles or face shield, dust mask, hearing protection, no gloves",
        },
        {
            "code": "C-011", "name": "Portable angle grinder",
            "aka": "4 inch / 5 inch / 7 inch angle grinder; die grinder",
            "identify": "A high-speed right-angle tool with a side handle, a wheel guard and a spindle lock, "
                        "taking depressed-centre grinding discs, cut-off discs, flap discs or wire "
                        "brushes. The die grinder is a smaller, higher-speed straight tool for burrs.",
            "operate": "Select the disc for the material and the task, fit it with the correct flanges, set "
                       "the guard to protect the operator, hold with both hands, let the disc reach full "
                       "speed before contact, and grind at a shallow angle. Use a cutting disc for "
                       "cutting only, without side pressure.",
            "safety": "This is one of the highest-risk tools in the shop. Always use the guard. Check the "
                      "disc speed rating against the tool, inspect for damage and never fit a disc larger "
                      "than the guard allows. Wear a face shield, hearing protection, dust mask and "
                      "apron; keep sparks away from the body and from flammables. A disc that breaks "
                      "ejects fragments at high speed, so never remove the guard and never grind without "
                      "the side handle.",
            "care": "Clean the air vents, check the cable and the switch, replace flanges if damaged, and "
                    "have the tool serviced when the bearings sound rough.",
            "trades": "Welder/Fabricator, Fitter, Plumber, Masonry, Mechanic Motor Vehicle, "
                      "Refrigeration & AC",
            "ppe": "Face shield, hearing protection, dust mask or respirator, apron and gloves",
        },
        {
            "code": "C-012", "name": "Shearing machine, guillotine and nibbler",
            "aka": "Hand lever shear; treadle guillotine; power shears; nibbler",
            "identify": "The guillotine holds sheet between a fixed bed and a moving blade driven by a "
                        "lever, treadle or motor; the nibbler punches small bites with a reciprocating "
                        "punch; hand shears are bench-mounted lever blades.",
            "operate": "Set the back gauge for the cut width, hold the sheet flat against the bed and the "
                       "gauge, keep fingers well behind the hold-down, and make the cut with a firm "
                       "stroke. For the nibbler, start from an edge or a drilled hole and follow the "
                       "marked line.",
            "safety": "Guillotine blades are extremely sharp and the hold-down can crush fingers \u2014 use "
                      "a hold-down and keep hands at least a hand's width from the blade line. Fit the "
                      "finger guard and never remove it. Nibblers throw small sharp slugs; wear a face "
                      "shield.",
            "care": "Oil the blade guides, check the blade clearance for the sheet thickness, keep the "
                    "hold-down working, and sharpen or reverse the blades when dull.",
            "trades": "Sheet Metal Worker, Fabricator, Refrigeration & AC, Electrician (panel work)",
            "ppe": "Cut-resistant gloves, safety glasses or face shield, hearing protection",
        },
        {
            "code": "C-013", "name": "Bandsaw blade, hacksaw blade and jigsaw blade",
            "aka": "Bimetal band 6\u201332 TPI; HSS hacksaw blade; jigsaw blade T-shank",
            "identify": "Toothed cutting blades supplied by pitch and tooth material: bimetal for general "
                        "cutting, carbide for hard materials, HSS for hacksaws. Pitch is chosen by "
                        "section thickness.",
            "operate": "Fit with the teeth pointing in the cutting direction (forward on a hacksaw, "
                       "towards the motor on a band saw) and tension correctly. Use a coarser pitch for "
                       "thick sections, a finer pitch for thin sections and tube.",
            "safety": "Damaged or blunt blades need force and break; replace rather than persist. Never "
                      "touch a running blade, and never reach into the cut.",
            "care": "Keep blades dry and oiled before storage; store in a rack so that the teeth are not "
                    "blunted against other tools.",
            "trades": "All metal, wood and fabrication trades",
            "ppe": "Safety glasses, hearing protection",
        },
        {
            "code": "C-014", "name": "Files, rasps and rotary burrs (power)",
            "aka": "File 250/300 mm; wood rasp; carbide rotary burr (rotary file)",
            "identify": "Files are covered in Group 1; here the reference is to powered versions \u2014 "
                        "rotary burrs in a die grinder or drill, and rasps for wood. A burr is a "
                        "carbide, double-cut or single-cut head in various shapes (ball, cylinder, "
                        "tree, cone).",
            "operate": "Run the burr at the speed recommended for the material, keep it moving so that it "
                       "does not groove the work, and use light pressure. For wood rasps, work along "
                       "the grain.",
            "safety": "Rotary burrs grab and kick on edges; use both hands, a face shield, and no gloves "
                      "on a fast spindle. Carbide burrs shatter if dropped.",
            "care": "Clean the teeth with a file card or a wire brush; oil lightly; discard chipped "
                    "burrs.",
            "trades": "Tool & Die Maker, Fitter, Carpenter, Fabricator",
            "ppe": "Face shield, dust mask, hearing protection",
        },
        {
            "code": "C-015", "name": "Reamer, counterbore and countersink",
            "aka": "Machine reamer; counterbore with pilot; countersink 60/82/90 degree",
            "identify": "The machine reamer is a fluted cutter with a chamfered lead for sizing a drilled "
                        "hole; the counterbore has a pilot that follows the drilled hole to cut a flat "
                        "seat; the countersink cuts a conical seat for a screw head.",
            "operate": "Drill undersize, then ream at about two-thirds of the drilling speed with twice "
                       "the feed and plenty of cutting fluid, feeding in one direction only. Use the "
                       "correct pilot and a slow speed for counterboring and countersinking.",
            "safety": "Reamers must never be turned backwards; doing so dulls them and can seize. Keep "
                      "hands clear of the flutes.",
            "care": "Clean and oil after use, store in the case, and protect the cutting edges.",
            "trades": "Fitter, Turner, Machinist, Tool & Die Maker, Fabricator",
            "ppe": "Safety glasses",
        },
        {
            "code": "C-016", "name": "Tap, die and thread rolling head",
            "aka": "Tap set M3\u2013M20; split die; tap wrench; thread rolling head",
            "identify": "Taps are threaded, fluted cutters with taper, second and bottom leads; dies are "
                        "split rings in a die stock. A thread rolling head forms threads by displacement "
                        "rather than cutting.",
            "operate": "Use the correct tapping drill size, keep the tap square with a tap guide, apply "
                       "cutting fluid, and back off a quarter turn every half turn. Chase threads by "
                       "hand, not under power, unless using a tapping attachment with a clutch.",
            "safety": "Taps are brittle; a broken tap in a hole is a costly defect. Use a tap wrench of "
                      "the right size, not pliers, and never power-tap by hand-holding the work.",
            "care": "Clean and oil the flutes, store in the box, and use a tap extractor for broken taps.",
            "trades": "Fitter, Turner, Machinist, Plumber, Millwright, Tool & Die Maker",
            "ppe": "Safety glasses",
        },
        {
            "code": "C-017", "name": "Belt sander, disc sander and linisher",
            "aka": "Belt and disc sander; linisher; orbital sander",
            "identify": "An abrasive belt or disc driven over rollers or a platen, with a work table and "
                        "dust extraction; portable orbital sanders use a pad with a clamped or hook-and-"
                        "loop abrasive sheet.",
            "operate": "Set the table close to the belt, hold the work firmly, let the abrasive cut, and "
                       "move the work to avoid burning or grooving. Select the grit for the stock "
                       "removal required.",
            "safety": "Dust from wood, paint and metal is a fire and health hazard \u2014 use extraction and "
                      "a dust mask. Never wear loose gloves or sleeves near a belt, and do not sand "
                      "small parts that can be pulled into the machine. Sparks from metal sanding can "
                      "ignite wood dust, so keep the two operations separate.",
            "care": "Replace worn belts, clean the platen, empty the extraction bags, and check the "
                    "tracking of the belt.",
            "trades": "Carpenter, Painter, Fabricator, Fitter, Foundry",
            "ppe": "Safety glasses, dust mask or respirator, hearing protection",
        },
        {
            "code": "C-018", "name": "Woodworking circular saw and table saw",
            "aka": "Table saw with fence and blade guard; mitre saw; circular saw",
            "identify": "A toothed blade projecting through a table or a base plate, with a riving knife, "
                        "an upper and lower guard, a rip fence and a mitre gauge.",
            "operate": "Set the blade height just above the stock, set the fence parallel to the blade, "
                       "stand to one side of the blade line, feed with push sticks, and use a feather "
                       "board for narrow rips. Support long stock at both ends.",
            "safety": "Never remove the blade guard or the riving knife. Never reach over or behind the "
                      "blade. Kickback is the main hazard \u2014 stand out of the line of the blade and "
                      "use the fence correctly. No gloves near the blade, and check for nails.",
            "care": "Clean the table and the rise-and-fall mechanism, check the guard return, sharpen or "
                    "replace the blade, and check the alignment of the fence and the blade.",
            "trades": "Carpenter, Interior Design, Building Maintenance, Furniture",
            "ppe": "Safety glasses, hearing protection, dust mask, no gloves",
        },
        {
            "code": "C-019", "name": "Woodworking planer, thicknesser and jointer",
            "aka": "Surface planer; thickness planer; hand plane",
            "identify": "A rotating cutter block with knives or disposable inserts, set in a table with an "
                        "infeed and outfeed, and a fence on the jointer. The hand plane is a body with a "
                        "sole and an adjustable iron.",
            "operate": "On a jointer, feed with the grain, keep hands behind the cutter block and use push "
                       "blocks. On a thicknesser, set the depth of cut to about 1\u20132 mm, feed one end, "
                       "and let the machine take the stock. On a hand plane, set the iron for a fine cut "
                       "and plane along the grain.",
            "safety": "The cutter block is unguarded for the width of the cut \u2014 keep hands well away "
                      "and use push blocks. Never plane stock shorter than about 300 mm on a machine, and "
                      "check for nails and grit. Hearing protection is essential.",
            "care": "Check knife condition and tightness, wax the tables, check the belt and bearing "
                    "condition, and align the fence.",
            "trades": "Carpenter, Interior Design, Furniture, Building Maintenance",
            "ppe": "Safety glasses, hearing protection, dust mask, no gloves",
        },
        {
            "code": "C-020", "name": "Woodworking router and spindle moulder",
            "aka": "Plunge router with cutters; spindle moulder; trimmer",
            "identify": "A high-speed vertical spindle carrying a profiled cutter, adjustable in depth, "
                        "with a fence or a template guide.",
            "operate": "Select the cutter, set the depth in small increments, feed against the rotation "
                       "(left to right along a fence), and use a template or a jig for curves. Take "
                       "shallow cuts and make several passes.",
            "safety": "Routers and moulders are unforgiving of small or unsupported work \u2014 use jigs, "
                      "push sticks and feather boards. Check the cutter is tight before starting and "
                      "never reach under the work. Feed direction matters: climb cutting will throw the "
                      "work.",
            "care": "Clean the collet and the cutter shanks, check the spindle brake, and keep cutters "
                    "sharp.",
            "trades": "Carpenter, Interior Design, Furniture",
            "ppe": "Safety glasses, hearing protection, dust mask",
        },
        {
            "code": "C-021", "name": "Metal cutting chisels, trepanning tool and tube cutter",
            "aka": "Hole cutter for sheet; chassis punch; tube cutter",
            "identify": "A hole cutter is a toothed or fluted cylinder with a pilot; a chassis punch is a "
                        "draw-bolt punch and die set; a tube cutter has a cutting wheel and rollers.",
            "operate": "For a chassis punch, drill a pilot hole, assemble the punch and die through the "
                       "hole, and tighten the draw bolt steadily. For a tube cutter, rotate the tool "
                       "around the tube, tightening the wheel slightly each revolution, then ream.",
            "safety": "Chassis punches have high stored force; keep fingers out of the punch area and "
                      "check the dies are matched. Tube cutters leave a sharp internal burr \u2014 ream it, "
                      "especially on refrigeration lines.",
            "care": "Oil the threads and the cutting wheel; replace a chipped wheel; keep the punch and die "
                    "pairs together.",
            "trades": "Electrician, Plumber, Refrigeration & AC, Fabricator",
            "ppe": "Safety glasses, gloves",
        },
        {
            "code": "C-022", "name": "Hand snips, notcher and pneumatic shear",
            "aka": "Power notcher; pneumatic shears; hand nibbler",
            "identify": "Bench or portable machines that remove a notch or shear sheet; pneumatic shears "
                        "use a compressed-air reciprocating blade.",
            "operate": "Mark the notch, align with the stops, and make the cut in one clean stroke. For "
                       "pneumatic shears, keep the tool square to the sheet and let the blade cut rather "
                       "than forcing it.",
            "safety": "Air-operated tools need a whip check and the correct pressure; never exceed the "
                      "rated pressure. Sheet edges are sharp and the cut-off piece can fall on a foot.",
            "care": "Lubricate the air motor, drain the air line, and sharpen or replace the blades.",
            "trades": "Sheet Metal Worker, Fabricator, Refrigeration & AC",
            "ppe": "Cut-resistant gloves, face shield, hearing protection",
        },
        {
            "code": "C-023", "name": "Hydraulic press and arbor press",
            "aka": "Hydraulic workshop press 10\u2013100 tonne; arbor press; screw press",
            "identify": "A heavy frame with a hydraulic ram or a mechanical rack and pinion, a pressure "
                        "gauge and a work table, used for pressing bearings, straightening, broaching and "
                        "assembly.",
            "operate": "Centre the work under the ram, use a suitable pressing sleeve or drift that bears "
                       "on the inner ring of a bearing, apply pressure slowly while watching the gauge "
                       "and the work, and use a shield or blanket when pressing brittle parts.",
            "safety": "The stored energy in a press is enormous \u2014 never place hands between the ram and "
                      "the work, never exceed the rated pressure, and always use a guard or a polycarbonate "
                      "shield. A part that shatters under pressure ejects fragments. Check the hoses and "
                      "the relief valve.",
            "care": "Check the hydraulic oil level and hoses, keep the ram and table clean, and never "
                    "leave the press under load.",
            "trades": "Mechanic Motor Vehicle, Millwright, Fitter, Tool & Die Maker, Bearings and "
                      "assembly shops",
            "ppe": "Safety glasses or face shield, gloves, safety shoes",
        },
        {
            "code": "C-024", "name": "Sharpening equipment \u2014 oilstone, diamond hone, grinder jig",
            "aka": "Oilstone; diamond plate; wet stone; sharpening jig",
            "identify": "Abrasive blocks or plates in graded grits, used to restore a cutting edge by hand, "
                        "with an angle jig to hold a constant bevel.",
            "operate": "Flood the stone with the recommended lubricant, hold the tool at the correct angle, "
                       "and work in smooth strokes over the full length of the stone, finishing on a "
                       "finer grit and removing the burr on the flat face.",
            "safety": "A sharp edge that slips off a stone can cut deeply \u2014 cut away from the body and "
                      "keep the stone on a non-slip base.",
            "care": "Flatten the stone periodically on a diamond plate or emery on glass; keep it covered; "
                    "do not drop it.",
            "trades": "Carpenter, Fitter, Painter, Butcher/Food trades, Tool & Die Maker",
            "ppe": "Cut-resistant gloves",
        },
        {
            "code": "C-025", "name": "Ultrasonic and abrasive jet cutting (advanced)",
            "aka": "Abrasive water jet; ultrasonic cutter; wire EDM",
            "identify": "Computer-controlled machines that cut by abrasive jet, high-frequency vibration "
                        "or spark erosion rather than by a toothed edge. Found in advanced CITS trade "
                        "technology and in industry attachment.",
            "operate": "Under supervision: set the work on the table, load the programme, verify the "
                       "offset and the cutting path, and start with the safety enclosure closed.",
            "safety": "Never open an enclosure while a jet, wire or spark is active; high-pressure water "
                      "can inject through skin, and EDM dielectric and debris are hazardous. Follow the "
                      "manufacturer's procedure exactly.",
            "care": "Per the manufacturer's schedule \u2014 filters, nozzle wear, dielectric quality and "
                    "wire tension.",
            "trades": "Tool & Die Maker (advanced), Additive Manufacturing, industry OJT",
            "ppe": "Per machine specification; safety glasses and hearing protection at minimum",
        },
    ],
}

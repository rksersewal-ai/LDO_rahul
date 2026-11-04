# -*- coding: utf-8 -*-
"""Chapter 3: universal safety framework, PPE matrix, power tool and machine rules."""

CH_SAFETY = {
    "title": "3. Universal Safety Framework for Workshop Tools",
    "paras": [
        ("3.1 Why safety is taught before the tool",
         "Every CTS curriculum opens with the same block before the first job: importance and list of "
         "trade tools, safety attitude development and PPE, first aid, safe disposal of waste such as "
         "cotton waste and metal chips, hazard identification and avoidance, safety signs for danger, "
         "warning, caution and personal safety, preventive measures for electrical accidents, and use "
         "of fire extinguishers. This ordering is deliberate. A trainee who cannot recognise a hazard "
         "cannot be trusted with a machine, and an instructor who cannot teach the hazard cannot "
         "demonstrate the tool. The paragraphs below summarise the common framework; each tool entry in "
         "the tool entries in Part B then add the specific controls."),
        ("3.2 Hierarchy of control applied to workshop tools",
         "Controls are applied in order of effectiveness and only then by PPE. Elimination: do not "
         "perform the operation by hand if a guarded machine or a jig can do it. Substitution: use a "
         "file instead of a dry grinder where the finish allows, use a low-voltage tool in wet areas. "
         "Engineering control: fixed guards, interlocked chuck guards, machine vice instead of hand "
         "holding, local exhaust ventilation for fumes and dust, residual current devices, machine "
         "anchoring. Administrative control: standard operating procedure, permit to work, tool-box "
         "talk, job rotation, housekeeping and 5S, restricted access to welding and gas areas, "
         "inspection and calibration schedules. PPE: the last line, never the only line."),
        ("3.3 Hazard classes encountered with tools",
         "Mechanical \u2014 cutting edges, entrapment in rotating parts, ejection of work or tool bits, "
         "flying swarf, crushing, burns from hot work, stored-energy release from springs and hydraulics. "
         "Electrical \u2014 shock, arc flash, fire, and the special case of stored charge in capacitors. "
         "Chemical \u2014 acids, alkalis, solvents, fluxes, electrolytes, refrigerant, paint and "
         "adhesive vapours. Physical \u2014 noise above 85 dB(A), hand-arm vibration, heat, cold, "
         "radiation (ultraviolet from arc, laser in level and alignment tools, X-ray in "
         "non-destructive testing). Ergonomic \u2014 manual handling, repetitive filing, poor posture at "
         "a bench or under a vehicle. Fire and explosion \u2014 fuel gas, solvent vapour, dust. "
         "Biological and general \u2014 confined spaces, poor ventilation, slips on oil and swarf."),
        ("3.4 The ten workshop rules that apply to every tool",
         "One: receive instruction and demonstration before first use of any tool. Two: wear the PPE "
         "specified for that tool \u2014 no loose clothing, no loose sleeves, no rings, watches or "
         "chains near rotating equipment, hair tied back. Three: never remove or defeat a guard or an "
         "interlock. Four: hold work in a vice, clamp or fixture, never in the hand, when drilling, "
         "punching or chiselling. Five: keep hands clear of the cutting line and never leave a "
         "key, chuck key or spanner on a machine. Six: isolate, lock off and prove dead before "
         "adjusting or maintaining any electrical or powered equipment. Seven: use the right tool for "
         "the material and the size; do not extend a spanner with a pipe or hammer a wrench. Eight: "
         "keep the work area clear \u2014 swarf brushed, not blown; oily rags in a metal bin; walkways "
         "and fire points unobstructed. Nine: report every defect, crack, frayed cable, leaking "
         "regulator or missing guard and withdraw the tool from service. Ten: know the location of the "
         "first aid box, eye wash, fire extinguisher, main switch and emergency exit, and know how to "
         "raise the alarm."),
        ("3.5 Power tool safety rules",
         "Check the tool and cable before use and use an RCD/ELCB-protected supply. Never carry a tool "
         "by its cable or pull the plug out by the cable. Use double-insulated (Class II) or low-voltage "
         "tools where possible. Match the wheel, blade or bit to the tool's rated speed and material. "
         "Abrasive wheels must be ring-tested, correctly mounted with blotting paper washers, guarded "
         "and never run above the marked maximum speed; the tool rest clearance on a bench grinder is "
         "kept within about 2 mm and the tongue guard within about 3 mm. Hold a grinder so that sparks "
         "fly away from the body and never towards another person or a gas cylinder. Do not use a "
         "cut-off wheel for side grinding. Let a moving part stop completely before setting the tool "
         "down. In confined or wet locations use a 110 V site transformer or battery tools."),
        ("3.6 Machine tool rules",
         "Only a trained and authorised person operates a machine. Confirm the guard is in place and "
         "functional, the emergency stop works, and the workholding is tight. Remove the chuck key "
         "before starting a lathe or drill \u2014 treat it as a reflex. Set the correct spindle speed and "
         "feed for the material; never change speed or gearing while the spindle is moving. Do not "
         "reach over or lean on a rotating workpiece, and never measure, adjust, clean or clear chips "
         "while it turns. Stop the machine before changing a tool or a workpiece. Use a brush or hook, "
         "not fingers or compressed air, to clear chips. Keep the floor around the machine dry and free "
         "of swarf and coolant. On CNC equipment, verify the programme, the tool offsets and the "
         "simulated path in single block and with the rapid override reduced before the first cut, and "
         "know where the feed hold and emergency stop are."),
        ("3.7 Electrical safety essentials",
         "Treat every conductor as live until proved dead with a tester of the correct voltage range. "
         "Isolate at the main switch, lock and tag, then verify at the point of work. Use insulated "
         "tools with the correct voltage rating; inspect insulation for cuts before each use. Earth "
         "every metal enclosure, use three-pin plugs, and never bridge a fuse or a protective device. "
         "Work with one hand where practicable and stand on a dry insulating mat. Do not work alone on "
         "live equipment; a second person must be present and able to isolate the supply. Capacitors "
         "retain charge \u2014 discharge through a resistor and short them. Do not use water on an "
         "electrical fire; use CO2 or dry powder. Any shock victim needs medical attention even if they "
         "appear unharmed, because cardiac arrhythmia may follow."),
        ("3.8 Compressed gas cylinder rules",
         "Store cylinders upright, secured by chain or strap, with valve caps fitted, away from heat, "
         "ignition and sunlight, and with oxygen and fuel gas separated by distance or a fire-resistant "
         "barrier. Never use oil or grease on an oxygen fitting \u2014 oxygen plus oil is an explosive "
         "combination. Before connecting, crack the cylinder valve briefly to blow out dust, standing to "
         "the side of the outlet. Use only the regulator specified for that gas, and fit a flashback "
         "arrester at both the torch and the regulator end. Open the cylinder valve slowly and fully for "
         "oxygen, about one turn for fuel gas unless the manufacturer specifies otherwise. Test every "
         "joint for leaks with soap solution, never with a flame. Keep cylinders at least about 3 m from "
         "the flame, or shield them. Close the cylinder valve and drain the hoses after work, then back "
         "off the regulator screws."),
        ("3.9 Fire, first aid and emergency response",
         "Fires are classified A (solid), B (flammable liquid), C (flammable gas), D (metal) and F "
         "(cooking oil), with electrical fires treated as a separate risk. Water suits class A only and "
         "is never used on live electricity, liquids or metal fires. Foam suits A and B. CO2 suits "
         "electrical and liquid fires and is clean but has poor cooling and can displace oxygen in a "
         "small space. Dry powder is the general-purpose choice. Sand and dry powder are used for metal "
         "fires. In first aid, the priorities are to make the scene safe, then airway, breathing and "
         "circulation. For burns, cool with clean running water for at least ten to twenty minutes and "
         "do not apply ointment, ice or cotton. For eye injury or foreign body, wash from the inner to "
         "the outer corner or use an eye wash station and never rub. For electric shock, isolate before "
         "touching the casualty. For a deep cut, apply direct pressure with a clean dressing and elevate. "
         "For fainting, lay the person flat and raise the legs. All incidents, including near misses, "
         "are recorded and reviewed."),
        ("3.10 Housekeeping and 5S",
         "5S \u2014 Sort, Set in order, Shine, Standardise, Sustain \u2014 is explicitly part of the CTS "
         "and CITS syllabus. Applied to tools it means: no tool without a place and no place without a "
         "tool; shadow boards and tool kits checked at issue and return; surfaces and machines cleaned "
         "after each job; measuring instruments wiped, oiled and cased; calibrated instruments segregated "
         "with status labels; damaged tools tagged and withdrawn; and a weekly audit of the shop floor. "
         "Good housekeeping is also the cheapest accident prevention available, since most slips, "
         "trips, fires and lost tools trace back to it."),
    ],
}

PPE_MATRIX = [
    ("Operation / hazard", "Eyes and face", "Hands and arms", "Body and feet",
     "Head, hearing and respiratory", "Other controls"),
    ("Bench fitting, filing, chipping, hacksawing",
     "Safety glasses", "Leather or cut-resistant gloves for handling sections only, never near "
     "rotating parts", "Apron or coverall; steel-toe shoes; dry floor",
     "Cap or hair net; dust mask if dusty; ear plugs if noisy",
     "Work clamped in a vice; chipping screen or guard"),
    ("Drilling, turning, milling, grinding",
     "Safety glasses; face shield for grinding", "No gloves near rotating parts",
     "Close-fitting coverall, no loose sleeves; safety shoes",
     "Cap or hair net; ear protection above 85 dB(A); mask or LEV for coolant mist and dust",
     "Guards and interlocks; chuck key on a chain; isolation for setting"),
    ("Arc welding", "Welding helmet or shield, shade 9\u201313 by current",
     "Welding gauntlets", "Leather apron or flame-retardant jacket; spats; steel-toe boots",
     "Helmet plus cap; fume extraction or respirator for coated and stainless steel; ear "
     "protection when chipping slag", "Screens around the bay; earth return close to the joint"),
    ("Gas welding, brazing and cutting", "Goggles shade 4\u20135", "Leather gauntlets",
     "Leather apron; steel-toe boots", "Cap; ventilation or respirator for flux fume",
     "Flashback arresters; extinguisher and fire blanket within reach"),
    ("Electrical work", "Safety glasses for drilling and cutting; arc-rated face shield where arc "
     "flash is possible", "Insulating gloves rated to the voltage",
     "Arc-rated clothing for live or high-energy work; insulating shoes or mat",
     "Insulated helmet; no respiratory need",
     "Isolation, lockout tagout, voltage detector, second person present"),
    ("Chemical handling, plating and battery work", "Chemical goggles plus face shield",
     "Chemical-resistant gloves", "Chemical apron; rubber boots",
     "Face shield; respirator for the specific vapour",
     "Eye wash and safety shower; SDS available; bunded storage"),
    ("Refrigeration and AC service", "Safety glasses or goggles", "Insulating and cut-resistant "
     "gloves", "Coverall; steel-toe shoes", "Cap; respirator when brazing; refrigerant monitor",
     "Ventilation in plant rooms; no brazing near refrigerant"),
    ("Painting, solvent and adhesive work", "Goggles", "Solvent-resistant gloves",
     "Coverall; safety shoes", "Cap; organic vapour respirator",
     "Ventilation; no ignition source; fireproof cabinet for solvents"),
    ("Spray painting", "Goggles or full face shield", "Solvent-resistant gloves",
     "Coverall with hood; safety shoes", "Hood; supplied-air or cartridge respirator",
     "Spray booth with extraction and filters"),
    ("Woodworking machines", "Safety glasses or face shield", "No gloves on rotating cutters",
     "Close-fitting clothing; steel-toe shoes", "Cap or hair net; dust mask or LEV; hearing "
     "protection", "Guards, push sticks, feather boards, riving knife"),
    ("ICT hardware and electronics assembly", "Safety glasses when soldering or cutting",
     "ESD-safe gloves or none; anti-static wrist strap mandatory", "Anti-static coat; closed shoes",
     "Not normally required; fume extraction for soldering",
     "ESD mat and grounded bench; no food or drink at the bench"),
    ("Lifting and material handling", "As per the task", "Grip gloves",
     "High-visibility vest; steel-toe boots", "Helmet in overhead work areas; dust mask if dusty",
     "Use equipment not the back; keep the load close; ask for help"),
]

SAFETY_SIGNS = [
    ("Red \u2014 prohibition", "Circular red border with diagonal bar", "No smoking, no entry, do not "
     "operate, no naked flame"),
    ("Yellow \u2014 warning", "Triangular yellow with black symbol", "Electrical hazard, hot surface, "
     "slippery floor, rotating parts, laser, UV arc"),
    ("Blue \u2014 mandatory", "Solid blue circle with white symbol", "Wear eye protection, wear helmet, "
     "use guard, earth the machine, wear gloves"),
    ("Green \u2014 safe condition", "Rectangular green with white symbol", "First aid, eye wash, "
     "emergency exit, assembly point, safety shower"),
    ("Red \u2014 fire equipment", "Rectangular red with white symbol", "Fire extinguisher, hose reel, "
     "fire blanket, alarm call point"),
]

FIRE_TABLE = [
    ("Class", "Fuel", "Correct medium", "Never use"),
    ("A", "Wood, paper, cloth, rubber", "Water, foam, dry powder", "Water on live electrical parts"),
    ("B", "Petrol, oil, paint, solvent, LPG liquid", "Foam, dry powder, CO2", "Water jet"),
    ("C", "LPG, acetylene, hydrogen, natural gas", "Isolate the gas, then dry powder or CO2",
     "Extinguishing without isolating the leak"),
    ("D", "Magnesium, aluminium powder, sodium", "Dry sand, dry powder for metal fires",
     "Water, foam, CO2"),
    ("F", "Cooking oil and fat", "Wet chemical, fire blanket", "Water"),
    ("Electrical", "Live electrical equipment", "CO2, dry powder (isolate supply first)",
     "Water, foam"),
]

POWER_TOOL_RULES = [
    "Ring-test every bonded abrasive wheel before mounting and check the maximum speed marked on it "
    "against the machine speed.",
    "Fit the guard and the tool rest: bench grinder rest clearance about 2 mm, tongue guard about 3 mm.",
    "Never mount a wheel on a machine whose spindle speed exceeds the wheel rating, and never exceed "
    "the marked speed by fitting a larger pulley.",
    "Use the correct flange and blotting paper washers; tighten evenly and do not over-tighten.",
    "Stand to the side of a grinder when starting it, and let it run for a minute before use.",
    "Do not grind on the side of a straight wheel, and do not force work into a wheel.",
    "For portable grinders, check the guard is present and unmoved, and use the side handle.",
    "Match the blade to the material for circular saws and cut-off machines; never remove the riving "
    "knife or the lower blade guard.",
    "Use a push stick and feather boards on a circular saw or a table saw for narrow work.",
    "Never use a drill bit larger than the chuck or the drill's rated capacity.",
    "Use a machine vice or clamp; never hold a workpiece in the hand under a drill press.",
    "Use low-voltage or battery tools in wet or confined areas, and protect all supplies with an RCD.",
    "Inspect the cable, plug and strain relief before each use; do not use a taped or taped-over cable.",
    "Disconnect from the supply before changing a blade, bit, wheel or battery.",
    "Keep the work area clear of flammables when grinding, cutting or welding \u2014 sparks travel far.",
]

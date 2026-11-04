# -*- coding: utf-8 -*-
"""Group R: Refrigeration, air-conditioning, plumbing and fluid services."""

GROUP_R = {
    "letter": "R",
    "title": "Group 9 \u2014 Refrigeration, Air-Conditioning, Plumbing and Fluid Services",
    "intro": "This group works with pressure, vacuum and refrigerant. The hazards are largely invisible: "
             "a refrigerant leak that displaces oxygen in a basement, a refrigerant jet at minus 40 "
             "degrees C, a brazing flame next to an oil charge, a water hammer or a pipe under pressure. "
             "Plumbing adds hot water and confined-space work; chemical plant trades add corrosive and "
             "toxic fluids and permit-to-work systems.",
    "items": [
        {
            "code": "R-001", "name": "Manifold gauge set and hoses",
            "aka": "Two-valve and four-valve refrigerant manifold; charging hoses; service couplers",
            "identify": "Two or four pressure gauges (low side blue, high side red) on a body with hand "
                        "valves and colour-coded hoses with shut-off or depressor fittings; the compound "
                        "gauge reads both pressure and the corresponding saturation temperature.",
            "operate": "Connect the low-side hose to the suction service port and the high side to the "
                       "discharge port with the valves closed, purge the hoses, and read the operating "
                       "pressures against the expected saturation temperature for the refrigerant.",
            "safety": "Never open the high-side valve into a system that is not running, and never "
                      "pressurise a low-side hose above its rating. Use only hoses rated for the "
                      "refrigerant and never for a different refrigerant without flushing. Frostbite from "
                      "a liquid refrigerant jet is instantaneous \u2014 wear gloves and goggles.",
            "care": "Replace hoses that are cracked or have damaged depressor pins, keep the gauge faces "
                    "clean, and calibrate against a known pressure.",
            "trades": "Mechanic (Refrigeration & Air-Conditioner), HVAC service",
            "ppe": "Safety goggles or face shield, insulated and refrigerant-resistant gloves",
        },
        {
            "code": "R-002", "name": "Vacuum pump and micron gauge",
            "aka": "Two-stage vacuum pump 3\u20136 CFM; vacuum gauge; evacuation manifold",
            "identify": "A rotary-vane pump with an oil sight glass and an inlet port, and a micron or "
                        "electronic vacuum gauge that reads absolute pressure in microns.",
            "operate": "Connect through the manifold, open all valves including the Schrader cores, run the "
                       "pump until the micron level falls below the specified figure (commonly 500 "
                       "microns) and holds with the pump isolated, then charge.",
            "safety": "The pump oil becomes contaminated with refrigerant and moisture \u2014 change it and "
                      "dispose of it properly. Do not run the pump without oil, and do not use the same "
                      "pump and hoses across incompatible refrigerants.",
            "care": "Change the oil at each evacuation of a contaminated system, cap the ports, and check "
                    "the gauge calibration.",
            "trades": "Mechanic (Refrigeration & Air-Conditioner)",
            "ppe": "Safety glasses, gloves",
        },
        {
            "code": "R-003", "name": "Refrigerant recovery and charging machine",
            "aka": "Recovery unit; recovery cylinder; electronic scale; charging cylinder",
            "identify": "A compressor-based recovery unit with inlet and outlet ports and an oil separator; "
                        "a recovery cylinder that is clearly marked and never filled above 80 per cent; an "
                        "electronic scale for weighing the charge.",
            "operate": "Recover the charge into a dedicated cylinder, weigh the recovered amount, evacuate, "
                       "then charge by weight from the cylinder on the scale. Record the recovered and "
                       "charged quantity.",
            "safety": "Refrigerant must never be vented to the atmosphere \u2014 it is a controlled substance "
                      "and, in a confined space, an asphyxiation hazard. Never fill a cylinder above 80 "
                      "per cent liquid, never heat a cylinder with a flame, and never mix refrigerants in "
                      "one cylinder. Use a recovery cylinder that has been pressure-tested and is in "
                      "date.",
            "care": "Change the filter-drier on the recovery unit, check the hoses and seals, and store the "
                    "cylinders upright and secured.",
            "trades": "Mechanic (Refrigeration & Air-Conditioner), Mechanic Motor Vehicle (car AC)",
            "ppe": "Safety goggles, gloves, ventilation, refrigerant monitor in plant rooms",
        },
        {
            "code": "R-004", "name": "Tube working tools \u2014 bender, flare, swage and cutter",
            "aka": "Tube bender; flaring block and yoke; swaging punch set; tube cutter; deburring tool",
            "identify": "A lever bender with a forming shoe, a flaring block with a yoke and cone, a swage "
                        "set that expands the tube end, a tube cutter with a wheel and rollers, and a "
                        "deburring pen.",
            "operate": "Cut square and deburr, then bend to the required radius without flattening the "
                       "tube; make a flare with the correct depth of tube above the block, or swage for a "
                       "solder or braze joint. Always purge with nitrogen when brazing.",
            "safety": "A refrigerant line must never be brazed while it contains refrigerant or oil "
                      "without purging \u2014 refrigerant decomposes into phosgene-like compounds and the "
                      "oil can ignite. Keep the tube ends capped until assembly to prevent moisture "
                      "ingress.",
            "care": "Oil the bender and the flaring cone, keep the cutter wheel sharp, and store the tools "
                    "dry.",
            "trades": "Mechanic (Refrigeration & Air-Conditioner), Plumber, Instrument Mechanic",
            "ppe": "Safety glasses, gloves",
        },
        {
            "code": "R-005", "name": "Brazing and soldering set for refrigeration",
            "aka": "Oxy-acetylene or air-acetylene brazing torch; nitrogen purging kit; heat shield",
            "identify": "A small torch with a brazing tip, a nitrogen regulator and purging hose, and a heat "
                        "shield blanket to protect adjacent surfaces.",
            "operate": "Purge the system with a slow nitrogen flow during brazing to prevent oxidation inside "
                       "the pipe, heat the joint evenly, and feed the filler as the joint reaches "
                       "temperature. Cool and pressure-test afterwards.",
            "safety": "Nitrogen must be used with a regulator and a relief path \u2014 never cap a pipe "
                      "that is being purged, or the pressure will build and burst it. The torch is an open "
                      "flame near oil and refrigerant. Wear goggles, gloves and a heat-resistant apron.",
            "care": "Leak-test the torch and hoses, keep the nitrogen regulator in good order, and store "
                    "cylinders upright and chained.",
            "trades": "Mechanic (Refrigeration & Air-Conditioner), Plumber, Sheet Metal",
            "ppe": "Goggles shade 4\u20135, gauntlets, apron",
        },
        {
            "code": "R-006", "name": "Leak detection equipment",
            "aka": "Electronic refrigerant leak detector; UV dye and lamp; soap solution; nitrogen "
                   "pressure test kit",
            "identify": "A hand-held electronic detector with a heated sensor and a flexible probe; UV dye "
                        "with a UV lamp; a soap or bubble solution; a nitrogen regulator and gauge set for "
                        "pressure testing.",
            "operate": "Move the probe slowly below and around each joint (some refrigerants are heavier "
                       "than air), or pressurise the system with dry nitrogen and a trace of refrigerant "
                       "and test with soap solution, or use dye and the UV lamp.",
            "safety": "Never use oxygen or compressed air to pressure-test a refrigeration system \u2014 "
                      "oxygen plus oil can explode. Use dry nitrogen only, with a regulator and a relief "
                      "valve. Do not use a flame as a leak detector.",
            "care": "Replace the sensor in the detector per the manufacturer, store the dye sealed, and "
                    "keep the test kit complete.",
            "trades": "Mechanic (Refrigeration & Air-Conditioner), Plumber, Chemical plant",
            "ppe": "Safety glasses, gloves",
        },
        {
            "code": "R-007", "name": "Compressor service tools",
            "aka": "Valve spring compressor; bearing puller; crankshaft gauge; oil pump; compressor "
                   "lifting sling",
            "identify": "Tools for opening reciprocating, scroll and rotary compressors: valve plate "
                        "pullers, bearing pullers, feeler and micrometer sets, and a sling or lifting eye "
                        "for the compressor body.",
            "operate": "Recover the charge, isolate and remove the compressor, drain the oil, measure the "
                       "wear, replace the valves and bearings and reassemble with the specified oil and "
                       "torque.",
            "safety": "Compressors are heavy and awkward \u2014 use a sling and two people. Residual "
                      "refrigerant and oil can spray when a bolt is released. Do not mix POE oil with "
                      "mineral oil, and never leave a system open to atmosphere.",
            "care": "Cap all openings, keep the oil sealed, and clean the work area before assembly.",
            "trades": "Mechanic (Refrigeration & Air-Conditioner)",
            "ppe": "Safety glasses, gloves, safety boots",
        },
        {
            "code": "R-008", "name": "Air handling, duct and airflow instruments",
            "aka": "Anemometer; manometer; differential pressure gauge; psychrometer; duct leakage tester",
            "identify": "A vane or hot-wire anemometer for air velocity; a water or digital manometer for "
                        "static pressure; a sling or digital psychrometer for dry and wet bulb "
                        "temperature and relative humidity.",
            "operate": "Drill test ports, insert the probe to the recommended depth, and take readings "
                       "across the section. Use the psychrometer readings to find the relative humidity "
                       "and dew point from a chart.",
            "safety": "Do not insert a probe into a moving fan or into a duct under high pressure without "
                      "the correct gland; keep hands clear of belts and pulleys.",
            "care": "Zero the manometer, protect the sensor, and check the calibration.",
            "trades": "Mechanic (Refrigeration & Air-Conditioner), HVAC, Health Safety & Environment",
            "ppe": "Safety glasses, dust mask in ducts",
        },
        {
            "code": "R-009", "name": "Pipe and fitting tools \u2014 pipe vice, wrench, cutter and threading",
            "aka": "Pipe vice 100 mm; pipe wrench 300/400 mm; wheel cutter; BSP die set; reamer",
            "identify": "As described in Group 1 (H-031, H-032), used for GI and MS pipe work in plumbing "
                        "and for service lines in refrigeration.",
            "operate": "Cut square, ream the burr, thread with cutting oil, and assemble with the specified "
                       "sealant or tape applied to the male thread only.",
            "safety": "Support long pipe runs; a pipe that rolls in a vice can fall on a foot. Thread "
                      "cutting oil irritates skin. Never use a pipe wrench on a chrome or plastic "
                      "fitting.",
            "care": "Oil the vice screw and the die head, clean the cutter wheel, and store the dies "
                    "oiled.",
            "trades": "Plumber, Mechanic (Refrigeration & Air-Conditioner), Fitter",
            "ppe": "Gloves, safety glasses, safety boots",
        },
        {
            "code": "R-010", "name": "Plumbing hand tools \u2014 adjustable wrench, basin wrench, plunger, "
                             "auger and drain snake",
            "aka": "Adjustable wrench; basin wrench; closet auger; drain snake; plunger; Teflon tape",
            "identify": "A wrench with a swinging jaw for access behind a basin; a coiled spring auger with "
                        "a crank for clearing a trap; a plunger with a rubber cup; and PTFE tape or thread "
                        "sealant.",
            "operate": "Clear a blockage with the plunger first, then the auger; remove and refit the trap "
                       "with a new washer; apply tape clockwise to the thread. Tighten unions firmly but "
                       "not to the point of cracking the fitting.",
            "safety": "Waste water carries pathogens \u2014 wear gloves and eye protection, and disinfect "
                      "the tools afterwards. A corroded fitting can shear and release hot water. Never "
                      "use a drain chemical and then a plunger in the same drain without flushing.",
            "care": "Clean and oil the auger cable, dry the tools after use, and store the snake coiled.",
            "trades": "Plumber, Sanitary Hardware Fitter, Building Maintenance",
            "ppe": "Gloves, goggles, apron, mask where aerosols are possible",
        },
        {
            "code": "R-011", "name": "Water pressure test pump and leak test equipment",
            "aka": "Hand test pump; hydrostatic test pump; pressure gauge; drain test plug",
            "identify": "A hand-operated piston pump with a reservoir, a non-return valve and a gauge, "
                        "connected to the pipework with a test plug.",
            "operate": "Fill the system, bleed the air, pressurise to the specified test pressure (commonly "
                       "1.5 times the working pressure for pipework, or as the standard requires), and hold "
                       "it for the specified period while watching the gauge.",
            "safety": "Never exceed the specified test pressure and never test with a gas where a "
                      "hydrostatic test is required. Air-pressurised plastic pipe stores energy and can "
                      "burst violently. Stand clear of joints and caps during the test.",
            "care": "Oil the pump piston, check the gauge, and drain and dry the pump after use.",
            "trades": "Plumber, Fitter, Chemical plant, Fire protection",
            "ppe": "Safety glasses or face shield, gloves, safety boots",
        },
        {
            "code": "R-012", "name": "Pumps, valves and fluid machinery (demonstration)",
            "aka": "Centrifugal pump; reciprocating pump; gate, globe, ball and butterfly valves; "
                   "pressure relief valve; flow meter",
            "identify": "Pumps are identified by the casing, impeller and suction and discharge ports; "
                        "valves by the body, the stem and the disc or ball; the relief valve is set to a "
                        "specified pressure; the flow meter shows rate on a dial or a digital display.",
            "operate": "Read the nameplate and the flow direction arrow, prime the pump, open the suction "
                       "valve fully and the discharge valve partially, start and set the flow. Identify "
                       "valve types by their construction and their function in a line.",
            "safety": "Never run a centrifugal pump dry \u2014 it destroys the seal and can seize. Isolate "
                      "and depressurise before opening a line, and never loosen a flange under pressure. "
                      "Relief valves must never be plugged or blinded. Rotating couplings need guards.",
            "care": "Check the gland or mechanical seal, lubricate the bearings, keep the strainer clean, "
                    "and operate every valve to prevent seizing.",
            "trades": "Pump Operator-cum-Mechanic, Attendant Operator (Chemical Plant), Instrument "
                      "Mechanic, Plumber, Refrigeration & AC",
            "ppe": "Safety glasses, gloves, hearing protection, chemical PPE in plant",
        },
        {
            "code": "R-013", "name": "Instrumentation for fluid measurement",
            "aka": "Pressure gauge; manometer; rotameter; orifice plate; flow transmitter; level gauge; "
                   "thermowell",
            "identify": "A pressure gauge with a Bourdon tube; a U-tube or digital manometer; a rotameter "
                        "with a float in a tapered tube; an orifice plate with pressure tappings; a level "
                        "gauge with a sight glass or a float.",
            "operate": "Open the isolating valve slowly with the vent closed, read the gauge at eye level, "
                       "and record. Use the correct range and the correct fluid-specific calibration.",
            "safety": "A gauge can burst if over-ranged or if a diaphragm fails on a corrosive line \u2014 "
                      "use the correct wetted material and a gauge isolator. Never look at a gauge face "
                      "while opening a valve; stand to the side.",
            "care": "Calibrate against a deadweight tester, keep the impulse lines clean, and replace "
                    "cracked glass.",
            "trades": "Instrument Mechanic, Instrument Mechanic (Chemical Plant), Maintenance Mechanic "
                      "(Chemical Plant), Attendant Operator",
            "ppe": "Safety glasses or face shield, gloves, chemical PPE",
        },
        {
            "code": "R-014", "name": "Welding and fabrication for pipework",
            "aka": "Pipe welding positioner; alignment clamps; purge equipment; beveling machine",
            "identify": "A positioner that rotates the pipe for downhand welding, internal and external "
                        "alignment clamps, purge dams, and a beveling machine or grinder for the weld "
                        "preparation.",
            "operate": "Bevel the pipe ends to the specified angle and land, align with the clamps, tack "
                       "weld, and complete the root, fill and cap passes while purging the root with "
                       "argon on stainless and alloy pipe.",
            "safety": "Pipe welding is often done in a pit, a trench or a confined space \u2014 test the "
                      "atmosphere first, use forced ventilation, and have a standby person outside. "
                      "Grinding in a pipe is a confined-space fire hazard.",
            "care": "Inspect the positioner and clamps, keep the purge equipment sealed, and maintain the "
                    "beveling tools.",
            "trades": "Welder (Pipe), Fabricator, Plumber (industrial), Chemical plant maintenance",
            "ppe": "Helmet, gauntlets, apron, respirator; confined-space harness and gas detector",
        },
    ],
}

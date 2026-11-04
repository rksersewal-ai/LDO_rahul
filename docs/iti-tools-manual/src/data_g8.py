# -*- coding: utf-8 -*-
"""Group A: Automotive and vehicle service tools."""

GROUP_A = {
    "letter": "A",
    "title": "Group 8 \u2014 Automotive and Vehicle Service Tools",
    "intro": "Automotive trades add three hazards that the bench trades do not have: a heavy vehicle "
             "above the mechanic, a fuel system under pressure, and a high-current electrical system with "
             "an explosive battery. The Mechanic Motor Vehicle, Two Wheeler, Diesel, Auto Electrical and "
             "Agricultural Machinery trades all share the lifting, measuring, diagnostic and "
             "special-service tools below. Vehicle lifting and support is the single most important "
             "control in this group.",
    "items": [
        {
            "code": "A-001", "name": "Trolley jack and axle stands",
            "aka": "Hydraulic floor jack 2\u20133 tonne; axle stands or jack stands; wheel chocks",
            "identify": "A wheeled hydraulic jack with a lifting saddle and a release valve; axle stands are "
                        "rated, toothed or pinned supports with a broad base; chocks are wedge blocks.",
            "operate": "Chock the wheels, place the jack under the specified jacking point, lift to the "
                       "required height, and immediately place axle stands under the chassis or axle at "
                       "rated points before going under. Lower the jack so that the vehicle rests on the "
                       "stands, not the jack.",
            "safety": "Never work under a vehicle supported only by a jack. Never exceed the rated capacity "
                      "and never place a stand on a soft or sloping surface. Bleed and check the jack for "
                      "leaks before use. Keep the jack handle clear of the vehicle when lowering.",
            "care": "Check the hydraulic oil level, bleed air from the cylinder, inspect the seals and the "
                    "castors, and store the stands with the pins in place.",
            "trades": "Mechanic Motor Vehicle, Diesel, Light & Heavy Vehicle, Agricultural Machinery, "
                      "Two Wheeler (ramp)",
            "ppe": "Safety glasses, safety boots, gloves",
        },
        {
            "code": "A-002", "name": "Vehicle hoist and service pit",
            "aka": "Two-post and four-post hoist; scissor lift; inspection pit",
            "identify": "A hydraulic lift with arms or platforms, a control panel, safety locks and, on "
                        "two-post types, adjustable arm pads; a pit is a below-floor trench with steps and "
                        "lighting.",
            "operate": "Position the vehicle so that the centre of gravity is between the posts, set the "
                       "arms on the specified lifting points, raise to the working height, and engage the "
                       "mechanical locks before going underneath.",
            "safety": "Only trained and authorised staff operate a hoist. Confirm the locks are engaged, "
                      "check the load is balanced, keep feet clear of the arms, and never stand under a "
                      "raised vehicle that is not locked. Pits need guarding, drainage and ventilation "
                      "for heavier-than-air fumes.",
            "care": "Inspect the cables, chains, hoses and locks per the statutory schedule, keep the "
                    "pads clean, and record the periodic inspection.",
            "trades": "Mechanic Motor Vehicle, Diesel, Heavy Vehicle, Auto Electrical",
            "ppe": "Safety glasses, safety boots, helmet where specified",
        },
        {
            "code": "A-003", "name": "Torque wrench and angle gauge",
            "aka": "Click and beam torque wrench 5\u2013300 Nm; torque angle gauge; torque multiplier",
            "identify": "A wrench with a calibrated scale or a preset click mechanism, a square drive, and "
                        "a ratchet head; the angle gauge measures the additional rotation for "
                        "torque-to-yield fasteners.",
            "operate": "Look up the specified torque and tightening sequence, set the wrench, apply a steady "
                       "pull to the click, and then the specified angle where required. Tighten in "
                       "stages and in the specified pattern, for example spiral from the centre for a "
                       "cylinder head.",
            "safety": "Reaction torque from a large fastener can injure the wrist and throw the operator "
                      "off balance \u2014 brace yourself and use the correct drive size. Never use a torque "
                      "wrench to undo a fastener or as a breaker bar.",
            "care": "Return the wrench to its lowest setting after use, do not drop it, and have it "
                    "calibrated annually. Store in the case.",
            "trades": "Mechanic Motor Vehicle, Diesel, Two Wheeler, Agricultural Machinery, "
                      "Refrigeration & AC (compressor assembly)",
            "ppe": "Gloves, safety glasses",
        },
        {
            "code": "A-004", "name": "Engine repair hand tools \u2014 ring spanner, socket and puller sets",
            "aka": "Combination spanner set; deep socket set; bearing puller; gear puller; valve spring "
                   "compressor; piston ring compressor; ridge reamer",
            "identify": "A collection of forged and hardened tools shaped for engine work: flare-nut "
                        "spanners for fuel and brake lines, split-ring and two- and three-leg pullers for "
                        "bearings and gears, a valve spring compressor for removing valves, a ring "
                        "compressor for fitting pistons, and a ridge reamer for worn bores.",
            "operate": "Use the puller with the legs fully engaged and the centre screw lubricated; compress "
                       "the valve spring squarely; compress the rings with the correct taper. Work to the "
                       "workshop manual's sequence and torque specifications.",
            "safety": "Valve springs store considerable energy \u2014 keep fingers clear and use the correct "
                      "compressor. Pullers can slip off a bearing and the part can fly. Support the block "
                      "securely on a stand.",
            "care": "Oil the screw threads, keep the puller legs and jaws in good condition, and store the "
                    "spring compressor in its case.",
            "trades": "Mechanic Motor Vehicle, Diesel, Two Wheeler, Agricultural Machinery",
            "ppe": "Safety glasses or face shield, gloves, safety boots",
        },
        {
            "code": "A-005", "name": "Micrometer, bore gauge and Plastigauge for engine measurement",
            "aka": "0\u2013100 mm outside micrometer; dial bore gauge; cylinder gauge; Plastigauge; "
                   "vernier caliper",
            "identify": "As described in Group 2, used for measuring piston diameter, bore wear, journal "
                        "diameter, bearing clearance, valve stem and guide wear, and crankshaft end float.",
            "operate": "Measure at the specified points \u2014 for a cylinder, at three levels and in two "
                       "directions at 90 degrees. For bearing clearance, use Plastigauge: place a strand "
                       "across the journal, assemble and torque the cap without rotating, then measure "
                       "the flattened width against the scale.",
            "safety": "Keep instruments clean of oil and grit \u2014 a false reading here leads to an engine "
                      "failure. Never measure a hot component.",
            "care": "Wipe and oil after use, store in the case, and calibrate.",
            "trades": "Mechanic Motor Vehicle, Diesel, Two Wheeler, Agricultural Machinery",
            "ppe": "Gloves; no other special PPE",
        },
        {
            "code": "A-006", "name": "Compression tester and cylinder leakage tester",
            "aka": "Petrol compression gauge; diesel compression gauge; leak-down tester",
            "identify": "A pressure gauge with a hose and an adapter that screws into the injector or spark "
                        "plug hole; the leak-down tester supplies regulated air and measures the "
                        "percentage lost.",
            "operate": "Warm the engine, disable the ignition and the fuel supply, remove all plugs or "
                       "injectors, fit the gauge, crank for a fixed number of revolutions, and record the "
                       "reading for each cylinder. For leak-down, set the cylinder to top dead centre on "
                       "compression and apply the specified pressure.",
            "safety": "Disable the ignition before cranking \u2014 a spark near an open plug hole and fuel "
                      "vapour is a fire. Diesel compression can exceed 30 bar; use a diesel-rated gauge. "
                      "Keep clear of the fan and belts during cranking.",
            "care": "Check the hose and O-rings, zero the gauge, and store in the case.",
            "trades": "Mechanic Motor Vehicle, Diesel, Two Wheeler",
            "ppe": "Safety glasses, gloves",
        },
        {
            "code": "A-007", "name": "Fuel injection and common-rail service tools",
            "aka": "Injector puller; nozzle tester; common-rail pressure gauge; diagnostic scanner; "
                   "injection timing light",
            "identify": "Special tools for removing and testing injectors, a high-pressure gauge and hose "
                        "for rail pressure, an OBD scanner with a vehicle interface, and a timing light "
                        "for ignition timing.",
            "operate": "Depressurise the system per the manual, use the specified puller, test the injector "
                       "on the nozzle tester, and read live data with the scanner. Never crack a "
                       "high-pressure union to bleed it.",
            "safety": "Common-rail pressure reaches 2,000 bar or more \u2014 a jet of diesel at that "
                      "pressure penetrates skin and causes injection injury leading to amputation. "
                      "Depressurise and wait the specified time before opening any union, never put a hand "
                      "near a suspected leak, and use cardboard to check for a leak. Diesel is a fire "
                      "hazard.",
            "care": "Keep the test oil clean, store the scanner battery charged, and protect the "
                    "high-pressure gauge from impact.",
            "trades": "Mechanic Motor Vehicle, Diesel, Agricultural Machinery",
            "ppe": "Safety glasses or face shield, diesel-resistant gloves, no hand near leaks",
        },
        {
            "code": "A-008", "name": "Brake service tools",
            "aka": "Brake bleeding kit; brake spring pliers; disc brake piston retractor; shoe adjuster; "
                   "flare nut spanner; brake lathe",
            "identify": "A pressure or vacuum bleeder with a reservoir; pliers with shaped jaws for shoe "
                        "return springs; a piston retractor for caliper pistons; a flaring tool and tube "
                        "bender for brake lines; a brake lathe for disc or drum machining.",
            "operate": "Bleed in the specified order (usually furthest from the master cylinder first), keep "
                       "the reservoir topped up, retract the caliper piston squarely, and torque the "
                       "caliper and wheel fasteners.",
            "safety": "Brake fluid damages paint and is toxic \u2014 wear gloves and goggles and wash off "
                      "spills. Brake dust from older linings may contain asbestos: never blow it with "
                      "compressed air; use a wet method or a dust-rated vacuum and a respirator.",
            "care": "Clean the bleeder and the lathe, store brake fluid sealed, and check the lathe tooling.",
            "trades": "Mechanic Motor Vehicle, Light & Heavy Vehicle, Two Wheeler",
            "ppe": "Chemical gloves and goggles, respirator when handling brake dust",
        },
        {
            "code": "A-009", "name": "Suspension and steering tools",
            "aka": "Coil spring compressor; ball joint separator; tie rod puller; wheel alignment gauge; "
                   "camber and caster gauge; steering wheel puller",
            "identify": "Heavy screwed compressors that grip the coils, fork or scissor separators for "
                        "tapered joints, and alignment gauges or laser/computer alignment equipment.",
            "operate": "Compress the spring evenly on both sides, keeping the compressor square; separate "
                       "the joint with the correct tool rather than a hammer; set the alignment to the "
                       "manufacturer's specification with the vehicle at kerb weight.",
            "safety": "A compressed coil spring stores enormous energy and can kill if the compressor "
                      "slips \u2014 use the correct spring compressor with the safety pins fitted, stand "
                      "to the side, and never use a makeshift compressor. Never hammer a ball joint "
                      "taper \u2014 it deforms the housing.",
            "care": "Check the compressor threads for wear, oil them, and inspect the alignment equipment "
                    "calibration.",
            "trades": "Mechanic Motor Vehicle, Light & Heavy Vehicle, Two Wheeler",
            "ppe": "Face shield, gloves, safety boots",
        },
        {
            "code": "A-010", "name": "Tyre service equipment",
            "aka": "Tyre changer; wheel balancer; tyre pressure gauge; tread depth gauge; bead breaker; "
                   "wheel brace; impact wrench",
            "identify": "A tyre changer with a turntable and a mount/demount head; a balancer with a "
                        "spindle and a weight station; a pressure gauge with a chuck; a tread depth gauge "
                        "with a plunger.",
            "operate": "Deflate fully before demounting, use the machine's bead breaker, lubricate the bead, "
                       "mount with the correct head position, inflate with a clip-on chuck and a remote "
                       "valve, and balance with the specified weights. Torque the wheel nuts in a star "
                       "pattern.",
            "safety": "An over-inflated or badly seated tyre can burst with lethal force \u2014 inflate in "
                      "a safety cage or with the tyre on the machine and never stand over it or hold it "
                      "by hand. Never exceed the marked pressure. Impact wrenches cause hearing damage "
                      "and can shear studs.",
            "care": "Keep the changer jaws and head clean, calibrate the balancer, and check the gauge "
                    "against a master.",
            "trades": "Mechanic Motor Vehicle, Light & Heavy Vehicle, Two Wheeler",
            "ppe": "Safety glasses or face shield, hearing protection, safety boots",
        },
        {
            "code": "A-011", "name": "Vehicle diagnostic scanner and oscilloscope",
            "aka": "OBD-II scanner; manufacturer diagnostic tool; automotive scope; multimeter; "
                   "CAN bus tester",
            "identify": "A hand-held or PC-based tool with a vehicle connector (OBD-II or manufacturer "
                        "specific), a display and a menu of systems; an automotive scope has multiple "
                        "channels for injector, ignition and sensor signals.",
            "operate": "Connect with the ignition off, switch on, read and record the fault codes and live "
                       "data, and clear codes only after the repair. Use the scope to check a signal "
                       "waveform against the expected pattern.",
            "safety": "Never disconnect a battery or a module while the ignition is on, and never probe "
                      "airbag circuits with a multimeter \u2014 the squib can fire. Keep the scanner cable "
                      "clear of fans and belts.",
            "care": "Update the software, charge the battery, and store the cable coiled.",
            "trades": "Mechanic Motor Vehicle, Auto Electrical & Electronics, Diesel, Two Wheeler",
            "ppe": "Safety glasses",
        },
        {
            "code": "A-012", "name": "Auto electrical tools \u2014 alternator, starter and charging system",
            "aka": "Battery load tester; charging system tester; growler; armature tester; soldering iron; "
                   "heat gun",
            "identify": "A load tester with a carbon pile or electronic load and a voltmeter; a growler for "
                        "testing armatures; a charging system tester that reads voltage and current; "
                        "soldering and heat-shrink tools for terminals.",
            "operate": "Test the battery state of charge and then the load capacity, test the alternator "
                       "output at the specified engine speed, and check the voltage drop across cables. "
                       "Recondition or replace the starter and test the no-load current.",
            "safety": "A lead-acid battery releases hydrogen \u2014 no sparks, and connect the negative last "
                      "and disconnect it first. The load tester produces heat; keep it ventilated and "
                      "never touch the carbon pile. Remove rings and watches.",
            "care": "Keep the tester clean and calibrated, store the soldering iron in its stand, and keep "
                    "the battery terminals clean.",
            "trades": "Mechanic Auto Electrical & Electronics, Mechanic Motor Vehicle, Two Wheeler",
            "ppe": "Goggles, acid-resistant gloves, face shield near batteries",
        },
        {
            "code": "A-013", "name": "Lubrication and fluid service equipment",
            "aka": "Oil drain pan; oil filter wrench; grease gun; oil pump; coolant tester; air line and "
                   "blow gun",
            "identify": "A drain pan with a spout, a strap or cup filter wrench, a lever or pneumatic "
                        "grease gun, a hand or air-operated oil pump, a hydrometer or refractometer for "
                        "coolant, and a blow gun with a safety nozzle.",
            "operate": "Drain the oil warm, replace the filter with a lightly oiled gasket, fill to the "
                       "specified level and check with the dipstick, grease every nipple to the specified "
                       "schedule, and test the coolant concentration.",
            "safety": "Waste oil is a skin sensitiser and a serious environmental hazard \u2014 collect it "
                      "in a closed container for authorised recycling and never pour it down a drain. "
                      "Hot oil causes burns. Compressed air must never be used on skin or clothing; use a "
                      "safety nozzle limited to about 2 bar.",
            "care": "Clean the grease gun, keep the oil containers labelled, and maintain the air line "
                    "filter and lubricator.",
            "trades": "Mechanic Motor Vehicle, Diesel, Agricultural Machinery, Refrigeration & AC "
                      "(compressors)",
            "ppe": "Nitrile gloves, safety glasses, apron",
        },
        {
            "code": "A-014", "name": "Vehicle body repair tools",
            "aka": "Panel beating hammers and dollies; slide hammer; stud welder; spray gun; masking "
                   "materials; MIG welder for body panels",
            "identify": "Shrinking and planishing hammers with matching dollies, a slide hammer with a "
                        "claw or a hook, a stud welder that spot-welds pins for pulling, and a gravity or "
                        "HVLP spray gun.",
            "operate": "Assess the damage, pull the panel with the slide hammer or stud welder, planish "
                       "with the dolly, fill and shape, then prime, sand and paint in a booth.",
            "safety": "Body repair involves solvents, isocyanates in two-pack paint, dust and welding "
                      "fume \u2014 use a supplied-air or appropriate cartridge respirator in the booth, "
                      "eye protection and gloves. Do not weld a galvanised or coated panel without "
                      "extraction. The slide hammer can slip and strike the operator.",
            "care": "Clean the spray gun after every use, store solvents closed, and maintain the booth "
                    "filters.",
            "trades": "Mechanic Motor Vehicle (body repair), Painter (Industrial/Automotive)",
            "ppe": "Respirator, goggles, gloves, coverall",
        },
    ],
}

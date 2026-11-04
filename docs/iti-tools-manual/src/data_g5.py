# -*- coding: utf-8 -*-
"""Group W: Joining, welding, thermal cutting and fastening."""

GROUP_W = {
    "letter": "W",
    "title": "Group 5 \u2014 Joining, Welding, Thermal Cutting and Fastening",
    "intro": "Joining covers the widest range of hazards in one group: high current, ultraviolet "
             "radiation, fuel gas at pressure, hot metal, fume and stored energy. The CTS and CITS "
             "outcomes require the trainee not only to weld but to set up the equipment, adjust the "
             "parameters, inspect the joint and observe the safety norms for arc, TIG and gas welding, "
             "soldering, brazing and riveting. Chapter 3.8 on gas cylinders and 3.9 on fire apply to "
             "everything below.",
    "items": [
        {
            "code": "W-001", "name": "Arc welding machine (transformer, inverter and rectifier)",
            "aka": "SMAW set 200\u2013400 A; AC transformer; DC inverter; welding generator",
            "identify": "A power source with an on/off switch, a current range selector or digital display, "
                        "a polarity switch on DC sets, two output terminals (electrode holder and work "
                        "return clamp) and a cooling fan. Inverter sets are light, transformer sets heavy "
                        "and robust, and engine-driven generators are used on site.",
            "operate": "Connect the electrode holder to the correct polarity for the electrode, connect the "
                       "work return clamp to bare clean metal close to the joint, set the current for the "
                       "electrode diameter and the material thickness, strike and maintain the arc, and "
                       "inspect the bead. Adjust current as the work heats or the position changes.",
            "safety": "The open-circuit voltage is lethal \u2014 never touch the holder jaws or bare metal "
                      "with the machine on. Isolate before changing cables or electrodes. The arc emits "
                      "intense ultraviolet that causes 'arc eye' within minutes: use a proper welding "
                      "helmet of the correct shade, keep the screen and the flash guards in place, and "
                      "warn others. Keep cables and the return clamp in good condition; a poor return "
                      "causes stray currents that can damage bearings and shock the operator. Earth the "
                      "casing, keep the work area dry and never weld in a wet or confined space without "
                      "specific precautions.",
            "care": "Blow out dust, check the fan, inspect the cable insulation and the holder, keep the "
                    "terminals tight, and store the set dry.",
            "trades": "Welder (Gas & Electric), Welder (Pipe), Fabricator, Fitter, Mechanic Motor Vehicle",
            "ppe": "Welding helmet, gauntlets, leather apron, safety boots, fume extraction",
        },
        {
            "code": "W-002", "name": "Electrode holder and welding cables",
            "aka": "Insulated stinger 300/400 A; welding cable 25\u201370 mm2; earth clamp",
            "identify": "The holder is an insulated tong assembly with a spring or screw grip for the "
                        "electrode; the cable is a heavy flexible, finely stranded copper cable with "
                        "rubber insulation; the earth clamp is a spring or screw clamp with copper jaws.",
            "operate": "Insert the electrode at about 90 degrees to the jaws for flat work and adjust for "
                       "position work. Keep the cable run short and untangled, and fix the earth clamp to "
                       "clean bare metal on the workpiece itself.",
            "safety": "A damaged holder, exposed jaw or cracked insulation is a direct electrocution "
                      "hazard \u2014 withdraw the tool. Never coil a cable around the body, never run a "
                      "cable over sharp edges or a hot area, and never repair a cable with tape. "
                      "Disconnect before changing electrodes on high-current sets.",
            "care": "Inspect the insulation before each use, keep the jaws clean and replace worn ones, and "
                    "coil the cable loosely when storing.",
            "trades": "All welding and fabrication trades",
            "ppe": "Dry insulating gloves, welding gauntlets, rubber-soled boots",
        },
        {
            "code": "W-003", "name": "Welding helmet, hand shield and filter glass",
            "aka": "Auto-darkening helmet; passive helmet shade 10\u201313; hand shield",
            "identify": "A helmet or hand-held shield with a filter plate of a specified shade and a clear "
                        "cover lens. Auto-darkening types have a liquid crystal filter, a solar or battery "
                        "supply and adjustable shade and sensitivity.",
            "operate": "Set the shade for the process and current \u2014 around shade 10 for low-current TIG "
                       "and up to shade 13 for heavy arc gouging \u2014 adjust the headband, and ensure the "
                       "clear cover lens is in good condition. Test the auto-darkening filter before each "
                       "session.",
            "safety": "Never weld without the helmet down, never look at an arc with the naked eye, and "
                      "never use a helmet with a cracked or missing filter \u2014 the ultraviolet passes "
                      "straight through. Do not rely on a solar auto-darkening helmet in poor light "
                      "without checking that it darkens.",
            "care": "Replace scratched cover lenses frequently (they are cheap), clean with a soft cloth, "
                    "store the helmet where it will not be scratched, and remove the battery for long "
                    "storage.",
            "trades": "All welding trades",
            "ppe": "The helmet is itself PPE; add gauntlets, apron, ear protection when chipping",
        },
        {
            "code": "W-004", "name": "Welding table, positioner, clamps and fixtures",
            "aka": "Arc welding table with positioner 100 x 75 x 70 cm; magnetic clamps; earth boss",
            "identify": "A steel table, often slotted or with a fixture grid, on which work is tacked and "
                        "clamped; a positioner rotates or tilts heavy work; magnetic and toggle clamps hold "
                        "alignment.",
            "operate": "Set the earth connection to the table for small work, tack the joint, check "
                       "alignment with a square, and complete the weld in the flat position where possible "
                       "by using the positioner.",
            "safety": "Never weld with the earth current passing through a bearing or a hydraulic ram "
                      "\u2014 use a proper return path. Hot offcuts fall through slots: keep the floor "
                      "clear and wear spats. Clamps and fixtures must be rated for the current and must "
                      "not be made of unknown alloys that fume.",
            "care": "Keep the table free of spatter with a light anti-spatter spray, check the earth boss "
                    "and clamps, oil the positioner bearings.",
            "trades": "Welder, Fabricator, Fitter",
            "ppe": "Helmet, gauntlets, apron, safety boots, spats",
        },
        {
            "code": "W-005", "name": "Gas welding and cutting set (oxy-acetylene / LPG)",
            "aka": "Oxy-acetylene welding torch; cutting torch with nozzles; regulators; hoses",
            "identify": "Two cylinders with regulators (oxygen right-hand thread, acetylene left-hand "
                        "thread), coloured hoses (oxygen black or green, acetylene red), flashback "
                        "arresters, a torch body with a mixing head, welding nozzles and cutting nozzles.",
            "operate": "Open the cylinder valves slowly, set the regulator pressures for the nozzle size, "
                       "purge the hoses, light with a spark lighter using acetylene first then oxygen, and "
                       "adjust to a neutral flame. For cutting, preheat the edge, open the oxygen jet and "
                       "move steadily. Shut down in reverse order \u2014 oxygen first, then acetylene "
                       "\u2014 and drain the hoses.",
            "safety": "Never use oil or grease on any oxygen fitting. Never leave the torch burning "
                      "unattended or hanging on a cylinder. Keep cylinders upright and chained, at least "
                      "about 3 m from the flame and clear of slag. Fit flashback arresters at both ends. "
                      "Test joints with soap solution, never a flame. Do not use a worn or greasy hose. "
                      "Beware of acetylene at pressures above about 1 bar (15 psi) \u2014 it can decompose "
                      "explosively. After work, close the valves and bleed the regulators to zero.",
            "care": "Check the hoses for cracks, replace perished hose, clean the nozzle tips with the "
                    "correct tip cleaner (never a drill), leak-test the regulators periodically, and store "
                    "the torch with the valves closed.",
            "trades": "Welder (Gas & Electric), Fabricator, Plumber, Refrigeration & AC, Sheet Metal",
            "ppe": "Goggles shade 4\u20135, gauntlets, leather apron, spark-proof clothing",
        },
        {
            "code": "W-006", "name": "Gas cylinders and regulators",
            "aka": "Oxygen cylinder; dissolved acetylene cylinder; LPG cylinder; argon and CO2 cylinders",
            "identify": "Seamless steel cylinders in standard colours with a valve and a valve cap, "
                        "identified by shoulder colour and marking. Regulators are two-gauge (cylinder "
                        "contents and delivery pressure) or single-gauge with a diaphragm.",
            "operate": "Identify the cylinder by marking, not colour alone. Crack the valve briefly to "
                       "clear dust, fit the correct regulator, set the delivery pressure with the "
                       "adjusting screw while watching the delivery gauge, and open the valve slowly.",
            "safety": "Acetylene cylinders must never be laid on their side or used within about 30 "
                      "minutes of being upright; the acetone and porous mass will be disturbed. Do not "
                      "use a cylinder showing impact damage or a leaking valve. Keep full and empty "
                      "cylinders segregated and marked, and never drop or roll one with the valve uncapped. "
                      "A regulator with a damaged diaphragm will pass full cylinder pressure to the "
                      "torch.",
            "care": "Store under cover and ventilated, chained, with caps on; replace damaged gauges; have "
                    "regulators tested; record cylinder receipt and return.",
            "trades": "All welding, plumbing, refrigeration and fabrication trades",
            "ppe": "Gloves, goggles, safety boots; face shield when connecting",
        },
        {
            "code": "W-007", "name": "TIG welding set (GTAW)",
            "aka": "TIG inverter with HF start; argon regulator and flowmeter; torch with tungsten electrode",
            "identify": "A DC or AC/DC constant-current power source with a gas valve or solenoid, a torch "
                        "with a ceramic cup and a collet holding a tungsten electrode, a foot pedal or "
                        "torch amperage control, and an argon cylinder with a regulator and flowmeter.",
            "operate": "Grind the tungsten to a point (longitudinal, not radial), set the current and the "
                       "gas flow (typically 8\u201312 litres per minute), start the arc with the HF or "
                       "lift-arc, form a weld pool and add filler rod at a shallow angle. Control the "
                       "heat with the pedal. The CITS Fitter outcome requires identification of TIG "
                       "welding tools.",
            "safety": "TIG produces ozone and metal fume, and the arc is very bright \u2014 use extraction "
                      "and a shade 10\u201311 lens. Tungsten electrodes can become radioactive with thoriated "
                      "types; grind with dust extraction and store separately. The HF start can interfere "
                      "with pacemakers and electronics. Hot tungsten and hot filler ends are easily "
                      "touched \u2014 cut the filler end rather than breaking it.",
            "care": "Clean the collet and the cup, replace a contaminated tungsten, check the gas hose for "
                    "leaks, and keep the torch leads dry.",
            "trades": "Welder (advanced), Fabricator (stainless and aluminium), Refrigeration & AC "
                      "(pipe joints), Fitter",
            "ppe": "Auto-darkening helmet shade 10\u201311, gauntlets, fume extraction, safety glasses under "
                   "the helmet",
        },
        {
            "code": "W-008", "name": "MIG / MAG welding set (GMAW)",
            "aka": "MIG welder with wire feeder; spool gun for aluminium; CO2/Argon shielding gas",
            "identify": "A power source with a wire feed unit, a spool of filler wire, a torch with a "
                        "contact tip and a gas nozzle, a regulator and flowmeter, and an earth clamp. "
                        "Parameter controls are voltage, wire feed speed and gas flow.",
            "operate": "Fit the correct liner, drive rolls and contact tip for the wire, set the voltage "
                       "and wire speed, check the gas flow with the trigger, and weld with the torch "
                       "pushed or dragged as the process requires. Maintain a stick-out of about 10\u201315 "
                       "mm and a consistent travel speed.",
            "safety": "The wire is fed under power and can pierce the hand \u2014 never point the torch at "
                      "yourself and always keep the nozzle away from the body. Watch for burn-back and "
                      "for the gas flow being lost. Ultraviolet and fume hazards are the same as for arc "
                      "welding, with additional metal fume from the filler. Do not use a wire spool that "
                      "has absorbed moisture.",
            "care": "Replace the contact tip and liner when worn, blow out the wire path, drain the gas "
                    "line, and store wire in a dry place.",
            "trades": "Welder (Gas & Electric), Fabricator, Mechanic Motor Vehicle (body repair)",
            "ppe": "Helmet shade 10\u201312, gauntlets, apron, fume extraction",
        },
        {
            "code": "W-009", "name": "Soldering irons, soldering station and solder",
            "aka": "Soldering iron 25\u2013100 W; temperature-controlled station; solder wire with flux; "
                   "solder pot",
            "identify": "A heated bit or element with a copper or plated tip; the station has a "
                        "temperature control and a stand with a sponge; solder is supplied as wire with a "
                        "flux core, as paste or as bar for a pot.",
            "operate": "Set the temperature for the solder and the joint (about 300\u2013350 degrees C for "
                       "leaded, slightly higher for lead-free), tin the tip, heat the joint and apply "
                       "solder to the far side so that it flows into the joint, and remove the solder "
                       "then the iron. Use the minimum time to avoid damaging components.",
            "safety": "The iron reaches 300\u2013400 degrees C and looks cool \u2014 always return it to the "
                      "stand, never lay it on the bench. Solder fume from flux is a respiratory irritant; "
                      "use extraction or a fan. Lead solder is toxic: no eating, drinking or smoking at "
                      "the bench, wash hands after work, and keep solder away from children. Molten solder "
                      "spits; wear glasses.",
            "care": "Clean and re-tin the tip frequently, replace a corroded tip, keep the sponge damp, "
                    "and store the iron in the stand.",
            "trades": "Electronics Mechanic, Electrician, ICT, Mechanic Consumer Electronics, "
                      "Refrigeration & AC (electrical joints)",
            "ppe": "Safety glasses, fume extraction, ESD-safe practices",
        },
        {
            "code": "W-010", "name": "Brazing and silver soldering equipment",
            "aka": "Brazing torch; silver solder and flux; brazing hearth with firebricks",
            "identify": "A gas torch with a brazing nozzle, filler rods (bronze or silver-based) and a "
                        "flux; a hearth lined with firebricks to contain the heat.",
            "operate": "Clean the joint, apply flux, heat evenly to the brazing temperature (the flux "
                       "becomes clear), and feed the filler into the joint by capillary action without "
                       "playing the flame on the filler.",
            "safety": "Brazing fumes from flux and from cadmium-bearing filler are toxic \u2014 use "
                      "extraction and avoid cadmium fillers in training. The work stays hot and looks cold; "
                      "quench or handle with tongs. Fluoride fluxes burn skin.",
            "care": "Clean the torch tip, store flux in a closed container, and keep firebricks dry.",
            "trades": "Refrigeration & AC, Plumber, Sheet Metal, Welder, Electrician",
            "ppe": "Goggles, gauntlets, apron, fume extraction",
        },
        {
            "code": "W-011", "name": "Riveting tools \u2014 hand, pneumatic and pop riveter",
            "aka": "Rivet set and snap; pneumatic rivet hammer with bucking bar; lazy tongs; pop riveter",
            "identify": "Solid riveting uses a rivet set in a hammer and a bucking bar behind the work; "
                        "pop or blind riveting uses a mandrel pulled by a hand or power tool.",
            "operate": "Drill the hole to the rivet size, insert the rivet, hold the bucking bar against "
                       "the tail, and upset the head with the rivet gun or hammer in short bursts. For "
                       "blind rivets, insert and squeeze until the mandrel snaps.",
            "safety": "Pneumatic rivet hammers cause vibration injury and hearing damage \u2014 use "
                      "anti-vibration gloves, ear protection and a trigger with a dead-man control. The "
                      "bucking bar can slip and crush a finger. Blind rivet mandrels eject at speed; wear "
                      "glasses.",
            "care": "Keep the rivet sets and snap dressed, oil the air motor, and check the hose "
                    "connection with a whip check.",
            "trades": "Sheet Metal Worker, Fabricator, Mechanic Motor Vehicle (body), Aircraft "
                      "maintenance",
            "ppe": "Safety glasses, hearing protection, anti-vibration gloves",
        },
        {
            "code": "W-012", "name": "Brazing and welding inspection tools",
            "aka": "Welding gauge (fillet and butt); weld size gauge; magnifying glass; dye penetrant kit",
            "identify": "A folding gauge with fingers for measuring fillet leg length, throat thickness, "
                        "undercut, misalignment and root gap; a magnifier; a dye penetrant or magnetic "
                        "particle test kit for surface defects.",
            "operate": "Clean the weld, place the gauge fingers against the profile, and read the "
                       "dimension. For dye penetrant, clean, apply penetrant, dwell, remove the excess, "
                       "apply developer and inspect under white light.",
            "safety": "Penetrant chemicals are irritants and are often flammable \u2014 gloves, glasses and "
                      "ventilation. Welds and the surrounding metal are hot; allow cooling before "
                      "inspection.",
            "care": "Clean the gauge after use, keep the penetrant kit closed and within shelf life, and "
                    "calibrate the gauge.",
            "trades": "Welder, Fabricator, Quality inspection, Mechanic Motor Vehicle",
            "ppe": "Gloves, safety glasses, ventilation for chemicals",
        },
        {
            "code": "W-013", "name": "Adhesive, sealant and mechanical fastening tools",
            "aka": "Caulking gun; sealant applicator; nut runner; torque multiplier; pop riveter; "
                   "thread-locking compound",
            "identify": "Hand or air-powered tools for dispensing adhesives and sealants, and powered "
                        "wrenches and multipliers for tightening.",
            "operate": "Prepare the surface, apply the sealant in a continuous bead, and tool it before it "
                       "skins. For threaded fasteners, clean the threads, apply the specified torque, and "
                       "use thread-locking compound where specified.",
            "safety": "Many adhesives and sealants are flammable, sensitising or corrosive in the uncured "
                      "state \u2014 read the safety data sheet, wear gloves and goggles, and ventilate. Air "
                      "tools need a whip check.",
            "care": "Seal the cartridge after use, clean the nozzle, and store the compound within its "
                    "shelf life.",
            "trades": "Mechanic Motor Vehicle, Carpenter, Refrigeration & AC, Fabricator, Building "
                      "Maintenance",
            "ppe": "Gloves, goggles, ventilation",
        },
        {
            "code": "W-014", "name": "Oxy-fuel cutting torch with nozzles and tip cleaner",
            "aka": "Cutting torch; cutting nozzle size 0\u20136; tip cleaner set",
            "identify": "A torch with a cutting oxygen lever and a mixing head for two preheat flames, "
                        "fitted with a cutting nozzle numbered by plate thickness.",
            "operate": "Select the nozzle for the thickness, set the pressures, light and adjust to a "
                       "neutral flame, preheat the edge to bright orange, then depress the cutting lever "
                       "and move steadily. Clean the nozzle orifices with the correct tip cleaner.",
            "safety": "Never use a drill or a wire to clean a nozzle. Slag sprays downwards and bounces off "
                      "the floor \u2014 protect feet and shins, clear the area below, and keep combustibles "
                      "away. Never cut a sealed container or one that held fuel.",
            "care": "Clean the nozzles, inspect the torch body for leaks, and store with the valves closed.",
            "trades": "Welder, Fabricator, Sheet Metal, Mechanic Motor Vehicle (scrap cutting)",
            "ppe": "Goggles, gauntlets, apron, spats, hearing protection",
        },
    ],
}

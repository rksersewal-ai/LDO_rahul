# -*- coding: utf-8 -*-
"""Group X: Electronics, computer hardware and ICT tools."""

GROUP_X = {
    "letter": "X",
    "title": "Group 7 \u2014 Electronics, Computer Hardware and ICT Tools",
    "intro": "Electronics and ICT trades share a bench, a set of fine hand tools and a strict "
             "electrostatic-discharge discipline. The distinguishing hazards are small and easy to "
             "underestimate: a soldering tip that looks cold, a capacitor that holds a charge, a "
             "laser in a DVD drive, a lithium cell in a laptop, a CRT with stored high voltage. The "
             "CITS Electronics Mechanic curriculum also expects the instructor to demonstrate the "
             "operation and care of every instrument below.",
    "items": [
        {
            "code": "X-001", "name": "Anti-static wrist strap, mat and ESD station",
            "aka": "ESD wrist strap; dissipative bench mat; grounding cord; ioniser",
            "identify": "A fabric or elastic wrist band with a conductive inner surface and a coiled cord "
                        "ending in a 1 megohm resistor and a clip; the mat is a dissipative rubber or vinyl "
                        "sheet with a snap for the grounding cord.",
            "operate": "Wear the strap on bare skin, clip the cord to a verified earth point through the "
                       "resistor, and place the mat on the bench. Handle boards by the edges only, and "
                       "keep components in conductive bags or tubes until needed.",
            "safety": "The 1 megohm resistor limits current if the wearer contacts a live conductor "
                      "\u2014 never substitute a plain wire. Do not wear a strap while working on a live "
                      "mains circuit.",
            "care": "Test the strap and cord periodically, clean the mat with an approved cleaner, and "
                    "replace a broken cord.",
            "trades": "Electronics Mechanic, Mechanic Computer Hardware, ICT, COPA, Mechanic Industrial "
                      "Electronics",
            "ppe": "The ESD station is itself protective equipment",
        },
        {
            "code": "X-002", "name": "Precision screwdriver and bit set",
            "aka": "Tweaker set; Torx, hex and Phillips precision drivers; nut driver set",
            "identify": "Small screwdrivers with swivel tops and hardened tips in sizes from 0 to 3 mm, and "
                        "a bit set on a magnetic holder.",
            "operate": "Match the tip exactly to the screw head, apply axial pressure, and turn. Use a "
                       "magnetic retriever for screws in tight places. Keep a screw tray so that nothing "
                       "is lost inside equipment.",
            "safety": "Small blades slip easily into the palm; hold the work in a clamp or on the bench, "
                      "not in the hand. Do not force a worn screw. Avoid touching components on the board "
                      "with the shaft.",
            "care": "Keep the tips dressed, oil the swivel cap, and store the set in its case.",
            "trades": "Mechanic Computer Hardware, Electronics Mechanic, ICT, Mobile repair",
            "ppe": "Safety glasses, ESD strap",
        },
        {
            "code": "X-003", "name": "Long-nose plier, flush cutter and tweezers",
            "aka": "Snipe-nose plier 120 mm; side cutter; anti-magnetic tweezers",
            "identify": "Small pliers with fine serrated jaws, a flush cutter with a hardened edge that "
                        "cuts component leads flush with the board, and pointed or curved tweezers for "
                        "placing surface-mount parts.",
            "operate": "Bend and form leads with the plier, cut leads with the flush side against the "
                       "board, and place components with tweezers while holding the iron in the other "
                       "hand.",
            "safety": "Cut leads can fly into the eye \u2014 wear safety glasses and cut away from the "
                      "face. Tweezers are sharp; never use them to probe a live circuit.",
            "care": "Oil the pivot, keep the cutter edges dressed, and store tweezers with tips protected.",
            "trades": "Electronics Mechanic, ICT, Mechanic Computer Hardware",
            "ppe": "Safety glasses, ESD strap",
        },
        {
            "code": "X-004", "name": "Desoldering pump, wick and hot air rework station",
            "aka": "Solder sucker; desoldering braid; hot air gun with nozzles; preheater",
            "identify": "A spring-loaded suction pump, a braided copper wick, and a hot-air station with a "
                        "temperature and airflow control and interchangeable nozzles.",
            "operate": "Heat the joint until the solder melts, then release the pump or apply the wick with "
                       "the iron. For hot-air rework, select the nozzle, set the temperature and airflow, "
                       "preheat the board, and lift the component with tweezers when the solder flows.",
            "safety": "The hot-air nozzle reaches 400 degrees C and can ignite the board or the bench "
                      "\u2014 keep it on its stand and away from solvents, and let it cool before "
                      "changing the nozzle. Solder splash from the pump can burn. Use extraction for "
                      "flux fume.",
            "care": "Clean the pump barrel and nozzle, replace the tip, and check the airflow.",
            "trades": "Electronics Mechanic, Mechanic Computer Hardware, ICT",
            "ppe": "Safety glasses, fume extraction, heat-resistant gloves for hot parts",
        },
        {
            "code": "X-005", "name": "Multimeter, logic probe and battery tester",
            "aka": "Bench DMM; logic probe; battery load tester; PSU tester",
            "identify": "As in Group 6, plus a logic probe for digital levels and a PSU tester with "
                        "connectors for the standard power supply rails.",
            "operate": "Read ATX rail voltages under load with the PSU tester, use the logic probe to trace "
                       "a digital signal, and use the DMM for continuity and voltage checks.",
            "safety": "The primary side of a switch-mode power supply holds about 340 V DC on the "
                      "reservoir capacitor after the supply is unplugged \u2014 discharge it and wait "
                      "before touching. Never probe a live primary side.",
            "care": "Keep the probes clean, replace the battery, and check the calibration.",
            "trades": "Mechanic Computer Hardware, Electronics Mechanic, ICT",
            "ppe": "Safety glasses, one hand in the pocket rule on live boards",
        },
        {
            "code": "X-006", "name": "Computer assembly and service tools",
            "aka": "Anti-static bag; cable ties; crimping tool for RJ45; punch-down tool; cable tester; "
                   "Torx and hex driver sets",
            "identify": "RJ45 crimpers with a ratchet and a cutting and stripping function; a punch-down "
                        "tool with 66 and 110 blades for patch panels; a cable tester with a remote "
                        "terminator; cable ties and a tie gun.",
            "operate": "Assemble the PC on the ESD mat, fit the CPU with the correct orientation, apply "
                       "thermal paste, seat the RAM fully, and connect the power leads. For networking, "
                       "untwist the minimum length, crimp the RJ45 with the correct colour code, and test "
                       "the patch lead and the run.",
            "safety": "Never force a connector or a CPU into a socket. The power supply holds a charge "
                      "\u2014 work with it unplugged. Do not use a vacuum cleaner on a PC; static and "
                      "dust ignite.",
            "care": "Clean the case fans and filters, replace the thermal paste periodically, keep the "
                    "crimper clean, and store the tester with the battery removed.",
            "trades": "Mechanic Computer Hardware, ICT System Maintenance, COPA, Network Technician",
            "ppe": "ESD strap, safety glasses when cutting cable ties",
        },
        {
            "code": "X-007", "name": "Network tools \u2014 crimper, punch-down, tester and tone generator",
            "aka": "RJ45 crimper; 110 punch-down tool; LAN cable tester; tone and probe kit; fibre "
                   "cleaver and connector kit",
            "identify": "Hand tools for terminating twisted-pair and fibre cable, and test sets that "
                        "verify continuity, pinout and (on better testers) length, attenuation and "
                        "crosstalk.",
            "operate": "Terminate to T568A or T568B consistently at both ends, test with the remote unit, "
                       "and label both ends. For fibre, strip, cleave, and terminate with the specified "
                       "connector and polish if required.",
            "safety": "Fibre offcuts are microscopic glass splinters that cause serious eye injury and "
                      "cannot be seen on skin \u2014 use a black mat, keep the waste pot labelled, never "
                      "use bare hands, and wear eye protection. Laser light in a fibre system is "
                      "invisible and can damage the retina \u2014 never look into a fibre end or a "
                      "connector.",
            "care": "Clean fibre connectors with lint-free swabs and IPA, keep the cleaver blade clean, and "
                    "store the tester charged.",
            "trades": "Network Technician, ICT System Maintenance, COPA",
            "ppe": "Safety glasses, gloves for fibre waste handling",
        },
        {
            "code": "X-008", "name": "Signal generators, power supply (bench) and frequency counter",
            "aka": "Regulated DC bench supply 0\u201330 V / 0\u20135 A; function generator; frequency "
                   "counter; isolation transformer",
            "identify": "Bench instruments with digital displays, output terminals, current limiting and, "
                        "on the supply, constant-voltage and constant-current modes.",
            "operate": "Set the voltage and current limit before connecting the load, connect with the "
                       "polarity correct, and monitor the current. Use the isolation transformer when "
                       "servicing equipment with a live chassis.",
            "safety": "Verify the output before connecting a component \u2014 an accidental 30 V destroys "
                      "a 3.3 V board and can cause a fire. Do not exceed the current rating. Keep the "
                      "benches dry.",
            "care": "Keep the vents clear, check the calibration, and replace the fuse with the correct "
                    "type.",
            "trades": "Electronics Mechanic, Mechanic Industrial Electronics, ICT",
            "ppe": "Safety glasses",
        },
        {
            "code": "X-009", "name": "Electronic trainer kits and project boards",
            "aka": "Analogue and digital trainer; breadboard; microcontroller board; sensor modules",
            "identify": "A self-contained training panel with a breadboard area, a power supply, "
                        "potentiometers, lamps, switches and built-in test points; microcontroller boards "
                        "with USB and GPIO headers.",
            "operate": "Build the circuit on the breadboard with the power off, verify the connections "
                       "against the schematic, then apply the supply. For microcontroller work, upload "
                       "the programme and use the serial monitor to debug.",
            "safety": "The trainer has exposed conductors on the breadboard \u2014 keep metal objects and "
                      "liquids away. Electrolytic capacitors and the regulator can become hot. Do not "
                      "exceed the board supply rating and never short the rails.",
            "care": "Keep the trainer covered, clean the breadboard contacts, and store components in "
                    "labelled drawers.",
            "trades": "Electronics Mechanic, ICT, COPA, Artificial Intelligence Programming Assistant, "
                      "CITS Electronics",
            "ppe": "Safety glasses, ESD precautions",
        },
        {
            "code": "X-010", "name": "Display, printer and scanner service tools",
            "aka": "Suction cup for screens; plastic opening tools and spudger; screwdriver set; USB "
                   "cable; cleaning kit",
            "identify": "Non-marring plastic pry tools, suction cups for lifting glass panels, a magnetic "
                        "mat with screw positions, and lint-free cleaning cloths and fluid.",
            "operate": "Power down and disconnect, discharge, use the plastic tools to release clips "
                       "without forcing, record the screw positions, and reassemble in reverse.",
            "safety": "A laptop or monitor may retain charge in the inverter or power board; wait and "
                      "discharge. The display panel is fragile and cuts when broken; wear gloves. Broken "
                      "backlight tubes in older LCDs contain mercury \u2014 handle as hazardous waste.",
            "care": "Clean the screen only with the specified fluid, avoid pressure on the panel, and "
                    "store the tool kit organised.",
            "trades": "Mechanic Computer Hardware, Electronics Mechanic, ICT",
            "ppe": "Cut-resistant gloves, safety glasses, ESD strap",
        },
        {
            "code": "X-011", "name": "Laser and optical tools (printer, DVD, photo equipment)",
            "aka": "Laser printer unit; DVD drive laser; digital camera and lens; optical power meter",
            "identify": "Laser printer assemblies with a laser scanner unit and a fuser; DVD and Blu-ray "
                        "drives with a laser diode; cameras with a lens and sensor; an optical power meter "
                        "for fibre work.",
            "operate": "Follow the manufacturer's service procedure, replace toner and drum units as "
                       "instructed, and never open the laser scanner unit in training.",
            "safety": "Laser radiation in a printer or drive is enclosed \u2014 never defeat the interlock. "
                      "The fuser reaches about 200 degrees C. Toner is an eye and respiratory irritant; "
                      "vacuum it with the specified toner-safe vacuum, never with a domestic cleaner. In "
                      "cameras, never look at the sun through the lens.",
            "care": "Follow the maintenance kit schedule, clean the optics with lint-free tissue only, and "
                    "store the lens capped.",
            "trades": "Mechanic Computer Hardware, Digital Photographer, Printing trades, ICT",
            "ppe": "Safety glasses, mask when handling toner",
        },
        {
            "code": "X-012", "name": "Digital camera, camcorder and tripod (training aid)",
            "aka": "Digital video camera with hard disk or SD card; tripod; light panel",
            "identify": "A camera with a lens, a sensor, a recording medium and controls for aperture, "
                        "shutter speed and ISO; a tripod with a levelling head and a quick-release plate.",
            "operate": "Set the exposure for the subject, brace the camera on the tripod, frame the shot, "
                       "record, and transfer the file. The CITS Training Methodology curriculum "
                       "specifically requires the application and care of the digital camera for "
                       "recording demonstrations.",
            "safety": "Do not point a camera at the sun or a welding arc \u2014 the sensor can be destroyed "
                      "and the eye injured. Avoid tripod legs in walkways, and obtain consent before "
                      "filming trainees.",
            "care": "Charge and remove the battery, clean the lens with lens tissue, store the card "
                    "separately, and keep the camera in a dry box in humid conditions.",
            "trades": "CITS all trades (Training Methodology), Digital Photographer, "
                      "Multimedia Animation & Special Effects",
            "ppe": "None beyond normal workshop PPE",
        },
    ],
}

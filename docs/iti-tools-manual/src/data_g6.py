# -*- coding: utf-8 -*-
"""Group E: Electrical tools, wiring accessories and test instruments."""

GROUP_E = {
    "letter": "E",
    "title": "Group 6 \u2014 Electrical Tools, Wiring Accessories and Test Instruments",
    "intro": "The Electrician and Wireman trades use the largest single Annexure in the CTS system "
             "because the trade spans hand tools, wiring accessories, rotating machines, control gear "
             "and a full bench of test instruments. The CITS Electrician and Electronics Mechanic "
             "curricula add the demonstration and calibration duties. Every instrument in this group is "
             "a measuring device that can also be a hazard: a megger generates high voltage, a clamp "
             "meter is used on live conductors, and a multimeter is only as safe as its category rating "
             "and its leads.",
    "items": [
        {
            "code": "E-001", "name": "Pliers set \u2014 combination, nose, side cutting and crimping",
            "aka": "Combination plier 200 mm insulated; long-nose plier; diagonal cutter; crimping tool "
                   "1.5\u201316 mm2 and 16\u201395 mm2",
            "identify": "Insulated handles marked with the voltage rating (typically 1000 V), serrated "
                        "gripping jaws, a cutting edge near the pivot, and, on the crimper, a set of "
                        "graduated nests marked with the conductor size.",
            "operate": "Cut and strip small conductors with side cutters, grip and twist with combination "
                       "pliers, and form terminations with the nose plier. For crimping, select the nest "
                       "marked for the lug and conductor size, insert the lug fully and close the handles "
                       "completely so that the ratchet releases.",
            "safety": "Always isolate before working on a circuit; insulated tools reduce the risk of "
                      "accidental contact and are not a licence for live work. Never cut a live "
                      "conductor. Check the insulation for cuts and the cutting edge for nicks before use.",
            "care": "Oil the pivot, keep the cutting edges dressed, and discard a tool with damaged "
                    "insulation \u2014 the voltage rating depends on it.",
            "trades": "Electrician, Wireman, Electronics Mechanic, Lift & Escalator, Refrigeration & AC",
            "ppe": "Insulating gloves, safety glasses, insulated footwear",
        },
        {
            "code": "E-002", "name": "Electrician's knife and cable stripping tool",
            "aka": "Double-bladed electrician's knife 100 mm; automatic wire stripper; cable sheath stripper",
            "identify": "A folding knife with one straight and one hooked blade, or a plier-like stripper "
                        "with graduated cutting nests and an adjustable stop.",
            "operate": "Score the sheath lightly around the cable, peel it back, and strip the insulation "
                       "without nicking the conductor. Use the correct nest for the conductor size and "
                       "keep the blade away from the copper.",
            "safety": "Always cut away from the body and never towards the hand holding the cable; a "
                      "nicked conductor is a weak point that will fail and heat. Never cut a live cable. "
                      "Fold the blade closed when not in use.",
            "care": "Keep the blade sharp, oil the hinge, and replace a worn stripper nest.",
            "trades": "Electrician, Wireman, ICT, Electronics Mechanic",
            "ppe": "Cut-resistant gloves for stripping, safety glasses",
        },
        {
            "code": "E-003", "name": "Neon tester and voltage detector",
            "aka": "Neon screwdriver tester 500 V; two-pole voltage tester; non-contact voltage pen",
            "identify": "A single-pole tester has a neon lamp and a resistor in a transparent handle with "
                        "a metal contact; a two-pole tester has two probes and a lamp or display; a "
                        "non-contact pen senses the electric field and beeps or lights.",
            "operate": "Test the tester on a known live source before and after the test. For the "
                       "single-pole type, touch the probe to the conductor and the finger contact to the "
                       "body; for the two-pole type, connect both probes across the conductors.",
            "safety": "A neon tester proves presence, never absence of voltage with confidence, and it "
                      "cannot indicate the voltage level. Use a two-pole tester or a proven multimeter "
                      "for isolation verification. A non-contact pen gives false readings near other "
                      "conductors. Never rely on a single tester; test, then verify with a second "
                      "instrument and prove the tester on a known source.",
            "care": "Check the lamp and resistor periodically, replace a cracked body, and keep the probes "
                    "clean.",
            "trades": "Electrician, Wireman, Lift & Escalator",
            "ppe": "Insulating gloves, safety glasses, insulated footwear",
        },
        {
            "code": "E-004", "name": "Multimeter (analogue and digital)",
            "aka": "DMM with CAT III/IV rating; analogue multimeter; clamp-on ammeter",
            "identify": "A meter with a rotary range switch, a display, a common and a voltage/ohms input "
                        "socket, sometimes a separate 10 A socket, and test leads with probe tips. A "
                        "digital meter displays values; an analogue meter has a moving pointer.",
            "operate": "Select the function and range before connecting the leads, connect in parallel for "
                       "voltage and in series for current, and select the highest range when the value is "
                       "unknown. For resistance or continuity, isolate and de-energise the circuit and "
                       "check for parallel paths. Use the continuity buzzer for fault finding and check "
                       "diodes on the diode range.",
            "safety": "Check the meter's safety category against the circuit \u2014 CAT II for appliances, "
                      "CAT III for distribution boards, CAT IV for service entrance. Use fused, shroud-"
                      "protected leads in good condition and never use a cracked probe. Never measure "
                      "resistance or continuity on a live circuit. On an analogue meter, wrong range "
                      "selection can destroy the movement; on any meter, a wrong function on a live "
                      "circuit can arc and injure.",
            "care": "Check the battery, replace blown fuses with the correct rating, keep the probes clean, "
                    "and have the meter calibrated for training and assessment use.",
            "trades": "Electrician, Wireman, Electronics Mechanic, Refrigeration & AC, Mechanic Motor "
                      "Vehicle, Lift & Escalator, Solar technician",
            "ppe": "Insulating gloves, safety glasses",
        },
        {
            "code": "E-005", "name": "Clamp meter (tong tester)",
            "aka": "Clamp-on ammeter 0\u2013100 A digital; leakage clamp meter",
            "identify": "A meter with a hinged jaw that encircles a single conductor and measures current "
                        "by magnetic induction, with a rotary switch for AC current, voltage and "
                        "resistance. A leakage clamp has higher resolution for small currents.",
            "operate": "Set the range, open the jaws, encircle one conductor only, close the jaws fully, "
                       "and read the current. For a three-phase circuit, clamp each phase separately.",
            "safety": "Clamp round a single conductor \u2014 clamping a cable containing both live and "
                      "neutral reads zero. Keep fingers behind the guard, never clamp a bare conductor, "
                      "and use the CAT-rated instrument for the panel. A clamp meter is not an isolation "
                      "device.",
            "care": "Check the jaw faces are clean and close fully, replace the battery, and verify the "
                    "reading against a known load.",
            "trades": "Electrician, Wireman, Lift & Escalator, Refrigeration & AC",
            "ppe": "Insulating gloves, arc-rated clothing for panel work",
        },
        {
            "code": "E-006", "name": "Megger (insulation resistance tester)",
            "aka": "Megger 500 V and 1000 V; insulation tester with hand crank or electronic source",
            "identify": "An instrument that applies a high DC voltage (commonly 500 V or 1000 V) and "
                        "measures resistance in megohms, with two (or three, with a guard) test terminals.",
            "operate": "Isolate and discharge the circuit, disconnect sensitive equipment, connect the "
                       "leads across the insulation, apply the test voltage, and read the resistance "
                       "after the reading stabilises (typically 60 seconds for polarisation index). Test "
                       "between phase and earth, phase and phase, and across the winding.",
            "safety": "The megger generates a high voltage that can give a painful shock, and it stores "
                      "charge in the instrument and in the circuit under test \u2014 discharge to earth "
                      "afterwards and never touch the leads during or immediately after the test. Never "
                      "test a live circuit or an electronic device. Do not use on a capacitor bank "
                      "without discharging it.",
            "care": "Check the battery or the crank drive, keep the leads in good condition, and have the "
                    "instrument calibrated.",
            "trades": "Electrician, Wireman, Lift & Escalator, Mechanic Motor Vehicle, Millwright",
            "ppe": "Insulating gloves, safety glasses, insulated footwear; second person present",
        },
        {
            "code": "E-007", "name": "Earth tester and earth resistance measurement",
            "aka": "Three- and four-terminal earth tester; clamp-on earth tester",
            "identify": "An instrument with spikes and leads for the fall-of-potential method, or a "
                        "clamp-on type that measures the loop resistance without disconnecting.",
            "operate": "Drive the potential and current spikes at the specified spacing in a straight line "
                       "from the electrode, connect in the fall-of-potential configuration, and read the "
                       "resistance. Take readings at several spacings to confirm a plateau.",
            "safety": "Isolate the installation before testing, drive spikes clear of buried services, and "
                      "do not test during a thunderstorm.",
            "care": "Clean the spikes, check the leads, and calibrate the instrument.",
            "trades": "Electrician, Wireman, Electrical maintenance",
            "ppe": "Gloves, safety boots, hi-vis vest",
        },
        {
            "code": "E-008", "name": "Wiring accessories \u2014 switches, sockets, holders and MCBs",
            "aka": "Modular switch and socket; batten holder; ceiling rose; MCB 6\u201363 A; RCCB/ELCB; "
                   "distribution board",
            "identify": "Insulated moulded devices rated for voltage and current: switches break the phase, "
                        "sockets receive the plug, holders carry the lamp, and protection devices (MCB for "
                        "overcurrent, RCCB or ELCB for earth leakage, MCCB for larger currents) sit in a "
                        "distribution board.",
            "operate": "Select the correct rating, wire the phase to the switch and the neutral to the "
                       "holder or socket as per the standard, tighten terminals to the specified torque, "
                       "and test the polarity and the earth continuity. Fit the correct size of protective "
                       "device for the cable and the load.",
            "safety": "Isolate and lock off the supply, verify dead, then work. Never bridge a protective "
                      "device or fit a fuse or MCB of a higher rating than the cable can carry. Test the "
                      "RCCB with its test button after installation and periodically. Do not mix "
                      "polarity \u2014 a switch in the neutral leaves the holder live even when switched "
                      "off.",
            "care": "Keep terminals tight, clean the contacts, replace a device that shows arcing or heat "
                    "discolouration, and label the circuits in the board.",
            "trades": "Electrician, Wireman, Lift & Escalator, Building Maintenance",
            "ppe": "Insulating gloves, safety glasses, insulated tools",
        },
        {
            "code": "E-009", "name": "Conduit, bending and threading tools",
            "aka": "Conduit bender (hand and hydraulic); PVC bending spring; conduit die and stock; "
                   "fish tape",
            "identify": "The bender is a shoe and handle that bends conduit to a radius; a bending spring "
                        "supports PVC conduit internally; a die and stock cut threads on mild steel "
                        "conduit; the fish tape is a flexible steel or nylon tape for pulling cables "
                        "through conduit.",
            "operate": "Measure and mark, place the conduit in the bender with the mark on the arrow, and "
                       "bend with steady pressure, checking the angle with a square. For PVC, insert the "
                       "spring, heat gently and bend, then cool before removing the spring. Thread steel "
                       "conduit with cutting oil, reversing to break the chip.",
            "safety": "A hydraulic bender develops high force \u2014 keep fingers out of the shoe. Heat "
                      "PVC evenly; overheating releases hydrogen chloride fumes. Debris in conduit can "
                      "cut the hand when fishing; wear gloves.",
            "care": "Oil the bender pins and the die, keep the spring clean, and store the fish tape coiled "
                    "without kinks.",
            "trades": "Electrician, Wireman, ICT cabling",
            "ppe": "Gloves, safety glasses, fume extraction when heating PVC",
        },
        {
            "code": "E-010", "name": "Cable pulling, jointing and termination tools",
            "aka": "Cable roller; cable jack; crimping tool; heat shrink gun; cable jointing kit; "
                   "binding wire",
            "identify": "Rollers and jacks support heavy cable; crimping tools make compression joints; a "
                        "heat gun shrinks the insulation sleeve; jointing kits contain tape, mastic and "
                        "ferrules.",
            "operate": "Set rollers at intervals, pull with steady tension and no kinks, and maintain the "
                       "minimum bend radius. For a termination, strip the correct length, fit the ferrule "
                       "or lug, crimp in the marked nest, and insulate with heat-shrink.",
            "safety": "Cable pulling involves high tension \u2014 never stand inside a bight or allow anyone "
                      "to stand where a rope or cable could snap. Heat guns reach about 600 degrees C. "
                      "Crimping produces a sharp burr.",
            "care": "Keep crimp nests clean, check the ratchet release, and store the heat gun on its "
                    "stand.",
            "trades": "Electrician, Wireman, Lift & Escalator, ICT",
            "ppe": "Gloves, safety glasses, safety boots",
        },
        {
            "code": "E-011", "name": "Electric motors and starters (demonstration set)",
            "aka": "Three-phase induction motor; single-phase motor; DOL starter; star-delta starter; "
                   "3-point and 4-point DC starter",
            "identify": "A motor with a terminal box and a nameplate giving voltage, current, speed, frame "
                        "and insulation class; starters with contactors, overload relays and push buttons. "
                        "The Electrician Annexure lists 3-point and 4-point DC starters for 2.5 kW "
                        "motors.",
            "operate": "Read the nameplate, connect the winding for the supply voltage (star or delta), "
                       "check the direction of rotation, set the overload relay to the motor full-load "
                       "current, and start and stop with the correct starter. Measure the winding "
                       "resistance and insulation resistance before energising.",
            "safety": "Isolate and lock off before opening the terminal box. Beware of the residual charge "
                      "in capacitors on single-phase motors and of the high inrush current. Couple the "
                      "motor to a load only with the guard fitted. Rotating shafts and couplings must be "
                      "guarded.",
            "care": "Lubricate the bearings, keep the cooling fan and fins clean, check the terminal "
                    "tightness, and test the overload relay.",
            "trades": "Electrician, Wireman, Lift & Escalator, Refrigeration & AC, Millwright",
            "ppe": "Insulating gloves, safety glasses, insulated tools",
        },
        {
            "code": "E-012", "name": "Transformer and winding equipment",
            "aka": "Small transformer kit; winding machine; coil winder; varnish and baking oven; "
                   "laminations",
            "identify": "A winding machine with a counter and a spindle; bobbins and formers; enamelled "
                        "copper wire; laminations; insulation paper; a varnish dip and a bake oven.",
            "operate": "Wind turns evenly in layers with insulation between layers, terminate the leads "
                       "securely, assemble the core, dip in insulating varnish and bake, then test the "
                       "turns ratio, insulation resistance and no-load current.",
            "safety": "The oven is hot and the varnish is flammable and gives off solvent vapour \u2014 use "
                      "extraction and keep ignition sources away. The winding machine can trap fingers "
                      "and hair.",
            "care": "Keep the wire spools clean, check the counter, and store varnish closed.",
            "trades": "Electrician, Electronics Mechanic, Mechanic Transformer",
            "ppe": "Gloves, safety glasses, fume extraction, heat-resistant gloves at the oven",
        },
        {
            "code": "E-013", "name": "Battery, charger and DC supply",
            "aka": "Lead-acid battery; lithium-ion pack; battery charger; SMPS; UPS",
            "identify": "Cells with terminals marked positive and negative, an electrolyte level on "
                        "flooded types, a vent, and a charger with voltage and current settings or an "
                        "automatic profile. Lithium packs carry a battery management board.",
            "operate": "Connect positive to positive and negative to negative, charge in a ventilated "
                       "space, and monitor the temperature and the gassing. Equalise and top up flooded "
                       "cells with distilled water only, and test the specific gravity with a hydrometer.",
            "safety": "Lead-acid batteries release hydrogen, which is explosive: no sparks or flames, and "
                      "ventilate. The electrolyte is sulphuric acid \u2014 goggles, gloves and an eye wash "
                      "are mandatory, and acid is added to water, never the reverse. Lithium cells can go "
                      "into thermal runaway if shorted, overcharged or punctured: never charge unattended, "
                      "never use a damaged pack, and use the correct charger. Remove metal jewellery "
                      "\u2014 a shorted ring causes deep burns.",
            "care": "Keep the terminals clean and greased, store charged, and dispose of batteries through "
                    "the authorised recycler.",
            "trades": "Electrician, Mechanic Motor Vehicle, Solar technician, UPS maintenance, "
                      "Electronics Mechanic",
            "ppe": "Chemical goggles, acid-resistant gloves and apron, face shield, eye wash nearby",
        },
        {
            "code": "E-014", "name": "Oscilloscope and signal generator",
            "aka": "Digital storage oscilloscope; function generator; logic analyser",
            "identify": "An oscilloscope displays voltage against time on a screen, with vertical (volts "
                        "per division) and horizontal (time per division) controls and one or more "
                        "channels; the signal generator produces sine, square and triangle waveforms of "
                        "set amplitude and frequency.",
            "operate": "Set the probe attenuation and compensate the probe, connect the ground clip to "
                       "circuit ground, set the vertical and timebase controls, and trigger on the signal. "
                       "Use the generator to inject a known signal for tracing.",
            "safety": "An oscilloscope ground clip is connected to the protective earth \u2014 never connect "
                      "it to a live conductor or to a point above earth potential. Use an isolating "
                      "transformer or a differential probe for mains-referenced measurements. Do not "
                      "exceed the probe's voltage rating.",
            "care": "Store the probe carefully, keep the instrument cooled and dry, and check the "
                    "calibration output.",
            "trades": "Electronics Mechanic, Mechanic Industrial Electronics, ICT, Mechanic Medical "
                      "Electronics, CITS Electronics",
            "ppe": "Safety glasses, no live contact",
        },
        {
            "code": "E-015", "name": "LCR meter, component tester and logic probe",
            "aka": "LCR bridge; transistor tester; logic probe; ESR meter",
            "identify": "Bench instruments with test clips that measure inductance, capacitance and "
                        "resistance, identify semiconductor junctions, or indicate logic high, low and "
                        "pulse states.",
            "operate": "Discharge capacitors, isolate the component, connect the clips and read the value; "
                       "compare with the marked value and tolerance.",
            "safety": "Capacitors hold a charge after the power is removed \u2014 discharge through a "
                      "resistor and verify with a meter before touching. Solder joints and hot components "
                      "are a burn hazard.",
            "care": "Calibrate, keep the clips clean, and store in a dry place.",
            "trades": "Electronics Mechanic, Mechanic Consumer Electronics, Mechanic Computer Hardware, "
                      "ICT",
            "ppe": "Safety glasses, ESD precautions",
        },
        {
            "code": "E-016", "name": "Soldering and desoldering station with ESD protection",
            "aka": "Temperature-controlled soldering station; desoldering pump and wick; hot air rework "
                   "station",
            "identify": "A station with a temperature-controlled iron, a hot-air handpiece on rework "
                        "types, and an ESD-safe grounded tip; a desoldering pump is a spring-loaded "
                        "suction tool and desoldering wick is braided copper.",
            "operate": "Set the temperature, tin the tip, heat the joint and apply solder, then remove the "
                       "solder and the iron. For desoldering, heat the joint and use the pump or wick to "
                       "remove the solder.",
            "safety": "The tip and the hot air nozzle reach 300\u2013450 degrees C \u2014 burns are instant "
                      "and the iron must always be returned to the stand. Flux fume causes asthma; use "
                      "extraction. The pump can eject molten solder.",
            "care": "Re-tin the tip, clean the heating element, and replace the tip when the plating is "
                    "gone.",
            "trades": "Electronics Mechanic, Mechanic Computer Hardware, ICT, Mechanic Consumer "
                      "Electronics",
            "ppe": "Safety glasses, fume extraction, ESD wrist strap",
        },
        {
            "code": "E-017", "name": "Insulated hand tools with voltage rating",
            "aka": "VDE 1000 V pliers, screwdrivers, cutters and spanners",
            "identify": "Tools with a two-colour insulating layer and a VDE or IEC 60900 marking with the "
                        "rated voltage (1000 V AC). Insulation covers the handle and most of the shaft.",
            "operate": "Use the correct type and size for the fastener and apply pressure in line with the "
                       "screw or nut. Keep the insulated shaft between the hand and the live part.",
            "safety": "The insulation is rated for 1000 V AC and must be inspected before every use "
                      "\u2014 a cut, a burn or a puncture voids the rating. Insulated tools do not make "
                      "live work safe; they reduce the consequence of an accidental contact. Never use "
                      "them above the rated voltage.",
            "care": "Clean with a damp cloth and mild detergent only, store in a dry tool roll, and discard "
                    "a tool with any damage to the insulation.",
            "trades": "Electrician, Wireman, Lift & Escalator",
            "ppe": "Insulating gloves, arc-rated clothing, face shield",
        },
        {
            "code": "E-018", "name": "Electrical safety equipment \u2014 LOTO, RCD and insulated mat",
            "aka": "Lockout padlock and tags; residual current device; insulating mat and gloves; "
                   "voltage detector; arc flash shield",
            "identify": "A lockout hasp and padlock with a tag for isolation; an RCD (30 mA for personnel "
                        "protection) in the supply; rubber insulating mats and gloves rated for the "
                        "voltage; a voltage detector as the first line of proof.",
            "operate": "Identify the isolation point, open it, lock and tag, prove dead with a detector of "
                       "the correct voltage, and discharge stored energy. Only then work. Restore by "
                       "removing personnel, checking the work, and removing the lock with the key holder "
                       "present.",
            "safety": "Never defeat an RCD; test it with the test button monthly. Insulating gloves must be "
                      "air-tested and within their test date. An insulating mat with oil or a hole in it "
                      "does not insulate. A tag without a lock is advisory, not a control.",
            "care": "Record and date-test the protective equipment, store gloves in a bag away from "
                    "sunlight, and replace damaged items.",
            "trades": "All electrical trades",
            "ppe": "These are the PPE for the trade",
        },
        {
            "code": "E-019", "name": "Solar PV tools and test gear",
            "aka": "DC clamp meter; irradiance meter; MC4 crimper and spanner; module tester",
            "identify": "A DC-rated clamp meter for strings, an irradiance meter for performance ratios, "
                        "MC4 crimping tools and spanner sets for module connectors, and an insulation and "
                        "continuity tester for the array.",
            "operate": "Isolate the array at the DC isolator, use the DC clamp to measure string current, "
                       "and crimp MC4 connectors with the matched crimper and check the pull test.",
            "safety": "A PV array generates voltage whenever there is light \u2014 it cannot be switched "
                      "off, so cover or isolate at the string level and treat DC conductors as live. DC "
                      "arcs do not self-extinguish, which is why DC-rated devices and tools are required. "
                      "Work with insulated tools and gloves, and never use an AC-rated meter on a DC "
                      "string.",
            "care": "Keep connectors clean and dry, inspect for hot spots with a thermal camera, and record "
                    "the test results.",
            "trades": "Solar technician, Electrician (renewables)",
            "ppe": "Insulating gloves rated for DC, arc-rated clothing, safety glasses",
        },
        {
            "code": "E-020", "name": "Ladder, platform and insulated access equipment",
            "aka": "Aluminium and fibreglass ladder; step ladder; mobile platform; insulated platform",
            "identify": "A ladder with side stiles and rungs, a class or duty rating and a non-slip foot. "
                        "The fibreglass type is non-conductive and mandatory near live electrical work.",
            "operate": "Place at the correct angle (about 1 in 4), secure the top and the foot, maintain "
                       "three points of contact, and never overreach. Use a permit and a harness for "
                       "work at height.",
            "safety": "Aluminium ladders conduct \u2014 never use one for electrical work. Inspect the "
                      "ladder for cracks and missing rungs, never stand on the top two rungs, and never "
                      "place a ladder on an unstable or slippery surface. Do not work alone at height.",
            "care": "Store horizontally on racks, keep the feet clean, and withdraw a damaged ladder.",
            "trades": "Electrician, Wireman, Lift & Escalator, ICT cabling, Building Maintenance",
            "ppe": "Safety harness for work at height, helmet, non-slip footwear",
        },
    ],
}

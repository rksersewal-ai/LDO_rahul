# -*- coding: utf-8 -*-
"""Part C: PPE matrix chapter, power tool chapter, care/calibration, CITS Training Methodology,
trade index, assessment checklists, glossary and bibliography."""

CH_PPE = {
    "title": "4. Personal Protective Equipment and Safety Signage Matrix",
    "paras": [
        ("4.1 Selection logic",
         "PPE is selected from the hazard, not from habit. The matrix below maps the common ITI "
         "operations to the minimum PPE that should be issued. Where an operation appears in more than "
         "one row, the more protective requirement applies. Every item must be to a recognised standard, "
         "fit the wearer, and be inspected before use."),
        ("4.2 What each item protects against",
         "Safety glasses protect against flying chips and dust from the front and the side, so "
         "side-shielded types are preferred. A face shield adds protection against larger fragments, "
         "hot slag and chemical splash but is not a substitute for glasses. A welding helmet combines a "
         "filter against ultraviolet and infrared with impact protection. Gloves must be matched to the "
         "hazard: leather for abrasion and heat, cut-resistant knit for sheet and glass, nitrile or "
         "butyl for chemicals, insulating rubber rated to the voltage for electrical work, and cotton or "
         "none near rotating machinery because a glove can be caught. Safety footwear protects the toes "
         "from impact and the sole from penetration, and anti-static or insulating types are specified "
         "for particular areas. Hearing protection is required from about 85 dB(A), with ear muffs "
         "preferred for intermittent high noise and plugs for long exposure. Respiratory protection "
         "ranges from a simple dust mask for nuisance dust through a P2/P3 particulate filter for silica "
         "and metal fume to a cartridge respirator for solvents and a supplied-air system for "
         "isocyanates and sandblasting."),
        ("4.3 Limits of PPE",
         "PPE fails silently: a scratched lens, a cut glove, a filter past its date, a helmet with a "
         "cracked shell. It also creates a false sense of safety and can introduce new hazards \u2014 "
         "gloves caught in a drill, a mask that fogs goggles so the wearer lifts them. This is why "
         "Chapter 3 puts engineering and administrative controls ahead of PPE, and why the instructor "
         "must check PPE at the start of every practical session, not once a term."),
        ("4.4 Signage",
         "Safety signs follow a five-colour convention that every trainee must be able to read at a "
         "glance. The table below is the minimum that a shop floor should display, and it should be "
         "taught with the tools rather than in isolation, because the sign is the last reminder before "
         "the hazard."),
    ],
}

CH_POWER = {
    "title": "5. Power Tool and Machine Guarding Rules",
    "paras": [
        ("5.1 Why a separate chapter",
         "Power tools and machine tools are where the hand tool's local injury becomes a life-changing "
         "injury. The rules below are general across all the powered items in Groups 3, 4, 10 and 11, "
         "and they should be posted at each machine and covered in the first practical session of every "
         "trade that uses one."),
        ("5.2 Guarding principles",
         "A guard is a physical barrier that prevents access to a danger point and, where possible, "
         "contains ejected fragments. Fixed guards are preferred; interlocked guards are used where "
         "access is needed for operation; adjustable guards follow the work; and self-adjusting guards "
         "move with the material. A guard must not be removable without a tool, must not create a new "
         "trap point, and must not obstruct the view of the work more than necessary. Guards that have "
         "been removed and not refitted are the most common finding in an ITI safety audit."),
        ("5.3 The pre-start check",
         "Before starting any powered machine: guard in place and secure; emergency stop tested; chuck "
         "key, spanner and tools removed; workholding tight; workpiece clear of the cutter; speed and "
         "feed correct for the material; coolant and extraction working; and nobody else in the zone. "
         "Say the check out loud when learning \u2014 it becomes a habit faster than it becomes a "
         "chore."),
        ("5.4 Electrical protection for power tools",
         "Use a residual current device of 30 mA sensitivity on all portable tools, and prefer Class II "
         "double-insulated or 110 V site tools in wet, outdoor or confined locations. Inspect the cable, "
         "plug and strain relief at the start of each shift. Never repair a cable with insulation tape, "
         "never use a tool with a cracked casing, and disconnect at the plug \u2014 not by pulling the "
         "cable \u2014 before changing an accessory."),
        ("5.5 Working alone and emergency response",
         "No trainee works alone on a machine, and no instructor leaves a practical class unsupervised "
         "while machines are running. Every shop needs a clearly marked main isolator, a first aid box, "
         "an eye wash, and a fire extinguisher appropriate to the materials present. The emergency "
         "sequence is: stop the machine, isolate the supply, raise the alarm, give first aid within "
         "competence, and record the incident."),
    ],
}

CH_CARE = {
    "title": "6. Calibration, Care, Storage and 5S",
    "paras": [
        ("6.1 The three categories of tool",
         "Tools divide into consumables (blades, drills, taps, electrodes, abrasives), durable tools "
         "(hammers, spanners, files, hand tools) and instruments (calipers, micrometers, gauges, "
         "test equipment). Each has a different care regime: consumables are replaced on condition, "
         "durable tools on defect, and instruments on a calibration schedule. Confusing the three is why "
         "instruments get used as hammers and why blunt drills get forced."),
        ("6.2 Calibration",
         "A calibration is a comparison against a traceable standard, recorded with the date and the "
         "result. In an ITI the minimum set is: vernier calipers and micrometers (annually, plus a zero "
         "check at every use), dial indicators (annually), gauge blocks and slip gauges (on a longer "
         "cycle, with careful handling), torque wrenches (annually), electrical meters (annually, with "
         "a functional check before each use), meggers (annually), pressure and temperature instruments "
         "(annually or per the standard), and weighing equipment in food trades (annually). Instruments "
         "that fail are withdrawn, tagged and either adjusted by a competent person or scrapped. A "
         "calibration sticker on the instrument, with the next due date, is the simplest auditable "
         "system."),
        ("6.3 Storage",
         "Storage protects accuracy and prevents injury. Rules that matter: measuring instruments in "
         "cases, never loose in a drawer; files and reamers individually racked so that teeth do not "
         "rub; drills in an index; taps and dies in their box; hacksaw blades with tension released; "
         "chisels and punches with edges protected; gas cylinders upright and chained with caps on; "
         "flammable liquids in a fireproof cabinet; and chemicals in labelled, bunded containers with "
         "the safety data sheet available. Tool kits are issued against a list and checked on return, "
         "which also teaches accountability."),
        ("6.4 5S applied to the tool store",
         "Sort: remove broken, obsolete and unidentified items. Set in order: a place for every tool and "
         "a label for every place, with frequently used items at hand height. Shine: clean the store and "
         "the tools, and inspect while cleaning. Standardise: a tool list per trade, a calibration "
         "register, an issue log, a colour code for ownership. Sustain: a weekly audit, a monthly review "
         "of the register, and a place on the notice board for the results. This is the same 5S that the "
         "CITS Training Methodology syllabus requires the instructor to teach."),
        ("6.5 Records that an inspection will ask for",
         "Tool and equipment register, purchase and specification records, calibration certificates and "
         "schedule, maintenance log for machines, statutory inspections (hoists, pressure vessels, "
         "lifting gear, scaffolds), PPE issue and inspection records, accident and near-miss register, "
         "fire equipment service records, and training records showing that each trainee was "
         "demonstrated and assessed on each tool."),
    ],
}

CH_TM = {
    "title": "8. The CITS Instructor's Toolkit \u2014 Training Methodology Aids",
    "intro": "Training Methodology is common to every CITS trade and is examined as a separate subject "
             "(40 per cent in Principles of Teaching in the NSTI scheme). Its tool list is short and "
             "mostly electronic, but it is assessed as rigorously as any trade tool. The DGT "
             "\u2018Core Skills (Training Methodology)\u2019 document lists classroom furniture, an "
             "LCD/LED projector or interactive flat panel, a multimedia computer, a UPS, a white board, "
             "a projector screen, a digital video camera with tripod, an air conditioner for the computer "
             "room, wall charts, transparencies and DVDs, a printer with scanner, a steel cupboard and a "
             "first aid box. The syllabus additionally requires the use and maintenance of the OHP, "
             "the digital camera, the LCD projector and the smart board, and the preparation of charts, "
             "transparencies, slides, posters and mock-ups. The items below record what an instructor "
             "trainee must be able to identify, operate, care for and use safely.",
    "items": [
        {
            "code": "TM-001", "name": "Black board and white board",
            "aka": "Chalk board; dry-wipe white board 6 x 4 ft",
            "identify": "A writing surface with a frame and a tray for chalk or markers and a duster. The "
                        "white board has a low-glare coated steel or laminate surface.",
            "operate": "Plan the board layout before the session (title, diagram area, key points), write "
                       "large and legibly, rule guide lines lightly, and clean at the end. Use the board "
                       "for the sequence of a demonstration, not for long text.",
            "safety": "Chalk dust is a respiratory irritant and aggravates asthma \u2014 use dust-free "
                      "chalk and a damp cloth. Marker pens must be the correct low-odour dry-wipe type; "
                      "permanent markers ruin the surface and their solvent vapour is a hazard in a "
                      "closed room.",
            "care": "Clean the white board with the specified cleaner only, replace the duster, keep the "
                    "tray dry, and resurface a scratched board.",
            "trades": "All CITS trades",
            "ppe": "None",
        },
        {
            "code": "TM-002", "name": "Flannel board, magnetic board and display boards",
            "aka": "Flannel graph; magnetic board; bulletin board; chart stand",
            "identify": "A fabric-covered board to which cut-outs with a rough backing adhere, a steel "
                        "board that holds magnetic strips and symbols, and a pin board for notices and "
                        "charts.",
            "operate": "Prepare the cut-outs in advance, place them progressively as the explanation "
                       "develops, and build the diagram in front of the class so the sequence becomes "
                       "visible. This is the cheapest way to demonstrate a process.",
            "safety": "Pins and staples are a puncture hazard \u2014 keep a magnet or a pin box and never "
                      "leave pins on the floor. Do not mount a display board where it can fall on the "
                      "class.",
            "care": "Store the cut-outs flat in labelled envelopes, keep the boards dusted, and check the "
                    "frame fixings.",
            "trades": "All CITS trades",
            "ppe": "None",
        },
        {
            "code": "TM-003", "name": "Overhead projector (OHP) and transparencies",
            "aka": "OHP with a fresnel lens and a lamp; acetate transparency sheets; marker pens",
            "identify": "A box with a lamp, a condenser lens, a glass stage and a focusing head with a "
                        "mirror, projecting a transparency onto a screen. Still listed in the syllabus "
                        "even though it is largely superseded by digital projection.",
            "operate": "Place the transparency on the stage the right way up, focus the head, adjust the "
                       "mirror angle, and reveal information progressively by covering part of the sheet "
                       "with paper. Switch off when not in use.",
            "safety": "The lamp and the stage become very hot \u2014 never touch them, never place papers "
                      "on the stage, and allow cooling before moving the projector. Route the mains cable "
                      "where it cannot be tripped over.",
            "care": "Clean the fresnel lens and the stage glass with a soft cloth, replace the lamp "
                    "correctly, and store transparencies flat and interleaved.",
            "trades": "All CITS trades",
            "ppe": "None",
        },
        {
            "code": "TM-004", "name": "LCD / LED projector and screen",
            "aka": "Multimedia projector 3,000\u20134,000 lumens; tripod or wall screen; HDMI and VGA "
                   "cabling",
            "identify": "A projector with an input panel (HDMI, VGA, USB), a lens with a zoom and focus "
                        "ring, a remote control and ventilation grilles; a screen in a matte white "
                        "material.",
            "operate": "Place the projector square to the screen at the correct throw distance, connect "
                       "the source, select the input, focus and correct keystone, and then switch off "
                       "the room lighting to the level that keeps notes legible. Use the blank or freeze "
                       "function rather than switching off when you want attention.",
            "safety": "Never look into the lens while it is on, and never allow the projector to run with "
                      "the lamp cover removed \u2014 the lamp is under pressure and its housing is hot. "
                      "Do not block the vents; a projector that overheats is a fire risk. Suspend the "
                      "projector from a rated mount and secure the ceiling fixing.",
            "care": "Clean the filter and the lens, let the fan run through its cool-down cycle before "
                    "switching off at the mains, replace lamps or modules per the hour counter, and "
                    "store the remote without batteries if it will not be used.",
            "trades": "All CITS trades",
            "ppe": "None",
        },
        {
            "code": "TM-005", "name": "Interactive flat panel / smart board",
            "aka": "IFP with touch overlay; interactive whiteboard with projector; visualiser",
            "identify": "A large touch panel with HDMI and USB inputs, an on-board computer or an OPS "
                        "module, a stylus and a wireless mirroring option; the visualiser is a document "
                        "camera that displays an object or a page on the screen.",
            "operate": "Calibrate the touch, connect the source, use the annotation tools over a diagram, "
                       "save the annotated board as a PDF for the class, and mirror a tablet or phone "
                       "for a live demonstration. Use the visualiser to show a small tool or a "
                       "measurement to the whole class.",
            "safety": "The panel is heavy and must be mounted on a rated wall fixing. Do not use a sharp "
                      "object on the surface \u2014 a scratched panel is an expensive loss. The panel "
                      "runs on mains voltage; do not open the rear cover.",
            "care": "Clean with a soft dry or slightly damp cloth and the approved cleaner, keep the "
                    "vents clear, update the firmware, and shut down properly.",
            "trades": "All CITS trades",
            "ppe": "None",
        },
        {
            "code": "TM-006", "name": "Multimedia computer, UPS and printer-scanner",
            "aka": "Desktop or laptop with projector output; UPS; multifunction printer",
            "identify": "A computer with HDMI/VGA output, a UPS with a battery and a load display, and a "
                        "printer with a scanner platen and a document feeder. Listed in the CITS tool "
                        "list as a multimedia computer with accessories, a UPS and a printer with "
                        "scanner.",
            "operate": "Prepare the presentation and the digital handouts, connect to the projector, and "
                       "print the job sheets, operation sheets and assessment sheets. Scan trainee work "
                       "and record it.",
            "safety": "Keep liquids away from the equipment, do not open the power supply, and do not "
                      "defeat the UPS alarm. Toner is an irritant \u2014 vacuum with a toner-safe "
                      "cleaner, and never use a domestic vacuum.",
            "care": "Back up teaching material, update the software, clean the scanner glass, and replace "
                    "the UPS battery on schedule.",
            "trades": "All CITS trades",
            "ppe": "None",
        },
        {
            "code": "TM-007", "name": "Digital video camera with tripod",
            "aka": "Camcorder; DSLR or mirrorless with video; smartphone gimbal; tripod",
            "identify": "A camera with a lens, a recording medium, a microphone input and a tripod bush; a "
                        "tripod with a pan-and-tilt head and a quick-release plate.",
            "operate": "Frame the demonstration to show the hands and the work, set the focus manually for "
                       "close work, record in good light, and use the footage for micro-teaching review "
                       "and for trainees who missed a session.",
            "safety": "Do not film in a way that distracts an operator of a machine; never place a tripod "
                      "in a walkway; obtain consent before filming trainees; and do not record in areas "
                      "where personal information is visible.",
            "care": "Charge and remove the battery, clean the lens, store the card separately, and keep "
                    "the camera in a dry box.",
            "trades": "All CITS trades",
            "ppe": "None",
        },
        {
            "code": "TM-008", "name": "Charts, posters, models, mock-ups and specimens",
            "aka": "Wall chart; flip chart; poster; scaled model; cut-away mock-up; sectioned specimen; "
                   "component board",
            "identify": "Prepared two- or three-dimensional teaching aids: a printed chart, a flip chart on "
                        "a stand, a working model or a cut-away of a machine element, a mounted board of "
                        "components with labels.",
            "operate": "Introduce the aid at the point in the lesson where it resolves a difficulty, "
                       "point to the specific part, pass the specimen round for handling where it is safe "
                       "to do so, and then remove the aid so that attention returns to the work.",
            "safety": "A cut-away or sectioned specimen may have sharp edges \u2014 deburr and mount it "
                      "behind a guard. Models with moving parts must not be powered in front of the "
                      "class without a guard. Display boards must be fixed so they cannot fall.",
            "care": "Store flat and dust-free, repair promptly, and update when the curriculum changes.",
            "trades": "All CITS trades",
            "ppe": "None",
        },
        {
            "code": "TM-009", "name": "Written instructional material templates",
            "aka": "Job sheet; operation sheet; information sheet; assignment sheet; experiment sheet; "
                   "final job check sheet; lesson plan; demonstration plan",
            "identify": "Standard pro-forms: the job sheet states the job, drawing, tools, material, "
                        "procedure and safety; the operation sheet details a single operation step by "
                        "step; the information sheet carries the theory; the check sheet the acceptance "
                        "criteria.",
            "operate": "Prepare the material from the learning outcome, list the tools and the safety "
                       "precautions, break the procedure into numbered steps, and include a self-check "
                       "with the tolerances. Use the same structure across the trade so that trainees "
                       "learn one format.",
            "safety": "Every job and operation sheet must carry its own safety precautions and the PPE "
                      "required \u2014 this is the administrative control that makes the practical "
                      "session safe before it begins.",
            "care": "Version-control the templates, keep a master set, and review them when the "
                    "curriculum is revised.",
            "trades": "All CITS trades",
            "ppe": "None",
        },
        {
            "code": "TM-010", "name": "Trainee progress and assessment records",
            "aka": "Daily diary; progress chart; theory and practical record; assessment sheet; "
                   "competence log",
            "identify": "Registers and charts that record attendance, sessional marks, job completion, "
                        "assessment results and remediation.",
            "operate": "Record at the time of the activity, not later; chart the progress so that a "
                       "trainee can see their own trend; and use the record to plan remediation before "
                       "the All India Trade Test.",
            "safety": "The record is also the evidence that safety training and PPE issue happened, which "
                      "matters in any incident investigation. Keep it accurate and current.",
            "care": "Store in a locked cupboard, back up any digital record, and retain per the NCVT "
                    "retention rule.",
            "trades": "All CITS trades",
            "ppe": "None",
        },
    ],
}

CH_ASSESS = {
    "title": "9. Assessing Tool Competence \u2014 Instructor Checklists",
    "paras": [
        ("9.1 Why a checklist",
         "Tool competence has three parts and all three must be assessed: identification and selection, "
         "operation to specification, and safe working. A trainee who can produce a job but cannot "
         "identify a damaged tool, or who works quickly with a missing guard, is not yet competent. The "
         "checklists below are generic; a trade-specific version should add the tolerance and the "
         "operations from the curriculum."),
        ("9.2 Identification and selection",
         "Ask the trainee to name the tool and its parts, state its specification and range, choose the "
         "correct tool for a stated job from a set, explain why the others are unsuitable, identify "
         "damage or wear, and check that the calibration status is valid. Typical prompt: \u2018select "
         "the instrument you would use to measure the depth of this blind hole to 0.02 mm, and show me "
         "why the vernier caliper is the right choice here.\u2019"),
        ("9.3 Operation to specification",
         "Observe the set-up, the technique, the parameter selection, the measurement discipline and the "
         "finish. The trainee should state the speed, feed or setting before starting and explain why. "
         "Insist on measuring the work with the correct instrument and on recording the result against "
         "the tolerance."),
        ("9.4 Safe working",
         "Observe PPE, guards, workholding, isolation, housekeeping before and after the job, tool "
         "condition checks, and the response to a deliberately introduced fault such as a frayed cable "
         "or a missing guard. A single unsafe act should stop the assessment and trigger "
         "re-demonstration, not a mark deduction."),
        ("9.5 Recording and remediation",
         "Record each element as competent or not yet competent with a short note, give the trainee the "
         "record, and schedule re-assessment after targeted practice. Keep the record as evidence for "
         "the sessional marks and for the institute's training records."),
    ],
}

ASSESS_CHECKLIST = [
    ("Phase", "What the assessor looks for"),
    ("1. Preparation", "Correct PPE worn; work area clear; tool clean and undamaged; calibration valid; "
     "job sheet and drawing available; material identified"),
    ("2. Identification", "Names the tool and its parts; states specification, range and least count; "
     "explains the principle; selects the correct tool for the job"),
    ("3. Setting up", "Workheld securely in a vice, clamp or fixture; machine guards in place; speed, "
     "feed or pressure selected and justified; tool set to the correct position"),
    ("4. Operation", "Correct technique and sequence; hands clear of the cutting line; workpiece "
     "measured at the right stages; coolant or lubricant used correctly"),
    ("5. Safety behaviour", "No guard bypass; no gloves near rotating parts; chuck key removed; "
     "isolation used where required; chips cleared with a brush; correct lifting technique"),
    ("6. Inspection", "Correct instrument used; reading recorded against the tolerance; visual check for "
     "burrs, cracks and finish"),
    ("7. Close-down", "Machine stopped and isolated; tool cleaned, oiled and returned; swarf and waste "
     "disposed of correctly; work area left clean; breakage or defect reported"),
    ("8. Knowledge", "Explains the hazard, the control and what to do in an emergency; identifies the "
     "safety signs and the location of first aid and fire equipment"),
]

GLOSSARY = [
    ("Term", "Meaning"),
    ("AITT", "All India Trade Test \u2014 the NCVT examination at the end of a CTS course"),
    ("CITS", "Crafts Instructor Training Scheme \u2014 the one-year instructor training programme at NSTIs"),
    ("CTS", "Craftsmen Training Scheme \u2014 the ITI trade training scheme"),
    ("DGT", "Directorate General of Training, Ministry of Skill Development & Entrepreneurship"),
    ("NCVT", "National Council for Vocational Training"),
    ("NSTI", "National Skill Training Institute (formerly Central Training Institute)"),
    ("NCIC", "National Craft Instructor Certificate \u2014 awarded on passing CITS"),
    ("NTC / NAC", "National Trade Certificate / National Apprenticeship Certificate"),
    ("NSQF", "National Skills Qualification Framework \u2014 levels 1 to 10"),
    ("NOS", "National Occupational Standard \u2014 the unit-level competence statement"),
    ("QP", "Qualification Pack \u2014 the NSQF document that groups NOS for a job role"),
    ("TM", "Training Methodology \u2014 the common CITS subject on teaching and assessment"),
    ("POT", "Principles of Teaching \u2014 the theory component of Training Methodology"),
    ("VCS / WCS", "Vocational Calculation & Science / Workshop Calculation & Science"),
    ("OJT", "On-the-Job Training \u2014 150 hours of industry attachment or a group project in CITS"),
    ("PPE", "Personal Protective Equipment"),
    ("RCD / ELCB / RCCB", "Residual current device / earth leakage circuit breaker / residual current "
     "circuit breaker \u2014 protective devices that trip on earth leakage"),
    ("MCB / MCCB", "Miniature / moulded case circuit breaker \u2014 overcurrent protection"),
    ("LOTO", "Lockout and tagout \u2014 the isolation procedure before maintenance"),
    ("5S", "Sort, Set in order, Shine, Standardise, Sustain \u2014 the housekeeping method in the syllabus"),
    ("Least count", "The smallest value an instrument can read, for example 0.02 mm on a vernier caliper"),
    ("Go / No-Go", "A limit gauge that must pass on one limit and must not pass on the other"),
    ("Wringing", "The molecular adhesion that holds slip gauges together in a stack"),
    ("Swarf", "Chips and turnings produced by machining"),
    ("Snag / pinch point", "A point where a body part can be caught between two parts, one of them moving"),
    ("Kickback", "The violent ejection of work by a rotating blade or cutter"),
    ("Auto-darkening", "A welding filter that darkens automatically when the arc strikes"),
    ("Flashback arrester", "A device that stops a flame travelling back into a gas hose or cylinder"),
    ("Micron (vacuum)", "One thousandth of a millimetre of mercury \u2014 used for evacuation levels"),
    ("ESD", "Electrostatic discharge \u2014 the static discharge that destroys electronic components"),
    ("Tolerance", "The permitted variation in a dimension, for example \u00b1 0.02 mm"),
    ("Fit", "The relationship between the sizes of a hole and a shaft, from clearance to interference"),
    ("MSDS / SDS", "Material (or Safety) Data Sheet \u2014 the hazard information for a chemical"),
    ("LEV", "Local exhaust ventilation \u2014 extraction at the source of fume or dust"),
]

BIBLIOGRAPHY = [
    ("Source", "What it was used for"),
    ("DGT, Competency Based Curriculum \u2014 Fitter (CTS, NSQF Level 4), Version 3.0, dgt.gov.in",
     "Trade structure, hours, learning outcomes, tolerances, trainee tool kit and Annexure-I tool list"),
    ("DGT, Competency Based Curriculum \u2014 Fitter (CITS, NSQF Level 5 and 6), dgt.gov.in and "
     "bharatskills.gov.in", "CITS structure, trade technology outcomes, detailed Fitter CITS tool and "
     "equipment list (items 1\u2013146 plus machinery)"),
    ("DGT, Competency Based Curriculum \u2014 Electrician (CTS, NSQF Level 5), cstaricalcutta.gov.in and "
     "dgt.gov.in", "Electrician trainee tool kit, shop tools, test instruments, starters and machines"),
    ("DGT, Core Skills (Training Methodology) \u2014 CITS, cstaricalcutta.gov.in",
     "Training Methodology outcomes and the official tools and equipment list for TM"),
    ("DGT, Core Skills (Workshop Calculation & Science, Engineering Drawing, Soft Skills and Training "
     "Methodology) \u2014 CITS, NSQF Level 6, cstaricalcutta.gov.in", "Engineering Technology and TM "
     "subject structure and tool lists"),
    ("DGT / NCVT trade curriculum index, bharatskills.gov.in and dgt.gov.in",
     "The full CTS and CITS trade list from which the trade table in Chapter 2 was compiled"),
    ("NSTI websites (Trivandrum, Noida, Indore, Panipat, Vadodara, Mumbai, Bengaluru, Ludhiana, "
     "Allahabad, Patna, Agartala), *.dgt.gov.in", "Current CTS and CITS offerings, NSQF levels, "
     "duration, eligibility, pass criteria and attendance rules"),
    ("DGT, Craftsmen Training Scheme and Crafts Instructor Training Scheme scheme documents",
     "Scheme history, network size, admission rules, certification and the AITT process"),
    ("IS / BIS standards for hand tools, abrasive wheels, PPE and electrical accessories; IEC 60900 for "
     "insulated tools", "Safety requirements quoted for insulated tools, guards and PPE"),
    ("ISO 9001 / ISO 45001 and OSHA guidance on machine guarding, lockout/tagout and hazard "
     "communication", "Hierarchy of control, guarding principles and safe working rules"),
    ("Manufacturer operating manuals for machine tools, welding sets, refrigeration equipment and "
     "training aids", "Parameter ranges, care routines and specific safety instructions"),
]

CH_LIMITS = {
    "title": "12. Limitations and How to Keep This Document Current",
    "paras": [
        ("12.1 It is a compilation, not a standard",
         "This document has no statutory force. Where an institute's own safety manual, a manufacturer's "
         "instructions, a State Council syllabus or a statutory requirement differs, that document "
         "prevails. Parameters quoted here \u2014 speeds, pressures, torques, temperature ranges, "
         "clearances \u2014 are indicative and must be confirmed against the specific machine and "
         "material before use in training or in assessment."),
        ("12.2 Currency of the curriculum",
         "DGT revises curricula periodically (the Fitter CTS is at version 3.0 and the Electrician at a "
         "revised CTS edition, while several CITS documents are at version 2.0 with newer revisions in "
         "circulation). New trades such as Drone Technician, Additive Manufacturing, Semiconductor "
         "Technician and Artificial Intelligence Programming Assistant have been introduced recently and "
         "their tool lists continue to evolve. Before using this compendium for an indent or an audit, "
         "check the current curriculum PDF for the specific trade on dgt.gov.in or bharatskills.gov.in."),
        ("12.3 Coverage",
         "The register covers the tools that a trainee and an instructor must be able to identify, "
         "operate and use safely. Highly specialised equipment that appears in a single advanced trade "
         "(for example marine engine test beds, mining machinery or semiconductor fabrication trainers) "
         "is represented at class level. Regional and State Council variants may add items."),
        ("12.4 Maintenance of this document",
         "Suggested cycle: review annually; update the tool register when a curriculum revision is "
         "notified; add a new group when a new trade introduces a new class of tool; and verify the "
         "Annexure-I references each year. Record each revision with a date and a short note so that "
         "instructors can see what changed."),
        ("12.5 Using it in an ITI",
         "Three practical uses: as a teaching aid in the first-week tool identification sessions; as a "
         "job-sheet annexure, quoting the tool code so that the trainee knows exactly which tool and "
         "which precautions apply; and as a store and audit checklist for Annexure-I compliance, "
         "calibration and PPE issue."),
    ],
}

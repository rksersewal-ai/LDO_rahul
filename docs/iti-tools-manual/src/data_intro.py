# -*- coding: utf-8 -*-
"""Front matter and framework chapters for the ITI CTS/CITS Tool Compendium."""

TITLE = "ITI Tool Compendium"
SUBTITLE = ("A Consolidated Reference of Tools, Equipment and Training Aids used in "
            "Craftsmen Training Scheme (CTS) and Crafts Instructor Training Scheme (CITS)")
EDITION = "First Edition \u2014 November 2026"
PREPARED_FOR = ("Industrial Training Institutes (ITIs), National Skill Training Institutes (NSTIs), "
                "Crafts Instructor trainees (CITS) and instructors under NCVT / DGT")

ABSTRACT = (
    "This compendium consolidates every class of tool, instrument, machine, test equipment and "
    "training aid that appears in the Craftsmen Training Scheme (CTS / ITI) and Crafts Instructor "
    "Training Scheme (CITS / NSTI) curricula published by the Directorate General of Training (DGT) "
    "under the National Council for Vocational Training (NCVT). Tools are grouped by engineering "
    "practice rather than by trade, so a single instrument appears once with every trade that uses "
    "it. For each tool the document records what the trainee or instructor must be able to "
    "identify, the operation(s) they must be able to perform, the inspection and care routine, and "
    "the specific safety precautions and personal protective equipment required. The scope covers "
    "engineering and non-engineering trades, minor and major tools, hand tools, precision "
    "metrology, machine tools, electrical and electronic test instruments, welding and gas "
    "equipment, automotive, refrigeration, fabrication, ICT, and the Training Methodology (TM) "
    "aids used by CITS instructor trainees."
)

HOW_TO_USE = [
    ("Part A", "Framing chapters. Read Ch. 1\u20136 once to understand the CTS/CITS structure, NSQF levels, "
               "and the universal safety hierarchy that applies to every tool in the document."),
    ("Part B", "The master tool register (Ch. 7), 216 numbered entries in eleven practice-wise groups, each "
               "with identification points, operating essentials, care, safety precautions and PPE. "
               "This is the core deliverable."),
    ("Part C", "Instructor and reference material: the CITS Training Methodology aid list (Ch. 8), "
               "tool competence checklists (Ch. 9), a trade-to-tool index (Ch. 10), glossary and "
               "bibliography (Ch. 11) and the limitations of this compilation (Ch. 12)."),
    ("Numbering", "Every tool carries a stable code of the form group-letter + serial (e.g. M-014 is the "
                  "fourteenth measuring and marking tool). Codes can be quoted in job sheets, store "
                  "indents and inspection checklists."),
    ("Columns", "Name / Identification = what to look at to recognise and verify the tool. "
                "Operate = the minimum competence expected. Safety / PPE = the non-negotiable controls. "
                "Care = what keeps the tool accurate and serviceable."),
]

CH_ABOUT = {
    "title": "1. Scope, Sources and Method",
    "paras": [
        ("1.1 What this document is",
         "This is a research compilation, not an official DGT publication. It gathers into one place the "
         "tool and equipment content that is normally scattered across several hundred trade curriculum "
         "PDFs on dgt.gov.in, bharatskills.gov.in and the NSTI/ITI websites. The intent is that an "
         "instructor preparing a demonstration, a trainee preparing for the All India Trade Test "
         "(AITT), or an institute preparing a store indent can find the tool, its identification "
         "points, its operation and its hazards without opening a dozen documents."),
        ("1.2 What CTS and CITS are",
         "The Craftsmen Training Scheme (CTS) was introduced in 1950 and is delivered through roughly "
         "15,000 ITIs (about 2,700 government and 12,300 private) and 33 National Skill Training "
         "Institutes. Duration ranges from six months to two years, with engineering trades normally "
         "two years and non-engineering trades normally one year. Training is approximately 70 per cent "
         "practical and 30 per cent theory, examined by the All India Trade Test and certified by NCVT "
         "as the National Trade Certificate (NTC). The Crafts Instructor Training Scheme (CITS) is the "
         "one-year instructor qualification delivered at NSTIs; it combines Trade Technology, "
         "Engineering Technology / Vocational Calculation and Science, and Training Methodology, and "
         "leads to the National Craft Instructor Certificate (NCIC)."),
        ("1.3 Source hierarchy used",
         "Wherever possible, tool names follow the Annexure-I 'List of Tools and Equipment' of the "
         "current DGT competency-based curriculum for the trade, because that annexure is the document "
         "an institute is actually audited against. Primary sources consulted include the CTS 3.0 and "
         "revised CTS curricula for Fitter and Electrician, the CITS NSQF-5/6 curricula for Fitter and "
         "for Core Skills (Training Methodology, Workshop Calculation and Science, Engineering "
         "Drawing), and the trade curriculum index on bharatskills.gov.in and cstaricalcutta.gov.in. "
         "The full list appears in the Bibliography (Ch. 11)."),
        ("1.4 Level of confidence",
         "Statements about curriculum structure, subject names, NSQF levels, pass criteria and tool "
         "names are taken from published DGT material. Statements about operating technique and safety "
         "are compiled from standard Indian and international workshop practice (IS/BIS, OSHA, ISO "
         "and manufacturer guidance) and should be read as good practice, not as a substitute for the "
         "shop safety manual or a manufacturer's operating instructions. Where a parameter is "
         "safety-critical (for example gas welding pressures or electrical isolation), the local "
         "standard operating procedure prevails."),
        ("1.5 How the tool groups were derived",
         "Trade curricula were read from the practical side: each Professional Skill learning outcome "
         "names the operations to be performed, and each operation implies a tool. Those tools were "
         "then de-duplicated across trades and grouped by the physical principle they exploit \u2014 "
         "marking, measuring, metal removal by hand, metal removal by machine, joining, forming, "
         "electrical, electronic, fluid, thermal, automotive, ICT and instructional. A tool that serves "
         "two groups is placed in the group of its primary function and cross-referenced. This grouping "
         "is why the same vernier caliper serves Fitter, Turner, Machinist, Tool and Die Maker, Motor "
         "Vehicle and Draughtsman, and appears once here rather than a dozen times."),
        ("1.6 Limits",
         "The register is broad but not exhaustive. Very specialised equipment that appears in only one "
         "or two advanced trades (for example semiconductor fabrication trainers or marine engine "
         "test beds) is represented at class level rather than item level. Regional and State Council "
         "variants, and trades introduced after the source curricula were published, may add items "
         "not listed here."),
    ],
}

CH_FRAMEWORK = {
    "title": "2. The CTS and CITS Curriculum Framework",
    "paras": [
        ("2.1 Subject structure in CTS",
         "An engineering CTS trade carries Trade Practical (Professional Skill), Trade Theory "
         "(Professional Knowledge), Engineering Drawing, Workshop Calculation and Science, and "
         "Employability Skills. Non-engineering trades carry Trade Practical, Trade Theory and "
         "Employability Skills, with Vocational Calculation and Science where applicable. In a typical "
         "two-year engineering trade the notional split is 1,680 hours practical and 720 hours theory "
         "over 2,400 hours, i.e. 70:30. Employability Skills is a 60-hour component in each year. "
         "A representative one-year structure shows Trade Practical 840 hours, Trade Theory 360 hours "
         "and Employability Skills 60 hours over 1,200 hours."),
        ("2.2 Where tools enter the curriculum",
         "Tools appear at three levels. First, the introductory block of every trade \u2014 the trainee "
         "is taught the trade's tool list, safety attitude, PPE, first aid, safe disposal of swarf and "
         "waste, hazard identification, safety signs, electrical accident prevention and fire "
         "extinguisher use before touching a machine. Second, in the practical task columns, where each "
         "job names the operation and therefore the tool. Third, in Annexure-I, which is the auditable "
         "list of trainee tool kits, shop tools and accessories, and machinery with specification and "
         "quantity for a batch (commonly 20 or 25 trainees, plus one for the instructor)."),
        ("2.3 The CITS structure",
         "CITS is a one-year, NSQF level 5 or 6 programme. Trade Technology comprises Professional "
         "Skill and Professional Knowledge at basic and advanced level. Training Methodology is common "
         "to all trades and is split into TM Practical and TM Theory (approximately 270 + 180 hours in "
         "the NSQF-6 Fitter document), with a mandatory 150 hours of On-the-Job Training or group "
         "project where industry attachment is not available. Engineering Technology (Workshop "
         "Calculation and Science, Engineering Drawing) or Vocational Calculation and Science and Soft "
         "Skills complete the programme. The instructor is assessed on all components \u2014 for example "
         "40 per cent in Trade Theory, 40 per cent in Principles of Teaching, 40 per cent in Vocational "
         "Calculation and Science and 60 per cent in Trade Practical, with 80 per cent attendance \u2014 "
         "before being awarded the NCIC."),
        ("2.4 The two audiences for a tool list",
         "A CTS trainee needs to identify a tool, select it correctly, use it safely and maintain it. A "
         "CITS instructor trainee needs all of that plus the ability to demonstrate it, to explain its "
         "construction and principle, to prepare the job sheet or operation sheet that uses it, to "
         "specify it in an indent, to inspect it, and to teach the safety precautions around it. This "
         "document therefore records identification, operation, care and safety for every entry, and "
         "adds a separate instructor-focused chapter (Ch. 8) for the Training Methodology aids."),
        ("2.5 NSQF level expectation",
         "NSQF level determines the depth of tool competence. At levels 3 and 3.5 (COPA, DTP, "
         "Draughtsman variants, many one-year service trades) the expectation is correct routine use "
         "under supervision. At level 4 (most one-year engineering and two-year non-engineering trades) "
         "the trainee works independently to specification. At level 5 (Electrician, Fitter variants, "
         "advanced maintenance trades) the trainee diagnoses, sets up and inspects. CITS instructors are "
         "trained at level 5 or 6, which is why they must be able to teach, assess and improve the use "
         "of the same tools."),
    ],
}

TRADE_TABLE = [
    # (Group, Representative CTS trades)
    ("Machining & Fitting",
     "Fitter, Turner, Machinist, Machinist (Grinder), Tool & Die Maker (Dies & Moulds), Tool & Die "
     "Maker (Press Tools, Jigs & Fixtures), Operator Advanced Machine Tools, Mechanic Machine Tools "
     "Maintenance"),
    ("Fabrication & Welding",
     "Welder (Gas & Electric), Welder (Pipe), Sheet Metal Worker, Structural Fabricator, Forger & "
     "Heat Treater, Foundryman Technician, Mechanic Mining Machinery"),
    ("Electrical",
     "Electrician, Wireman, Lift & Escalator Mechanic, Mechanic Power Electronics, Electroplater"),
    ("Electronics & ICT",
     "Electronics Mechanic, Mechanic Consumer Electronics Appliances, Mechanic Industrial Electronics, "
     "Mechanic Medical Electronics, Mechanic Computer Hardware, Mechanic Radio & TV, Mechanic "
     "Communication Equipment Maintenance, ICT System Maintenance, Mechanic-cum-Operator Electronics "
     "Communication System, Mechanic Mechatronics, Network Technician, Data Entry Operator, COPA, "
     "DTP Operator, Web Designing & Computer Graphics, Multimedia Animation & Special Effects"),
    ("Automotive",
     "Mechanic Motor Vehicle, Mechanic (Auto Electrical & Electronics), Mechanic Diesel Engine, "
     "Mechanic Repair & Maintenance of Light/Heavy Vehicles, Mechanic Repair & Maintenance of Two "
     "Wheelers, Mechanic Tractor, Driver-cum-Mechanic, Mechanic Agricultural Machinery, Marine Engine "
     "Fitter, Vessel Navigator"),
    ("Refrigeration, HVAC & Fluid",
     "Mechanic (Refrigeration & Air-Conditioner), Plumber, Pump Operator-cum-Mechanic, Sanitary "
     "Hardware Fitter, Attendant Operator (Chemical Plant), Instrument Mechanic (Chemical Plant), "
     "Maintenance Mechanic (Chemical Plant), Laboratory Assistant (Chemical Plant)"),
    ("Building & Construction",
     "Mason (Building Constructor), Carpenter, Painter General, Domestic Painter, Industrial Painter, "
     "Draughtsman (Civil), Architectural Draughtsman / Architectural Assistant, Interior Design & "
     "Decoration, Surveyor, Building Maintenance, Stone Mining/Processing Machine Operator, Excavator "
     "Operator (Mining)"),
    ("Textile, Apparel & Leather",
     "Dress Making, Cutting & Sewing, Sewing Technology, Fashion Design & Technology, Surface "
     "Ornamentation Techniques, Computer Aided Embroidery & Designing, Textile Mechatronics, Weaving "
     "Technician, Spinning Technician, Textile Wet Processing Technician, Leather Goods Maker, "
     "Footwear Maker"),
    ("Printing & Media",
     "Litho Offset Machine Minder, Plate Maker-cum-Impositor, Process Cameraman, Digital Photographer, "
     "Photographer, Desktop Publishing Operator"),
    ("Food, Agriculture & Allied",
     "Craftsman Food Production (General/Vegetarian), Baker & Confectioner, Catering & Hospitality "
     "Assistant, Food & Vegetable Processing, Dairying, Horticulture, Floriculture & Landscaping, "
     "Agro Processing, Cane & Bamboo Worker"),
    ("Service, Health & Beauty",
     "Basic Cosmetology, Spa Therapy, Physiotherapy Technician, Health Sanitary Inspector, Health "
     "Safety & Environment, Hospital House Keeping, Radiology Technician, Old Age Care Assistant, "
     "Creche Management, Firemen, Fire Technology, Counselling Skills"),
    ("Business, Office & Emerging",
     "Secretarial Practice (English), Stenographer & Secretarial Assistant (Hindi/English), Office "
     "Assistant-cum-Computer Operator, Finance Executive, Marketing Executive, Human Resource "
     "Executive, Front Office Assistant, Library & Information Science, Travel & Tourism, Tourist "
     "Guide, Insurance Agent, Artificial Intelligence Programming Assistant, Additive Manufacturing, "
     "Drone Technician, Semiconductor Technician, Information Technology"),
]

SUBJECT_TABLE = [
    ("Subject", "Common abbreviation", "What it covers", "Tool implication"),
    ("Trade Practical", "TP / PS", "Workshop jobs; the professional skill component, about 70 per "
     "cent of hours", "All physical tools, machines and consumables"),
    ("Trade Theory", "TT / PK", "Principles, construction, materials, calculations of the trade",
     "Tool construction, selection and specification knowledge"),
    ("Engineering Drawing", "ED", "Reading and making drawings, projection, sections, tolerances",
     "Drawing board, instruments, CAD workstation, plotter"),
    ("Workshop Calculation & Science", "WCS", "Applied arithmetic, mensuration, physics, materials",
     "Measuring instruments, calculators, lab apparatus"),
    ("Employability Skills", "ES", "Communication, IT literacy, entrepreneurship, safety, quality",
     "Computer, projector, PPE for ES demonstrations"),
    ("Training Methodology", "TM (CITS only)", "Educational psychology, methods, instructional "
     "technology, assessment", "Training aids: boards, OHP, LCD, camera, smart board"),
    ("Vocational Calculation & Science", "VCS (CITS)", "Trade-relevant mathematics and science for "
     "instructors", "Measuring instruments, demonstration apparatus"),
    ("On-the-Job Training / Group Project", "OJT (CITS)", "150 hours in industry or a group project",
     "Industry-standard tools and equipment, project tooling"),
]

PASS_CRITERIA = [
    ("Programme", "Theory requirement", "Practical requirement", "Other"),
    ("CTS (typical ITI)", "33% Trade Theory; 33% Employability Skills",
     "60% Trade Practical", "Minimum 80% attendance to sit AITT"),
    ("CITS (NSTI, Fitter NSQF-6)", "40% Trade Theory; 40% Principles of Teaching; 40% VCS",
     "60% Trade Practical", "80% attendance")]

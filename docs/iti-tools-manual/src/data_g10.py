# -*- coding: utf-8 -*-
"""Group B: Building, construction, woodworking and painting tools."""

GROUP_B = {
    "letter": "B",
    "title": "Group 10 \u2014 Building, Construction, Woodworking and Painting",
    "intro": "Construction trades work with heavy materials, dust, silica and heights, and their tools "
             "are deceptively simple. A trowel, a chisel or a masonry drill each carry a specific hazard "
             "that is easy to overlook in a syllabus that covers plastering or bricklaying. Carpentry adds "
             "sharp edges and dust; painting adds solvents, isocyanates and work at height. The "
             "Silica hazard from concrete cutting and chasing deserves particular attention in an Indian "
             "ITI setting.",
    "items": [
        {
            "code": "B-001", "name": "Trowel, float and hawk",
            "aka": "Steel trowel; wooden float; sponge float; hawk board; notched trowel",
            "identify": "A flat steel or wooden plate with a handle: the steel trowel finishes, the wooden "
                        "float is for rendering, the sponge float textures, and the notched trowel spreads "
                        "tile adhesive in regular ribs.",
            "operate": "Load mortar onto the hawk, pick up a workable amount on the trowel, spread and "
                       "level, then finish with the appropriate float. Keep the blade at a shallow angle "
                       "and use the whole edge.",
            "safety": "Wet mortar is alkaline and dries the skin; wear gloves and wash hands before eating. "
                      "A dropped trowel from height is lethal \u2014 tether tools when working above ground "
                      "level.",
            "care": "Clean the blade immediately after use, oil the metal edge lightly, and do not let "
                    "mortar set on the trowel.",
            "trades": "Mason (Building Constructor), Painter, Building Maintenance, Interior Design",
            "ppe": "Gloves, safety boots, goggles when mixing",
        },
        {
            "code": "B-002", "name": "Masonry drill, hammer and chisel",
            "aka": "Masonry drill bit; SDS hammer drill; brick chisel; mortar chisel; club hammer",
            "identify": "A drill bit with a carbide insert and a flute for masonry; a hammer drill with a "
                        "percussion action; chisels with a wide or pointed forged edge; a club or lump "
                        "hammer, about 1\u20132 kg.",
            "operate": "Mark the position, use a short pilot, apply light pressure with the hammer action on "
                       "masonry, and clear the dust. Chisel with short blows and a guard, working towards "
                       "a free edge.",
            "safety": "Cutting, chasing and drilling concrete or brick generates respirable crystalline "
                      "silica, a serious lung hazard \u2014 use water suppression or dust extraction and an "
                      "appropriate respirator. Goggles and a face shield are essential, and hearing "
                      "protection for drilling. Never chisel with the tool pointing at anyone.",
            "care": "Replace a blunt masonry bit, dress a mushroomed chisel head, and clean and oil the "
                    "hammer handle.",
            "trades": "Mason, Plumber, Electrician (wall chasing), Building Maintenance, Painter",
            "ppe": "Respirator (silica), goggles, face shield, hearing protection, gloves",
        },
        {
            "code": "B-003", "name": "Mixing tools \u2014 trough, mixer and vibrator",
            "aka": "Mortar trough; concrete mixer; hand paddle; immersion vibrator; wheelbarrow; gauge "
                   "boxes and screed",
            "identify": "A trough for hand mixing, a drum mixer with a tilting wheel, a gauge box for "
                        "measuring aggregate, and a flexible-shaft vibrator with a needle for compacting "
                        "concrete.",
            "operate": "Measure by gauge box or weight, dry-mix in the ratio specified, add water gradually "
                       "to the correct workability, then place in layers and compact.",
            "safety": "Cement is a strong alkali and can cause chemical burns, particularly with prolonged "
                      "contact \u2014 gloves, boots and eye protection are essential. Never put a hand or a "
                      "shovel into a running mixer. A vibrator can electrocute in wet conditions, so it "
                      "must be RCD-protected.",
            "care": "Wash the mixer out after use, oil the drum bearings, and store the vibrator needle "
                    "clean.",
            "trades": "Mason, Building Constructor, Plumber, Civil works",
            "ppe": "Gloves, face shield, boots, respiratory protection for cement dust",
        },
        {
            "code": "B-004", "name": "Measuring, levelling and setting-out tools for building",
            "aka": "Water level; spirit level 600\u20131800 mm; plumb bob; square; line and pins; folding "
                   "rule; marking gauge",
            "identify": "A transparent water-filled hose shows equal height at both ends; a laser or spirit "
                        "level shows level and plumb; a line and pins set a straight axis; a folding rule "
                        "or tape measures.",
            "operate": "Establish a datum line, transfer levels with the water level or the laser, set out "
                       "right angles with the 3-4-5 method or a square, and string a line between pins for "
                       "a wall.",
            "safety": "Do not use a laser level while looking into the beam; keep the work area clear of "
                      "materials that could trip; props and formwork must not be left unbraced.",
            "care": "Calibrate the level, keep the water level free of airlocks, store the folding rule "
                    "dry, and protect the laser from impact.",
            "trades": "Mason, Carpenter, Draughtsman (Civil), Surveyor, Interior Design",
            "ppe": "Safety shoes, helmet on site, laser safety glasses where specified",
        },
        {
            "code": "B-005", "name": "Carpentry hand tools \u2014 saw, plane, chisel, mallet, square",
            "aka": "Handsaw; tenon saw; coping saw; jack plane; wood chisel set; wooden mallet; try square",
            "identify": "A saw with a hardened, set-tooth blade; a plane with a body, an iron, a cap iron "
                        "and an adjustable mouth; a bevel-edged chisel with a socket or tang handle; a "
                        "mallet with a beech or rubber head.",
            "operate": "Mark and knife the line, saw on the waste side using long strokes at about 45 "
                       "degrees, pare with the chisel and strike with the mallet, and check with the "
                       "square. Sharpen the plane iron and the chisel bevel on the oilstone.",
            "safety": "Wood chisels are the most common cause of serious hand cuts in a workshop. Always "
                      "chisel with both hands behind the edge, clamp the work, and never hold a piece in "
                      "the hand. Saws cut on the forward stroke and can jump; keep the other hand clear.",
            "care": "Hone the edges, oil the plane screws, keep the saw teeth protected in a rack, and "
                    "store the tools dry and off the floor.",
            "trades": "Carpenter, Interior Design & Decoration, Building Maintenance, Furniture",
            "ppe": "Safety glasses, dust mask when sanding",
        },
        {
            "code": "B-006", "name": "Portable power woodworking tools \u2014 circular saw, jigsaw, router, "
                             "planer",
            "aka": "Circular saw 7 inch; jigsaw; plunge router; power planer; reciprocating saw",
            "identify": "Hand-held power tools with a guard system and a base plate; the circular saw has a "
                        "spring-loaded lower guard, the jigsaw has an orbital action switch, and the "
                        "router has a plunge base and a depth stop.",
            "operate": "Clamp the work, set the depth so the blade projects a few millimetres below the "
                       "stock, connect to an extractor, start the tool before contact, and feed steadily "
                       "with both hands.",
            "safety": "Never remove or tie back the lower blade guard. Keep the cable behind the tool, "
                      "never in the cut line. Kickback when ripping is violent \u2014 use a rip guide and "
                      "stand to one side. Eye and hearing protection are essential, and a dust mask for "
                      "MDF and hardwood dust.",
            "care": "Clean the guards and vents, brush out the motor, check the brushes and the cable, and "
                    "keep the blades sharp.",
            "trades": "Carpenter, Interior Design, Building Maintenance, Furniture, Painter (boarding)",
            "ppe": "Goggles, hearing protection, dust mask, no gloves",
        },
        {
            "code": "B-007", "name": "Woodworking machine tools \u2014 circular saw bench, planer and "
                             "spindle moulder",
            "aka": "Table saw; surface planer; thicknesser; spindle moulder; mortiser",
            "identify": "Stationary machines with a cast-iron or steel table, a fence, guards and a dust "
                        "extraction hood: the table saw has a rising blade with a riving knife, the planer "
                        "has a cutter block, the moulder has a spindle with cutters, and the mortiser has "
                        "a hollow chisel.",
            "operate": "Set the fence and the depth, fit and adjust the guards, feed with push sticks and "
                       "feather boards against the rotation of the cutter, and never reach over the "
                       "cutter head.",
            "safety": "These are the highest-risk machines in a carpentry shop: the cutter block is "
                      "unguarded for the width of cut and a kickback can break a wrist. Guards, push "
                      "sticks and a riving knife are mandatory, short stock must not be machined, and "
                      "hearing protection and extraction are essential.",
            "care": "Check the knife or cutter tightness, wax the tables, check the belts and bearings, and "
                    "empty the extraction.",
            "trades": "Carpenter, Furniture, Interior Design, Building Maintenance",
            "ppe": "Goggles or face shield, hearing protection, dust mask, no gloves",
        },
        {
            "code": "B-008", "name": "Painting and decorating tools",
            "aka": "Brush set; roller and tray; spray gun; putty knife; sanding block; paint kettle and "
                   "strainer; ladder and platform",
            "identify": "Brushes are natural bristle for solvent paint and synthetic for water-based; "
                        "rollers have a sleeve and a frame; the spray gun has a nozzle, a needle and an air "
                        "cap; the putty knife is a flexible blade for filling.",
            "operate": "Prepare and sand the surface, prime, fill and sand again, then apply the finish in "
                       "thin coats. For spraying, set the fluid and air, keep the gun square and at a "
                       "constant distance, and use the correct thinner.",
            "safety": "Paints, thinners, two-pack hardeners and adhesives give off flammable and toxic "
                      "vapour. Use a cartridge or supplied-air respirator, ventilate, and eliminate "
                      "ignition sources. Isocyanate hardeners sensitise the lungs and can cause asthma. "
                      "Beware of lead paint in old buildings, and of working on a ladder with wet paint.",
            "care": "Clean brushes and rollers after each use, strain and store paint, clean the gun with "
                    "the correct solvent, and store solvents in a fireproof cabinet.",
            "trades": "Painter General, Domestic Painter, Industrial Painter, Building Maintenance, "
                      "Interior Design",
            "ppe": "Respirator, goggles, gloves, coverall, ventilation",
        },
        {
            "code": "B-009", "name": "Scaffolding, ladder and working platform",
            "aka": "Scaffold tower; trestle; mobile scaffold; ladder; safety harness",
            "identify": "A modular tube-and-fitting or system scaffold with standards, ledgers, transoms, "
                        "boards and guard rails; a ladder with a rated duty; a full-body harness with a "
                        "lanyard and an anchor point.",
            "operate": "Erect to the manufacturer's or the standard's configuration, brace and tie it, "
                       "provide toe boards and guard rails at all working levels, and access by an "
                       "internal ladder. Use a harness anchored above the working position.",
            "safety": "Falls are the leading cause of construction deaths. Never work from a scaffold "
                      "without guard rails, never climb the outside of a scaffold, and never overload a "
                      "platform. Inspect the scaffold after alteration or high wind. A ladder must be at "
                      "the correct angle, secured and extending above the landing.",
            "care": "Inspect the components for damage and corrosion, store under cover, and tag and "
                    "quarantine defective items. Record the scaffold inspection.",
            "trades": "Mason, Painter, Carpenter, Electrician, Building Maintenance, Fabricator",
            "ppe": "Full-body harness, helmet, safety boots, high-visibility vest",
        },
        {
            "code": "B-010", "name": "Concrete cutting and surface preparation tools",
            "aka": "Disc cutter (cut-off saw); core drill; scarifier; floor grinder; needle scaler; "
                   "sandblasting equipment",
            "identify": "Petrol, electric or hydraulic disc cutters with a water or dust suppression "
                        "system; a core drill with a diamond core and a water feed; a floor grinder with "
                        "diamond segments; a sandblasting pot with a nozzle and a supplied-air helmet.",
            "operate": "Mark the line, use water suppression or extraction, start the cut with the blade "
                       "clear, and cut in stages. For core drilling, anchor the rig, start the water, and "
                       "let the core bit cut without forcing.",
            "safety": "Silica dust from concrete cutting is a confirmed carcinogen \u2014 water suppression "
                      "plus a properly fitted respirator is mandatory, and dry cutting indoors should be "
                      "prohibited. Blade guards must stay on, and the operator needs hearing and eye "
                      "protection. Sandblasting requires a supplied-air helmet and full protective "
                      "clothing.",
            "care": "Check the blade and the water supply, flush the core drill, and maintain the dust "
                    "extraction filters.",
            "trades": "Mason, Building Maintenance, Stone Processing, Industrial Painter",
            "ppe": "Respirator P2/P3, face shield, hearing protection, gloves, waterproofs",
        },
        {
            "code": "B-011", "name": "Bar bending, cutting and steel fixing tools",
            "aka": "Bar bender; bar cutting machine; rebar cutter and bender; tying hook; bolt cutter; "
                   "hacksaw",
            "identify": "A lever or hydraulic bar bender with a former and a roller; a shear-type bar "
                        "cutter; a hook for tying binding wire; a long-handled bolt cutter.",
            "operate": "Set the former for the required bend radius, place the bar against the stop, and "
                       "bend in one steady stroke. Cut with the correct machine capacity and tie the cage "
                       "with the specified wire and pattern.",
            "safety": "Rebar ends are sharp and a bar under bending stores energy \u2014 keep clear of the "
                      "bar while it bends and never stand in the path of a cut bar. Bars can fall from a "
                      "stack; wear gloves and boots.",
            "care": "Oil the machine, check the formers and the shear blades, and store bars on dunnage.",
            "trades": "Mason, Building Constructor, Civil works",
            "ppe": "Heavy gloves, safety glasses, safety boots, helmet",
        },
        {
            "code": "B-012", "name": "Formwork, shuttering and propping tools",
            "aka": "Plywood shuttering; props and jacks; clamps; release agent; nail gun; crow bar",
            "identify": "Plywood or steel panels with timber or steel bearers, adjustable props with pins, "
                        "clamps for the joints, and a release agent for the face.",
            "operate": "Assemble to the drawing, prop and brace, check the level and the line, apply the "
                       "release agent, and strike only when the concrete has reached the specified "
                       "strength.",
            "safety": "Formwork failure during a pour is a collapse hazard \u2014 props must be on a sound "
                      "base and correctly braced, and the load must not exceed the design. Nail guns cause "
                      "penetrating injuries; never point one at a person, and treat every gun as loaded.",
            "care": "Clean and oil the panels, store the props on racks, and inspect the props for "
                    "buckled pins.",
            "trades": "Mason, Building Constructor, Carpenter",
            "ppe": "Gloves, helmet, safety boots, safety glasses",
        },
        {
            "code": "B-013", "name": "Demolition hand tools",
            "aka": "Crowbar; wrecking bar; sledge hammer; pickaxe; bolt cutter; dust suppression spray",
            "identify": "Heavy forged bars with a claw, chisel or point; a pick with a pointed and a "
                        "chisel end; a heavy sledge.",
            "operate": "Assess the structure, isolate services, work from the top down and from the "
                       "farthest point towards the exit, keep a clear escape route, and suppress dust with "
                       "water.",
            "safety": "Demolition is a high-hazard activity: uncontrolled collapse, buried services, "
                      "asbestos and silica. It requires a survey, isolation of electricity, gas and water, "
                      "and a permit. Never demolish a load-bearing element without an engineer's "
                      "instruction.",
            "care": "Inspect the bars and the handles, and remove burrs.",
            "trades": "Building Maintenance, Mason, General construction",
            "ppe": "Helmet, respirator, gloves, boots, high-visibility vest",
        },
        {
            "code": "B-014", "name": "Tile cutting and fixing tools",
            "aka": "Manual tile cutter; wet tile saw; angle grinder with diamond blade; notched trowel; "
                   "spacers; tile levelling system",
            "identify": "A scoring wheel and breaker on a rail; a wet saw with a diamond blade and a water "
                        "tray; a notched trowel with square or round notches sized to the tile; plastic "
                        "spacers and clips.",
            "operate": "Mark and score, break with the breaker, or cut with the wet saw; apply adhesive "
                       "with the notched trowel, back-butter large tiles, and set with spacers and a "
                       "level.",
            "safety": "Tile edges and cut slivers are razor sharp \u2014 gloves and goggles. Wet saws and "
                      "grinders run in water and dust, so RCD protection and a respirator for silica are "
                      "needed. Adhesive is alkaline and irritates the skin.",
            "care": "Clean the wet saw tray, check the blade, and wash the trowel before the adhesive sets.",
            "trades": "Mason, Interior Design, Painter, Building Maintenance",
            "ppe": "Goggles, gloves, respirator for silica, hearing protection",
        },
        {
            "code": "B-015", "name": "Glass and glazing tools",
            "aka": "Glass cutter; running pliers; glazing shovel; suction lifter; putty knife",
            "identify": "A small hardened wheel in a handle; pliers with a curved jaw for running a score; "
                        "a suction lifter with a pump and a gauge; a flexible knife for putty.",
            "operate": "Score once, firmly and in one pass, with the cutting fluid applied; run the score "
                       "with the pliers or over a wire; and carry with suction lifters.",
            "safety": "Glass cuts deeply and breaks without warning. Wear cut-resistant gloves, safety "
                      "glasses, and covered forearms; never carry a pane against the body; keep a first "
                      "aid kit with tweezers nearby. Dispose of broken glass in a rigid, labelled "
                      "container.",
            "care": "Oil the cutting wheel, store the cutter dry, and clean the suction cups.",
            "trades": "Carpenter, Interior Design, Building Maintenance, Glazier",
            "ppe": "Cut-resistant gloves, safety glasses, forearm protection",
        },
        {
            "code": "B-016", "name": "Plastering and rendering machine",
            "aka": "Mortar spray machine; plastering trowel machine; hopper and hose",
            "identify": "A hopper-fed pump delivering mortar through a hose to a spray nozzle, or a "
                        "rotating trowel machine with a float blade set.",
            "operate": "Set the mix and the delivery rate, keep the nozzle square to the wall, and follow "
                       "with a rule and a float. Clean the hose immediately after use.",
            "safety": "The pump is under pressure and a blocked hose can burst or inject mortar into the "
                      "skin \u2014 never look into or point a nozzle at a person, and bleed the pressure "
                      "before opening a line. Cement dust and lime are corrosive.",
            "care": "Flush the pump and hose with water after use, check the seals, and grease the "
                    "bearings.",
            "trades": "Mason, Painter, Building Maintenance",
            "ppe": "Face shield, gloves, boots, respirator",
        },
    ],
}

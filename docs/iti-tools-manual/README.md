# ITI Tool Compendium — CTS & CITS

`ITI_CTS_CITS_Tools_Compendium.pdf` is a 116-page reference listing the tools, equipment,
instruments, machines and training aids used in the Craftsmen Training Scheme (CTS / ITI) and the
Crafts Instructor Training Scheme (CITS / NSTI) under NCVT / DGT.

For every entry it records:

- identification points (what to look at to recognise and verify the tool)
- the minimum operating competence
- specific safety precautions and required PPE
- the care / calibration routine
- the trades in which it appears in the CTS and CITS curricula

## Contents at a glance

| Part | Chapters | What it covers |
| --- | --- | --- |
| A — Framework | 1–6 | Scope and sources, the CTS/CITS curriculum structure, the universal safety framework, PPE and signage matrix, power-tool and machine-guarding rules, calibration/5S |
| B — Register | 7 | 11 practice groups, 216 numbered entries (H, M, C, T, W, E, X, A, R, B, S) |
| C — References | 8–12 + Appendix A | CITS Training Methodology aid list, tool-competence checklists, trade-to-tool index, glossary and bibliography, limitations, alphabetical index |

## Sources

Compiled from DGT / NCVT competency-based curricula, in particular:

- Fitter CTS (NSQF-4, v3.0) and Fitter CITS (NSQF-5/6) — including the Annexure-I tool and
  equipment lists
- Electrician CTS (NSQF-5) — trainee tool kit, shop tools and test instruments
- Core Skills CITS — Training Methodology, Workshop Calculation & Science, Engineering Drawing,
  including the official Training Methodology tools and equipment list
- The DGT/NSTI trade listings used for the trade table in Chapter 2

Safety and operating content follows standard workshop practice (IS/BIS, IEC 60900, OSHA and
manufacturer guidance). The document is a compilation, not an official DGT publication.

## Regenerating the PDF

Requires Python 3 with `reportlab` (and `pypdfium2` for the running-header pass):

```bash
python3 -m venv .venv-pdf
.venv-pdf/bin/pip install reportlab pypdfium2
.venv-pdf/bin/python docs/iti-tools-manual/src/build_pdf.py
```

The generator runs twice: the first pass renders the document and learns which heading governs each
page, the second pass prints that heading in the running header.

### Source layout

```
src/
  build_pdf.py      layout, styles, page decoration, TOC, index, build passes
  data_intro.py     front matter, how-to-use, Chapters 1–2, trade and subject tables
  data_safety.py    Chapter 3 (safety framework), PPE matrix, signage, fire classes, power rules
  data_g1..g11.py   the 11 tool groups (the register)
  data_g12.py       Chapters 4–6, CITS Training Methodology aids, checklists, glossary, bibliography
```

Tool codes are stable (`group-letter` + serial, e.g. `M-014`) and can be quoted in job sheets,
store indents and inspection checklists. When adding or removing an entry the group's serial
numbering and the group summary table update automatically; the entry counts quoted in the text
(currently 216 register entries plus 10 Training Methodology aids) must be edited by hand.

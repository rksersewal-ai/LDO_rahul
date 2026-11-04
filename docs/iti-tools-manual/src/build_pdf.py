# -*- coding: utf-8 -*-
"""Builds the ITI Tool Compendium PDF."""

import os
import sys

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (BaseDocTemplate, Frame, Image, KeepTogether, NextPageTemplate,
                                PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle)
from reportlab.platypus.tableofcontents import TableOfContents

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import data_intro as DI
import data_safety as DS
import data_g1 as G1
import data_g2 as G2
import data_g3 as G3
import data_g4 as G4
import data_g5 as G5
import data_g6 as G6
import data_g7 as G7
import data_g8 as G8
import data_g9 as G9
import data_g10 as G10
import data_g11 as G11
import data_g12 as G12

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..",
                   "ITI_CTS_CITS_Tools_Compendium.pdf")

INK = colors.HexColor("#12263A")
ACCENT = colors.HexColor("#1F5F8B")
LIGHT = colors.HexColor("#EAF1F6")
RULE = colors.HexColor("#B8CBD8")
MUTED = colors.HexColor("#4A5A66")
BG = colors.HexColor("#F7FAFC")

HEADER_MAP = {}      # page -> heading text, learnt on the first pass
PAGE_START = {}      # page on which each heading starts, learnt on the first pass

PAGE_W, PAGE_H = A4
LM = RM = 18 * mm
TM_ = 19 * mm
BM = 16 * mm

ss = getSampleStyleSheet()


def st(name, **kw):
    base = kw.pop("parent", ss["BodyText"])
    return ParagraphStyle(name, parent=base, **kw)


S = {
    "cover_kicker": st("ck", fontName="Helvetica-Bold", fontSize=10.5, textColor=ACCENT,
                       tracking=2.2, spaceAfter=8, leading=14),
    "cover_title": st("ct", fontName="Helvetica-Bold", fontSize=40, leading=44, textColor=INK,
                      spaceAfter=6),
    "cover_sub": st("cs", fontName="Helvetica", fontSize=15.5, leading=22, textColor=MUTED,
                    spaceAfter=16),
    "cover_meta": st("cm", fontName="Helvetica", fontSize=9.5, leading=15, textColor=MUTED),
    "h1": st("h1", fontName="Helvetica-Bold", fontSize=20, leading=24, textColor=INK,
             spaceBefore=2, spaceAfter=10),
    "h1_part": st("h1p", fontName="Helvetica-Bold", fontSize=20, leading=24, textColor=INK,
                  spaceBefore=2, spaceAfter=10),
    "h2": st("h2", fontName="Helvetica-Bold", fontSize=11.2, leading=14.5, textColor=ACCENT,
             spaceBefore=11, spaceAfter=4.5),
    "h3": st("h3", fontName="Helvetica-Bold", fontSize=9.8, leading=13, textColor=INK,
             spaceBefore=8, spaceAfter=3),
    "body": st("body", fontName="Helvetica", fontSize=9.3, leading=13.6, textColor=INK,
               alignment=TA_JUSTIFY, spaceAfter=6),
    "body_l": st("bl", parent=ss["BodyText"], fontName="Helvetica", fontSize=9.3, leading=13.6,
                 textColor=INK, alignment=TA_LEFT, spaceAfter=6),
    "toolname": st("tn", fontName="Helvetica-Bold", fontSize=10.6, leading=13.6, textColor=colors.white),
    "toolcode": st("tc", fontName="Helvetica-Bold", fontSize=8.4, leading=11, textColor=colors.white),
    "aka": st("aka", fontName="Helvetica-Oblique", fontSize=8.5, leading=11.6, textColor=MUTED,
              spaceAfter=2),
    "field": st("fld", fontName="Helvetica", fontSize=8.5, leading=11.9, textColor=INK,
                alignment=TA_JUSTIFY),
    "field_lbl": st("flbl", fontName="Helvetica-Bold", fontSize=8.1, leading=11.9, textColor=ACCENT),
    "tbl": st("tbl", fontName="Helvetica", fontSize=7.9, leading=10.6, textColor=INK),
    "tbl_b": st("tblb", fontName="Helvetica-Bold", fontSize=7.9, leading=10.6, textColor=colors.white),
    "tbl_c": st("tblc", fontName="Helvetica-Bold", fontSize=7.9, leading=10.6, textColor=INK),
    "cv_kicker": st("cvk", fontName="Helvetica-Bold", fontSize=10, textColor=colors.HexColor("#6FB3D9"),
                    spaceAfter=9),
    "cv_title": st("cvt", fontName="Helvetica-Bold", fontSize=42, leading=46,
                   textColor=colors.white, spaceAfter=10),
    "cv_sub": st("cvs", fontName="Helvetica", fontSize=12.5, leading=19,
                 textColor=colors.HexColor("#C7D8E4"), spaceAfter=10),
    "cv_meta": st("cvm", fontName="Helvetica", fontSize=9, leading=14,
                  textColor=colors.HexColor("#8FA9BC")),
    "cv_lbl": st("cvl", fontName="Helvetica-Bold", fontSize=7.6, leading=11,
                 textColor=colors.HexColor("#6FB3D9")),
    "caption": st("cap", fontName="Helvetica-Oblique", fontSize=8, leading=11, textColor=MUTED,
                  spaceBefore=3, spaceAfter=10),
    "bullet": st("bul", fontName="Helvetica", fontSize=9, leading=13, textColor=INK,
                 leftIndent=11, bulletIndent=2, spaceAfter=3.5, alignment=TA_JUSTIFY),
    "toc1": st("toc1", fontName="Helvetica-Bold", fontSize=10, leading=17, textColor=INK),
    "toc2": st("toc2", fontName="Helvetica", fontSize=8.8, leading=14, textColor=MUTED,
               leftIndent=14),
    "note": st("note", fontName="Helvetica-Oblique", fontSize=8.4, leading=12, textColor=MUTED),
}


def esc(t):
    return (str(t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


class Doc(BaseDocTemplate):
    def __init__(self, path, **kw):
        BaseDocTemplate.__init__(self, path, **kw)
        self.section = "\u2014"
        self.chapter = ""

    def afterFlowable(self, flowable):
        if getattr(flowable, "_toc_level", None) == 0:
            self.chapter = flowable._toc_text
            PAGE_START.setdefault(self.page, flowable._toc_text)
        if hasattr(flowable, "_toc_level"):
            key = flowable._toc_key
            self.canv.bookmarkPage(key)
            try:
                self.canv.addOutlineEntry(flowable._toc_text, key,
                                          level=flowable._toc_level, closed=0)
            except Exception:
                pass
            self.notify("TOCEntry", (flowable._toc_level, flowable._toc_text, self.page, key))


def deco(canv, doc, kind):
    canv.saveState()
    W, H = canv._pagesize
    if kind == "cover":
        canv.setFillColor(INK)
        canv.rect(0, 0, W, H, stroke=0, fill=1)
        canv.setFillColor(colors.HexColor("#0D1A26"))
        canv.rect(0, 0, W, 118, stroke=0, fill=1)
        canv.setFillColor(ACCENT)
        canv.rect(0, H - 10, W, 10, stroke=0, fill=1)
        canv.setFillColor(colors.HexColor("#2E7FAE"))
        canv.rect(0, H - 10, W * 0.34, 10, stroke=0, fill=1)
    else:
        # header rule
        canv.setStrokeColor(RULE)
        canv.setLineWidth(0.6)
        canv.line(LM, H - TM_ + 6, W - RM, H - TM_ + 6)
        canv.setFont("Helvetica", 7.4)
        canv.setFillColor(MUTED)
        canv.drawString(LM, H - TM_ + 10, "ITI Tool Compendium  \u2013  CTS & CITS")
        canv.drawRightString(W - RM, H - TM_ + 10, HEADER_MAP.get(doc.page, ""))
        # footer
        canv.line(LM, BM, W - RM, BM)
        canv.setFont("Helvetica", 7.4)
        canv.drawString(LM, BM - 10, "NCVT / DGT trade tools, operation and safety reference")
        canv.setFont("Helvetica-Bold", 8.4)
        canv.setFillColor(ACCENT)
        canv.drawRightString(W - RM, BM - 10, str(doc.page))
    canv.restoreState()


def draw_cover(canv, doc):
    deco(canv, doc, "cover")


def draw_divider(canv, doc):
    canv.saveState()
    W, H = canv._pagesize
    canv.setFillColor(INK)
    canv.rect(0, 0, W, H, stroke=0, fill=1)
    canv.setFillColor(colors.HexColor("#0D1A26"))
    canv.rect(0, 0, W, 92, stroke=0, fill=1)
    canv.setFillColor(ACCENT)
    canv.rect(0, H - 9, W, 9, stroke=0, fill=1)
    canv.setFillColor(colors.HexColor("#2E7FAE"))
    canv.rect(0, H - 9, W * 0.34, 9, stroke=0, fill=1)
    canv.setFont("Helvetica", 7.4)
    canv.setFillColor(colors.HexColor("#54708A"))
    canv.drawString(LM, 34, "ITI Tool Compendium  \u2013  CTS & CITS")
    canv.setFont("Helvetica-Bold", 8.4)
    canv.setFillColor(colors.HexColor("#6FB3D9"))
    canv.drawRightString(W - RM, 34, str(doc.page))
    canv.restoreState()


def draw_body(canv, doc):
    deco(canv, doc, "body")


class H1(Paragraph):
    def __init__(self, text, toc_key=None, level=0, register=True):
        Paragraph.__init__(self, esc(text), S["h1"])
        if level is None:
            return
        if register:
            HEADING_TEXTS.append(text)
        if level is None:
            return
        self._toc_level = level
        self._toc_text = text
        k = toc_key or text
        self._toc_key = k.replace("'", "\u2019").replace('"', "\u201d")
        self.chapter = text


class H2(Paragraph):
    def __init__(self, text, toc=False):
        Paragraph.__init__(self, esc(text), S["h2"])
        if not toc:
            return
        self._toc_level = 1
        self._toc_text = text
        self._toc_key = text.replace("'", "\u2019").replace('"', "\u201d")


def P(txt, style="body"):
    return Paragraph(txt, S[style])


def table(rows, widths, header=True, zebra=True, fs=7.9, align_center=False):
    data = []
    for i, row in enumerate(rows):
        r = []
        for j, cell in enumerate(row):
            if i == 0 and header:
                r.append(Paragraph(esc(cell), S["tbl_b"]))
            elif j == 0 and header:
                r.append(Paragraph(esc(cell), S["tbl_c"]))
            else:
                r.append(Paragraph(esc(cell), S["tbl"]))
        data.append(r)
    t = Table(data, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    cmds = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4.5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4.5),
        ("TOPPADDING", (0, 0), (-1, -1), 3.6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.6),
        ("BOX", (0, 0), (-1, -1), 0.6, RULE),
        ("LINEBELOW", (0, 0), (-1, -1), 0.35, RULE),
    ]
    if header:
        cmds.append(("BACKGROUND", (0, 0), (-1, 0), INK))
    if zebra:
        for i in range(1, len(data)):
            if i % 2 == 0:
                cmds.append(("BACKGROUND", (0, i), (-1, i), BG))
    t.setStyle(TableStyle(cmds))
    return t


# ---------------------------------------------------------------- tool panel ---

INSTRUMENT_SELECT = [
    ("Measurement need", "Expected tolerance", "Instrument", "Least count / note"),
    ("Rough length, marking out", "\u00b1 0.5 mm", "Steel rule", "0.5 mm; sight vertically to avoid "
     "parallax"),
    ("General external and internal size", "\u00b1 0.1 mm", "Vernier caliper", "0.02 mm; check zero "
     "at every use"),
    ("Precision diameter, journal, thickness", "\u00b1 0.01 mm", "Outside micrometer", "0.01 mm; use "
     "the ratchet, never force"),
    ("Bores, cylinder wear", "\u00b1 0.01 mm", "Dial bore gauge set with a micrometer",
     "0.01 mm; measure at three levels, two directions"),
    ("Depth of a blind hole or recess", "\u00b1 0.02 mm", "Depth micrometer or depth gauge",
     "0.01 mm; three readings around the feature"),
    ("Angle", "5 minutes", "Vernier bevel protractor", "5 min; or a sine bar with slip gauges for "
     "high accuracy"),
    ("Runout, squareness, alignment", "0.01 mm", "Dial test indicator with magnetic base",
     "0.01 mm; pre-load the stylus about half a turn"),
    ("Thread pitch diameter", "Class of fit", "Thread micrometer or three-wire method",
     "Best practice for precision threads"),
    ("Surface finish", "Ra value", "Roughness comparator plates, or a profilometer",
     "N1\u2013N12 visual and tactile comparison; instrument for a number"),
    ("Flatness and straightness", "0.01 mm", "Surface plate with blueing, straight edge and feeler",
     "Marking and scraping control"),
    ("Complex geometry, position, form", "Micron level", "Coordinate measuring machine",
     "Temperature-controlled room; probe qualified on a reference sphere"),
    ("Torque of a fastener", "\u00b1 3 to 5 per cent", "Torque wrench", "Return to the lowest setting "
     "after use; calibrate annually"),
    ("Voltage, current, resistance, continuity", "Meter accuracy class", "Digital multimeter",
     "Match the CAT rating to the installation"),
    ("Insulation resistance", "Megohm", "Insulation tester (megger)", "500 V or 1000 V test voltage; "
     "discharge after the test"),
    ("Earth resistance", "Ohm", "Earth tester", "Fall-of-potential method with spikes"),
    ("Rotational speed", "rpm", "Tachometer or stroboscope", "Optical type keeps the hand away from "
     "the shaft"),
    ("Temperature", "\u00b1 1 degree C", "Thermometer, thermocouple or infrared pyrometer",
     "Set the emissivity for infrared types"),
]


FIELD_ORDER = [
    ("identify", "Identify"),
    ("operate", "Operate"),
    ("safety", "Safety / precautions"),
    ("care", "Care / calibration"),
    ("trades", "Trades"),
    ("ppe", "PPE"),
]


def _strip(item, avail):
    """Header strip for a tool entry. Rendered as the first slice of the panel table."""
    hdr = Table(
        [[Paragraph(esc(item["code"]), S["toolcode"]),
          Paragraph(esc(item["name"]), S["toolname"])]],
        colWidths=[17 * mm, avail - 17 * mm], hAlign="LEFT")
    hdr.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ACCENT),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, 0), 5),
        ("LEFTPADDING", (1, 0), (1, 0), 2),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return hdr


def tool_panel(item):
    """Detailed entry panel: one table so it can split at row boundaries when it
    reaches the foot of a page, with the header strip repeated on continuation."""
    pad = 3.2 * mm
    outer_w = PAGE_W - LM - RM
    lblw = 24 * mm + pad
    avail = outer_w - lblw - pad
    hdr = _strip(item, outer_w - 2 * pad)

    rows = [[hdr, ""]]
    cmds = [
        ("SPAN", (0, 0), (1, 0)),
        ("BACKGROUND", (0, 0), (1, 0), colors.white),
        ("LEFTPADDING", (0, 0), (-1, 0), pad),
        ("RIGHTPADDING", (0, 0), (-1, 0), pad),
        ("TOPPADDING", (0, 0), (-1, 0), pad),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 1.6 * mm),
    ]
    i = 1
    if item.get("aka"):
        rows.append([Paragraph("<i>Also called:</i>&nbsp;&nbsp;" + esc(item["aka"]), S["aka"]), ""])
        cmds += [("SPAN", (0, 1), (1, 1)),
                 ("BACKGROUND", (0, 1), (1, 1), colors.HexColor("#F3F7FA")),
                 ("LEFTPADDING", (0, 1), (0, 1), pad + 1.5),
                 ("BOTTOMPADDING", (0, 1), (1, 1), 2.2),
                 ("TOPPADDING", (0, 1), (1, 1), 2.2)]
        i = 2
    for key, label in FIELD_ORDER:
        val = item.get(key)
        if not val:
            continue
        rows.append([Paragraph(esc(label), S["field_lbl"]),
                     Paragraph(esc(val), S["field"])])
        if key == "safety":
            cmds += [("BACKGROUND", (0, i), (-1, i), colors.HexColor("#FFF3E4")),
                     ("LINEBEFORE", (0, i), (0, i), 2.4, colors.HexColor("#DE8A22"))]
        i += 1

    cmds += [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 0.7, RULE),
        ("LEFTPADDING", (0, 1), (-1, -1), pad),
        ("RIGHTPADDING", (0, 1), (0, -1), 4),
        ("RIGHTPADDING", (1, 1), (1, -1), pad),
        ("TOPPADDING", (0, 1), (-1, -1), 2.0),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 2.0),
        ("BOTTOMPADDING", (0, -1), (-1, -1), pad),
        ("LINEBELOW", (0, 1), (-1, -2), 0.4, LIGHT),
    ]
    t = Table(rows, colWidths=[lblw, avail], hAlign="LEFT",
              splitByRow=1, repeatRows=1)
    t.setStyle(TableStyle(cmds))
    return [t, Spacer(1, 3.0 * mm)]


def group_section(g):
    out = [H1("%s" % g["title"], level=0), P(esc(g["intro"]))]
    out.append(Spacer(1, 2 * mm))
    out.append(P("<b>%d entries in this group.</b>" % len(g["items"]), "note"))
    out.append(Spacer(1, 3 * mm))
    for it in g["items"]:
        out.extend(tool_panel(it))
    return out


def part_divider(letter, title, blurb, contents):
    """Full-page dark divider for a Part."""
    rows = []
    for c in contents:
        rows.append([Paragraph("\u2014", S["cv_lbl"]), Paragraph(c, S["cv_meta"])])
    t = Table(rows, colWidths=[10 * mm, 120 * mm], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    out = [Spacer(1, 34 * mm),
           Paragraph("PART " + letter, S["cv_kicker"]),
           Paragraph(title, S["cv_title"]),
           Spacer(1, 4 * mm),
           Paragraph(blurb, S["cv_sub"]),
           Spacer(1, 10 * mm), t,
           NextPageTemplate("body"), PageBreak()]
    return out


def all_groups():
    return [G1.GROUP_G1, G2.GROUP_M, G3.GROUP_C, G4.GROUP_T, G5.GROUP_W, G6.GROUP_E,
            G7.GROUP_X, G8.GROUP_A, G9.GROUP_R, G10.GROUP_B, G11.GROUP_S]


# ------------------------------------------------------------------- content ---

def build():
    HEADING_TEXTS.clear()
    doc = Doc(OUT, pagesize=A4, leftMargin=LM, rightMargin=RM, topMargin=TM_, bottomMargin=BM,
              title="ITI Tool Compendium \u2014 CTS and CITS",
              author="Compiled reference", subject="ITI CTS/CITS tools, operation and safety",
              creator="ReportLab")

    frame_cover = Frame(LM, BM, PAGE_W - LM - RM, PAGE_H - TM_ - BM, id="cover",
                        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    frame_body = Frame(LM, BM + 6, PAGE_W - LM - RM, PAGE_H - TM_ - BM - 10, id="body",
                       leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[frame_cover], onPage=draw_cover),
        PageTemplate(id="body", frames=[frame_body], onPage=draw_body),
        PageTemplate(id="divider", frames=[frame_cover], onPage=draw_divider),
    ])

    story = []
    a = story.append

    # ---------------- cover ----------------
    a(Spacer(1, 40 * mm))
    a(Paragraph("TRAINING REFERENCE&nbsp;&nbsp;\u00b7&nbsp;&nbsp;NCVT / DGT", S["cv_kicker"]))
    a(Paragraph("ITI Tool Compendium", S["cv_title"]))
    a(Spacer(1, 3 * mm))
    a(Paragraph("Tools, equipment and training aids used across the Craftsmen Training Scheme "
                "(CTS / ITI) and the Crafts Instructor Training Scheme (CITS / NSTI)", S["cv_sub"]))
    a(Paragraph("With identification points, operating essentials, care routines and safety "
                "precautions for every entry", S["cv_sub"]))
    a(Spacer(1, 7 * mm))
    a(Paragraph("Engineering &amp; non-engineering trades&nbsp;&nbsp;\u00b7&nbsp;&nbsp;minor and major "
                "tools&nbsp;&nbsp;\u00b7&nbsp;&nbsp;hand tools, machine tools, metrology, welding, "
                "electrical, electronics, automotive, refrigeration, construction, textile, printing, "
                "food, beauty, health and instructional aids", S["cv_meta"]))

    a(Spacer(1, 22 * mm))
    n_items = sum(len(g["items"]) for g in all_groups()) + len(G12.CH_TM["items"])
    facts = Table([[Paragraph("PREPARED FOR", S["cv_lbl"]), Paragraph("COVERAGE", S["cv_lbl"]),
                    Paragraph("SOURCE BASIS", S["cv_lbl"])],
                   [Paragraph("ITIs, NSTIs, CITS instructor trainees and instructors under NCVT / DGT",
                              S["cv_meta"]),
                    Paragraph("%d numbered tool entries in %d groups, plus framing and reference "
                              "chapters" % (n_items, len(all_groups())), S["cv_meta"]),
                    Paragraph("DGT / NCVT trade curricula, Annexure-I tool and equipment lists, and "
                              "standard workshop safety practice", S["cv_meta"])]],
                  colWidths=[(PAGE_W - LM - RM) * 0.30, (PAGE_W - LM - RM) * 0.34,
                             (PAGE_W - LM - RM) * 0.36], hAlign="LEFT")
    facts.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEABOVE", (0, 0), (-1, 0), 1.0, ACCENT),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (0, -1), 10),
    ]))
    a(facts)
    a(Spacer(1, 30 * mm))
    a(Paragraph(DI.EDITION, S["cv_meta"]))
    a(Paragraph("A research compilation, not an official DGT publication. Verify specifications "
                "against the current curriculum PDF for the trade before use in an indent or an audit.",
                S["cv_meta"]))

    a(NextPageTemplate("body"))
    a(PageBreak())

    # ---------------- contents ----------------
    a(H1("Contents", level=None, register=False))
    a(P("The register in Part B is indexed by tool group. Each entry within a group carries a code "
        "in the form group-letter plus serial number.", "note"))
    a(Spacer(1, 3 * mm))
    toc = TableOfContents()
    toc.levelStyles = [S["toc1"], S["toc2"]]
    toc.dotsMinLevel = 0
    a(toc)
    a(PageBreak())

    # ---------------- abstract / how to use ----------------
    a(H1("About This Compendium", level=0))
    a(P(esc(DI.ABSTRACT)))
    a(H2("How to use it"))
    how = [[i + 1, k, v] for i, (k, v) in enumerate(DI.HOW_TO_USE)]
    rows = [("", "Part / feature", "What it gives you")]
    for n, k, v in how:
        rows.append((str(n), k, v))
    a(table(rows, [10 * mm, 34 * mm, PAGE_W - LM - RM - 44 * mm]))
    a(Spacer(1, 3 * mm))
    a(P("A note on conventions: quantities and specifications are quoted as they appear in the DGT "
        "source curriculum where available, and as typical workshop practice otherwise. Every "
        "parameter that a trainee might act on \u2014 speed, pressure, torque, test voltage, "
        "temperature \u2014 must be confirmed against the machine manual and the shop standard "
        "operating procedure before use.", "note"))

    # ---------------- Part A framing ----------------
    a(NextPageTemplate("divider"))
    a(PageBreak())
    for fl in part_divider("A", "Framework",
                           "What CTS and CITS are, how tools enter the curriculum, and the safety "
                           "hierarchy that applies to every tool in the register.",
                           ["1. Scope, sources and method",
                            "2. The CTS and CITS curriculum framework",
                            "3. Universal safety framework for workshop tools",
                            "5. PPE and safety signage matrix",
                            "6. Power tool and machine guarding rules",
                            "7. Calibration, care, storage and 5S"]):
        a(fl)

    a(H1(DI.CH_ABOUT["title"], level=0))
    for head, body in DI.CH_ABOUT["paras"]:
        a(H2(head))
        a(P(esc(body)))

    a(PageBreak())
    a(H1(DI.CH_FRAMEWORK["title"], level=0))
    for head, body in DI.CH_FRAMEWORK["paras"]:
        a(H2(head))
        a(P(esc(body)))

    a(H2("2.6 Representative CTS trades by discipline"))
    a(P("The trade list below is a consolidated view of the trades currently offered under CTS across "
        "ITIs and NSTIs. It is grouped by discipline so that a reader can find the tool group that "
        "applies. A single trade may draw on several tool groups."))
    a(table([(g, t) for g, t in DI.TRADE_TABLE],
            [38 * mm, PAGE_W - LM - RM - 38 * mm]))
    a(P("Table 2.1 \u2014 CTS trades grouped by discipline. Source: DGT and NSTI trade listings.",
        "caption"))

    a(H2("2.7 Subjects and their tool implications"))
    a(table(DI.SUBJECT_TABLE,
            [34 * mm, 20 * mm, 58 * mm, PAGE_W - LM - RM - 112 * mm]))
    a(P("Table 2.2 \u2014 Curriculum subjects and the tools each implies.", "caption"))

    a(H2("2.8 Assessment thresholds"))
    a(table(DI.PASS_CRITERIA, [42 * mm, 52 * mm, 44 * mm, PAGE_W - LM - RM - 138 * mm]))
    a(P("Table 2.3 \u2014 Typical pass criteria. Requirements vary by NSTI and by year; confirm "
        "against the current scheme document.", "caption"))

    a(PageBreak())
    a(H1(DS.CH_SAFETY["title"], level=0))
    for head, body in DS.CH_SAFETY["paras"]:
        a(H2(head))
        a(P(esc(body)))

    # ---------------- Part C reference tables moved here ----------------
    a(PageBreak())
    a(H1(G12.CH_PPE["title"], level=0))
    for head, body in G12.CH_PPE["paras"]:
        a(H2(head))
        a(P(esc(body)))
    a(H2("4.5 PPE matrix by operation"))
    w = PAGE_W - LM - RM
    cols = [34, 40, 46, 40, 52, 48]
    scale = w / sum(cols)
    a(table(DS.PPE_MATRIX, [c * scale for c in cols]))
    a(P("Table 4.1 \u2014 Minimum PPE by operation. Where rows overlap, the more protective "
        "requirement applies.", "caption"))

    a(H2("4.6 Safety signage"))
    a(table(DS.SAFETY_SIGNS, [36 * mm, 46 * mm, w - 82 * mm]))
    a(P("Table 4.2 \u2014 The five sign categories and representative messages.", "caption"))

    a(H2("4.7 Fire classes and correct media"))
    a(table(DS.FIRE_TABLE, [18 * mm, 46 * mm, 56 * mm, w - 120 * mm]))
    a(P("Table 4.3 \u2014 Fire classes, the correct extinguishing medium and the dangerous "
        "mistakes.", "caption"))

    a(PageBreak())
    a(H1(G12.CH_POWER["title"], level=0))
    for head, body in G12.CH_POWER["paras"]:
        a(H2(head))
        a(P(esc(body)))
    a(H2("5.6 Fifteen rules for powered tools"))
    for i, r in enumerate(DS.POWER_TOOL_RULES, 1):
        a(Paragraph("<b>%d.</b> %s" % (i, esc(r)), S["bullet"], bulletText="\u2022"))

    a(PageBreak())
    a(H1(G12.CH_CARE["title"], level=0))
    for head, body in G12.CH_CARE["paras"]:
        a(H2(head))
        a(P(esc(body)))

    # ---------------- Part B: the register ----------------
    a(NextPageTemplate("divider"))
    a(PageBreak())
    for fl in part_divider("B", "The Master Tool Register",
                           "216 numbered entries in eleven practice groups, covering every class of "
                           "tool, instrument, machine and test equipment in the CTS and CITS "
                           "curricula \u2014 minor and major.",
                           ["Group 1  Hand tools and bench work",
                            "Group 2  Measuring, marking-out and inspection instruments",
                            "Group 3  Cutting, drilling, sawing, shearing and grinding",
                            "Group 4  Machine tools and machine-shop accessories",
                            "Group 5  Joining, welding, thermal cutting and fastening",
                            "Group 6  Electrical tools and test instruments",
                            "Group 7  Electronics, computer hardware and ICT",
                            "Group 8  Automotive and vehicle service",
                            "Group 9  Refrigeration, AC, plumbing and fluid services",
                            "Group 10  Building, construction, woodworking and painting",
                            "Group 11  Textile, printing, media, food, beauty and health"]):
        a(fl)
    a(H1("7. The Master Tool Register", level=0))
    a(P("This is the core of the document. Tools are grouped by engineering practice and numbered "
        "continuously within each group. Each entry carries a stable code, the tool name and its "
        "aliases, what to look at in order to identify it, the minimum operating competence, the "
        "specific safety precautions, the care routine, the trades that use it and the PPE."))
    a(P("The groups are: <b>H</b> hand tools and bench work; <b>M</b> measuring, marking-out and "
        "inspection; <b>C</b> cutting, drilling, sawing, shearing and grinding; <b>T</b> machine "
        "tools; <b>W</b> joining, welding and thermal cutting; <b>E</b> electrical tools and test "
        "instruments; <b>X</b> electronics and ICT; <b>A</b> automotive; <b>R</b> refrigeration, "
        "air-conditioning and fluid services; <b>B</b> building, construction, woodworking and "
        "painting; <b>S</b> textile, printing, media, food, beauty and health service tools."))
    a(Spacer(1, 3 * mm))

    total = 0
    summary_rows = [("Group", "Code", "Title", "Entries")]
    for g in all_groups():
        total += len(g["items"])
        summary_rows.append((g["letter"], g["letter"] + "-001 to %s-%03d" %
                             (g["letter"], len(g["items"])), g["title"].split("\u2014 ")[-1],
                             str(len(g["items"]))))
    summary_rows.append(("", "", "Total entries in the register", str(total)))
    w = PAGE_W - LM - RM
    a(table(summary_rows, [16 * mm, 34 * mm, w - 84 * mm, 20 * mm]))
    a(P("Table B.1 \u2014 The register at a glance.", "caption"))

    a(H2("Anatomy of an entry"))
    a(P("Each panel carries the same eight fields, so that an entry can be read in a fixed order "
        "and quoted in a job sheet. <b>Identify</b> tells the reader what to look at \u2014 shape, "
        "material, graduation, marking \u2014 to recognise the tool and to notice that it is worn or "
        "damaged. <b>Operate</b> states the minimum competence: the set-up, the technique and the "
        "checkpoint that separates a correct result from a plausible one. <b>Safety / precautions</b> "
        "is highlighted, because it is the field that is skipped when a lesson runs late. "
        "<b>Care / calibration</b> covers what keeps the tool accurate and serviceable. "
        "<b>Trades</b> lists where the tool appears in the CTS and CITS curricula, and <b>PPE</b> "
        "gives the minimum issue for that tool. The <i>Also called</i> line carries the alternative "
        "names a trainee will meet in a store indent or a manufacturer's catalogue."))

    a(H2("Choosing the instrument for the tolerance"))
    a(P("Measurement is not a single skill; it is a decision about accuracy. The table below maps a "
        "measurement need to the instrument that the curriculum expects, using the tolerances that "
        "appear in the CTS and CITS Fitter outcomes (\u00b1 0.25 mm for basic fitting, \u00b1 0.04 mm "
        "and 30 minutes of arc for fits, \u00b1 0.02 mm for precision fitting). Using a more precise "
        "instrument than the job needs is slow; using a less precise one is wrong."))
    a(table(INSTRUMENT_SELECT, [42 * mm, 26 * mm, 42 * mm, w - 110 * mm]))
    a(P("Table B.2 \u2014 Instrument selection by accuracy requirement.", "caption"))

    for g in all_groups():
        for fl in group_section(g):
            a(fl)
        a(PageBreak())

    # ---------------- Part C ----------------
    a(NextPageTemplate("divider"))
    a(PageBreak())
    for fl in part_divider("C", "Instructor and Reference Material",
                           "The CITS training-aid toolkit, the checklists used to assess tool "
                           "competence, and the reference apparatus for the whole document.",
                           ["8. The CITS instructor's toolkit (Training Methodology aids)",
                            "9. Assessing tool competence",
                            "10. Trade-to-tool group index",
                            "11. Glossary and bibliography",
                            "12. Limitations and maintenance of this document"]):
        a(fl)
    a(P("The chapters that follow support the register: the instructor's training-aid toolkit for "
        "CITS Training Methodology, the checklists used to assess tool competence, a trade-to-tool "
        "index, a glossary and the source bibliography.", "note"))
    a(Spacer(1, 3 * mm))

    a(H1(G12.CH_TM["title"], level=0))
    a(P(esc(G12.CH_TM["intro"])))
    for it in G12.CH_TM["items"]:
        for fl in tool_panel(it):
            a(fl)

    a(PageBreak())
    a(H1(G12.CH_ASSESS["title"], level=0))
    for head, body in G12.CH_ASSESS["paras"]:
        a(H2(head))
        a(P(esc(body)))
    a(H2("9.6 Generic tool competence checklist"))
    w = PAGE_W - LM - RM
    a(table(G12.ASSESS_CHECKLIST, [34 * mm, w - 34 * mm]))
    a(P("Table 9.1 \u2014 Instructor checklist for a practical tool assessment.", "caption"))

    # trade index
    a(PageBreak())
    a(H1("10. Trade-to-Tool Group Index", level=0))
    a(P("Use this index to move from a trade to the groups that hold its tools. Every trade also "
        "uses the universal items in Group 1 (hand tools), the relevant instruments from Group 2, "
        "and the safety and first aid content of Chapter 3."))
    idx_rows = [("Trade family", "Tool groups", "Notes")]
    pairs = [
        ("Fitter, Turner, Machinist, Tool & Die Maker, Operator Advanced Machine Tools",
         "H, M, C, T, W",
         "Full bench, metrology, machine tool and joining coverage; CMM and slip gauges at "
         "advanced level"),
        ("Welder, Fabricator, Sheet Metal, Forger, Foundryman",
         "H, M, C, W",
         "Welding, cutting, forming and inspection; add T for fabrication machine tools"),
        ("Electrician, Wireman, Lift & Escalator",
         "H, M, E, B",
         "Electrical hand tools, instruments and access equipment; add C for drilling and chasing"),
        ("Electronics Mechanic, Computer Hardware, ICT, COPA, DTP, Multimedia",
         "H, M, X, E",
         "Fine hand tools, ESD control, test instruments and ICT cabling"),
        ("Mechanic Motor Vehicle, Two Wheeler, Diesel, Auto Electrical, Agricultural Machinery",
         "H, M, C, A, E",
         "Lifting, measuring, diagnostic and special service tools"),
        ("Refrigeration & AC, Plumber, Pump Operator, Chemical Plant trades",
         "H, M, C, W, R, E",
         "Pressure, vacuum, refrigerant, pipework and fluid instrumentation"),
        ("Mason, Carpenter, Painter, Draughtsman (Civil), Surveyor, Interior Design",
         "H, M, B, C",
         "Setting out, forming, finishing, access equipment and wood/masonry machines"),
        ("Dress Making, Fashion Design, Surface Ornamentation, Textile trades",
         "S, H, M",
         "Sewing, cutting, pressing, embroidery, loom and wet processing"),
        ("Printing, Photography, DTP",
         "S, H, M, X",
         "Press, guillotine, camera and image processing; add B for finishing"),
        ("Food Production, Bakery, Catering, Food Processing, Dairying",
         "S, M, H",
         "Kitchen, bakery and preservation plant; add R for pumps and valves"),
        ("Cosmetology, Spa, Health Sanitary, Hospital House Keeping, Old Age Care",
         "S, H, M",
         "Beauty, sterilisation, cleaning, patient handling and infection control"),
        ("Firemen, Fire Technology, Health Safety & Environment",
         "S, M, B",
         "Fire equipment, first aid, PPE, access equipment and monitoring instruments"),
        ("CITS \u2014 all trades",
         "TM, plus the groups of the parent trade",
         "Training aids and assessment tools are added to the trade's own tool set"),
    ]
    idx_rows += pairs
    w = PAGE_W - LM - RM
    a(table(idx_rows, [56 * mm, 26 * mm, w - 82 * mm]))
    a(P("Table 10.1 \u2014 Trade families mapped to tool groups.", "caption"))

    # glossary
    a(PageBreak())
    a(H1("11. Glossary and Bibliography", level=0))
    a(H2("11.1 Glossary of abbreviations and technical terms"))
    w = PAGE_W - LM - RM
    a(table(G12.GLOSSARY, [40 * mm, w - 40 * mm]))
    a(P("Table 11.1 \u2014 Abbreviations and terms used in this document.", "caption"))

    a(H2("11.2 Sources"))
    a(P("The compendium was compiled from the following sources. Curriculum documents were used for "
        "trade structure, tool names and specifications; standards and manufacturer guidance were used "
        "for operating practice and safety."))
    a(table(G12.BIBLIOGRAPHY, [72 * mm, w - 72 * mm]))
    a(P("Table 11.2 \u2014 Principal sources.", "caption"))

    a(PageBreak())
    a(H1(G12.CH_LIMITS["title"], level=0))
    for head, body in G12.CH_LIMITS["paras"]:
        a(H2(head))
        a(P(esc(body)))

    # alphabetical index of every entry
    a(H1("Appendix A \u2014 Alphabetical Index of Entries", level=0))
    a(P("Every catalogued entry, alphabetically by name, with its code and group. Use the code to "
        "locate the entry in Part B and to quote it in a job sheet, store indent or inspection "
        "checklist."))
    entries = []
    for g in all_groups():
        for it in g["items"]:
            entries.append((it["name"], it["code"], g["letter"]))
    for it in G12.CH_TM["items"]:
        entries.append((it["name"], it["code"], "TM"))
    entries.sort(key=lambda x: x[0].lower())
    w = PAGE_W - LM - RM
    rows = [("Entry", "Code", "Group")] + [(n, c, "Group " + grp) for n, c, grp in entries]
    half = (len(rows) + 1) // 2
    left, right = rows[:half], rows[half:]
    wide = (w - 6 * mm) / 2
    colw = [wide - 33 * mm, 17 * mm, 16 * mm]
    a(table(rows, [w - 60 * mm, 24 * mm, 32 * mm]))
    a(P("Table A.1 \u2014 %d entries including the Training Methodology aids." % len(entries),
        "caption"))

    a(Spacer(1, 6 * mm))
    a(P("End of document.", "note"))

    doc.multiBuild(story)
    return OUT


HEADING_TEXTS = []   # filled by build() in document order


def _learn_headers(pdf_path, headings):
    """Scan each rendered page for the heading that governs it (the last heading that
    starts on that page, else the previous one). TOC pages are skipped."""
    import re
    try:
        import pypdfium2 as pdfium
    except ImportError:
        return {}
    src = pdfium.PdfDocument(pdf_path)
    n = len(src)
    pages = [src[i].get_textpage().get_text_range() for i in range(n)]
    src.close()

    def norm(t):
        return re.sub(r"\s+", " ", t).strip()

    flat = {}
    for i, t in enumerate(pages):
        flat[i + 1] = norm(t.replace("\r", " ").replace("\n", " "))

    starts = {}
    pos = 0
    for pg in range(3, n + 1):          # pages 1-2: cover and contents
        text = flat[pg]
        hit = None
        j = pos
        while j < len(headings):
            h = norm(headings[j])
            if h and h in text:
                hit = j
                j += 1
            else:
                break
        if hit is not None:
            starts[pg] = headings[hit]
            pos = hit + 1

    header = {}
    cur = ""
    for pg in range(1, n + 2):
        if pg in starts:
            cur = starts[pg]
        header[pg] = cur
    return header


def build_all():
    """Build, learn the heading that governs each page, then rebuild with running
    headers. Header text does not affect pagination, so the second pass is stable."""
    global HEADER_MAP
    HEADER_MAP = {}
    tmp = build()
    headings = list(HEADING_TEXTS)
    HEADER_MAP = _learn_headers(tmp, headings)
    return build()


if __name__ == "__main__":
    p = build_all()
    print("written", p, os.path.getsize(p))

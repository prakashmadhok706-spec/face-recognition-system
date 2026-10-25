# Format Compliance Audit Report

**Document Audited:** `REPORT_WORKSPACE/Mini_Project_Report.pdf` (and `Mini_Project_Report.docx`)  
**Authoritative Reference:** `Mini Project report format III SEM.pdf` (Inderprastha Engineering College, Dr. APJ Abdul Kalam Technical University)  
**Date of Audit:** October 25, 2026  
**Auditor:** Strict Academic Report Auditor & Technical Reviewer

---

## 1. Executive Summary

A comprehensive compliance audit was conducted comparing the generated 48-page Mini Project Report against the official college guidelines (*Mini Project report format III SEM*). While the generated document exhibits strong technical depth and covers all 12 core chapters and preliminary sections, significant structural, layout, and typographic non-compliances were identified that require correction before the report can be considered final and submission-ready.

---

## 2. Structural Compliance Checklist

| Item # | Required Section / Format Item | College Format Requirement | Current Status | Audit Findings & Evidence |
|---|---|---|---|---|
| **1** | **Cover Page** | Standard format with title, student names/roll nos, guide, college name, AKTU, Dec 2025 | **PARTIAL** | Content present, but spacing caused it to spill across Pages 1 and 2 in the PDF. Must fit strictly on 1 page. |
| **2** | **Bonafide Certificate** | Specific text, supervisor name, designation, "SUPERVISOR" in caps, double line spacing | **PARTIAL** | Content is present, but signature block spilled onto Page 4 (sparse page). Missing "SUPERVISOR" keyword between name and designation. Must fit strictly on 1 page. |
| **3** | **Acknowledgement** | Brief (≤ 1 page), mentions guide & Dr. Vijai Singh (HOD CSE), signatures at bottom | **PARTIAL** | Mentions HOD Dr. Vijai Singh and guide, but closing spilled onto Page 6. Must fit strictly on 1 page. |
| **4** | **Declaration** | Standard university candidate declaration | **PASS** | Exact university declaration text implemented cleanly on Page 7. |
| **5** | **Abstract** | Narration of problem, methodology, findings (≤ 4 pages, double spacing, 14pt) | **PASS** | High-quality abstract covering SIH26087, LBPH, FastAPI, React ERP, and verified outcomes (Pages 8-9). |
| **6** | **Table of Contents** | Specimen on page 6 of format with Chapter Nos, Titles, Page Nos (prelims in Roman) | **FAIL** | Completely missing in generated DOCX and PDF! Jumped directly from Abbreviations to Chapter 1. |
| **7** | **List of Tables** | Captions matching text, 1.5 spacing, page numbers in lower case Roman | **FAIL** | Completely missing in generated DOCX and PDF. |
| **8** | **List of Figures** | Captions matching text, 1.5 spacing, page numbers in lower case Roman | **FAIL** | Completely missing in generated DOCX and PDF. |
| **9** | **List of Symbols & Abbreviations** | Standard symbols/abbreviations, 1.5 line spacing | **PASS** | Present on Page 10. (Needs Roman numeral page numbering). |
| **10** | **Blank Page Check** | No unintended blank pages | **FAIL** | Page 11 in the generated PDF is completely blank due to an unnecessary page break. |
| **11** | **Chapter 1: Introduction** | 1.1 Problem Def, 1.2 Background, 1.3 Objectives, 1.4 Feasibility/Need, 1.5 Novelty, 1.6 Tech Spec (1.6.1 HW/SW) | **PASS** | All required subsections present with exhaustive technical content. |
| **12** | **Chapter 2: Literature Review** | 2.1 Existing System (theoretical/methodological contributions of papers/books), 2.2 Limitations | **PASS** | Thorough analysis of 5 existing systems, comparative table, and research gaps. |
| **13** | **Chapter 3: Proposed System** | Architecture, modules, algorithms, advantages | **PASS** | Covers full microservices architecture, anti-spoofing, dual attendance, and trade-offs. |
| **14** | **Chapter 4: Software Requirement Analysis** | 4.1 Functional (a. Use case diagram, b. Use case descriptions), 4.2 Nonfunctional, 4.3 Major Modules | **PARTIAL** | Subsections present, but 4.1 needs explicit (a) Use Case Diagram and (b) Use Case Descriptions structuring. |
| **15** | **Chapter 5: System Analysis & Design** | 5.1 Class designs, 5.2 Sequence, 5.3 Activity, 5.4 DFDs, 5.5 Database (5.5.1 E-R Diagrams), 5.6 Gantt/PERT | **PARTIAL** | Rich content, but missing explicit 5.5.1 E-R Diagram heading and PERT Chart under 5.6. |
| **16** | **Chapter 6: Implementation / Core Module** | 6.1 Database tables & fields, 6.2 Algorithms/Approaches, 6.3 Implementation of modules | **PASS** | Exhaustive database field schema tables, Haar+LBPH formulas, and multi-thread retraining logic. |
| **17** | **Chapter 7: Results / Outputs & Testing** | 7.1 All UI screens, 7.2 Layouts of web pages, 7.3 Design & Test steps, 7.4 Testing process | **FAIL** | Generated report only had 7.1 and 7.2. Omitted 7.2 Layouts and 7.3 Test steps/criteria structure. |
| **18** | **Chapter 8: Conclusions / Recommendations** | Objectives achieved, limitations, future scope | **PASS** | Comprehensive conclusions, achieved objectives, limitations, and future scope. |
| **19** | **Chapter 9: References** | Alphabetical order, single spacing, author followed by year, IEEE/standard style | **PASS** | 15 verified academic citations in proper format. |
| **20** | **Chapter 10: Plagiarism** | Plagiarism compliance declaration / report summary | **PASS** | Present with transparent disclaimer regarding academic submission. |
| **21** | **Chapter 11: Research Paper Publication** | Published paper or status with journal/conference name | **PASS** | Formal paper preparation status and target IEEE conference venue documented. |
| **22** | **Chapter 12: Appendices** | 12.1 Software/simulator details, 12.2 Steps to execute/run, 12.3 Coding | **PARTIAL** | Content present, but subsections must match 12.1, 12.2, 12.3 exact headings from template. |

---

## 3. Typographic and Page Formatting Compliance

| Parameter | College Requirement | Current Generated Value | Compliance Status | Action Required |
|---|---|---|---|---|
| **Paper Size** | Standard A4 (297 mm × 210 mm) | A4 (29.7 cm × 21.0 cm) | **PASS** | Retain. |
| **Margins** | Top: 30-35mm, Bottom: 25-30mm, Left: 35-40mm, Right: 20-25mm | Top: 32mm, Bottom: 27mm, Left: 38mm, Right: 22mm | **PASS** | Perfect match within specified college ranges. |
| **General Font** | Times New Roman | Times New Roman | **PASS** | Retain. |
| **Body Font Size** | **14-point** (Section 6.1: "The general text shall be typed in font Style Times New Roman and Font Size 14") | 12-point (`style.font.size = Pt(12)`) | **FAIL** | **Must update general body text to 14pt** as strictly mandated by template Section 6.1. |
| **Body Line Spacing** | 1.5 line spacing | 1.5 line spacing (`WD_LINE_SPACING.ONE_POINT_FIVE`) | **PASS** | Retain. |
| **Page Numbering** | Lower-right corner. Prelims in lowercase Roman (i, ii, iii...), main body in Arabic (1, 2, 3...) starting from Chapter 1 | No page numbers in footer! | **FAIL** | **Must add Word footer page numbering** with lower-case Roman for prelims and Arabic for main chapters. |
| **Chapter Headings** | Centered 50mm down from top, capital letters, 16pt, no punctuation | Centered, Bold, 16pt | **PASS** | Matches specification. |
| **Table & Figure Captions** | Above tables, below figures; numbered by chapter (e.g., Table 2.1, Figure 7.1) | Captions present and formatted | **PASS** | Matches specification. |

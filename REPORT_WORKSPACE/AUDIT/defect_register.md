# Defect Register: Mini Project Report

**Document Audited:** `REPORT_WORKSPACE/Mini_Project_Report.pdf`  
**Authoritative Reference:** `Mini Project report format III SEM.pdf`  
**Audit Date:** October 25, 2026

---

## 1. Summary of Identified Defects

| Defect ID | Severity | Chapter / Section | Description | Required Correction | Status |
|---|---|---|---|---|---|
| **DEF-01** | **CRITICAL** | Cover Page | Cover page content overflows onto Page 2 in generated PDF. | Adjust vertical spacing and font margins so Cover Page strictly fits on Page 1. | **OPEN** |
| **DEF-02** | **CRITICAL** | Bonafide Certificate | Certificate signature block overflows onto Page 4 (leaving a 1-line orphan). Missing capital keyword "SUPERVISOR". | Adjust spacing to fit on single page; add "SUPERVISOR" in capital letters between guide name and designation. | **OPEN** |
| **DEF-03** | **HIGH** | Acknowledgement | Team signature overflows onto Page 6. | Adjust spacing so Acknowledgement fits strictly on Page 3 (preliminary page). | **OPEN** |
| **DEF-04** | **CRITICAL** | Preliminary Matter | Missing Table of Contents (Specimen provided on template page 6). | Implement complete Table of Contents with accurate chapter, section, and preliminary page references. | **OPEN** |
| **DEF-05** | **HIGH** | Preliminary Matter | Missing List of Tables (Mandated by template section 5.6). | Generate List of Tables with table numbers, full captions, and page numbers. | **OPEN** |
| **DEF-06** | **HIGH** | Preliminary Matter | Missing List of Figures (Mandated by template section 5.7). | Generate List of Figures with figure numbers, captions, and page numbers. | **OPEN** |
| **DEF-07** | **HIGH** | Typographic Format | Body text font size is 12pt instead of 14pt (Template section 6.1 specifies 14pt Times New Roman, 1.5 line spacing). | Update base body text font size to 14pt across all normal paragraphs. | **OPEN** |
| **DEF-08** | **HIGH** | Page Numbering | No page numbers in document footer (Template section 7.1 specifies lower-case Roman in preliminary pages, Arabic in main text on lower-right). | Implement Word footer page numbering with lowercase Roman numerals (i, ii, iii...) for prelims and Arabic numerals (1, 2, 3...) from Chapter 1. | **OPEN** |
| **DEF-09** | **MEDIUM** | Page Layout | Unwanted blank page on Page 11 in generated PDF. | Remove extraneous page breaks before Chapter 1. | **OPEN** |
| **DEF-10** | **HIGH** | Chapter 7 | Missing 7.2 (Layouts of Web Pages and Screens) and 7.3 (Design and Test Steps / Criteria). | Restructure Chapter 7 into 4 sections: 7.1 Output screens, 7.2 Web layouts/blueprints, 7.3 Design and test criteria, 7.4 Testing process. | **OPEN** |
| **DEF-11** | **MEDIUM** | Chapter 4 | Missing explicit "(a) Use Case diagram with proper factoring" and "(b) Use case descriptions" structure in 4.1. | Restructure Section 4.1 to include explicit subsections for 4.1.1 (a) Use Case Diagram with proper factoring and 4.1.2 (b) Use Case Descriptions. | **OPEN** |
| **DEF-12** | **MEDIUM** | Chapter 5 | Missing explicit 5.5.1 E-R Diagrams and 5.6 PERT Chart. | Add explicit 5.5.1 E-R Diagrams subsection with entity relationships, and add PERT network chart under 5.6. | **OPEN** |
| **DEF-13** | **MEDIUM** | Chapter 12 | Subsections do not strictly match template naming: 12.1 Software/simulator details, 12.2 Steps to execute, 12.3 Coding. | Align subsection numbering and titles strictly to 12.1, 12.2, and 12.3. | **OPEN** |
| **DEF-14** | **LOW** | Chapter 1 | Typo in template numbering (1.5.1 HW/SW required under 1.6). | Provide clean 1.6.1 Hardware and Software Required under 1.6 Technical Specification. | **OPEN** |
| **DEF-15** | **LOW** | Chapter 8 | Heading reads "CONCLUSIONS AND RECOMMENDATIONS" whereas template title is "CONCLUSIONS / RECOMMENDATIOS". | Standardize title to "CHAPTER 8: CONCLUSIONS / RECOMMENDATIONS". | **OPEN** |
| **DEF-16** | **LOW** | Chapter 11 | Heading title needs to include full template label: "RESEARCH PAPER PUBLICATION (PUBLISHED PAPER/PAPER STATUS WITH JOURNAL /CONFERENCE NAME)". | Update Chapter 11 heading to match exact full template designation. | **OPEN** |

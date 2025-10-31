# UNHCR Rights-Mapper Design Guidelines

## Design Approach

**Selected System:** Modern Professional Application with Chat Interface Pattern
**Justification:** A utility-focused legal assistance tool requiring trust, clarity, and efficient case management. The chat-based interface provides familiar conversation tracking while maintaining professional authority for legal work.

**Core Design Principles:**
1. **Modern Simplicity** - Clean, rounded components with generous whitespace
2. **Conversation-Centered** - Each case tracked as an accessible chat thread
3. **Professional Clarity** - Legal information hierarchy over decorative elements
4. **Seamless Navigation** - Fluid transitions between intake, verification, and report views

---

## Typography System

### Font Families
- **Primary:** Inter (interface, headings, labels)
- **Legal Content:** Georgia or serif (report body, citations)
- **Monospace:** JetBrains Mono (case IDs, timestamps)

### Type Scale
- **App Title/Hero:** text-3xl to text-4xl, font-bold
- **Page Headers:** text-2xl, font-semibold
- **Section Headers:** text-xl, font-semibold
- **Chat Messages:** text-base
- **Body/Forms:** text-base
- **Labels/Meta:** text-sm, font-medium
- **Timestamps:** text-xs

### Hierarchy
- Conversation list: text-sm with font-semibold for case titles
- Active chat indicator: font-bold treatment
- Legal citations: text-sm, italic serif

---

## Layout System

### Spacing Primitives
**Core Units:** Tailwind spacing of **3, 4, 6, 8, 12, 16, 20**
- **p-6 to p-8:** Card/panel padding
- **gap-4, gap-6:** Component spacing
- **mb-6, mb-8:** Section separation
- **rounded-xl, rounded-2xl:** Modern rounded corners throughout

### Application Shell
**Two-Column Layout:**
- **Left Sidebar (Chat List):** Fixed width w-80, full height, sticky
  - Top: "New Case" button (p-4, mb-4)
  - Conversation list (scrollable, space-y-2)
  - Each conversation: p-4, rounded-xl, clickable card
  - Active conversation: distinct treatment
  
- **Main Content Area:** flex-1, overflow-y-auto
  - Inner container: max-w-5xl mx-auto, px-8
  - Consistent top padding: pt-12

### Container Widths
- **Intake Screen:** max-w-3xl mx-auto (focused input)
- **Verification Dashboard:** max-w-4xl mx-auto
- **Legal Report:** max-w-5xl mx-auto (optimal document width)

---

## Screen-Specific Layouts

### Chat Sidebar Structure
**Conversation Cards:**
- Case title (truncate, font-semibold, mb-1)
- Last activity timestamp (text-xs)
- Status badge (Draft/Verified/Completed)
- Border-l-4 for status indicator stripe

**Sidebar Header:**
- App logo/title at top (p-6)
- "New Case" primary button (w-full, mb-6)
- Search/filter input (mb-4, rounded-full)

### Screen 1: Smart Intake
**Layout:**
- Page title with icon (mb-8)
- Large textarea component (min-h-80, rounded-2xl, p-6)
- Label above: "Paste Unstructured Case Notes" (mb-3)
- Placeholder example text shown
- Helper text below (text-sm, mb-6)
- Primary CTA button (mt-8, px-8 py-4, rounded-full)
- Substantial whitespace (py-16)

### Screen 2: Verification Dashboard
**Two-Section Layout:**

**Section 1 - Extracted Facts:**
- Header with verification icon (mb-6)
- Fact cards in single column (space-y-4)
- Each card: p-6, rounded-xl, key-value pairs
- Status badges for categories (rounded-full, px-3 py-1)
- Edit icons on hover for each fact

**Section 2 - Missing Information:**
- Clear header with instruction text (mb-8)
- Question cards (space-y-6)
- Each card: p-6, rounded-xl, numbered
- Radio groups with clear spacing (space-y-3)
- Checkbox groups with generous padding
- Submit button (mt-12, w-full md:w-auto, rounded-full)

**Visual Separation:**
- Border-t between sections (mt-12, pt-12)
- Both sections contained in max-w-4xl

### Screen 3: Legal Report
**Document Layout:**
- Report header with metadata (mb-12)
  - Title (text-3xl, font-bold)
  - Case ID and timestamp (text-sm, right-aligned)
  
**Per-Need Section:**
- Need category header with icon (text-2xl, mb-8)
- AI Summary card (p-8, rounded-2xl, mb-8, border-l-4)
  - "Summary" label (uppercase, text-xs, tracking-wide, mb-3)
  - Summary text (leading-relaxed)
  
- Legal Basis subsection (mb-8)
  - Subheader (text-lg, font-semibold, mb-4)
  - Article text (serif, leading-relaxed, text-justify)
  
- Citation box (p-6, rounded-xl, mb-12)
  - "Source Citation" label (uppercase, text-xs, mb-2)
  - Quote text (serif, italic, mb-2)
  - Source reference (font-medium)

**Section Spacing:**
- space-y-16 between need sections
- Print-friendly page breaks

---

## Component Library

### Chat Components
- **Conversation Card:** p-4, rounded-xl, hover transition, cursor-pointer
- **New Case Button:** w-full, py-3, rounded-full, font-semibold
- **Status Badge:** inline-flex, px-3 py-1, rounded-full, text-xs

### Forms
- **Textareas:** rounded-2xl, border-2, p-6, focus ring, min-height constraints
- **Radio Buttons:** Custom styled, rounded-full, min-h-12 click target
- **Checkboxes:** rounded-md, clear checked state
- **Input Labels:** font-medium, mb-2, block

### Buttons
- **Primary:** px-8 py-4, rounded-full, font-semibold, text-base
- **Secondary:** outlined, same sizing, rounded-full
- **Icon Buttons:** h-10 w-10, rounded-full, centered icon

### Cards & Containers
- **Panel Cards:** p-6 to p-8, rounded-xl, border, hover states where interactive
- **Summary Boxes:** p-8, rounded-2xl, border-l-4 accent
- **Citation Boxes:** p-6, rounded-xl, distinct border
- **Fact Cards:** p-6, rounded-xl, flex justify-between

### Icons & Badges
- **Icons:** Heroicons throughout for consistency
  - Chat bubbles for conversations
  - Document icons for reports
  - Check/alert icons for status
- **Badges:** rounded-full, px-3 py-1, text-xs, uppercase, font-medium

### Navigation
- Sidebar sticky navigation
- Active state clearly differentiated
- Back/forward navigation within case workflow

---

## Accessibility

### Focus Management
- All interactive elements: ring-2, ring-offset-2, rounded focus rings
- Skip to main content link
- Keyboard navigation through conversation list and forms

### ARIA & Screen Readers
- Conversation list role="list"
- Status announcements for AI processing
- Form labels explicitly associated
- Heading hierarchy h1 → h2 → h3 throughout

### Readability
- WCAG AA contrast minimum
- Legal text: text-base or larger, leading-relaxed
- Generous click targets (min 44x44px)
- Clear visual hierarchy with spacing

---

## Animation Guidelines

**Minimal, Purposeful Motion:**
- Conversation card hover: subtle scale (scale-102, duration-200)
- Screen transitions: fade-in (duration-300)
- Loading states: spinner during AI processing
- Radio/checkbox: subtle check animation (duration-150)

**Prohibited:**
- Scroll-triggered animations
- Auto-playing transitions
- Parallax effects
- Excessive motion

---

## Images

**No hero images needed.** This is a professional legal tool where trust comes from clean, functional interface design. The chat-based navigation and document-focused layouts rely on typography, spacing, and component clarity rather than decorative imagery.
# Mobile UI Features Guide

## Navigation Structure

### Mobile Navigation (< 768px)

```
┌─────────────────────────────────┐
│  ☰  SV Esting      Username    │  ← Sticky Header (56px)
├─────────────────────────────────┤
│                                 │
│                                 │
│        Main Content             │
│        (Scrollable)             │
│                                 │
│                                 │
├─────────────────────────────────┤
│  🏠   📅   📋   📊              │  ← Bottom Nav Bar
│ Dash  Plan  Attend Stats        │
└─────────────────────────────────┘
```

### Hamburger Menu (Slide-out)

```
┌─────────────────────┬───────────┐
│  ☰  SV Esting  User │   │       │
├─────────────────────┤   │       │
│ 🏠 Dashboard        │   │       │
│ 📅 Trainingsplan    │   │       │
│ 📋 Anwesenheit     │   │ Main  │
│ 📊 Statistiken     │   │Content│
│ 📁 Dateien         │   │       │
│ 👤 Profil          │   │       │
│                     │   │       │
│ 🚪 Abmelden        │   │       │
└─────────────────────┴───────────┘
     Sidebar (256px)
```

### Desktop Layout (≥ 768px)

```
┌───────────┬─────────────────────────────────┐
│           │  SV Esting     Username  Logout │
│ Sidebar   ├─────────────────────────────────┤
│ (Fixed)   │                                 │
│           │                                 │
│ 🏠 Dash   │        Main Content             │
│ 📅 Plan   │        (Scrollable)             │
│ 📋 Attend │                                 │
│ 📊 Stats  │                                 │
│ 📁 Files  │                                 │
│ 👤 Profile│                                 │
│           │                                 │
└───────────┴─────────────────────────────────┘
```

## Component Adaptations

### Stat Cards

**Mobile (2-column grid)**
```
┌─────────────┬─────────────┐
│ Training    │ Anwesenheit │
│   5         │    95%      │
│ Diese Woche │ Monat       │
├─────────────┼─────────────┤
│ Absolviert  │ Absagen     │
│   12        │    2        │
│ Von 15      │ Kommend     │
└─────────────┴─────────────┘
```

**Desktop (4-column grid)**
```
┌──────┬──────┬──────┬──────┐
│Train │Attend│Absol.│Absage│
│  5   │ 95%  │  12  │  2   │
│Woche │Monat │Von 15│Komm. │
└──────┴──────┴──────┴──────┘
```

### Session Cards

**Mobile (Stacked)**
```
┌─────────────────────────────┐
│ Training Name    [Geplant]  │
│ 🕐 14:00 - 16:00           │
│                             │
│ ┌──────────────┐            │
│ │   Absagen    │   (44px)   │
│ └──────────────┘            │
└─────────────────────────────┘
```

**Desktop (Horizontal)**
```
┌─────────────────────────────────┐
│ Training Name    [Geplant]      │
│ 🕐 14:00 - 16:00   [Absagen]   │
└─────────────────────────────────┘
```

### Forms

**Mobile (Single Column)**
```
┌─────────────────────────┐
│ Vorname *               │
│ ┌─────────────────────┐ │
│ │ Max                 │ │ (44px)
│ └─────────────────────┘ │
│                         │
│ Nachname *              │
│ ┌─────────────────────┐ │
│ │ Mustermann          │ │ (44px)
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │   Speichern         │ │ (44px)
│ └─────────────────────┘ │
└─────────────────────────┘
```

**Desktop (Multi-Column)**
```
┌─────────────────────────────────┐
│ Vorname *        Nachname *     │
│ ┌─────────────┐ ┌─────────────┐ │
│ │ Max         │ │ Mustermann  │ │
│ └─────────────┘ └─────────────┘ │
│                                 │
│          ┌──────────────┐       │
│          │  Speichern   │       │
│          └──────────────┘       │
└─────────────────────────────────┘
```

### Dialogs

**Mobile (Full Width)**
```
┌─────────────────────────────┐
│ Training absagen         ✕  │
├─────────────────────────────┤
│                             │
│ Grund für Absage:           │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │    Absage einreichen    │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │      Abbrechen          │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

## Touch Targets

All interactive elements follow the 44x44px minimum:

```
❌ Too Small (32px)     ✅ Perfect (44px+)
┌────────┐              ┌────────────┐
│ Button │              │   Button   │
└────────┘              └────────────┘
```

## Typography Scale

```
Mobile          Desktop
──────          ───────
text-2xl    →   text-3xl    (Headings)
text-xl     →   text-2xl    (Titles)
text-base   →   text-lg     (Body)
text-sm     →   text-base   (Small)
text-xs     →   text-sm     (Tiny)
```

## Spacing Scale

```
Mobile          Desktop
──────          ───────
gap-3       →   gap-4       (Grid gaps)
p-4         →   p-6         (Padding)
space-y-4   →   space-y-6   (Vertical spacing)
```

## Button States

```
Normal          Active (Touch)
┌────────────┐  ┌───────────┐
│   Button   │  │  Button   │  (Scale 0.95)
└────────────┘  └───────────┘
```

## Responsive Breakpoints

```
Mobile           Tablet          Desktop
(0-639px)        (640-1023px)    (1024px+)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━→
   sm               md               lg
```

## Safe Areas (Notched Devices)

```
┌─ safe-top ─────────────────┐
│  ≈ 44px on iPhone X+       │
├────────────────────────────┤
│                            │
│        Content             │
│                            │
├────────────────────────────┤
│  ≈ 34px on iPhone X+       │
└─ safe-bottom ──────────────┘
```

## Key CSS Utilities

### Touch Target
```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
}
```

### Safe Areas
```css
.safe-top {
  padding-top: env(safe-area-inset-top);
}

.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### No Tap Highlight
```css
* {
  -webkit-tap-highlight-color: transparent;
}
```

## Interaction Patterns

### Hamburger Menu
1. Tap hamburger icon
2. Sidebar slides in from left
3. Overlay appears on content
4. Tap overlay or ✕ to close

### Bottom Navigation
1. Always visible on mobile
2. Shows 4 primary items
3. Active state highlighted
4. Tap to navigate

### Card Actions
1. Mobile: Buttons stack vertically at bottom
2. Desktop: Buttons align horizontally to right
3. Full width on mobile for easier tapping

## Color Feedback

```
Default     →   Hover        →   Active
────────────    ────────────     ──────────
bg-white        bg-gray-50       bg-gray-100
                (desktop)        (mobile tap)
```

## Input Behavior

### iOS Zoom Prevention
```
Font size: 16px or larger
(Prevents automatic zoom on focus)
```

### Input Heights
```
Input:    44px (mobile) - 40px (desktop)
Textarea: 100px minimum
Button:   44px minimum on all devices
```

## Optimization Checklist

✅ Viewport meta tags set
✅ Touch targets ≥ 44px
✅ Font size ≥ 16px on inputs
✅ Safe area padding applied
✅ Tap highlighting disabled
✅ Active states on all buttons
✅ Responsive grids (1-2-4 columns)
✅ Stacked layouts on mobile
✅ Bottom navigation implemented
✅ Hamburger menu implemented
✅ Full-width mobile dialogs
✅ Reduced mobile padding
✅ Responsive typography
✅ Touch-optimized spacing

## Testing on Real Devices

### iPhone
- Test in Portrait & Landscape
- Verify safe areas on notched models
- Check bottom nav doesn't overlap content
- Test hamburger menu slide animation

### Android
- Test on various screen sizes
- Verify system navigation doesn't overlap
- Check touch targets on all buttons
- Test form input zoom behavior

### Tablets
- Verify breakpoint transitions
- Check layout at 768px boundary
- Test both orientations

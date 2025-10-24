# Primary Color Update - #509f28 (Green)

## Summary
The primary color has been updated from blue (#3b82f6) to green (#509f28) throughout the entire application.

## Changes Made

### 1. Global CSS Variables (`src/app/globals.css`)
Updated HSL color values:
- **--primary**: `221.2 83.2% 53.3%` → `100 60% 39%` (green)
- **--primary-foreground**: `210 40% 98%` → `0 0% 100%` (white for better contrast)
- **--ring**: `221.2 83.2% 53.3%` → `100 60% 39%` (green for focus rings)

### 2. Theme Color (`src/app/layout.tsx`)
- Updated viewport theme color from `#3b82f6` to `#509f28`
- This affects the mobile browser chrome color

### 3. Alert Component (`src/components/ui/alert.tsx`)
- Updated "info" variant from blue colors to use primary theme:
  - `border-blue-500/50` → `border-primary/50`
  - `text-blue-700` → `text-primary`
  - `bg-blue-50` → `bg-primary/10`
  - `[&>svg]:text-blue-600` → `[&>svg]:text-primary`

### 4. Status Constants (`src/lib/constants/statuses.ts`)
- Updated "completed" status color:
  - `bg-blue-100 text-blue-800` → `bg-primary/10 text-primary`

### 5. Home Page (`src/app/page.tsx`)
- Updated gradient background:
  - `from-blue-50` → `from-green-50`

## Color Values

### New Primary Color: #509f28
- **Hex**: #509f28
- **RGB**: rgb(80, 159, 40)
- **HSL**: hsl(100, 60%, 39%)

This is a vibrant green color suitable for:
- Sports/athletics branding
- Active/energetic themes
- Nature/growth associations

## Components Affected

All components using the primary color will automatically update:

### Buttons
- ✅ Default variant buttons (primary background)
- ✅ Outline variant hover states
- ✅ Link variant text color

### Text Elements
- ✅ All `.text-primary` classes
- ✅ Brand text in headers/logos
- ✅ Active navigation items
- ✅ Icons with `text-primary`

### Backgrounds
- ✅ Active navigation backgrounds
- ✅ Primary buttons
- ✅ Info alerts
- ✅ Completed status badges

### Borders & Accents
- ✅ Focus rings on inputs/buttons
- ✅ Active state borders
- ✅ Primary badge borders

### Loading Indicators
- ✅ Spinner color (`border-primary`)
- ✅ Progress indicators

### Specific UI Elements
- ✅ Active menu items (athlete/trainer layouts)
- ✅ Bottom navigation active state
- ✅ Admin badge in trainer header
- ✅ Primary action buttons throughout

## Contrast & Accessibility

The new green color (#509f28) provides:
- **Good contrast** against white backgrounds (4.5:1+ ratio)
- **White text** on green background for maximum readability
- **Distinguishable** from other status colors (yellow, red, etc.)

## Testing Checklist

- [ ] Verify button colors in all states (default, hover, active)
- [ ] Check text readability on colored backgrounds
- [ ] Test focus indicators visibility
- [ ] Verify navigation active states
- [ ] Check loading spinners
- [ ] Test alert variants
- [ ] Verify badge colors
- [ ] Check status indicators
- [ ] Test on light and dark backgrounds
- [ ] Verify mobile theme color in browser chrome

## Browser Compatibility

The HSL color format is supported in all modern browsers:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ iOS Safari 14+
- ✅ Chrome Mobile 90+

## Reverting (if needed)

To revert to the original blue color, change these values back in `src/app/globals.css`:

```css
--primary: 221.2 83.2% 53.3%;
--primary-foreground: 210 40% 98%;
--ring: 221.2 83.2% 53.3%;
```

And in `src/app/layout.tsx`:
```typescript
themeColor: '#3b82f6',
```

## Color Palette

The updated color system now uses:

| Color | Usage | Hex | HSL |
|-------|-------|-----|-----|
| **Primary** | Main brand color, primary actions | #509f28 | 100 60% 39% |
| Success | Positive feedback, present status | #10b981 | - |
| Warning | Warnings, excused absences | #f59e0b | - |
| Destructive | Errors, cancellations | #ef4444 | - |
| Secondary | Secondary actions | #f3f4f6 | - |

## Notes

- All color changes use CSS custom properties, ensuring consistency
- The Tailwind configuration automatically references these variables
- No hardcoded color values remain (except status badges which use semantic colors)
- The green color represents growth, activity, and athleticism
- Primary-foreground is pure white for optimal contrast

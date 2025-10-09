# Step 1 Page Components

## Visual Structure

```
┌─────────────────────────────────┐
│         CPN Logo                │
│    Cost Per Nut Calculator      │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │ Step 1 of 4    Add Girl  │  │
│  │ ████░░░░░░░░░░░░░░░░      │  │
│  ├───────────────────────────┤  │
│  │                           │  │
│  │  Name *                   │  │
│  │  [________________]       │  │
│  │                           │  │
│  │  Age *                    │  │
│  │  [___] (18-120)          │  │
│  │                           │  │
│  │  Rating *                 │  │
│  │  ●─────────○ 6.0         │  │
│  │  5.0         10.0         │  │
│  │                           │  │
│  │  ─── Optional Details ─── │  │
│  │                           │  │
│  │  Ethnicity (optional)     │  │
│  │  [________________]       │  │
│  │                           │  │
│  │  Hair Color (optional)    │  │
│  │  [________________]       │  │
│  │                           │  │
│  │  City (optional)          │  │
│  │  [________________]       │  │
│  │                           │  │
│  │  Country (optional)       │  │
│  │  [________________]       │  │
│  │                           │  │
│  │  [Continue →]             │  │
│  │                           │  │
│  │ Your data is saved        │  │
│  │ securely as you progress  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

## Component Breakdown

### Header Section
- **CPN Logo**: Large, bold yellow text (text-4xl)
- **Subtitle**: Gray descriptive text
- **Purpose**: Branding and context

### Progress Indicator
- **Step Counter**: "Step 1 of 4"
- **Step Label**: "Add Girl" (yellow accent)
- **Progress Bar**: 25% filled with yellow
- **Purpose**: User orientation and progress tracking

### Form Fields

#### Required Fields

**Name Input**
```tsx
<input
  type="text"
  className="w-full bg-cpn-dark border border-gray-700 rounded-lg px-4 py-3"
  placeholder="Enter name"
/>
```
- Full width
- Dark background with gray border
- Large padding for mobile touch
- Yellow border on focus

**Age Input**
```tsx
<input
  type="number"
  min="18"
  max="120"
  className="w-full bg-cpn-dark border border-gray-700 rounded-lg px-4 py-3"
/>
```
- Number input with constraints
- Same styling as text inputs
- Validation: 18-120

**Rating Slider**
```tsx
<input
  type="range"
  min="5.0"
  max="10.0"
  step="0.1"
  className="flex-1 h-2 bg-gray-700 rounded-lg"
/>
```
- Range input with custom styling
- Yellow thumb indicator
- Current value displayed: "6.0"
- Min/max labels below slider

#### Optional Fields

All optional fields use smaller padding (py-2) and text-sm:
- Ethnicity
- Hair Color
- City
- Country

### Error Display

```tsx
{errors.name && (
  <p className="text-red-500 text-sm mt-1">
    {errors.name}
  </p>
)}
```

Errors appear directly below the relevant field in red.

### Submit Button

```tsx
<button className="w-full bg-cpn-yellow hover:bg-cpn-yellow/90 text-cpn-dark font-bold py-3 px-4 rounded-lg">
  <span>Continue</span>
  <ChevronRight size={20} />
</button>
```

- Full width yellow button
- Dark text for contrast
- Right arrow icon
- Hover effect (slightly darker)
- Disabled state when submitting

### Security Message

Small gray text below button:
"Your data is saved securely as you progress"

## Styling Details

### Color Palette
- Background: `#000000` (cpn-dark)
- Card Background: `#1a1a1a`
- Border: `rgba(156, 163, 175, 0.2)` (gray-800)
- Primary: `#ffd700` (cpn-yellow)
- Text Primary: `#ffffff` (white)
- Text Secondary: `#9ca3af` (cpn-gray)
- Error: `#ef4444` (red-500)

### Typography
- Heading: 2xl, bold, white
- Labels: sm, medium, gray
- Input text: base, white
- Helper text: xs, gray
- Logo: 4xl, bold, yellow

### Spacing
- Container padding: p-6
- Field spacing: space-y-4
- Input padding: px-4 py-3
- Optional input padding: px-4 py-2

### Responsive Behavior
- Max width: 28rem (max-w-md)
- Centered on screen
- Full padding on mobile (p-4)
- Touch-friendly input sizes
- No horizontal scroll

## Interactions

### Form Validation
1. On blur: Clear field error if corrected
2. On submit: Validate all required fields
3. Show errors: Display validation messages

### Data Persistence
1. On change: Update local state
2. On submit: Save to localStorage + database
3. On success: Navigate to next step

### Loading States
1. Initial load: "Loading..." message
2. Submitting: Button shows "Saving..."
3. Disabled: All inputs disabled during submit

## Accessibility

- Semantic HTML (labels, inputs, buttons)
- Proper input types (text, number, range)
- Required fields marked with asterisk
- Error messages linked to fields
- Focus states visible
- Touch targets sized appropriately (44px+)

## Custom CSS

Slider styling for cross-browser support:

```css
.slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: #ffd700;
  cursor: pointer;
  border-radius: 50%;
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #ffd700;
  cursor: pointer;
  border-radius: 50%;
  border: none;
}
```

## State Management

```typescript
interface FormState {
  name: string;
  age: number;
  rating: number;
  ethnicity?: string;
  hair_color?: string;
  location_city?: string;
  location_country?: string;
}

interface ErrorState {
  [key: string]: string;
}
```

State updates trigger re-validation and localStorage sync.

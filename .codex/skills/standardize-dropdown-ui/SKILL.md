---
name: standardize-dropdown-ui
description: Standardize PFMS frontend dropdown controls. Use when adding, reviewing, or modifying dropdowns, selects, option lists, filters, status pickers, role pickers, PO pickers, catalog pickers, or any UI that might otherwise use a native HTML select in the EACTracker/PFMS React frontend.
---

# Standardize Dropdown UI

Use the shared `frontend/src/components/Select.jsx` component for user-facing dropdowns.

## Workflow

1. Search for native dropdowns before and after edits:

   ```bash
   rg -n "<select|</select>|<option|</option>" frontend/src
   ```

2. Replace user-facing native `<select>` elements with `Select`.

   ```jsx
   import Select from '../components/Select.jsx';

   <Select
     value={value}
     options={items.map(item => ({ value: item.id, label: item.name }))}
     onChange={nextValue => setValue(nextValue)}
     placeholder="Select item"
   />
   ```

3. For empty choices, use a real option object:

   ```jsx
   options={[{ value: '', label: 'Select PO' }, ...poOptions]}
   ```

4. Preserve existing sizing with `style` only when the surrounding layout already depends on it:

   ```jsx
   <Select value={category} options={options} onChange={setCategory} style={{ maxWidth: 90 }} />
   ```

5. Keep dropdown menu styling centralized in `frontend/src/index.css` under `.select`, `.select-menu`, `.select-option`, and related classes. Do not add one-off native select styles in screens.

6. Run validation:

   ```bash
   npm run build
   rg -n "<select|</select>|<option|</option>" frontend/src
   ```

Only leave native select markup if it is inside the shared `Select` component implementation or a comment explaining legacy context. Prefer removing stale comments that mention native selects.

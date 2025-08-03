# Migration 019: Update Vendor Criticality

## Overview
This migration updates the vendor criticality field to align with DORA (Digital Operational Resilience Act) standards.

## Changes Made

### Database Schema Changes
- **Renamed Column**: `critical_third_party` → `criticality`
- **Updated Enum Values**: 
  - Old: `'yes'`, `'no'`, `'under_review'`
  - New: `'Critical'`, `'NonCritical'`

### Data Mapping
- `'yes'` → `'Critical'`
- `'under_review'` → `'Critical'` 
- `'no'` → `'NonCritical'`
- `NULL` → `NULL` (unchanged)

## Impact Assessment

### Frontend Components Affected
- `src/components/dashboard/Dashboard.tsx`
- `src/components/vendors/VendorList.tsx`
- `src/components/vendors/VendorForm.tsx`
- `src/types/vendor.ts`
- `src/services/exportService.ts`

### Breaking Changes
- All references to `critical_third_party` field must be updated
- Enum value checks need to be updated in TypeScript definitions
- Form dropdowns and validation logic needs updates

## Migration Safety

### Rollback Safety: ✅ YES
- Safe to rollback, but note that original distinction between `'yes'` and `'under_review'` will be lost
- Both will become `'yes'` in rollback scenario

### Data Loss Risk: ⚠️ MINIMAL
- No data loss occurs
- Some semantic information lost in rollback (distinction between 'yes' and 'under_review')

## Post-Migration Tasks

1. Update TypeScript type definitions
2. Update all frontend components using the field
3. Update form validation and dropdown options
4. Update export/import logic
5. Test dashboard criticality calculations
6. Update any API documentation

## Testing Checklist

- [ ] Dashboard shows correct critical vendor counts
- [ ] Vendor forms save and display criticality correctly
- [ ] Vendor list filters work with new enum values
- [ ] Export functionality includes correct criticality values
- [ ] Migration can be rolled back successfully

## Timeline
- **Estimated Duration**: 30 seconds
- **Downtime Required**: None (if using blue-green deployment)
- **Business Impact**: Minimal (field rename only)
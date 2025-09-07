# SweetAlert Theme Migration Guide

## Overview
This guide explains how to ensure all SweetAlert (swal) alerts work properly in both light and dark modes across all pages in the CommunityLink application.

## Current Status ✅

### What's Already Working:
1. **SweetAlert CSS with Theme Support** - `frontend/src/styles/sweetAlert.css`
   - Comprehensive theme variables integration
   - Global overrides for all SweetAlert instances
   - Custom theme classes for enhanced theming
   - Responsive design support

2. **SweetAlert Utilities with Theme Detection** - `frontend/src/utils/sweetAlertUtils.js`
   - Automatic theme detection (data-theme, classes, system preference)
   - Theme-aware color schemes
   - Predefined alert types (success, error, warning, info, question, confirm)
   - Toast notifications with theme support
   - Loading alerts with theme support

3. **Theme System Integration** - `frontend/src/styles/themes.css`
   - Complete light/dark mode variables
   - Smooth transitions between themes
   - CSS custom properties for all UI elements

4. **App.js Integration**
   - SweetAlert CSS imported globally
   - SweetAlert theme initialization
   - Theme change monitoring

## Updated Components ✅

The following components have been updated to use theme-aware SweetAlert utilities:

1. **LoginPage.jsx** - All alerts now use theme-aware functions
2. **ContactUsPage.jsx** - All alerts now use theme-aware functions
3. **StudentsByYearPage.jsx** - Already using theme utilities

## Migration Steps for Remaining Components

### Step 1: Update Imports
Replace:
```javascript
import Swal from 'sweetalert2';
```

With:
```javascript
import { showAlert, showSuccess, showError, showWarning, showInfo, showQuestion, showConfirm } from '../utils/sweetAlertUtils';
```

### Step 2: Replace Swal.fire() Calls

#### Basic Alerts
**Before:**
```javascript
Swal.fire({
  icon: 'success',
  title: 'Success!',
  text: 'Operation completed successfully.',
  confirmButtonColor: '#10b981'
});
```

**After:**
```javascript
showSuccess('Success!', 'Operation completed successfully.');
```

#### Error Alerts
**Before:**
```javascript
Swal.fire({
  icon: 'error',
  title: 'Error',
  text: 'Something went wrong.',
  confirmButtonColor: '#ef4444'
});
```

**After:**
```javascript
showError('Error', 'Something went wrong.');
```

#### Warning Alerts
**Before:**
```javascript
Swal.fire({
  icon: 'warning',
  title: 'Warning',
  text: 'Please check your input.',
  confirmButtonColor: '#f59e0b'
});
```

**After:**
```javascript
showWarning('Warning', 'Please check your input.');
```

#### Confirmation Dialogs
**Before:**
```javascript
const result = await Swal.fire({
  title: 'Are you sure?',
  text: "You won't be able to revert this!",
  icon: 'warning',
  showCancelButton: true,
  confirmButtonColor: '#ef4444',
  cancelButtonColor: '#6b7280',
  confirmButtonText: 'Yes, delete it!',
  cancelButtonText: 'Cancel'
});
```

**After:**
```javascript
const result = await showConfirm('Are you sure?', "You won't be able to revert this!", {
  confirmButtonText: 'Yes, delete it!',
  cancelButtonText: 'Cancel'
});
```

#### Custom Alerts
**Before:**
```javascript
Swal.fire({
  icon: 'info',
  title: 'Information',
  text: 'Here is some information.',
  confirmButtonColor: '#3b82f6',
  confirmButtonText: 'Got it!'
});
```

**After:**
```javascript
showInfo('Information', 'Here is some information.', {
  confirmButtonText: 'Got it!'
});
```

### Step 3: Available Functions

| Function | Purpose | Parameters |
|----------|---------|------------|
| `showAlert(options)` | Generic alert with full customization | `options` object |
| `showSuccess(title, text, options)` | Success alert | `title`, `text`, optional `options` |
| `showError(title, text, options)` | Error alert | `title`, `text`, optional `options` |
| `showWarning(title, text, options)` | Warning alert | `title`, `text`, optional `options` |
| `showInfo(title, text, options)` | Info alert | `title`, `text`, optional `options` |
| `showQuestion(title, text, options)` | Question alert with Yes/Cancel | `title`, `text`, optional `options` |
| `showConfirm(title, text, options)` | Confirmation dialog | `title`, `text`, optional `options` |
| `showToast(icon, title, options)` | Toast notification | `icon`, `title`, optional `options` |
| `showLoading(title, text)` | Loading alert | `title`, `text` |
| `closeLoading()` | Close loading alert | None |

## Components That Need Migration

The following components still use the old `Swal.fire()` method and should be migrated:

1. ManageUsersPage.jsx
2. RegisterPage.jsx
3. EventListPage.jsx
4. AdminManageEventsPage.jsx
5. EventAttendancePage.jsx
6. StudentDocumentationPage.jsx
7. AdminEventDocumentation.jsx
8. AdminViewStudentDocumentation.jsx
9. SettingsPage.jsx
10. PublicEventRegistrationPage.jsx
11. SchoolSettingsPage.jsx
12. Students40HoursPage.jsx
13. MyParticipationPage.jsx
14. FeedbackPage.jsx
15. EventParticipants.jsx
16. RegistrationApprovalPage.jsx
17. EventDetailsPage.jsx
18. RegistrationManagementPage.jsx
19. StaffApprovalPage.jsx
20. ResetPasswordPage.jsx
21. AdminManageFeedbackPage.jsx
22. EditEventPage.jsx
23. CreateEventPage.jsx
24. AdminManageMessagesPage.jsx
25. ForgotPasswordPage.jsx
26. EventDocumentationUpload.jsx
27. VerifyEmailPage.jsx
28. ProfilePictureUpload.jsx
29. ChangePasswordPage.jsx

## Benefits of Migration

1. **Automatic Theme Support** - Alerts automatically adapt to light/dark mode
2. **Consistent Styling** - All alerts use the same theme variables
3. **Better UX** - Smooth transitions and hover effects
4. **Maintainability** - Centralized theme management
5. **Future-Proof** - Easy to update theme colors globally

## Testing

After migration, test alerts in both themes:

1. **Light Mode**: Switch to light theme and trigger various alerts
2. **Dark Mode**: Switch to dark theme and trigger various alerts
3. **Theme Switching**: Change themes while alerts are open
4. **Responsive**: Test on different screen sizes

## Notes

- The CSS already provides global overrides, so existing `Swal.fire()` calls will have basic theme support
- Migration to theme utilities provides enhanced theming and better maintainability
- All theme colors are defined in `themes.css` and automatically applied
- The system detects theme changes automatically and updates SweetAlert accordingly

## Support

If you encounter any issues during migration:

1. Check browser console for errors
2. Verify imports are correct
3. Ensure theme variables are available
4. Test in both light and dark modes
5. Check responsive behavior on mobile devices

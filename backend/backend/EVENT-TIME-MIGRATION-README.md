# Event Time Migration Guide

## Overview
This migration updates the event system from using a single `time` field to separate `startTime` and `endTime` fields for better event scheduling.

## Changes Made

### Backend Changes

#### 1. Event Model (`backend/models/Event.js`)
- **Removed**: `time: { type: String, required: true }`
- **Added**: 
  - `startTime: { type: String, required: true }`
  - `endTime: { type: String, required: true }`

#### 2. Event Controller (`backend/controllers/eventController.js`)
- **Updated**: `createEvent` function to handle `startTime` and `endTime`
- **Updated**: `updateEvent` function to handle `startTime` and `endTime`
- **Removed**: References to old `time` field

### Frontend Changes

#### 1. CreateEventPage (`frontend/src/components/CreateEventPage.jsx`)
- **Added**: Separate start time and end time input fields
- **Added**: Time validation (end time must be after start time)
- **Updated**: Form submission to send `startTime` and `endTime`

#### 2. Event Display Components
Updated all components to display time as "startTime - endTime" format:
- `AdminManageEventsPage.jsx`
- `EventListPage.jsx`
- `EventDetailsPage.jsx`
- `EventAttendancePage.jsx`
- `PublicEventRegistrationPage.jsx`

## Migration Steps

### 1. Run Database Migration
```bash
cd backend
node scripts/migrateEventTimes.js
```

This script will:
- Find all existing events with the old `time` field
- Set `startTime` to the old time value
- Set `endTime` to '23:59' (default end time)
- Remove the old `time` field

### 2. Restart Backend Server
After running the migration, restart your backend server to ensure the new model changes take effect.

### 3. Test the System
- Create a new event with start and end times
- Verify existing events display correctly with the new time format
- Check that all event displays show "startTime - endTime" format

## Benefits

1. **Better Event Scheduling**: Users can now specify both start and end times
2. **Improved User Experience**: Clear indication of event duration
3. **More Accurate Time Tracking**: Better support for attendance and timing systems
4. **Future Extensibility**: Foundation for more advanced scheduling features

## Rollback Plan

If you need to rollback:
1. Restore the old Event model with `time` field
2. Update the controller functions to use `time` instead of `startTime`/`endTime`
3. Update frontend components to display single time field
4. Run a reverse migration script if needed

## Notes

- Existing events will have `endTime` set to '23:59' by default
- The migration preserves all existing event data
- New events require both start and end times
- Time validation ensures logical time sequences

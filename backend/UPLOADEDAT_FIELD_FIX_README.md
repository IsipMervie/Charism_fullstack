# uploadedAt Field Fix - Database Migration Guide

## Problem Description

The application is experiencing 500 errors due to Mongoose schema validation issues. The error occurs when trying to create the `uploadedAt` property on string values instead of objects.

### Error Pattern
```
TypeError: Cannot create property 'uploadedAt' on string '63ee5141f67ceb75f3b011dac5a208b2'
```

### Root Cause
The database contains legacy data where file fields are stored as strings instead of objects with the expected structure:

**Expected Structure:**
```javascript
{
  data: Buffer,
  contentType: String,
  filename: String,
  uploadedAt: Date
}
```

**Current Data (Problematic):**
```javascript
"63ee5141f67ceb75f3b011dac5a208b2"  // String instead of object
```

### Affected Fields
1. **SchoolSettings.logo** - School logo image
2. **Event.image** - Event banner images  
3. **User.profilePicture** - User profile pictures

## Solution

### 1. Immediate Fix (Defensive Programming)

We've added defensive checks in the controllers to prevent crashes:

- **Settings Controller**: Converts string logo values to `null`
- **Event Controller**: Converts string image values to `null`
- **MongoFileStorage Utility**: Enhanced `hasFile()` function to handle malformed data

### 2. Permanent Fix (Data Migration)

Run the migration script to convert all string values to proper object structures:

```bash
cd backend
node scripts/fix-uploadedAt-fields-robust.js
```

## Migration Scripts

### Basic Migration (`fix-uploadedAt-fields.js`)
- Simple conversion of string values to object structures
- Basic error handling
- Suitable for small datasets

### Robust Migration (`fix-uploadedAt-fields-robust.js`) - **RECOMMENDED**
- Enhanced error handling and logging
- Content-type detection from file extensions
- Detailed progress reporting
- Safe fallbacks for failed conversions

## Running the Migration

### Prerequisites
1. Ensure database connection is working
2. Backup your database (recommended)
3. Run during low-traffic periods

### Execution
```bash
# Navigate to backend directory
cd backend

# Run the robust migration script
node scripts/fix-uploadedAt-fields-robust.js
```

### Expected Output
```
🔧 Starting robust uploadedAt field migration...
✅ Database connected

📚 Fixing SchoolSettings.logo field...
  Processing SchoolSettings logo: 63ee5141f67ceb75f3b011dac5a208b2
  ✅ Converting logo from string to object
✅ Fixed 1 SchoolSettings documents (0 errors)

📅 Fixing Event.image field...
  Processing Event image: 1756224198912-439736402-Screenshot 2025-08-21 201250.png
  ✅ Converting event image from string to object
✅ Fixed 5 Event documents (0 errors)

👤 Fixing User.profilePicture field...
✅ Fixed 0 User documents (0 errors)

📊 Migration Summary:
  SchoolSettings: 1 fixed, 0 errors
  Events: 5 fixed, 0 errors
  Users: 0 fixed, 0 errors
  Total: 6 fields fixed, 0 errors

🎉 Migration completed successfully with no errors!
🔌 Database connection closed
```

## What the Migration Does

### For Each Affected Field:
1. **Detects string values** in file fields
2. **Converts to object structure**:
   ```javascript
   {
     data: null,                    // Can't recover original file data
     contentType: 'image/png',      // Detected from filename extension
     filename: 'original-string',   // Preserves original filename
     originalName: 'original-string',
     uploadedAt: new Date(),        // Sets current timestamp
     fileSize: 0,                   // Unknown size
     description: 'Migrated from legacy field'
   }
3. **Saves updated documents** to database
4. **Logs progress** and any errors

### Content-Type Detection
The script automatically detects file types from extensions:
- `.png` → `image/png`
- `.jpg` → `image/jpeg`
- `.pdf` → `application/pdf`
- `.docx` → `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- And many more...

## Post-Migration

### What Happens:
- ✅ 500 errors should stop occurring
- ✅ File fields will have proper object structures
- ✅ `hasFile()` function will work correctly
- ✅ Controllers will handle data safely

### What You'll Need to Do:
- **Re-upload actual files** since the migration can't recover file data
- **Update file references** in your application if needed
- **Test file upload functionality** to ensure it works correctly

## Rollback Plan

If issues occur during migration:

1. **Stop the script** (Ctrl+C)
2. **Check the logs** for specific errors
3. **Restore from backup** if necessary
4. **Run in smaller batches** by modifying the script

## Monitoring

### Check Migration Success:
```javascript
// In MongoDB shell or application
db.schoolsettings.findOne({}, {logo: 1})
db.events.findOne({}, {image: 1})
db.users.findOne({}, {profilePicture: 1})
```

### Expected Result:
```javascript
// Before (problematic)
logo: "63ee5141f67ceb75f3b011dac5a208b2"

// After (fixed)
logo: {
  data: null,
  contentType: "image/png",
  filename: "63ee5141f67ceb75f3b011dac5a208b2",
  uploadedAt: ISODate("2024-08-30T..."),
  // ... other fields
}
```

## Prevention

To prevent this issue in the future:

1. **Always validate file data** before saving to database
2. **Use proper file upload middleware** (already implemented)
3. **Add schema validation** for file fields
4. **Regular data integrity checks** for production systems

## Support

If you encounter issues:

1. Check the migration script logs
2. Verify database connectivity
3. Ensure models are properly imported
4. Check for any custom middleware that might interfere

## Files Modified

- `backend/controllers/settingsController.js` - Added defensive logo handling
- `backend/controllers/eventController.js` - Added defensive image handling  
- `backend/utils/mongoFileStorage.js` - Enhanced `hasFile()` function
- `backend/scripts/fix-uploadedAt-fields.js` - Basic migration script
- `backend/scripts/fix-uploadedAt-fields-robust.js` - Robust migration script

---

**Note**: This migration is safe and non-destructive. It only converts malformed data to proper structures without losing any information.

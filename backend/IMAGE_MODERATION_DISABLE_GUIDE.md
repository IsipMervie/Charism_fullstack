# Image Moderation Disable Guide

## Problem
The Event Chat image moderation system was being overly aggressive, flagging normal images as "Inappropriate image" even when they were perfectly fine pictures.

## Solution
The image moderation system has been significantly relaxed and now includes a bypass option.

## Changes Made

### 1. Relaxed Filtering Rules
- **File Size Limits**: Increased from 1.5MB to 50MB before flagging
- **Suspicious Characteristics**: Reduced from 2+ flags to requiring multiple explicit flags
- **Pattern Matching**: Only flags extremely explicit inappropriate terms
- **Error Handling**: Now defaults to allowing images instead of blocking them

### 2. Added Bypass Option
You can completely disable image moderation by setting an environment variable:

```bash
DISABLE_IMAGE_MODERATION=true
```

## How to Disable Image Moderation Completely

### Option 1: Environment Variable (Recommended)
Add this to your `.env` file:
```
DISABLE_IMAGE_MODERATION=true
```

### Option 2: Production Environment
If you're using Render, Heroku, or similar:
1. Go to your environment variables settings
2. Add: `DISABLE_IMAGE_MODERATION` = `true`
3. Restart your application

## What Was Fixed

### Before (Too Strict)
- ❌ Images over 1.5MB were flagged as suspicious
- ❌ Images over 2MB were blocked
- ❌ Common words like "image", "photo" could trigger flags
- ❌ Any 2+ suspicious characteristics blocked the image
- ❌ Errors in analysis blocked all images

### After (Much More Reasonable)
- ✅ Images up to 50MB are allowed
- ✅ Only extremely explicit inappropriate terms are blocked
- ✅ Requires multiple explicit flags to block an image
- ✅ Errors in analysis now allow images through
- ✅ Added complete bypass option

## Testing
After making these changes, normal images should now upload successfully in Event Chat without being flagged as inappropriate.

## Rollback
If you need to revert to stricter moderation, simply remove the `DISABLE_IMAGE_MODERATION=true` environment variable and restart the application.

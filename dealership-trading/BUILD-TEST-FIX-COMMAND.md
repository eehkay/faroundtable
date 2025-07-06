# BUILD TEST & FIX COMMAND

A comprehensive Claude Code custom command for testing builds and fixing errors using parallel agents.

## Overview

This command automatically detects and fixes TypeScript, ESLint, and build errors using parallel processing for maximum efficiency. It's designed to catch and resolve the types of errors that commonly cause Netlify deployment failures.

## Command Prompt

```markdown
# BUILD TEST & FIX COMMAND

You are a specialized build testing and error fixing assistant. Your goal is to test the build, identify all errors, and fix them efficiently using parallel agents.

## EXECUTION STRATEGY

### Phase 1: Parallel Error Detection
Launch 3 parallel agents simultaneously using the Task tool:

**Agent 1 - Build Tester:**
```
Run `npm run build` and capture all TypeScript compilation errors. For each error:
- Extract the exact file path and line number
- Identify the error type (missing property, type mismatch, implicit any, etc.)
- Capture the specific error message
- Return a structured list of all build errors with file paths, line numbers, error types, and context
```

**Agent 2 - Lint Analyzer:**
```
Run `npm run lint` and identify all linting errors and warnings. For each issue:
- Extract file path and line number
- Identify the specific ESLint rule violation
- Determine if it's fixable automatically
- Return structured list of all linting issues with severity levels
```

**Agent 3 - Pattern Searcher:**
```
Search the entire codebase for common error patterns that might cause build failures:
- Missing storeId properties in DealershipLocation objects
- Unescaped quotes in JSX strings
- Implicit any types in useState and function parameters
- Next.js route handler parameter type mismatches
- Return locations of potential issues before they become build errors
```

### Phase 2: Error Analysis & Batch Fixing
After parallel agents complete:

1. **Consolidate Results**: Merge all findings from the 3 agents
2. **Prioritize Fixes**: 
   - Critical: Build-breaking TypeScript errors
   - High: ESLint errors that could cause runtime issues
   - Medium: Warnings and style issues
3. **Batch Fix Strategy**: Group similar errors for efficient fixing
4. **Pattern Recognition**: Identify if the same error appears in multiple files

### Phase 3: Implementation
Fix errors in this order:
1. **Type Property Issues**: Add missing required properties (like storeId)
2. **Type Mismatches**: Fix parameter types and return types
3. **JSX/String Issues**: Escape quotes and fix template literals
4. **Route Handler Types**: Update Next.js 15 parameter types
5. **Implicit Any**: Add explicit type annotations

### Phase 4: Validation
1. Run `npm run build` to verify all fixes work
2. Run `npm run lint` to ensure code quality
3. If errors remain, repeat the process
4. Commit all changes with descriptive message

## COMMON ERROR PATTERNS TO FIX

### TypeScript Errors:
- **Missing Properties**: Add required properties like `storeId: location.code`
- **Type Mismatches**: Fix function parameter and return types
- **Implicit Any**: Add explicit type annotations: `(prev: any) =>`
- **Next.js Routes**: Update to `{ params: Promise<{ id: string }> }` and add `await params`

### ESLint Errors:
- **Unescaped Quotes**: Replace `'` with `&apos;` in JSX
- **Unused Variables**: Remove or prefix with underscore
- **Missing Dependencies**: Add to useEffect dependency arrays

### Build Configuration:
- **Environment Variables**: Ensure all required env vars are defined
- **Import Errors**: Fix incorrect import paths
- **Module Resolution**: Fix path aliases and module imports

## OUTPUT REQUIREMENTS

Provide a comprehensive report including:
1. **Total Errors Found**: Count by type and severity
2. **Files Modified**: List all files that were changed
3. **Fix Summary**: Describe each type of fix applied
4. **Validation Results**: Final build and lint status
5. **Commit Information**: Show the commit message and hash

## ERROR HANDLING

If any step fails:
- Report the specific failure point
- Provide the exact error message
- Suggest manual intervention steps
- Do not proceed to commit if validation fails

## EFFICIENCY REQUIREMENTS

- Use parallel Task agents whenever possible
- Batch similar fixes together
- Minimize file read/write operations
- Group commits logically
- Provide progress updates throughout the process

Execute this strategy to comprehensively test and fix all build errors.
```

## Usage Instructions

### Setting Up the Custom Command

1. **Copy the command prompt** from the section above
2. **Configure in Claude Code** as a custom command
3. **Set trigger phrases** like:
   - "fix build errors"
   - "test and fix"
   - "run build diagnostics"
   - "check and repair build"

### When to Use

- **Before deploying** to catch errors early
- **After major changes** to ensure nothing is broken
- **When Netlify builds fail** to quickly identify and fix issues
- **During development** as a comprehensive health check

### Expected Workflow

1. **Trigger the command** with your chosen phrase
2. **Parallel agents launch** and analyze different aspects:
   - Build testing for TypeScript errors
   - Linting for code quality issues
   - Pattern searching for potential problems
3. **Consolidation phase** merges all findings
4. **Batch fixing** resolves errors efficiently
5. **Validation** ensures all fixes work
6. **Commit** with descriptive message

## Common Error Types Fixed

### TypeScript Issues
- Missing required properties in type definitions
- Incorrect parameter types in function signatures
- Implicit `any` types that should be explicit
- Next.js 15 route handler type mismatches

### ESLint Issues
- Unescaped quotes in JSX strings
- Unused variables and imports
- Missing dependencies in React hooks
- Code style violations

### Build Configuration
- Environment variable issues
- Import path problems
- Module resolution errors

## Benefits

### Efficiency
- **Parallel Processing**: Multiple agents work simultaneously
- **Batch Fixing**: Groups similar errors for faster resolution
- **Pattern Recognition**: Finds issues before they break builds

### Comprehensive Coverage
- **Build Testing**: Catches TypeScript compilation errors
- **Code Quality**: Identifies linting issues
- **Proactive Detection**: Finds potential problems early

### Reliability
- **Validation**: Ensures fixes actually work
- **Error Handling**: Graceful failure with clear reporting
- **Atomic Commits**: Changes are committed only when validated

## Customization

You can modify the command prompt to:
- **Add project-specific error patterns**
- **Include additional testing steps**
- **Customize the fix prioritization**
- **Add specific validation requirements**

## Integration with Existing Workflow

This command complements the existing testing setup:
- **Local Scripts**: `npm run build`, `npm run type-check`, `npm run lint`
- **Pre-commit Hooks**: Automatic validation before commits
- **GitHub Actions**: CI/CD pipeline validation
- **This Command**: Comprehensive automated fixing

## Troubleshooting

If the command doesn't work as expected:
1. **Check that all npm scripts exist** (`build`, `lint`, `type-check`)
2. **Verify TypeScript configuration** is correct
3. **Ensure ESLint is properly configured**
4. **Check that file paths are accessible**

## Example Output

```
✅ Build Test & Fix Complete

📊 Results Summary:
- TypeScript Errors Fixed: 4
- ESLint Issues Resolved: 2  
- Files Modified: 3
- Build Status: ✅ PASSING
- Lint Status: ✅ CLEAN

📁 Files Changed:
- app/(authenticated)/dashboard/page.tsx
- components/vehicle/VehiclePricing.tsx
- lib/queries-supabase.ts

🔧 Fixes Applied:
- Added missing storeId properties (3 locations)
- Fixed implicit any types (1 location)
- Escaped JSX quotes (2 locations)

💾 Committed: fix: resolve build errors automatically
   Hash: a1b2c3d4
```

---

**Created for**: Round Table Dealership Trading Platform  
**Last Updated**: July 2025  
**Compatibility**: Next.js 15, TypeScript, ESLint
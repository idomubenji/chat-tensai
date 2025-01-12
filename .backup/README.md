# Backup Directory

This directory contains backups from the deploy/ directory merge project.

## Contents

- `deploy/` - Backup of the original deploy/ directory before merging into the main codebase
  - Created on: January 12, 2024
  - Purpose: Safety backup during the codebase unification project
  - Can be safely removed after verifying production deployment works with the new unified structure

## Cleanup

Once the new unified structure has been running successfully in production for a few days, this backup can be removed using:

```bash
rm -rf .backup/deploy
``` 
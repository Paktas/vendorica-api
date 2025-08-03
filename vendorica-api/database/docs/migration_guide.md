# Database Migration Guide

## Overview
This guide explains how to manage database migrations in the Vendorica application using our new migration system.

## Migration Structure

### Folder Organization
```
database/
├── migrations/           # Incremental changes (IMMUTABLE after deployment)
├── schema/              # Complete schema snapshots  
├── seeds/               # Sample/test data
├── functions/           # Stored procedures
├── views/               # Database views
├── indexes/             # Performance indexes
├── triggers/            # Database triggers
└── docs/               # Documentation
```

### Migration Naming Convention
Format: `{version}_{action}_{target}_{description}/`

**Actions:**
- `create` - Creating new tables/structures
- `add` - Adding columns/constraints/indexes
- `drop` - Removing tables/columns/constraints
- `modify` - Changing existing structures
- `fix` - Bug fixes/corrections
- `data` - Data-only changes

**Examples:**
- `001_create_table_users/`
- `002_add_column_users_timezone/`
- `003_drop_index_vendors_name/`
- `004_modify_constraint_contracts_title/`
- `005_fix_policy_users_rls/`
- `006_data_seed_organizations/`

## Migration Files

Each migration folder contains:
- `up.sql` - Forward migration (apply changes)
- `down.sql` - Rollback migration (undo changes)
- `metadata.json` - Migration information and metadata

### Metadata Schema
```json
{
  "version": "001",
  "name": "migration_name",
  "description": "Detailed description of changes",
  "type": "schema|data|fix|performance",
  "author": "Developer Name",
  "created_at": "2024-12-31T00:00:00Z",
  "estimated_duration": "30 seconds",
  "breaking_change": false,
  "rollback_safe": true,
  "dependencies": ["previous_migration_version"],
  "affects_tables": ["table1", "table2"],
  "testing_notes": "How to test this migration",
  "deployment_notes": "Special deployment considerations"
}
```

## Migration Rules

### 1. Immutability Rule
**Once deployed to staging/production, migration files CANNOT be modified.**
- Create a new migration to fix issues
- Never edit existing migration files

### 2. Sequential Versioning
- Migrations run in numerical order
- No gaps in version numbers
- Use 3-digit zero-padded numbers (001, 002, etc.)

### 3. Rollback Safety
- Every migration must have a working `down.sql`
- Test rollbacks in development
- Some migrations may be marked as non-rollback-safe

### 4. Breaking Changes
- Mark breaking changes in metadata
- Coordinate with application deployments
- Plan for downtime if necessary

## Development Workflow

### Creating a New Migration

1. **Determine version number:**
   ```bash
   # Check latest migration
   ls database/migrations/ | sort -V | tail -1
   ```

2. **Create migration folder:**
   ```bash
   mkdir database/migrations/003_add_column_users_phone
   ```

3. **Create files:**
   ```bash
   touch database/migrations/003_add_column_users_phone/up.sql
   touch database/migrations/003_add_column_users_phone/down.sql
   touch database/migrations/003_add_column_users_phone/metadata.json
   ```

4. **Write migration code:**
   - Start with `up.sql` (forward changes)
   - Write `down.sql` (rollback changes)
   - Fill out `metadata.json`

5. **Test migration:**
   ```sql
   -- Apply migration
   \\i database/migrations/003_add_column_users_phone/up.sql
   
   -- Test functionality
   -- ...
   
   -- Test rollback
   \\i database/migrations/003_add_column_users_phone/down.sql
   ```

### Deployment Process

1. **Pre-deployment:**
   - Review migration files
   - Test in development environment
   - Test rollback procedures
   - Check dependencies

2. **Deployment:**
   - Create database backup
   - Apply migrations in order
   - Verify changes
   - Update migration log

3. **Post-deployment:**
   - Monitor application
   - Verify data integrity
   - Update documentation

### Emergency Rollback

1. **Immediate rollback:**
   ```sql
   \\i database/migrations/XXX_migration_name/down.sql
   ```

2. **Verify rollback:**
   - Check application functionality
   - Verify data integrity
   - Monitor for issues

3. **Root cause analysis:**
   - Identify issue
   - Plan fix
   - Create new migration

## Best Practices

### SQL Writing
- Use `IF EXISTS` and `IF NOT EXISTS` where appropriate
- Include helpful comments
- Use transactions for complex changes
- Test with realistic data volumes

### Performance Considerations
- Add indexes concurrently for large tables
- Consider impact on existing queries
- Plan for table locks during migrations
- Estimate migration duration

### Data Safety
- Always backup before migrations
- Test migrations with production-like data
- Validate data integrity after migrations
- Plan for rollback scenarios

### Documentation
- Write clear migration descriptions
- Document any manual steps required
- Include testing instructions
- Note any breaking changes

## Tools and Scripts

### Migration Status Script (Planned)
```bash
# Check which migrations have been applied
./scripts/migration_status.sh

# Apply pending migrations
./scripts/migrate.sh

# Rollback last migration
./scripts/rollback.sh
```

### Schema Validation (Planned)
```bash
# Generate current schema
./scripts/generate_schema.sh

# Compare with expected schema
./scripts/validate_schema.sh
```

## Troubleshooting

### Common Issues

1. **Migration fails midway:**
   - Check for syntax errors
   - Verify dependencies
   - Check for data conflicts
   - Review constraint violations

2. **Rollback fails:**
   - Check for dependent objects
   - Verify rollback script accuracy
   - May need manual cleanup

3. **Performance issues:**
   - Long-running migrations
   - Table locks affecting application
   - Index creation timeouts

### Getting Help

1. Check migration logs
2. Review metadata for deployment notes
3. Test in development environment
4. Consult with database team

## Migration Log

Keep track of applied migrations in production:

| Version | Name | Applied Date | Applied By | Duration | Notes |
|---------|------|--------------|------------|----------|-------|
| 001 | create_initial_tables | 2024-12-31 | DevOps | 30s | Initial deployment |
| 002 | add_user_preferences | 2024-12-31 | DevOps | 5s | User settings feature |

This log should be maintained in `database/docs/migration_log.md` and updated with each deployment.
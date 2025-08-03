# Migration 012: Introduce Advanced Roles Table

## Overview
Transform the current string-based role system into a flexible roles table architecture that supports future permissions and role management.

## Current State
- Users have `role` VARCHAR field with CHECK constraint: `('user', 'supervisor', 'administrator')`
- Role permissions are hardcoded in TypeScript

## Target Architecture
- **Roles Table**: Master table for all roles with metadata
- **Users Table**: Foreign key reference to roles table
- **Future Ready**: Designed for permissions and role_permissions tables

## Database Design

### New Tables

#### `roles` table
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,           -- 'user', 'supervisor', 'administrator'
    display_name VARCHAR(100) NOT NULL,         -- 'User', 'Supervisor', 'Administrator'
    description TEXT,                           -- Role description
    is_system BOOLEAN DEFAULT false,            -- System roles (cannot be deleted)
    is_active BOOLEAN DEFAULT true,             -- Active/inactive status
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT roles_name_check CHECK (name <> ''),
    CONSTRAINT roles_display_name_check CHECK (display_name <> '')
);
```

#### Future Tables (Architecture Planning)
```sql
-- Future: permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,          -- 'users.create', 'vendors.delete'
    display_name VARCHAR(200) NOT NULL,         -- 'Create Users', 'Delete Vendors'
    description TEXT,
    resource VARCHAR(50) NOT NULL,              -- 'users', 'vendors', 'contracts'
    action VARCHAR(50) NOT NULL,                -- 'create', 'read', 'update', 'delete'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Future: role_permissions junction table
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);
```

## Migration Steps

### Step 1: Create roles table and seed data
1. Create `roles` table with constraints and indexes
2. Insert default system roles:
   - `user` → "User" (standard user access)
   - `supervisor` → "Supervisor" (team management access)  
   - `administrator` → "Administrator" (full system access)

### Step 2: Add role_id to users table
1. Add `role_id UUID` column to users table (nullable initially)
2. Create mapping from current role strings to role UUIDs
3. Update all existing users with correct role_id values

### Step 3: Verify data integrity and switch
1. Verify all users have valid role_id assignments
2. Add NOT NULL constraint to role_id
3. Add foreign key constraint: `role_id REFERENCES roles(id)`
4. Create indexes for performance

### Step 4: Cleanup old role system
1. Drop old role CHECK constraint
2. Drop old role column
3. Update any remaining references

## Data Migration Strategy

### Safe Migration Process
1. **Backwards Compatible**: Keep old role column during transition
2. **Dual Write**: Update both old and new role fields during migration
3. **Verification**: Ensure 100% data consistency before switching
4. **Rollback Ready**: Maintain ability to rollback if issues occur

### Role Mapping
```
'user'          → roles.name = 'user'
'supervisor'    → roles.name = 'supervisor'  
'administrator' → roles.name = 'administrator'
```

## Impact Analysis

### Application Layer Changes
- **Types**: Update User interface to include Role object
- **Services**: Update UserService to handle role relationships
- **Components**: Update role dropdowns to use roles table
- **Permissions**: Update permission checking logic

### Benefits
- ✅ **Flexible**: Easy to add new roles without code changes
- ✅ **Scalable**: Supports complex permission systems
- ✅ **Maintainable**: Role management through UI instead of code
- ✅ **Auditable**: Role changes tracked in database
- ✅ **Future-Proof**: Ready for advanced permission systems

### Risks & Mitigation
- **Risk**: Data loss during migration
  - **Mitigation**: Multi-step migration with verification
- **Risk**: Application downtime
  - **Mitigation**: Backwards-compatible migration steps
- **Risk**: Permission logic breaks
  - **Mitigation**: Comprehensive testing of role-based features

## Testing Strategy
1. **Unit Tests**: Service layer role handling
2. **Integration Tests**: Role assignment and permission checking  
3. **Migration Tests**: Data integrity throughout migration
4. **UI Tests**: Role selection and display components

## Rollback Plan
Each migration step includes rollback SQL to restore previous state if needed.
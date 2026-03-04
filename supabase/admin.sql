-- ============================================
-- PLATFORM ADMIN TABLES
-- ============================================

-- Platform super admins (not company-bound)
CREATE TABLE IF NOT EXISTS platform_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    is_super_admin BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization plans/subscriptions
CREATE TABLE IF NOT EXISTS organization_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL DEFAULT 'basic',
    max_users INTEGER DEFAULT 5,
    max_customers INTEGER DEFAULT 100,
    max_vendors INTEGER DEFAULT 50,
    max_inventory_items INTEGER DEFAULT 200,
    modules_enabled JSONB DEFAULT '{}',
    subscription_status VARCHAR(50) DEFAULT 'active',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id)
);

-- Company modules (which modules are enabled per company)
CREATE TABLE IF NOT EXISTS company_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    module_key VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    enabled_at TIMESTAMPTZ DEFAULT NOW(),
    disabled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, module_key)
);

-- Admin audit logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES platform_admins(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    target_id UUID,
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User login history (for security)
CREATE TABLE IF NOT EXISTS user_login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- 'platform_admin' or 'company_user'
    login_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(50),
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    failure_reason VARCHAR(255)
);

-- ============================================
-- ADD COLUMNS TO EXISTING TABLES
-- ============================================

-- Add is_active to companies (soft delete)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- Add is_super_admin to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_platform_admins_email ON platform_admins(email);
CREATE INDEX IF NOT EXISTS idx_platform_admins_active ON platform_admins(is_active);

CREATE INDEX IF NOT EXISTS idx_organization_plans_company ON organization_plans(company_id);
CREATE INDEX IF NOT EXISTS idx_organization_plans_status ON organization_plans(subscription_status);

CREATE INDEX IF NOT EXISTS idx_company_modules_company ON company_modules(company_id);
CREATE INDEX IF NOT EXISTS idx_company_modules_key ON company_modules(module_key);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin ON admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON admin_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_login_history_user ON user_login_history(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_user_login_history_date ON user_login_history(login_at DESC);

-- ============================================
-- DEFAULT MODULES
-- ============================================

INSERT INTO company_modules (company_id, module_key, is_enabled)
SELECT id, 'sales', true FROM companies
ON CONFLICT (company_id, module_key) DO NOTHING;

INSERT INTO company_modules (company_id, module_key, is_enabled)
SELECT id, 'purchases', true FROM companies
ON CONFLICT (company_id, module_key) DO NOTHING;

INSERT INTO company_modules (company_id, module_key, is_enabled)
SELECT id, 'inventory', true FROM companies
ON CONFLICT (company_id, module_key) DO NOTHING;

INSERT INTO company_modules (company_id, module_key, is_enabled)
SELECT id, 'accounting', true FROM companies
ON CONFLICT (company_id, module_key) DO NOTHING;

INSERT INTO company_modules (company_id, module_key, is_enabled)
SELECT id, 'hr', true FROM companies
ON CONFLICT (company_id, module_key) DO NOTHING;

INSERT INTO company_modules (company_id, module_key, is_enabled)
SELECT id, 'crm', true FROM companies
ON CONFLICT (company_id, module_key) DO NOTHING;

-- ============================================
-- CREATE DEFAULT PLATFORM ADMIN
-- ============================================

-- Default admin: admin@erp.com / admin123
INSERT INTO platform_admins (email, password_hash, full_name, role, is_super_admin)
VALUES (
    'admin@erp.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: admin123
    'System Admin',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- UPDATE COMPANIES IS_ACTIVE
-- ============================================

UPDATE companies SET is_active = true WHERE is_active IS NULL;

ANALYZE platform_admins;
ANALYZE organization_plans;
ANALYZE company_modules;
ANALYZE admin_audit_logs;
ANALYZE user_login_history;
ANALYZE companies;
ANALYZE users;

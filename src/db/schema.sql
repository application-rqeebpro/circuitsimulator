-- =====================================================================
-- مخطّط قاعدة بيانات PostgreSQL لمختبر الدوائر الكهربائية
-- أكاديمية الميكاترونكس اليمنية - مخصص لطلاب الجامعة الإماراتية وبقية الجامعات
-- =====================================================================

-- جدول المستخدمين (Students & Platform Owner)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(128) NOT NULL,
    phone VARCHAR(32) UNIQUE NOT NULL,
    university VARCHAR(128) NOT NULL,
    study_level VARCHAR(64) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'owner')),
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
    password_hash VARCHAR(256) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);

-- جدول الاشتراكات (Subscriptions)
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(128) NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subs_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_expires_at ON subscriptions(expires_at);

-- جدول رموز التفعيل (Activation Codes)
CREATE TABLE IF NOT EXISTS activation_codes (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 180,
    plan_name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'used', 'revoked')),
    used_by_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_codes_code ON activation_codes(code);
CREATE INDEX IF NOT EXISTS idx_codes_status ON activation_codes(status);

-- جدول التجارب المعملية (Experiments)
CREATE TABLE IF NOT EXISTS experiments (
    id VARCHAR(64) PRIMARY KEY,
    number INTEGER NOT NULL,
    title VARCHAR(256) NOT NULL,
    title_en VARCHAR(256) NOT NULL,
    category VARCHAR(128) NOT NULL,
    level VARCHAR(128) NOT NULL,
    objective TEXT NOT NULL,
    tools JSONB NOT NULL DEFAULT '[]',
    schematic_description TEXT NOT NULL,
    steps JSONB NOT NULL DEFAULT '[]',
    scientific_explanation TEXT NOT NULL,
    default_circuit JSONB NOT NULL DEFAULT '{}',
    quiz JSONB NOT NULL DEFAULT '[]',
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول الدوائر المحفوظة للطلاب (Saved Circuits)
CREATE TABLE IF NOT EXISTS saved_circuits (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(256) NOT NULL,
    description TEXT,
    elements JSONB NOT NULL DEFAULT '[]',
    wires JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_circuits_user_id ON saved_circuits(user_id);

-- جدول محاولات ونتائج الاختبارات (Quiz Attempts)
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    experiment_id VARCHAR(64) NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    percentage INTEGER NOT NULL,
    answers JSONB NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quiz_user_exp ON quiz_attempts(user_id, experiment_id);

-- جدول سجل العمليات الإدارية (Audit Logs)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    action VARCHAR(128) NOT NULL,
    performed_by VARCHAR(128) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

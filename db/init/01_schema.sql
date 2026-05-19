CREATE TABLE IF NOT EXISTS app_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(160) NOT NULL,
    value JSON NOT NULL DEFAULT (JSON_OBJECT()),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NULL,
    email VARCHAR(190) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(190) NOT NULL,
    value JSON NOT NULL DEFAULT (JSON_OBJECT()),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_group FOREIGN KEY (group_id) REFERENCES app_groups(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS app_screens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(80) UNIQUE NOT NULL,
    title VARCHAR(190) NOT NULL,
    route VARCHAR(190) NOT NULL,
    value JSON NOT NULL DEFAULT (JSON_OBJECT()),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_screen_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    screen_id INT NOT NULL,
    can_create BOOLEAN NOT NULL DEFAULT FALSE,
    can_read BOOLEAN NOT NULL DEFAULT FALSE,
    can_update BOOLEAN NOT NULL DEFAULT FALSE,
    can_delete BOOLEAN NOT NULL DEFAULT FALSE,
    can_upload BOOLEAN NOT NULL DEFAULT FALSE,
    allowed_extensions JSON NOT NULL DEFAULT (JSON_ARRAY('txt','png','jpg','jpeg','pdf','doc','docx','xls','xlsx')),
    value JSON NOT NULL DEFAULT (JSON_OBJECT()),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_permissions_group FOREIGN KEY (group_id) REFERENCES app_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_permissions_screen FOREIGN KEY (screen_id) REFERENCES app_screens(id) ON DELETE CASCADE,
    UNIQUE KEY uq_group_screen (group_id, screen_id)
);

CREATE TABLE IF NOT EXISTS panel_records (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    group_id INT NOT NULL,
    screen_id INT NOT NULL,
    title VARCHAR(190) NOT NULL,
    value JSON NOT NULL DEFAULT (JSON_OBJECT()),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_records_group FOREIGN KEY (group_id) REFERENCES app_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_records_screen FOREIGN KEY (screen_id) REFERENCES app_screens(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS uploaded_files (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id INT NULL,
    group_id INT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(190),
    extension VARCHAR(20) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    analysis_status VARCHAR(40) NOT NULL DEFAULT 'pending',
    value JSON NOT NULL DEFAULT (JSON_OBJECT()),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_files_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE SET NULL,
    CONSTRAINT fk_files_group FOREIGN KEY (group_id) REFERENCES app_groups(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS app_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(120) NOT NULL,
    actor_user_id INT NULL,
    group_id INT NULL,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    message TEXT,
    value JSON NOT NULL DEFAULT (JSON_OBJECT()),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rpc_outbox (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    operation VARCHAR(120) NOT NULL,
    payload JSON NOT NULL DEFAULT (JSON_OBJECT()),
    status VARCHAR(40) NOT NULL DEFAULT 'pending',
    response JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_groups_after_insert;
DROP TRIGGER IF EXISTS trg_groups_after_update;
DROP TRIGGER IF EXISTS trg_groups_after_delete;
DROP TRIGGER IF EXISTS trg_screens_after_insert;
DROP TRIGGER IF EXISTS trg_screens_after_update;
DROP TRIGGER IF EXISTS trg_screens_after_delete;
DROP TRIGGER IF EXISTS trg_permissions_after_insert;
DROP TRIGGER IF EXISTS trg_permissions_after_update;
DROP TRIGGER IF EXISTS trg_permissions_after_delete;
DROP TRIGGER IF EXISTS trg_records_after_insert;
DROP TRIGGER IF EXISTS trg_records_after_update;
DROP TRIGGER IF EXISTS trg_records_after_delete;
DROP PROCEDURE IF EXISTS write_trigger_log;
DROP FUNCTION IF EXISTS can_group_access_screen;
DROP PROCEDURE IF EXISTS assign_screen_permission;

DELIMITER //

CREATE PROCEDURE write_trigger_log(
    IN p_table_name VARCHAR(120),
    IN p_operation VARCHAR(20),
    IN p_row_data JSON
)
BEGIN
    INSERT INTO app_logs(event_type, success, message, value)
    VALUES (
        LOWER(CONCAT(p_table_name, '.', p_operation)),
        TRUE,
        'Veritabanı tetikleyici günlüğü',
        JSON_OBJECT('table', p_table_name, 'operation', p_operation, 'row', p_row_data)
    );
END //

CREATE FUNCTION can_group_access_screen(
    p_group_id INT,
    p_screen_id INT,
    p_operation VARCHAR(20)
)
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_allowed BOOLEAN DEFAULT FALSE;

    SELECT CASE p_operation
        WHEN 'create' THEN can_create
        WHEN 'read' THEN can_read
        WHEN 'update' THEN can_update
        WHEN 'delete' THEN can_delete
        WHEN 'upload' THEN can_upload
        ELSE FALSE
    END
    INTO v_allowed
    FROM group_screen_permissions
    WHERE group_id = p_group_id AND screen_id = p_screen_id
    LIMIT 1;

    RETURN COALESCE(v_allowed, FALSE);
END //

CREATE PROCEDURE assign_screen_permission(
    IN p_group_code VARCHAR(64),
    IN p_screen_code VARCHAR(80),
    IN p_can_create BOOLEAN,
    IN p_can_read BOOLEAN,
    IN p_can_update BOOLEAN,
    IN p_can_delete BOOLEAN,
    IN p_can_upload BOOLEAN
)
BEGIN
    DECLARE v_group_id INT;
    DECLARE v_screen_id INT;

    SELECT id INTO v_group_id FROM app_groups WHERE code = p_group_code LIMIT 1;
    SELECT id INTO v_screen_id FROM app_screens WHERE code = p_screen_code LIMIT 1;

    IF v_group_id IS NULL OR v_screen_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Grup veya ekran bulunamadı';
    END IF;

    INSERT INTO group_screen_permissions (
        group_id, screen_id, can_create, can_read, can_update, can_delete, can_upload
    )
    VALUES (
        v_group_id, v_screen_id, p_can_create, p_can_read, p_can_update, p_can_delete, p_can_upload
    )
    ON DUPLICATE KEY UPDATE
        can_create = VALUES(can_create),
        can_read = VALUES(can_read),
        can_update = VALUES(can_update),
        can_delete = VALUES(can_delete),
        can_upload = VALUES(can_upload),
        updated_at = CURRENT_TIMESTAMP;
END //

CREATE TRIGGER trg_groups_after_insert
AFTER INSERT ON app_groups
FOR EACH ROW
BEGIN
    CALL write_trigger_log('app_groups', 'INSERT', JSON_OBJECT('id', NEW.id, 'code', NEW.code, 'name', NEW.name, 'value', NEW.value));
END //

CREATE TRIGGER trg_groups_after_update
AFTER UPDATE ON app_groups
FOR EACH ROW
BEGIN
    CALL write_trigger_log('app_groups', 'UPDATE', JSON_OBJECT('id', NEW.id, 'code', NEW.code, 'name', NEW.name, 'value', NEW.value));
END //

CREATE TRIGGER trg_groups_after_delete
AFTER DELETE ON app_groups
FOR EACH ROW
BEGIN
    CALL write_trigger_log('app_groups', 'DELETE', JSON_OBJECT('id', OLD.id, 'code', OLD.code, 'name', OLD.name, 'value', OLD.value));
END //

CREATE TRIGGER trg_screens_after_insert
AFTER INSERT ON app_screens
FOR EACH ROW
BEGIN
    CALL write_trigger_log('app_screens', 'INSERT', JSON_OBJECT('id', NEW.id, 'code', NEW.code, 'title', NEW.title, 'route', NEW.route, 'value', NEW.value));
END //

CREATE TRIGGER trg_screens_after_update
AFTER UPDATE ON app_screens
FOR EACH ROW
BEGIN
    CALL write_trigger_log('app_screens', 'UPDATE', JSON_OBJECT('id', NEW.id, 'code', NEW.code, 'title', NEW.title, 'route', NEW.route, 'value', NEW.value));
END //

CREATE TRIGGER trg_screens_after_delete
AFTER DELETE ON app_screens
FOR EACH ROW
BEGIN
    CALL write_trigger_log('app_screens', 'DELETE', JSON_OBJECT('id', OLD.id, 'code', OLD.code, 'title', OLD.title, 'route', OLD.route, 'value', OLD.value));
END //

CREATE TRIGGER trg_permissions_after_insert
AFTER INSERT ON group_screen_permissions
FOR EACH ROW
BEGIN
    CALL write_trigger_log('group_screen_permissions', 'INSERT', JSON_OBJECT('id', NEW.id, 'group_id', NEW.group_id, 'screen_id', NEW.screen_id, 'value', NEW.value));
END //

CREATE TRIGGER trg_permissions_after_update
AFTER UPDATE ON group_screen_permissions
FOR EACH ROW
BEGIN
    CALL write_trigger_log('group_screen_permissions', 'UPDATE', JSON_OBJECT('id', NEW.id, 'group_id', NEW.group_id, 'screen_id', NEW.screen_id, 'value', NEW.value));
END //

CREATE TRIGGER trg_permissions_after_delete
AFTER DELETE ON group_screen_permissions
FOR EACH ROW
BEGIN
    CALL write_trigger_log('group_screen_permissions', 'DELETE', JSON_OBJECT('id', OLD.id, 'group_id', OLD.group_id, 'screen_id', OLD.screen_id, 'value', OLD.value));
END //

CREATE TRIGGER trg_records_after_insert
AFTER INSERT ON panel_records
FOR EACH ROW
BEGIN
    CALL write_trigger_log('panel_records', 'INSERT', JSON_OBJECT('id', NEW.id, 'group_id', NEW.group_id, 'screen_id', NEW.screen_id, 'title', NEW.title, 'value', NEW.value));
END //

CREATE TRIGGER trg_records_after_update
AFTER UPDATE ON panel_records
FOR EACH ROW
BEGIN
    CALL write_trigger_log('panel_records', 'UPDATE', JSON_OBJECT('id', NEW.id, 'group_id', NEW.group_id, 'screen_id', NEW.screen_id, 'title', NEW.title, 'value', NEW.value));
END //

CREATE TRIGGER trg_records_after_delete
AFTER DELETE ON panel_records
FOR EACH ROW
BEGIN
    CALL write_trigger_log('panel_records', 'DELETE', JSON_OBJECT('id', OLD.id, 'group_id', OLD.group_id, 'screen_id', OLD.screen_id, 'title', OLD.title, 'value', OLD.value));
END //

DELIMITER ;

INSERT IGNORE INTO app_groups(code, name, value) VALUES
('supervisor', 'Süpervizör', JSON_OBJECT('description', 'Tüm panel ve izinleri yönetir')),
('student', 'Öğrenci', JSON_OBJECT('description', 'Öğrenci panel grubu')),
('school', 'Okul', JSON_OBJECT('description', 'Okul panel grubu')),
('company', 'İşletme', JSON_OBJECT('description', 'İşletme panel grubu'));

INSERT IGNORE INTO app_users(group_id, email, password_hash, full_name, value)
SELECT id, 'supervisor@example.com', 'demo-hash', 'Demo Süpervizör', JSON_OBJECT('demoPassword', '123456')
FROM app_groups WHERE code = 'supervisor';

INSERT IGNORE INTO app_users(group_id, email, password_hash, full_name, value)
SELECT id, 'ogrenci@example.com', 'demo-hash', 'Demo Öğrenci', JSON_OBJECT('demoPassword', '123456')
FROM app_groups WHERE code = 'student';

INSERT IGNORE INTO app_users(group_id, email, password_hash, full_name, value)
SELECT id, 'okul@example.com', 'demo-hash', 'Demo Okul', JSON_OBJECT('demoPassword', '123456')
FROM app_groups WHERE code = 'school';

INSERT IGNORE INTO app_users(group_id, email, password_hash, full_name, value)
SELECT id, 'isletme@example.com', 'demo-hash', 'Demo İşletme', JSON_OBJECT('demoPassword', '123456')
FROM app_groups WHERE code = 'company';

INSERT IGNORE INTO app_screens(code, title, route, value) VALUES
('dashboard', 'Gösterge Paneli', '/dashboard', JSON_OBJECT('icon', 'layout-dashboard')),
('student-list', 'Öğrenci Listesi', '/students', JSON_OBJECT('entity', 'student')),
('school-list', 'Okul Listesi', '/schools', JSON_OBJECT('entity', 'school')),
('company-list', 'İşletme Listesi', '/companies', JSON_OBJECT('entity', 'company')),
('file-center', 'Dosya Merkezi', '/files', JSON_OBJECT('aiEnabled', TRUE)),
('ai-lab', 'Yapay Zeka Analizi', '/ai', JSON_OBJECT('rag', TRUE, 'mcp', TRUE)),
('logs', 'Loglar', '/logs', JSON_OBJECT('supervisorOnly', TRUE));

INSERT IGNORE INTO uploaded_files(
    id,
    user_id,
    group_id,
    original_name,
    mime_type,
    extension,
    storage_path,
    analysis_status,
    value
)
SELECT
    '11111111-1111-4111-8111-111111111111',
    u.id,
    g.id,
    'sample-panel.png',
    'image/png',
    'png',
    '/app/uploads/sample-panel.png',
    'completed',
    JSON_OBJECT(
        'screen_id', (SELECT id FROM app_screens WHERE code = 'file-center'),
        'analysis', JSON_OBJECT('summary', 'Örnek image dosyası', 'format', 'png')
    )
FROM app_groups g
LEFT JOIN app_users u ON u.email = 'supervisor@example.com'
WHERE g.code = 'supervisor';

CALL assign_screen_permission('supervisor', 'dashboard', TRUE, TRUE, TRUE, TRUE, TRUE);
CALL assign_screen_permission('supervisor', 'student-list', TRUE, TRUE, TRUE, TRUE, TRUE);
CALL assign_screen_permission('supervisor', 'school-list', TRUE, TRUE, TRUE, TRUE, TRUE);
CALL assign_screen_permission('supervisor', 'company-list', TRUE, TRUE, TRUE, TRUE, TRUE);
CALL assign_screen_permission('supervisor', 'file-center', TRUE, TRUE, TRUE, TRUE, TRUE);
CALL assign_screen_permission('supervisor', 'ai-lab', TRUE, TRUE, TRUE, TRUE, TRUE);
CALL assign_screen_permission('supervisor', 'logs', FALSE, TRUE, FALSE, FALSE, FALSE);

CALL assign_screen_permission('student', 'dashboard', FALSE, TRUE, FALSE, FALSE, FALSE);
CALL assign_screen_permission('student', 'file-center', TRUE, TRUE, FALSE, FALSE, TRUE);
CALL assign_screen_permission('student', 'ai-lab', TRUE, TRUE, FALSE, FALSE, FALSE);

CALL assign_screen_permission('school', 'dashboard', FALSE, TRUE, FALSE, FALSE, FALSE);
CALL assign_screen_permission('school', 'student-list', TRUE, TRUE, TRUE, FALSE, TRUE);
CALL assign_screen_permission('school', 'file-center', TRUE, TRUE, FALSE, FALSE, TRUE);

CALL assign_screen_permission('company', 'dashboard', FALSE, TRUE, FALSE, FALSE, FALSE);
CALL assign_screen_permission('company', 'student-list', FALSE, TRUE, FALSE, FALSE, FALSE);
CALL assign_screen_permission('company', 'file-center', TRUE, TRUE, FALSE, FALSE, TRUE);

INSERT INTO panel_records(id, group_id, screen_id, title, value)
SELECT UUID(), g.id, s.id, 'Demo öğrenci kaydı', JSON_OBJECT('studentNo', '2026001', 'department', 'Bilgisayar Programcılığı', 'status', 'aktif')
FROM app_groups g
JOIN app_screens s ON s.code = 'student-list'
WHERE g.code = 'school'
AND NOT EXISTS (
    SELECT 1 FROM panel_records pr WHERE pr.title = 'Demo öğrenci kaydı'
);

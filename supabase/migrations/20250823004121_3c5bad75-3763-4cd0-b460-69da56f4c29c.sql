-- Create comprehensive permissions for all staff panel functionality

-- Application Management Permissions
INSERT INTO public.permissions (name, display_name, description, category) VALUES
('applications.view', 'View Applications', 'View all user applications', 'applications'),
('applications.create', 'Create Applications', 'Create new applications', 'applications'),
('applications.update', 'Update Applications', 'Update and review applications', 'applications'),
('applications.delete', 'Delete Applications', 'Delete applications', 'applications'),
('application_types.manage', 'Manage Application Types', 'Create and manage application types and forms', 'applications'),

-- Rules Management Permissions
('rules.view', 'View Rules', 'View server rules', 'rules'),
('rules.create', 'Create Rules', 'Create new rules', 'rules'),
('rules.update', 'Update Rules', 'Edit existing rules', 'rules'),
('rules.delete', 'Delete Rules', 'Delete rules', 'rules'),

-- Staff Management Permissions
('staff.view', 'View Staff', 'View staff members and roles', 'staff'),
('staff.promote', 'Promote Staff', 'Assign roles to users', 'staff'),
('staff.demote', 'Demote Staff', 'Remove staff roles from users', 'staff'),
('roles.create', 'Create Roles', 'Create new staff roles', 'staff'),
('roles.update', 'Update Roles', 'Edit existing roles', 'staff'),
('roles.delete', 'Delete Roles', 'Delete staff roles', 'staff'),
('permissions.manage', 'Manage Permissions', 'Assign permissions to roles', 'staff'),

-- User Management Permissions
('users.view', 'View Users', 'View all user profiles', 'users'),
('users.update', 'Update Users', 'Edit user profiles', 'users'),
('users.ban', 'Ban Users', 'Ban and unban users', 'users'),
('users.delete', 'Delete Users', 'Delete user accounts', 'users'),

-- Server Management Permissions
('server.settings', 'Server Settings', 'Manage server configuration', 'server'),
('server.stats', 'Server Stats', 'View and manage server statistics', 'server'),
('server.deployment', 'Deployment Settings', 'Manage deployment configuration', 'server'),

-- Security Permissions
('security.view', 'View Security', 'View security dashboard and logs', 'security'),
('security.settings', 'Security Settings', 'Manage security configuration', 'security'),
('security.ip_whitelist', 'IP Whitelist', 'Manage IP whitelist settings', 'security'),
('audit_logs.view', 'View Audit Logs', 'View system audit logs', 'security'),

-- Content Management Permissions
('content.homepage', 'Homepage Content', 'Manage homepage content', 'content'),
('content.design', 'Design Management', 'Manage site design and themes', 'content'),
('partners.manage', 'Manage Partners', 'Add and manage partners', 'content'),
('team.manage', 'Manage Team', 'Manage team member profiles', 'content'),
('streamers.manage', 'Manage Streamers', 'Manage Twitch streamers', 'content'),

-- Communication Permissions  
('email.templates', 'Email Templates', 'Manage email templates', 'communication'),
('email.send', 'Send Emails', 'Send emails to users', 'communication'),
('chat.manage', 'Live Chat Management', 'Manage live chat system', 'communication'),
('discord.manage', 'Discord Management', 'Manage Discord bot and logging', 'communication'),

-- Analytics Permissions
('analytics.view', 'View Analytics', 'View system analytics and reports', 'analytics'),
('logs.view', 'View Logs', 'View system logs', 'analytics'),
('reports.generate', 'Generate Reports', 'Generate system reports', 'analytics'),

-- System Administration Permissions
('system.maintenance', 'System Maintenance', 'Enable maintenance mode and system tasks', 'system'),
('system.functions', 'System Functions', 'Test and manage system functions', 'system'),
('system.database', 'Database Access', 'Direct database management access', 'system');
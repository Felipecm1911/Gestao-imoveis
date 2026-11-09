-- O e-mail passou a ser gravado e consultado já normalizado (Emails.normalize); lower() saiu da consulta.
DROP INDEX login_attempt_idx;
CREATE INDEX login_attempt_email_ip_idx ON login_attempt (email, ip, attempted_at);
CREATE INDEX login_attempt_email_idx ON login_attempt (email, attempted_at);

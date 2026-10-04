export const ISSUE_SQL = `INSERT INTO orders(seq,request_id,customer,memo,amount,created_at,code,local_seq)
SELECT COALESCE((SELECT MAX(seq) FROM orders),0)+1,?,?,?,?,?,s.code,
MAX(s.baseline,COALESCE((SELECT MAX(COALESCE(local_seq,seq)) FROM orders WHERE code=s.code),0))+1
FROM staff s WHERE s.code=? AND s.configured=1
AND MAX(s.baseline,COALESCE((SELECT MAX(COALESCE(local_seq,seq)) FROM orders WHERE code=s.code),0))<999999
ON CONFLICT(request_id) DO NOTHING`;
export const SET_NEXT_SQL = `UPDATE staff SET baseline=?,configured=1 WHERE code=?
AND ?>=MAX(baseline,COALESCE((SELECT MAX(COALESCE(local_seq,seq)) FROM orders WHERE code=staff.code),0))
RETURNING *`;
export const STAFF_SQL = `SELECT s.*,MAX(s.baseline,COALESCE((SELECT MAX(COALESCE(local_seq,seq)) FROM orders WHERE code=s.code),0))+1 AS next
FROM staff s ORDER BY s.code`;

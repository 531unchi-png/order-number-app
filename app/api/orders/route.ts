import {z} from "zod";
import {database} from "@/db/raw";
import {ISSUE_SQL} from "@/db/operations";
import {displayOrder,ensureStaff,errorResponse,originOK,responseHeaders} from "@/db/access";
const payloadSchema=z.object({requestId:z.string().regex(/^[a-zA-Z0-9-]{16,80}$/),code:z.string().regex(/^[0-9]{3}C$/),customer:z.string().max(100),memo:z.string().max(500),amount:z.number().int().min(0).max(999999999999).nullable()});
export async function GET(r:Request){
 try{const code=new URL(r.url).searchParams.get("code")??"411C";if(!/^[0-9]{3}C$/.test(code))return Response.json({error:"担当コードを確認してください"},{status:400});
 const rows=await database().prepare("SELECT * FROM orders WHERE code=? ORDER BY seq DESC").bind(code).all();
 return Response.json({orders:rows.results.map(displayOrder)},{headers:responseHeaders});
 }catch(e){return errorResponse(e);}
}
export async function POST(r:Request){
 if(!originOK(r))return Response.json({error:"操作を拒否しました"},{status:403});
 let input;try{input=await r.json();}catch{return Response.json({error:"入力内容を確認してください",notIssued:true},{status:400});}
 const parsed=payloadSchema.safeParse(input);if(!parsed.success)return Response.json({error:"入力内容を確認してください",notIssued:true},{status:400});
 try{
 const p=parsed.data;const db=database();await ensureStaff();
 await db.prepare(ISSUE_SQL).bind(p.requestId,p.customer.trim(),p.memo.trim(),p.amount,new Date().toISOString(),p.code).run();
 const row=await db.prepare("SELECT * FROM orders WHERE request_id=?").bind(p.requestId).first<Record<string,unknown>>();
 if(!row)return Response.json({error:"担当者が未登録・番号未設定、または連番の上限に達しています。管理者に確認してください。",notIssued:true},{status:409});
 if(row.code!==p.code)return Response.json({error:"前回の発番と担当者が異なります。履歴を確認してください。"},{status:409});
 return Response.json({order:displayOrder(row)},{headers:responseHeaders});
 }catch(e){return errorResponse(e);}
}
export async function PATCH(r:Request){
 if(!originOK(r))return Response.json({error:"操作を拒否しました"},{status:403});
 let input;try{input=await r.json();}catch{return Response.json({error:"番号を確認してください"},{status:400});}
 const parsed=z.object({seq:z.number().int().positive()}).safeParse(input);if(!parsed.success)return Response.json({error:"番号を確認してください"},{status:400});
 try{const row=await database().prepare("UPDATE orders SET cancelled_at=COALESCE(cancelled_at,?) WHERE seq=? RETURNING *").bind(new Date().toISOString(),parsed.data.seq).first<Record<string,unknown>>();
 if(!row)return Response.json({error:"番号が見つかりません"},{status:404});
 return Response.json({order:displayOrder(row)},{headers:responseHeaders});
 }catch(e){return errorResponse(e);}
}

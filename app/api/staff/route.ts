import {z} from "zod";
import {database} from "@/db/raw";
import {STAFF_SQL,SET_NEXT_SQL} from "@/db/operations";
import {isAdmin,ensureStaff,errorResponse,originOK,responseHeaders} from "@/db/access";
const schema=z.object({code:z.string().regex(/^[0-9]{3}C$/),name:z.string().trim().min(1).max(60),next:z.number().int().min(1).max(999999)});
export async function GET(r:Request){try{await ensureStaff();const rows=await database().prepare(STAFF_SQL).all();return Response.json({staff:rows.results,isAdmin:isAdmin(r)},{headers:responseHeaders});}catch(e){return errorResponse(e);}}
export async function POST(r:Request){
 if(!isAdmin(r)||!originOK(r))return Response.json({error:"担当者の登録は管理者だけが操作できます。"},{status:403});
 let input;try{input=await r.json();}catch{return Response.json({error:"入力を確認してください"},{status:400});}
 const parsed=schema.safeParse(input);if(!parsed.success)return Response.json({error:"担当コードは411Cのような数字3桁＋C、連番は1〜999999で入力してください。"},{status:400});
 try{const p=parsed.data;const result=await database().prepare("INSERT INTO staff(code,name,baseline,configured) VALUES (?,?,?,1) ON CONFLICT(code) DO NOTHING RETURNING *").bind(p.code,p.name,p.next-1).first();
 if(!result)return Response.json({error:"この担当コードは登録済みです。"},{status:409});
 return Response.json({staff:result},{headers:responseHeaders});
 }catch(e){return errorResponse(e);}
}
export async function PATCH(r:Request){
 if(!isAdmin(r)||!originOK(r))return Response.json({error:"番号の設定は管理者だけが操作できます。"},{status:403});
 let input;try{input=await r.json();}catch{return Response.json({error:"入力を確認してください"},{status:400});}
 const parsed=schema.pick({code:true,next:true}).safeParse(input);if(!parsed.success)return Response.json({error:"担当コードと次の連番（1〜999999）を確認してください。"},{status:400});
 try{const p=parsed.data;const row=await database().prepare(SET_NEXT_SQL).bind(p.next-1,p.code,p.next-1).first();
 if(!row)return Response.json({error:"発行済み・設定済みの番号より前には戻せません。ほかの端末で発行されていないか履歴を再確認してください。"},{status:409});
 return Response.json({staff:row},{headers:responseHeaders});
 }catch(e){return errorResponse(e);}
}

import {env} from "cloudflare:workers";
import {database} from "./raw";
export const responseHeaders={"Cache-Control":"no-store"};
export function isAdmin(r:Request){
 const configured=(env as unknown as Record<string,unknown>).ADMIN_EMAIL;
 const email=r.headers.get("oai-authenticated-user-email");
 return typeof configured==="string" && !!email && email.toLowerCase()===configured.toLowerCase();
}
export function originOK(r:Request){const origin=r.headers.get("origin");return !origin||origin===new URL(r.url).origin;}
export function errorResponse(e:unknown){console.error(e);return Response.json({error:"保存先に接続できません。通信を確認して再試行してください。"},{status:503,headers:responseHeaders});}
export async function ensureStaff(){await database().prepare("INSERT INTO staff(code,name,baseline,configured) VALUES ('411C','林部',0,0) ON CONFLICT(code) DO NOTHING").run();}
export function displayOrder(row:Record<string,unknown>){return {...row,ordinal:row.local_seq??row.seq};}

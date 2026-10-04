import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"注文番号発番｜試作品",description:"411C担当者用の注文番号発番",manifest:"/manifest.webmanifest",icons:{icon:"/favicon.svg",apple:"/icon-192.png"},appleWebApp:{capable:true,title:"注文番号",statusBarStyle:"default"}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ja"><body>{children}</body></html>}

"use client";
import Link from "next/link";
import Image from "next/image";
import {LogOut,Menu,X,Heart} from "lucide-react";
import {useState} from "react";
import {useAuth} from "@/components/AuthProvider";
export function SiteHeader(){
  const{user,signOut}=useAuth();
  const[open,setOpen]=useState(false);
  return <header className="site-header india-header"><div className="container nav">
    <Link href="/" className="brand india-brand"><span className="brand-mark"><Image src="/foodloop-mark.svg" alt="" width={46} height={46}/></span><span><b>FoodLoop</b><small>Food rescue · Feed people · Create impact</small></span></Link>
    <button className="mobile-menu" onClick={()=>setOpen(!open)} aria-label="Toggle navigation">{open?<X/>:<Menu/>}</button>
    <nav className={open?"nav-links show":"nav-links"}>
      <Link href="/#how-it-works">How it works</Link><Link href="/#promise">Our promise</Link><Link href="/#shloka">Our values</Link>
      {user?<><Link href="/dashboard" className="nav-strong">Dashboard</Link><Link href="/profile">Profile</Link><button className="nav-logout" onClick={()=>signOut()}><LogOut size={14}/> Sign out</button></>:<><Link href="/login">Log in</Link><Link href="/register" className="btn btn-nav"><Heart size={15}/> Join FoodLoop</Link></>}
    </nav>
  </div></header>;
}

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Heart, HeartHandshake, PackageCheck, ShieldCheck, Sparkles, Users, Utensils, HandHeart, PartyPopper, Quote, XCircle, Leaf } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { InteractiveExperiences } from "@/components/InteractiveExperiences";

const roles = [
  { icon: Utensils, title: "I have extra food", detail: "Restaurants, caterers & homes", href: "/register?role=donor", cta: "Share food" },
  { icon: HandHeart, title: "I serve my community", detail: "NGOs & community kitchens", href: "/register?role=ngo", cta: "Find food" },
  { icon: Users, title: "I can lend a hand", detail: "Volunteers & local helpers", href: "/register?role=volunteer", cta: "Volunteer" },
  { icon: PartyPopper, title: "I am celebrating", detail: "Weddings, events & gatherings", href: "/register?role=donor", cta: "Celebrate kindly" },
];

export default function Home() {
  return <>
    <SiteHeader />
    <main>
      <section className="indian-hero">
        <div className="hero-ornament hero-ornament-left">✺</div>
        <div className="container indian-hero-grid">
          <div className="indian-hero-copy">
            <div className="movement-tag"><span className="tag-dot"/> A FOOD-SHARING MOVEMENT FOR INDIA</div>
            <div className="sanskrit-kicker">अन्नं ब्रह्मेति व्यजानात्।</div>
            <div className="sanskrit-meaning">Food is sacred. Let it nourish, not go to waste.</div>
            <h1>Every extra meal<br/>can become <em>someone’s</em><br/>reason to smile.</h1>
            <p className="hero-english">A celebration leaves extra food. A kitchen prepares a little more. FoodLoop helps that food find a safe, caring journey to someone who can use it.</p>
            <div className="hero-cta-row">
              <Link className="btn btn-saffron" href="/register">Share a meal <Heart size={17} fill="currentColor"/> </Link>
              <Link className="btn btn-paper" href="/register?role=ngo">Join as an NGO <ArrowRight size={16}/></Link>
            </div>
            <div className="hero-note"><HeartHandshake size={20}/><span><b>Help with dignity. Change without the spectacle.</b><small>Every handover should be safe, respectful and accountable.</small></span></div>
          </div>
          <div className="indian-hero-photo">
            <Image src="/foodloop-community-meal.png" alt="Volunteers serving a freshly prepared community meal in India" fill priority sizes="(max-width: 800px) 100vw, 55vw" />
            <div className="photo-stamp"><span>ONE MEAL</span><b>MANY HOPES</b><small>SHARED WITH CARE</small></div>
            <div className="photo-caption"><Heart size={17} fill="currentColor"/> A meal shared is a little hope passed on.</div>
          </div>
        </div>
        <div className="hero-bottom container"><span>FOODLOOP · INDIA</span><span className="hero-bottom-line"/><span>WASTE LESS. FEED MORE. KEEP DIGNITY FIRST.</span></div>
      </section>

      <section className="promise-strip" id="promise">
        <div className="container promise-inner">
          <div><ShieldCheck/><span><b>Safe by intention</b><small>Only eligible, unserved food</small></span></div>
          <div><BadgeCheck/><span><b>Verified connections</b><small>People and partners we can trust</small></span></div>
          <div><PackageCheck/><span><b>Accountable handovers</b><small>Every step should be traceable</small></span></div>
          <div><HeartHandshake/><span><b>Dignity always</b><small>People are never a publicity prop</small></span></div>
        </div>
      </section>

      <section className="heart-story section container">
        <div className="story-heading">
          <div className="eyebrow warm-eyebrow">A SMALL THOUGHT. A BIG DIFFERENCE.</div>
          <h2>One table has<br/><em>more than enough.</em><br/>Another is waiting.</h2>
          <p>FoodLoop connects the two, thoughtfully. No grand speeches needed. Just a responsible way to move good food where it can do good.</p>
          <Link href="/register" className="story-link">Be part of this circle <ArrowRight size={17}/></Link>
        </div>
        <div className="quote-card">
          <div className="quote-flower">❋</div>
          <Quote size={30}/>
          <p>“A meal you may not need today could become the reason someone feels cared for today.”</p>
          <div className="quote-rule"/>
          <span>THE FOODLOOP PROMISE</span>
          <small>Share food. Share care. Never compromise dignity.</small>
        </div>
      </section>

      <section className="chaos-section">
        <div className="container">
          <div className="chaos-title">
            <div className="eyebrow">THE REALITY WE WANT TO CHANGE</div>
            <h2>Good food should never<br/><em>get lost in the chaos.</em></h2>
            <p>After a celebration, good food can be forgotten. Without planning, timing and a trusted handover, an opportunity disappears.</p>
          </div>
          <div className="chaos-grid">
            <article className="chaos-card chaos-before">
              <div className="chaos-symbol"><XCircle size={25}/></div>
              <div><span className="chaos-label">WHEN THERE IS NO PLAN</span><h3>The chaos we can avoid.</h3><ul><li>Extra food left without a safe collection plan</li><li>Confusion about who will pick it up</li><li>Late handovers and food that cannot be used</li><li>Good intentions with no proof of what happened</li></ul></div>
            </article>
            <div className="chaos-arrow"><ArrowRight size={26}/></div>
            <article className="chaos-card chaos-after">
              <div className="chaos-symbol"><Heart size={25}/></div>
              <div><span className="chaos-label">WHEN WE PLAN TOGETHER</span><h3>The change we can create.</h3><ul><li>Food listed while it is still suitable</li><li>A verified NGO or community partner matched</li><li>Pickup and handover clearly confirmed</li><li>Impact recorded with care and accountability</li></ul></div>
            </article>
          </div>
          <div className="handover-photo">
            <Image src="/foodloop-handover.png" alt="A team member handing safely packed meals to a community volunteer" fill sizes="100vw" />
            <div><span>THE MOMENT THAT MATTERS</span><b>From “extra food”<br/>to “someone’s meal.”</b></div>
          </div>
          <p className="safety-footnote">FoodLoop is for eligible, unserved surplus food. Safe handling, storage, transport and consumption timelines remain essential at every step.</p>
        </div>
      </section>

      <InteractiveExperiences />

      <section className="join-section-india">
        <div className="container join-india-inner">
          <div className="join-india-heading"><div className="eyebrow">THERE IS A PLACE FOR YOU</div><h2>Your small action.<br/><em>Someone’s brighter day.</em></h2><p>FoodLoop works when donors, NGOs, volunteers and event hosts work together.</p></div>
          <div className="role-cards">
            {roles.map(({icon: Icon,title,detail,href,cta})=><Link href={href} className="role-card" key={title}><span className="role-icon"><Icon/></span><b>{title}</b><small>{detail}</small><span className="role-cta">{cta} <ArrowRight size={14}/></span></Link>)}
          </div>
        </div>
      </section>

      <section className="shloka-section" id="shloka">
        <div className="container shloka-inner">
          <div className="shloka-lotus">❋</div>
          <div className="eyebrow light-eyebrow">AN ANCIENT THOUGHT. A LIVING PROMISE.</div>
          <p className="shloka-text">अन्नं न निन्द्यात्। तद्व्रतम्।</p>
          <h2>Food is not ordinary.<br/><em>It deserves respect.</em></h2>
          <p className="shloka-translation">“Do not disrespect food. This is the vow.”</p>
          <small>तैत्तिरीयोपनिषद् · भृगुवल्ली ३.७</small>
          <div className="shloka-divider"/>
          <p className="shloka-closing">Let every meal be treated with care.</p>
        </div>
      </section>

      <section className="closing-india">
        <div className="container closing-india-inner">
          <div className="closing-heart"><HeartHandshake size={36}/></div>
          <div className="eyebrow">ONE COMMUNITY. MANY KIND ACTS.</div>
          <h2>Let’s make sharing<br/><em>a reason to be proud.</em></h2>
          <p>Let’s build an India where responsible contribution becomes a mark of reputation, recognition and social pride.</p>
          <Link href="/register" className="btn btn-saffron">Join the FoodLoop movement <ArrowRight size={17}/></Link>
        </div>
      </section>
    </main>
    <footer className="footer india-footer"><div className="container footer-inner">
      <Link href="/" className="brand"><span className="brand-mark"><Image src="/foodloop-mark.svg" alt="" width={38} height={38}/></span><span>Food<span>Loop</span></span></Link>
      <p>Respect food. Respect people.</p>
      <div><Link href="/login">Log in</Link><Link href="/register">Join FoodLoop</Link><Link href="/#how-it-works">How it works</Link></div>
      <small>© 2026 FoodLoop · Built with care in India.</small>
    </div></footer>
  </>;
}

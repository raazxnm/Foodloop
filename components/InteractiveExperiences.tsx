"use client";
import {useState} from "react";
import {ArrowRight,Clock,Heart,MapPin,PackageCheck,ShieldCheck,Users,Utensils,CheckCircle2,Sparkles} from "lucide-react";

const stages = [
  {title:"A little extra",label:"01 · THE MOMENT",icon:Utensils,heading:"A celebration ends. The care doesn't.",body:"A restaurant, family or event host has eligible surplus food. They list what is available, where it is, and the safe collection window.",note:"The first promise: list only food that is safe and suitable to share.",color:"saffron"},
  {title:"A trusted match",label:"02 · THE CONNECTION",icon:Users,heading:"The right local partner steps in.",body:"A verified NGO or community kitchen reviews the listing and requests the food based on its capacity, location and ability to collect it in time.",note:"No random handoffs. A clear request and a responsible partner.",color:"green"},
  {title:"A safe handover",label:"03 · THE HANDOVER",icon:PackageCheck,heading:"The journey is completed with care.",body:"The donor and receiving partner coordinate pickup. The handover is confirmed and recorded so the contribution can be accounted for.",note:"Food safety, dignity and traceability come before recognition.",color:"rose"},
  {title:"A lasting record",label:"04 · THE IMPACT",icon:Sparkles,heading:"Good work becomes a trusted reputation.",body:"Verified activity contributes to a transparent impact record. Consistency, reliability and responsible practices matter more than simply claiming a large quantity.",note:"Recognition is earned through verified action. It is never for sale.",color:"gold"}
];

export function InteractiveExperiences(){
 const [stage,setStage]=useState(0);
 const [portions,setPortions]=useState(50);
 const current=stages[stage];
 const Icon=current.icon;
 return <div className="experience-wrap">
  <section className="meal-journey-section" id="how-it-works">
   <div className="container">
    <div className="experience-heading">
     <div className="eyebrow warm-eyebrow">DON&apos;T JUST READ ABOUT IT. FOLLOW THE JOURNEY.</div>
     <h2>One meal. Four moments.<br/><em>A chain of care.</em></h2>
     <p>Explore how a surplus meal can move from a kitchen to a community through a safer, more thoughtful process.</p>
    </div>
    <div className="journey-interactive">
     <div className="journey-tabs" role="tablist" aria-label="Meal journey stages">
      {stages.map((item,i)=><button key={item.title} className={stage===i?"journey-tab active":"journey-tab"} onClick={()=>setStage(i)} role="tab" aria-selected={stage===i}>
       <span className="tab-number">0{i+1}</span><span>{item.title}</span><ArrowRight size={15}/>
      </button>)}
     </div>
     <article className={`journey-feature journey-${current.color}`} key={stage}>
      <div className="journey-feature-art">
       <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
       <div className="feature-icon"><Icon size={48}/></div>
       <span className="floating-dot dot-a"/><span className="floating-dot dot-b"/><span className="floating-dot dot-c"/>
       <div className="feature-label">{current.label}</div>
      </div>
      <div className="journey-feature-copy">
       <div className="eyebrow">THE FOODLOOP JOURNEY</div>
       <h3>{current.heading}</h3><p>{current.body}</p>
       <div className="journey-note"><ShieldCheck size={19}/><span>{current.note}</span></div>
       <div className="journey-controls"><button className="journey-next" onClick={()=>setStage((stage+1)%stages.length)}>{stage===3?"Replay the journey":"Next moment"} <ArrowRight size={16}/></button><span>{String(stage+1).padStart(2,"0")} / 04</span></div>
      </div>
     </article>
     <div className="journey-progress"><span style={{width:`${(stage+1)*25}%`}}/></div>
    </div>
   </div>
  </section>

  <section className="rescue-studio">
   <div className="container rescue-studio-grid">
    <div className="rescue-studio-copy">
     <div className="eyebrow light-eyebrow">THE LITTLE WHAT-IF STUDIO</div>
     <h2>What could your<br/><em>extra food become?</em></h2>
     <p>Move the slider to imagine a sharing plan. This is an illustrative estimate, not a live FoodLoop impact counter. Actual servings depend on portion size, food suitability and safe handling.</p>
     <label className="portion-label" htmlFor="portion-slider">Potential portions <strong>{portions}</strong></label>
     <input id="portion-slider" className="portion-slider" type="range" min="10" max="200" step="5" value={portions} onChange={e=>setPortions(Number(e.target.value))}/>
     <div className="slider-ends"><span>10 portions</span><span>200 portions</span></div>
     <div className="studio-checks"><span><CheckCircle2/> Listed with clear details</span><span><CheckCircle2/> Matched with a verified partner</span><span><CheckCircle2/> Collected within a safe window</span></div>
    </div>
    <div className="portion-visual">
     <div className="plate-glow"/><div className="plate"><div className="plate-inner"><span className="plate-rice">✦</span><span className="plate-leaf">❋</span><span className="plate-dal">●</span></div></div>
     <div className="portion-number"><strong>{portions}</strong><span>possible portions</span></div>
     <div className="studio-caption"><Heart size={16} fill="currentColor"/> An estimate is a starting point. A safe handover makes it meaningful.</div>
    </div>
   </div>
  </section>
 </div>;
}

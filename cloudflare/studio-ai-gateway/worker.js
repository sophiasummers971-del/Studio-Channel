const SUPABASE_URL="https://qzqlwbzvzjaxzdrhamow.supabase.co";
const SUPABASE_KEY="sb_publishable_pzZ1zRYUncUJJp_A_odQfA_AI_mLd3k";
const MODEL="@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});

const itemSchema={
  type:"object",
  additionalProperties:false,
  properties:{
    title:{type:"string"},
    caption:{type:"string"},
    hashtags:{type:"array",items:{type:"string"}},
    script:{type:"string"},
    visualDirection:{type:"string"},
    thumbnailConcept:{type:"string"},
    postingTime:{type:"string"},
    estimatedReach:{type:"string"},
    pinTitle:{type:"string"},
    pinDescription:{type:"string"},
    boardName:{type:"string"},
    altText:{type:"string"}
  },
  required:["title","caption","hashtags","script","visualDirection","thumbnailConcept","postingTime","estimatedReach","pinTitle","pinDescription","boardName","altText"]
};

async function requireOperator(r){
  const a=r.headers.get("authorization")||"";
  if(!/^Bearer\s+.+/i.test(a)) throw Object.assign(new Error("Authentication required"),{status:401});
  const u=await fetch(SUPABASE_URL+"/auth/v1/user",{headers:{authorization:a,apikey:SUPABASE_KEY}});
  if(!u.ok) throw Object.assign(new Error("Invalid or expired session"),{status:401});
  const user=await u.json();
  const o=await fetch(SUPABASE_URL+"/rest/v1/studio_operators?select=user_id&user_id=eq."+encodeURIComponent(user.id),{headers:{authorization:a,apikey:SUPABASE_KEY,accept:"application/json"}});
  if(!o.ok) throw Object.assign(new Error("Operator verification failed"),{status:502});
  const rows=await o.json();
  if(!Array.isArray(rows)||rows.length!==1) throw Object.assign(new Error("Studio operator access required"),{status:403});
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(request.method!=="POST"||url.pathname!=="/generate") return json({error:"Not found"},404);
    try{
      await requireOperator(request);
      const b=await request.json();
      const platform=String(b.platform||"").trim().toLowerCase();
      const topic=String(b.topic||"").trim();
      const niche=String(b.niche||"general").trim();
      const tone=String(b.tone||"professional").trim();
      const audience=String(b.audience||"general audience").trim();
      const count=Math.min(10,Math.max(1,Number(b.count)||3));
      if(!platform||!topic) return json({error:"platform and topic are required"},400);

      const responseSchema={
        type:"object",
        additionalProperties:false,
        properties:{items:{type:"array",minItems:count,maxItems:count,items:itemSchema}},
        required:["items"]
      };

      const system=[
        "You are Channel Studio's social content generator.",
        "Create platform-ready content for "+platform+".",
        "Niche: "+niche+". Tone: "+tone+".",
        "Keep claims grounded and do not fabricate statistics.",
        "For Pinterest, make pinTitle, pinDescription, boardName, altText, visualDirection and thumbnailConcept useful and specific.",
        "Use empty strings only for fields that are truly irrelevant.",
        "Return exactly "+count+" items."
      ].join("\n");

      const prompt=[
        "Generate exactly "+count+" distinct pieces about: "+topic,
        "Audience: "+audience,
        "Each piece must use a different angle and hook."
      ].join("\n");

      const ai=await env.AI.run(MODEL,{
        messages:[{role:"system",content:system},{role:"user",content:prompt}],
        max_tokens:6000,
        response_format:{type:"json_schema",json_schema:responseSchema}
      });

      let parsed=null;
      if(ai && typeof ai==="object"){
        if(Array.isArray(ai.items)){
          parsed=ai;
        }else if(ai.response && typeof ai.response==="object"){
          parsed=ai.response;
        }else if(typeof ai.response==="string"){
          try{parsed=JSON.parse(ai.response)}catch{}
        }
      }else if(typeof ai==="string"){
        try{parsed=JSON.parse(ai)}catch{}
      }
      if(!parsed){
        return json({error:"Workers AI returned invalid structured content"},502);
      }

      const items=Array.isArray(parsed?.items)?parsed.items:[];
      if(items.length!==count) return json({error:"Workers AI returned "+items.length+" of "+count+" requested items"},502);

      return json({items,model:MODEL,platform,provider:"cloudflare-workers-ai"});
    }catch(e){
      return json({error:e?.message||"AI gateway error"},Number(e?.status)||500);
    }
  }
};
export default async function handler(req,res){
  const {message,model,persona,memory}=req.body;

  let system="You are a helpful AI.";
  if(persona==="coder") system="You are a senior software engineer.";
  if(persona==="teacher") system="You explain step by step.";
  if(persona==="researcher") system="You cite facts concisely.";

  try{

    // IMAGE
    if(model==="image"){
      return res.json({
        reply:"Image generated",
        image:`https://image.pollinations.ai/prompt/${encodeURIComponent(message)}`
      });
    }

    // GROQ
    if(model==="groq"){
      const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{
          Authorization:`Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          model:"llama-3.1-70b-versatile",
          messages:[
            {role:"system",content:system},
            ...memory.map(m=>({role:"user",content:m.q})),
            {role:"user",content:message}
          ]
        })
      });
      const j=await r.json();
      return res.json({reply:j.choices[0].message.content});
    }

    // GEMINI
    const r=await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          contents:[{parts:[{text:system+"\n"+message}]}]
        })
      }
    );
    const j=await r.json();
    res.json({reply:j.candidates[0].content.parts[0].text});

  }catch(e){
    res.json({reply:"Error: "+e.message});
  }
}

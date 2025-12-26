const memory = new Map();

export default async function handler(req,res){
  const { model, message, imageBase64, sessionId } = req.body;
  const history = memory.get(sessionId)||[];
  if(message) history.push({role:"user",content:message});
  memory.set(sessionId, history.slice(-20));

  try {

    // GROQ
    if(model==="groq"){
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{
          "Authorization":`Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          model:"llama-3.1-70b-versatile",
          messages:history
        })
      });
      const j = await r.json();
      return res.json({reply:j.choices[0].message.content});
    }

    // GEMINI
    if(model==="gemini"){
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        { method:"POST", headers:{ "Content-Type":"application/json" },
          body:JSON.stringify({ contents:[{parts:[{text:message}]}] })
        }
      );
      const j = await r.json();
      return res.json({reply:j.candidates[0].content.parts[0].text});
    }

    // OCR
    if(model==="ocr"){
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${process.env.GEMINI_API_KEY}`,
        { method:"POST", headers:{ "Content-Type":"application/json" },
          body:JSON.stringify({
            contents:[{parts:[
              {inline_data:{mime_type:"image/png",data:imageBase64}},
              {text:"Extract text"}
            ]}]
          })
        }
      );
      const j = await r.json();
      return res.json({reply:j.candidates[0].content.parts[0].text});
    }

    // SEARCH
    if(model==="search"){
      const q=encodeURIComponent(message);
      const r=await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_KEY}&cx=${process.env.GOOGLE_SEARCH_CX}&q=${q}`
      );
      const j=await r.json();
      const txt=j.items.map(i=>`• ${i.title}\n${i.snippet}`).join("\n\n");
      return res.json({reply:txt});
    }

    // IMAGE / VIDEO
    if(model==="image") return res.json({image:`https://image.pollinations.ai/prompt/${encodeURIComponent(message)}`});
    if(model==="video") return res.json({video:`https://video.pollinations.ai/prompt/${encodeURIComponent(message)}`});

    res.json({reply:"Unknown model"});

  } catch(e){
    res.status(500).json({reply:"Error: "+e.message});
  }
}

# from fastapi import FastAPI, Request
# from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
# import torch

# app = FastAPI()

# # Load LLaMA model (use a small one like 7B)
# model_name = "meta-llama/Llama-2-7b-chat-hf"  # needs HF auth
# tokenizer = AutoTokenizer.from_pretrained(model_name)
# model = AutoModelForCausalLM.from_pretrained(
#     model_name,
#     torch_dtype=torch.float16,
#     device_map="auto"
# )

# generator = pipeline("text-generation", model=model, tokenizer=tokenizer)

# @app.post("/suggest_stocks")
# async def suggest_stocks(request: Request):
#     data = await request.json()
#     tables = data.get("tables", [])

#     # Convert scraped table into a readable prompt
#     table_text = ""
#     for t in tables:
#         table_text += f"\nTable {t['tableIndex']}:\n"
#         for row in t["rows"][:10]:  # only first 10 rows
#             table_text += ", ".join([f"{k}: {v}" for k, v in row.items()]) + "\n"

#     prompt = f"""
#     You are a financial assistant. Based on this stock table:

#     {table_text}

#     Suggest 3 stocks that look promising for investment and explain why.
#     """

#     output = generator(prompt, max_length=300, num_return_sequences=1)[0]["generated_text"]

#     return {"suggestions": output}

from fastapi import FastAPI, Request
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
from fastapi.middleware.cors import CORSMiddleware  
import torch

app = FastAPI()
# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict to ["http://localhost:3000", "chrome-extension://<EXTENSION_ID>"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Lightweight alternative model
model_name = "google/flan-t5-base"  

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    
)
print("Model loaded successfully")

generator = pipeline("text2text-generation", model=model, tokenizer=tokenizer)

def compact_tables(tables, keep_rows=25, keep_cols=None, per_field_chars=40):
    lines = []
    for t in tables:
        rows = (t or {}).get("rows", [])[:keep_rows]
        for r in rows:
            # drop empty keys like "" or "Column13"
            r = {k: v for k, v in r.items() if k and v and k != "Column13"}
            if keep_cols:
                r = {k: r[k] for k in keep_cols if k in r}
            parts = [f"{k}: {str(v)[:per_field_chars]}" for k, v in r.items()]
            if parts:
                lines.append(" | ".join(parts))
    return "\n".join(lines)

@app.post("/suggest_stocks")
async def suggest_stocks(request: Request):
    try:
        print("Hello")
        data = await request.json()
        print("Received data:", data)  # Debugging line
    except Exception:
        return {"success": False, "error": "Invalid JSON input"}

    tables = data.get("tables", [])
    if not tables:
        return {"success": False, "error": "No tables provided"}

    # Convert scraped table into prompt
    table_text = ""
    for t in tables:
        table_text += f"\nTable {t.get('tableIndex', '?')}:\n"
        for row in t.get("rows", [])[:10]:
            row_text = ", ".join([f"{k}: {v}" for k, v in row.items()])
            table_text += row_text + "\n"

    prompt = f"""
    You are a financial assistant. Based on this stock table:

    {table_text}

    Suggest 3 stocks that look promising for investment and explain why.
    """

    try:
        output = generator(
        prompt, 
        max_length=256, 
        num_return_sequences=1
        )[0]["generated_text"]

    # --- 🔹 Extract unique stock tickers/names ---
    # Split by commas or newlines
        parts = [p.strip() for p in output.split(",") if p.strip()]
    
    # Deduplicate while preserving order
        seen = set()
        unique_parts = []
        for p in parts:
            if p not in seen:
                seen.add(p)
                unique_parts.append(p)

        cleaned_output = ", ".join(unique_parts[:5])  # limit to 3–5 unique suggestions

        return {"success": True, "suggestions": cleaned_output}

    except Exception as e:
        return {"success": False, "error": str(e)}

def get_stock_suggestions(text: str):
    # Example: your model or logic outputs suggestions
    raw_suggestions = [
        "GOOG Alphabet Inc.",
        "TSLA Tesla, Inc.",
        "AVGO Broadcom Inc.",
        "BRK.A Berkshire Hathaway Inc.",
        "YTD Capital",
        "YTD Capital Markets",
        "YTD Capital Markets",
        "YTD Capital Markets",
    ]

    # ✅ keep only unique while preserving order
    seen = set()
    unique_suggestions = []
    for s in raw_suggestions:
        if s not in seen:
            seen.add(s)
            unique_suggestions.append(s)

    return {"success": True, "suggestions": unique_suggestions}

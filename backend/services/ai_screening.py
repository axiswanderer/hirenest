import os
import json
import pdfplumber
import anthropic


def extract_pdf_text(file_path: str) -> str:
    with pdfplumber.open(file_path) as pdf:
        pages = [page.extract_text() or "" for page in pdf.pages]
    return "\n".join(pages).strip()


def screen_resume(resume_text: str, job_title: str, job_description: str) -> dict:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY is not set")

    client = anthropic.Anthropic(api_key=api_key)

    prompt = f"""You are an expert recruiter. Analyze the resume below against the job description.

Job Title: {job_title}
Job Description:
{job_description}

Resume:
{resume_text[:8000]}

Respond with ONLY a valid JSON object (no markdown, no explanation) with exactly these keys:
- "score": integer from 1 to 10
- "strengths": array of 3 short strings describing key strengths
- "gaps": array of up to 3 short strings describing gaps or concerns (can be empty)
- "recommendation": one sentence summarising your hiring recommendation"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    # Strip markdown fences if model added them
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())

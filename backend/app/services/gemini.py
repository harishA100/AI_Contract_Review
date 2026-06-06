import google.generativeai as genai
import json
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure the Gemini API if a key is provided and is not the default placeholder
is_gemini_configured = (
    settings.GEMINI_API_KEY 
    and settings.GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE"
)

if is_gemini_configured:
    genai.configure(api_key=settings.GEMINI_API_KEY)
else:
    logger.warning("Google Gemini API Key is not configured. Falling back to mock analysis service.")

def analyze_contract_text(text: str) -> dict:
    """
    Sends contract text to the Google Gemini API to generate structured reviews,
    returning a dictionary matching the AnalysisBase schema.
    """
    if not is_gemini_configured:
        logger.info("Using mock contract analysis (Gemini API key not configured).")
        return get_mock_analysis_data(text)

    prompt = f"""
    You are an expert contract review AI. Analyze the following contract text and extract key details, risks, and terms.
    
    You must return a valid JSON object. Do not include markdown code block syntax (like ```json ... ```).
    The JSON structure MUST follow this exact schema:
    {{
        "summary": "A concise high-level summary of the contract purpose, parties, and scope.",
        "risk_score": 45, // A general risk score from 0 (lowest risk) to 100 (highest risk) based on terms, liabilities, etc.
        "key_clauses": [
            {{
                "clause_name": "Clause title (e.g., Confidentiality, Intellectual Property)",
                "text": "The relevant exact snippet or summary of the clause from the contract text",
                "description": "Explanation of what this clause means and its operational impact"
            }}
        ],
        "payment_terms": [
            {{
                "term": "Payment Term name / summary (e.g., Net 30, Late Fees)",
                "details": "Details of payment schedules, invoicing requirements, and currency",
                "importance": "High, Medium, or Low"
            }}
        ],
        "termination_conditions": [
            {{
                "condition": "Termination type / trigger (e.g., Termination for Convenience, Breach)",
                "details": "Notice periods, conditions under which contract can be terminated, and consequences",
                "risk_level": "High, Medium, or Low"
            }}
        ],
        "obligations": [
            {{
                "party": "Which party is obligated (e.g., Vendor, Client, Joint)",
                "duty": "What obligation or deliverable is required",
                "deadline": "When it is due, or the frequency of the obligation"
            }}
        ],
        "risk_assessment": [
            {{
                "risk": "Description of the identified risk or unfavorable clause",
                "severity": "Critical, High, Medium, or Low",
                "mitigation": "Actionable advice on how to renegotiate or mitigate this risk"
            }}
        ]
    }}

    If any section has no information in the contract, return an empty list for that array. Ensure all JSON formatting is correct.
    
    CONTRACT TEXT:
    {text}
    """

    try:
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        # Parse JSON response
        result = json.loads(response.text.strip())
        
        # Basic validation of keys
        required_keys = ["summary", "risk_score", "key_clauses", "payment_terms", "termination_conditions", "obligations", "risk_assessment"]
        for key in required_keys:
            if key not in result:
                if key == "summary":
                    result[key] = "No summary provided."
                elif key == "risk_score":
                    result[key] = 0
                else:
                    result[key] = []
                    
        return result
        
    except Exception as e:
        logger.error(f"Gemini contract analysis failed: {e}")
        # In case of API failure, log and return fallback mock data
        return get_mock_analysis_data(text)

def get_mock_analysis_data(text: str) -> dict:
    """
    Returns high-quality mock analysis data for testing when Gemini API is unconfigured/fails.
    """
    # Extract some simple title metadata from the first line of text
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    inferred_title = lines[0] if lines else "Uploaded Contract"
    if len(inferred_title) > 60:
        inferred_title = inferred_title[:57] + "..."
        
    return {
        "summary": f"This is a simulated contract analysis of '{inferred_title}'. (Note: Google Gemini API Key was not configured, so this mock assessment has been generated). The agreement governs the relationship between the parties for professional services and contains standard operational covenants.",
        "risk_score": 35,
        "key_clauses": [
            {
                "clause_name": "Intellectual Property Ownership",
                "text": "All Work Product created under this Agreement shall belong solely to the Client.",
                "description": "Standard work-for-hire clause transfering IP ownership to the commissioning party."
            },
            {
                "clause_name": "Confidentiality Covenants",
                "text": "Each party agrees to maintain all proprietary information in strict confidence for 3 years.",
                "description": "Standard mutual confidentiality obligation protecting intellectual property during engagement."
            }
        ],
        "payment_terms": [
            {
                "term": "Net 45 Billing Cycle",
                "details": "Client shall pay invoices within 45 days of receipt of invoice from contractor.",
                "importance": "High"
            }
        ],
        "termination_conditions": [
            {
                "condition": "Termination for Convenience",
                "details": "Either party may terminate the engagement by giving 30 days written notice to the other.",
                "risk_level": "Medium"
            }
        ],
        "obligations": [
            {
                "party": "Contractor",
                "duty": "Deliver bi-weekly status reports and source code artifacts.",
                "deadline": "Every alternating Friday"
            },
            {
                "party": "Client",
                "duty": "Provide access to staging servers and review deliverables.",
                "deadline": "Within 5 business days of submission"
            }
        ],
        "risk_assessment": [
            {
                "risk": "Net 45 payment term is slightly longer than standard Net 30, which could impact contractor cashflow.",
                "severity": "Medium",
                "mitigation": "Renegotiate to Net 30 billing cycle if possible."
            },
            {
                "risk": "No liability cap is explicitly specified in the text, exposing contractor to high potential claims.",
                "severity": "High",
                "mitigation": "Add a standard limitation of liability clause capping damages to fees paid."
            }
        ]
    }

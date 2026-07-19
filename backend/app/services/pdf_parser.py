import fitz  # PyMuPDF
from fastapi import HTTPException, status

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """
    Extracts raw text content from PDF binary data.
    """
    try:
        # Open PDF document from in-memory bytes stream
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        
        cleaned_text = text.strip()
        if not cleaned_text:
            raise ValueError("No text could be extracted from this PDF. It might be empty or scanned/image-only.")
        return cleaned_text
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse PDF file: {str(e)}"
        )

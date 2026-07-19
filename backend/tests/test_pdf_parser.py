from unittest.mock import MagicMock, patch
import pytest
from fastapi import HTTPException
from app.services.pdf_parser import extract_text_from_pdf_bytes

def test_extract_text_from_pdf_bytes_success():
    """Test successful text extraction from PDF bytes."""
    mock_doc = MagicMock()
    mock_page = MagicMock()
    mock_page.get_text.return_value = "Python Developer Experience"
    mock_doc.__iter__.return_value = [mock_page]
    
    with patch("fitz.open", return_value=mock_doc) as mock_open:
        text = extract_text_from_pdf_bytes(b"dummy_pdf_bytes")
        assert text == "Python Developer Experience"
        mock_open.assert_called_once_with(stream=b"dummy_pdf_bytes", filetype="pdf")
        mock_doc.close.assert_called_once()

def test_extract_text_from_pdf_bytes_empty():
    """Test that empty or non-text PDFs raise a 422 error."""
    mock_doc = MagicMock()
    mock_page = MagicMock()
    mock_page.get_text.return_value = "   "
    mock_doc.__iter__.return_value = [mock_page]
    
    with patch("fitz.open", return_value=mock_doc):
        with pytest.raises(HTTPException) as exc_info:
            extract_text_from_pdf_bytes(b"dummy_pdf_bytes")
        assert exc_info.value.status_code == 422
        assert "empty or scanned" in exc_info.value.detail

def test_extract_text_from_pdf_bytes_failure():
    """Test that general PDF opening exceptions are handled gracefully."""
    with patch("fitz.open", side_effect=Exception("Failed to open file")):
        with pytest.raises(HTTPException) as exc_info:
            extract_text_from_pdf_bytes(b"dummy_pdf_bytes")
        assert exc_info.value.status_code == 422
        assert "Failed to parse PDF file" in exc_info.value.detail

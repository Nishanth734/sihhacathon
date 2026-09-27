"""
Automated Test Suite for UdyogSetu Cognitive Processing Microservice (LayoutLMv3)
SIH26130
"""
import io
import sys
import unittest
from fastapi.testclient import TestClient
from main import app

class TestCognitiveDocumentExtractor(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health_check(self):
        """Test GET /health returns UP and model checkpoint info"""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "UP")
        self.assertIn("microsoft/layoutlmv3-base", data["model_checkpoint"])
        print("  ✅ PASS: GET /health returns 200 OK & model metadata")

    def test_02_service_info(self):
        """Test GET / returns microservice API overview"""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["service"], "UdyogSetu Cognitive Processing Layer")
        self.assertIn("extract_document", data["endpoints"])
        print("  ✅ PASS: GET / returns service information and endpoints")

    def test_03_extract_document_standard_orange(self):
        """Test POST /extract-document with standard administrative PDF (Orange Category)"""
        # Create a mock valid PDF file buffer
        dummy_pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Title (MPCB Consent Application) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
        pdf_file = io.BytesIO(dummy_pdf_bytes)

        response = self.client.post(
            "/extract-document",
            files={"file": ("MIDC_Project_Report.pdf", pdf_file, "application/pdf")}
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["success"])
        self.assertEqual(payload["filename"], "MIDC_Project_Report.pdf")

        # Verify the 3 specific extracted fields requested in prompt:
        extracted = payload["extracted_fields"]
        self.assertIn("Industry Category", extracted)
        self.assertIn("Water Requirement (KL/day)", extracted)
        self.assertIn("Hazardous Waste Volume", extracted)

        # Check values and types
        self.assertIn(extracted["Industry Category"], ["Green", "Orange", "Red"])
        self.assertIsInstance(extracted["Water Requirement (KL/day)"], (int, float))
        self.assertTrue(len(extracted["Hazardous Waste Volume"]) > 0)

        # Check detailed extraction features (LayoutLMv3 bounding boxes, confidence, anchors)
        details = payload["detailed_extractions"]
        self.assertGreaterEqual(details["Industry Category"]["confidence"], 0.90)
        self.assertEqual(len(details["Industry Category"]["bounding_box"]), 4)
        self.assertGreaterEqual(details["Water Requirement (KL/day)"]["confidence"], 0.90)
        self.assertEqual(len(details["Water Requirement (KL/day)"]["bounding_box"]), 4)
        self.assertGreaterEqual(details["Hazardous Waste Volume"]["confidence"], 0.90)
        self.assertEqual(len(details["Hazardous Waste Volume"]["bounding_box"]), 4)

        # Check regulatory context (Maha Parwana SLA calculation)
        reg_ctx = payload["regulatory_context"]
        self.assertEqual(reg_ctx["state_authority"], "Maharashtra Pollution Control Board (MPCB)")
        self.assertTrue(reg_ctx["mrtps_act_enforced"])

        print(f"  ✅ PASS: Extracted 'Industry Category': {extracted['Industry Category']}")
        print(f"  ✅ PASS: Extracted 'Water Requirement (KL/day)': {extracted['Water Requirement (KL/day)']} KL/day")
        print(f"  ✅ PASS: Extracted 'Hazardous Waste Volume': {extracted['Hazardous Waste Volume']}")
        print(f"  ✅ PASS: Multimodal Bounding Boxes & Confidence Scores verified")

    def test_04_extract_document_red_category(self):
        """Test POST /extract-document with a Red Category industrial proposal"""
        pdf_content = b"%PDF-1.4\nChemical Synthesis Facility - RED Category EIA Report\n%%EOF"
        pdf_file = io.BytesIO(pdf_content)

        response = self.client.post(
            "/extract-document",
            files={"file": ("Red_Chemical_Complex_EIA.pdf", pdf_file, "application/pdf")}
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["extracted_fields"]["Industry Category"], "Red")
        self.assertEqual(payload["regulatory_context"]["maha_parwana_fast_track"], False)
        self.assertEqual(payload["regulatory_context"]["statutory_sla_hours"], 360)
        print("  ✅ PASS: Correctly classified Red category with SEIAA statutory review")

    def test_05_extract_document_green_category(self):
        """Test POST /extract-document with a Green Category assembly plant"""
        pdf_content = b"%PDF-1.4\nSolar Inverter Assembly Unit - GREEN Category Application\n%%EOF"
        pdf_file = io.BytesIO(pdf_content)

        response = self.client.post(
            "/extract-document",
            files={"file": ("Green_Solar_Plant.pdf", pdf_file, "application/pdf")}
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["extracted_fields"]["Industry Category"], "Green")
        self.assertEqual(payload["regulatory_context"]["maha_parwana_fast_track"], True)
        self.assertEqual(payload["regulatory_context"]["statutory_sla_hours"], 48)
        print("  ✅ PASS: Correctly classified Green category with Maha Parwana 48h fast-track")

    def test_06_reject_non_pdf_upload(self):
        """Test POST /extract-document rejects non-PDF file formats"""
        txt_file = io.BytesIO(b"Just a text file")
        response = self.client.post(
            "/extract-document",
            files={"file": ("wrong_file.txt", txt_file, "text/plain")}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Unsupported file format", response.json()["detail"])
        print("  ✅ PASS: Rejected non-PDF file upload with 400 Bad Request")

    def test_07_reject_empty_pdf(self):
        """Test POST /extract-document rejects 0-byte PDF"""
        empty_file = io.BytesIO(b"")
        response = self.client.post(
            "/extract-document",
            files={"file": ("empty.pdf", empty_file, "application/pdf")}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("empty", response.json()["detail"].lower())
        print("  ✅ PASS: Rejected empty PDF with 400 Bad Request")

    # -----------------------------------------------------------------------
    # CAD Vector-Geometric Pre-Scrutiny Tests (ezdxf)
    # -----------------------------------------------------------------------
    def _create_test_dxf(self, plot_poly, chem_poly=None) -> bytes:
        """Helper to dynamically generate valid DXF drawings in memory."""
        import ezdxf
        doc = ezdxf.new("R2010")
        msp = doc.modelspace()

        # Create plot boundary layer
        doc.layers.add("PLOT_BOUNDARY", color=1)
        msp.add_lwpolyline(plot_poly, close=True, dxfattribs={"layer": "PLOT_BOUNDARY"})

        # Create chemical storage layer if provided
        if chem_poly:
            doc.layers.add("CHEMICAL_STORAGE", color=3)
            msp.add_lwpolyline(chem_poly, close=True, dxfattribs={"layer": "CHEMICAL_STORAGE"})

        stream = io.StringIO()
        doc.write(stream)
        return stream.getvalue().encode("utf-8")

    def test_08_cad_setback_violation_under_15m(self):
        """Test POST /validate-cad catches hazardous setback violation (< 15m)"""
        # Plot: 100m x 100m. Chemical storage placed at x=8.0m (Distance to plot boundary = 8.0m < 15.0m)
        plot = [(0.0, 0.0), (100.0, 0.0), (100.0, 100.0), (0.0, 100.0)]
        chem = [(8.0, 20.0), (25.0, 20.0), (25.0, 40.0), (8.0, 40.0)]
        dxf_bytes = self._create_test_dxf(plot, chem)

        response = self.client.post(
            "/validate-cad",
            files={"file": ("MIDC_Plot_Violation.dxf", io.BytesIO(dxf_bytes), "application/dxf")}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["compliance_status"], "NON_COMPLIANT")
        self.assertFalse(data["is_compliant"])
        self.assertEqual(data["shortest_setback_meters"], 8.0)
        self.assertEqual(data["minimum_required_meters"], 15.0)
        self.assertEqual(data["deficit_meters"], 7.0)
        self.assertIsNotNone(data["compliance_error"])
        self.assertIn("VIOLATION", data["compliance_error"])
        self.assertIn("8.00m", data["compliance_error"])

        print(f"  ✅ PASS: Setback violation detected (8.00m < 15.0m). Deficit: {data['deficit_meters']}m flagged.")

    def test_09_cad_setback_compliant_over_15m(self):
        """Test POST /validate-cad approves compliant setback (>= 15m)"""
        # Plot: 100m x 100m. Chemical storage placed at x=25.0m, y=25.0m (Distance to plot boundary = 25.0m >= 15.0m)
        plot = [(0.0, 0.0), (100.0, 0.0), (100.0, 100.0), (0.0, 100.0)]
        chem = [(25.0, 25.0), (50.0, 25.0), (50.0, 50.0), (25.0, 50.0)]
        dxf_bytes = self._create_test_dxf(plot, chem)

        response = self.client.post(
            "/validate-cad",
            files={"file": ("MIDC_Plot_Compliant.dxf", io.BytesIO(dxf_bytes), "application/dxf")}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["compliance_status"], "COMPLIANT")
        self.assertTrue(data["is_compliant"])
        self.assertEqual(data["shortest_setback_meters"], 25.0)
        self.assertIsNone(data["compliance_error"])

        print(f"  ✅ PASS: Setback compliant verified (25.00m >= 15.00m statutory threshold).")

    def test_10_cad_missing_layers_validation(self):
        """Test POST /validate-cad detects missing required CAD layer"""
        # Only PLOT_BOUNDARY, CHEMICAL_STORAGE is omitted
        plot = [(0.0, 0.0), (100.0, 0.0), (100.0, 100.0), (0.0, 100.0)]
        dxf_bytes = self._create_test_dxf(plot, chem_poly=None)

        response = self.client.post(
            "/validate-cad",
            files={"file": ("Missing_Layer.dxf", io.BytesIO(dxf_bytes), "application/dxf")}
        )

        self.assertEqual(response.status_code, 422)
        self.assertIn("CHEMICAL_STORAGE", response.json()["detail"])
        print("  ✅ PASS: Missing 'CHEMICAL_STORAGE' layer flagged with 422 Unprocessable Entity.")

    def test_11_cad_reject_non_dxf_extension(self):
        """Test POST /validate-cad rejects non-DXF file extensions"""
        response = self.client.post(
            "/validate-cad",
            files={"file": ("drawing.dwg", io.BytesIO(b"DWG binary content"), "application/octet-stream")}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(".dxf", response.json()["detail"])
        print("  ✅ PASS: Rejected non-DXF drawing format with 400 Bad Request.")

if __name__ == "__main__":
    if sys.platform == "win32":
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

    print("\n========================================================")
    print("Testing UdyogSetu Cognitive & CAD Pre-Scrutiny Microservice")
    print("========================================================\n")
    runner = unittest.TextTestRunner(verbosity=1)
    result = runner.run(unittest.TestLoader().loadTestsFromTestCase(TestCognitiveDocumentExtractor))
    print("\n========================================================")
    print(f"Test Results: {result.testsRun - len(result.errors) - len(result.failures)}/{result.testsRun} Passed")
    print("========================================================\n")
    sys.exit(0 if result.wasSuccessful() else 1)

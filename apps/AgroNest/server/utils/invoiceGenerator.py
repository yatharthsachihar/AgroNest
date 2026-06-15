"""
AgroNest Invoice Generator — ReportLab
Generates a professional GST tax invoice PDF for an order matching the refined government grid layout.

# pip install reportlab
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
)
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Circle, Rect, String, Polygon
from datetime import datetime
from io import BytesIO


# ─────────────────────────────────────────
# Brand colors (from AgroNest design system)
# ─────────────────────────────────────────
PRIMARY      = colors.HexColor("#1B5E20")  # Solid Brand Green for borders
TEXT         = colors.black  # Solid black text
TEXT_MUTED   = colors.black  # Solid black text
GREEN_LIGHT  = colors.HexColor("#FAFDFB")  # Light green background for highlights
WHITE        = colors.white


# ─────────────────────────────────────────
# Canvas class for page numbering & layout
# ─────────────────────────────────────────
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pages = []

    def showPage(self):
        self.pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        page_count = len(self.pages)
        for page in self.pages:
            self.__dict__.update(page)
            super().showPage()
        super().save()


# ─────────────────────────────────────────
# Helper for creating aligned subtables
# ─────────────────────────────────────────
def make_details_subtable(data_rows, key_width, val_width, bold_style, regular_style):
    sub_data = []
    for k, v in data_rows:
        sub_data.append([
            Paragraph(f"<b>{k}</b>", bold_style),
            Paragraph(":", regular_style),
            Paragraph(v, regular_style)
        ])
    sub_table = Table(sub_data, colWidths=[key_width, 4 * mm, val_width])
    sub_table.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 1.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return sub_table


# ─────────────────────────────────────────
# Main invoice generator
# ─────────────────────────────────────────
def generate_invoice(order: dict, output_path: str = None) -> bytes:
    buffer = BytesIO() if output_path is None else output_path

    # Page size A4 is 210 x 297 mm
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=10 * mm,
        bottomMargin=10 * mm,
        leftMargin=14 * mm,
        rightMargin=14 * mm,
    )

    elements = []
    styles = getSampleStyleSheet()

    # ── Custom paragraph styles ──
    title_text_style = ParagraphStyle(
        "TitleText", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=22, textColor=colors.HexColor("#111827"),
        alignment=TA_RIGHT, leading=24,
    )
    section_lbl_style = ParagraphStyle(
        "SectionLabel", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=9, textColor=PRIMARY,
        leading=11, spaceAfter=4,
    )
    company_name_style = ParagraphStyle(
        "CompanyName", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=10, textColor=TEXT,
        leading=12, spaceAfter=2,
    )
    details_line_style = ParagraphStyle(
        "DetailsLine", parent=styles["Normal"],
        fontName="Helvetica", fontSize=8.5, textColor=TEXT, leading=11,
    )
    details_line_bold = ParagraphStyle(
        "DetailsLineBold", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=8.5, textColor=TEXT, leading=11,
    )
    
    # Table headers
    th_style = ParagraphStyle(
        "ThStyle", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=8, textColor=TEXT,
        leading=10,
    )
    th_style_right = ParagraphStyle(
        "ThStyleRight", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=8, textColor=TEXT,
        alignment=TA_RIGHT, leading=10,
    )
    th_style_center = ParagraphStyle(
        "ThStyleCenter", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=8, textColor=TEXT,
        alignment=TA_CENTER, leading=10,
    )
    
    # Table cells
    td_style = ParagraphStyle(
        "TdStyle", parent=styles["Normal"],
        fontName="Helvetica", fontSize=8, textColor=TEXT,
        leading=10,
    )
    td_style_bold = ParagraphStyle(
        "TdStyleBold", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=8, textColor=TEXT,
        leading=10,
    )
    td_style_right = ParagraphStyle(
        "TdStyleRight", parent=styles["Normal"],
        fontName="Helvetica", fontSize=8, textColor=TEXT,
        alignment=TA_RIGHT, leading=10,
    )
    td_style_right_bold = ParagraphStyle(
        "TdStyleRightBold", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=8, textColor=TEXT,
        alignment=TA_RIGHT, leading=10,
    )
    td_style_center = ParagraphStyle(
        "TdStyleCenter", parent=styles["Normal"],
        fontName="Helvetica", fontSize=8, textColor=TEXT,
        alignment=TA_CENTER, leading=10,
    )
    
    amount_words_style = ParagraphStyle(
        "AmountWords", parent=styles["Normal"],
        fontName="Helvetica", fontSize=9, textColor=TEXT,
        leading=12,
    )
    terms_title_style = ParagraphStyle(
        "TermsTitle", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=8.5, textColor=TEXT,
        leading=11, spaceAfter=2,
    )
    terms_line_style = ParagraphStyle(
        "TermsLine", parent=styles["Normal"],
        fontName="Helvetica", fontSize=7.5, textColor=TEXT_MUTED,
        leading=9.5,
    )
    footer_bar_style = ParagraphStyle(
        "FooterBar", parent=styles["Normal"],
        fontName="Helvetica", fontSize=8, textColor=TEXT_MUTED,
        alignment=TA_CENTER, leading=10,
    )

    # Extract order details
    items = order.get("items", [])
    subtotal = order.get("subtotal", 0)
    discount = order.get("discount", 0)
    shipping_fee = order.get("shippingFee", 0)
    gst_rate = order.get("gstRate", 18)
    total_amount = order.get("totalAmount", 0)

    order_id_raw = str(order.get("_id", "000000000000"))
    order_id = order_id_raw[-8:].upper()
    invoice_no = f"ARG/INV/{datetime.now().year}/{order_id_raw[-4:].upper()}"
    order_no = f"ARG/ORD/{datetime.now().year}/{order_id}"

    created_at = order.get("createdAt")
    if isinstance(created_at, str):
        try:
            created_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        except ValueError:
            created_dt = datetime.now()
    else:
        created_dt = created_at or datetime.now()
    date_str = created_dt.strftime("%d %b %Y")

    cgst_rate = gst_rate / 2
    sgst_rate = gst_rate / 2

    # Calculate itemised tax rows
    processed_items = []
    total_qty = 0
    total_taxable = 0
    total_cgst = 0
    total_sgst = 0

    for item in items:
        qty = item.get("quantity", 1)
        price = item.get("price", 0)
        item_subtotal = price * qty
        item_discount = (item_subtotal / subtotal) * discount if subtotal > 0 else 0
        item_taxable = item_subtotal - item_discount
        cgst = item_taxable * (cgst_rate / 100)
        sgst = item_taxable * (sgst_rate / 100)
        total = item_taxable + cgst + sgst

        total_qty += qty
        total_taxable += item_taxable
        total_cgst += cgst
        total_sgst += sgst

        processed_items.append({
            "name": item.get("name") or "Product",
            "variant": item.get("variant") or "",
            "price": price,
            "qty": qty,
            "taxable": item_taxable,
            "cgst": cgst,
            "sgst": sgst,
            "total": total
        })

    final_taxable = total_taxable
    if shipping_fee > 0:
        final_taxable += shipping_fee

    amount_words = amount_in_words(total_amount)

    # ─────────────────────────────────────────
    # 1. Header (Logo + Tax Invoice Title)
    # ─────────────────────────────────────────
    import os
    base_dir = os.path.dirname(os.path.abspath(__file__))
    logo_path = os.path.normpath(os.path.join(base_dir, "../../client/public/uploads/AgroNest_logo.png"))
    if os.path.exists(logo_path):
        logo_flowable = Image(logo_path, width=16 * mm, height=16 * mm)
    else:
        # Fallback to drawing if image is missing
        logo_flowable = Drawing(120, 32)
        logo_flowable.add(Rect(0, 0, 120, 32, fillColor=colors.white, strokeColor=colors.white))
        logo_flowable.add(Circle(16, 16, 13, fillColor=PRIMARY, strokeColor=PRIMARY))
        logo_flowable.add(Rect(12, 10, 8, 12, fillColor=colors.white, strokeColor=colors.white, rx=2, ry=2))
        logo_flowable.add(String(36, 10, "AGRONEST", fontName="Helvetica-Bold", fontSize=14, fillColor=colors.HexColor("#1A3322")))

    header_table = Table([[logo_flowable, Paragraph("TAX INVOICE", title_text_style)]], colWidths=[100 * mm, 82 * mm])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("LINEBELOW", (0, 0), (-1, -1), 2.5, PRIMARY),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 3 * mm))

    # ─────────────────────────────────────────
    # 2. Seller Details & QR Code Grid Table
    # ─────────────────────────────────────────
    seller_details = [
        Paragraph("SOLD BY / SELLER", section_lbl_style),
        Paragraph("ARGONEST AGRO PRIVATE LIMITED", company_name_style),
        Paragraph("123 Green Valley, Pal Road, Jodhpur, Rajasthan - 342003, India", details_line_style),
    ]

    # QR Drawing
    qr_draw = Drawing(56, 56)
    qr_draw.add(Rect(0, 0, 56, 56, fillColor=colors.white, strokeColor=colors.white))
    # Top-left anchor
    qr_draw.add(Rect(2, 38, 16, 16, fillColor=PRIMARY, strokeColor=PRIMARY))
    qr_draw.add(Rect(5, 41, 10, 10, fillColor=colors.white, strokeColor=colors.white))
    qr_draw.add(Rect(8, 44, 4, 4, fillColor=PRIMARY, strokeColor=PRIMARY))
    # Top-right anchor
    qr_draw.add(Rect(38, 38, 16, 16, fillColor=PRIMARY, strokeColor=PRIMARY))
    qr_draw.add(Rect(41, 41, 10, 10, fillColor=colors.white, strokeColor=colors.white))
    qr_draw.add(Rect(44, 44, 4, 4, fillColor=PRIMARY, strokeColor=PRIMARY))
    # Bottom-left anchor
    qr_draw.add(Rect(2, 2, 16, 16, fillColor=PRIMARY, strokeColor=PRIMARY))
    qr_draw.add(Rect(5, 5, 10, 10, fillColor=colors.white, strokeColor=colors.white))
    qr_draw.add(Rect(8, 8, 4, 4, fillColor=PRIMARY, strokeColor=PRIMARY))
    # Bits
    qr_draw.add(Rect(24, 42, 6, 6, fillColor=PRIMARY, strokeColor=PRIMARY))
    qr_draw.add(Rect(32, 36, 4, 4, fillColor=PRIMARY, strokeColor=PRIMARY))
    qr_draw.add(Rect(20, 20, 10, 10, fillColor=PRIMARY, strokeColor=PRIMARY))
    qr_draw.add(Rect(34, 24, 12, 6, fillColor=PRIMARY, strokeColor=PRIMARY))
    qr_draw.add(Rect(26, 4, 10, 10, fillColor=PRIMARY, strokeColor=PRIMARY))

    qr_cell = [
        qr_draw,
        Spacer(1, 1.5 * mm),
        Paragraph(f"Invoice Number: {invoice_no}", ParagraphStyle("qr_inv", parent=details_line_bold, fontSize=7.5, alignment=TA_CENTER))
    ]

    seller_qr_table = Table([[seller_details, qr_cell]], colWidths=[120 * mm, 62 * mm])
    seller_qr_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "CENTER"),
        ("BOX", (0, 0), (-1, -1), 1.5, PRIMARY),
        ("INNERGRID", (0, 0), (-1, -1), 1.5, PRIMARY),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    elements.append(seller_qr_table)
    elements.append(Spacer(1, -0.5 * mm)) # cleanly stack borders

    # ─────────────────────────────────────────
    # 3. Billed To & Delivered To Grid Table
    # ─────────────────────────────────────────
    cust = order.get("customer", {})
    customer_name = cust.get("name") or order.get("customerName") or "Customer"
    customer_address = cust.get("address") or order.get("address") or "—"
    customer_city = cust.get("city") or order.get("city") or ""
    customer_state = cust.get("state") or order.get("state") or "—"
    customer_pincode = cust.get("pincode") or order.get("pincode") or "—"

    # Billed To details
    billed_data_rows = [
        ("Name", customer_name),
        ("Address", f"{customer_address}, {customer_city}, {customer_state}"),
        ("Pin code", customer_pincode),
        ("State", customer_state)
    ]
    billed_sub = make_details_subtable(billed_data_rows, 18 * mm, 40 * mm, details_line_bold, details_line_style)
    billed_to_details = [
        Paragraph("BILLED TO", section_lbl_style),
        billed_sub
    ]

    # Delivered To details
    delivered_data_rows = [
        ("Name", customer_name),
        ("Address", f"{customer_address}, {customer_city}, {customer_state}"),
        ("Pin code", customer_pincode),
        ("State", customer_state)
    ]
    delivered_sub = make_details_subtable(delivered_data_rows, 18 * mm, 40 * mm, details_line_bold, details_line_style)
    delivered_to_details = [
        Paragraph("DELIVERED TO", section_lbl_style),
        delivered_sub
    ]

    # Order details
    order_data_rows = [
        ("Order Id", order_no),
        ("Invoice Date", date_str),
        ("Place of Supply", customer_state)
    ]
    order_sub = make_details_subtable(order_data_rows, 22 * mm, 32 * mm, details_line_bold, details_line_style)
    order_details = [
        Paragraph("ORDER DETAILS", section_lbl_style),
        order_sub
    ]

    billed_order_table = Table([[billed_to_details, delivered_to_details, order_details]], colWidths=[62 * mm, 62 * mm, 58 * mm])
    billed_order_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 1.5, PRIMARY),
        ("INNERGRID", (0, 0), (-1, -1), 1.5, PRIMARY),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(billed_order_table)
    elements.append(Spacer(1, 2 * mm))

    # ─────────────────────────────────────────
    # 4. Items breakdown Table
    # ─────────────────────────────────────────
    items_header = [
        Paragraph("SR. NO", th_style_center),
        Paragraph("ITEM DESCRIPTION", th_style),
        Paragraph("MRP", th_style_right),
        Paragraph("QTY", th_style_center),
        Paragraph("TAXABLE VALUE", th_style_right),
        Paragraph("CGST (%)", th_style_center),
        Paragraph("CGST (₹)", th_style_right),
        Paragraph("SGST (%)", th_style_center),
        Paragraph("SGST (₹)", th_style_right),
        Paragraph("TOTAL (₹)", th_style_right),
    ]

    items_rows = [items_header]

    for idx, item in enumerate(processed_items, start=1):
        desc = item["name"]
        if item["variant"]:
            desc = f"<b>{item['name']}</b><br/><font size='7' color='grey'>{item['variant']}</font>"
        else:
            desc = f"<b>{item['name']}</b>"

        items_rows.append([
            Paragraph(str(idx), td_style_center),
            Paragraph(desc, td_style),
            Paragraph(f"₹{item['price']:.2f}", td_style_right),
            Paragraph(str(item['qty']), td_style_center),
            Paragraph(f"₹{item['taxable']:.2f}", td_style_right),
            Paragraph(f"{cgst_rate}%", td_style_center),
            Paragraph(f"₹{item['cgst']:.2f}", td_style_right),
            Paragraph(f"{sgst_rate}%", td_style_center),
            Paragraph(f"₹{item['sgst']:.2f}", td_style_right),
            Paragraph(f"₹{item['total']:.2f}", td_style_right_bold),
        ])

    if shipping_fee > 0:
        items_rows.append([
            Paragraph(str(len(processed_items) + 1), td_style_center),
            Paragraph("Delivery and other charges", td_style),
            Paragraph(f"₹{shipping_fee:.2f}", td_style_right),
            Paragraph("1", td_style_center),
            Paragraph(f"₹{shipping_fee:.2f}", td_style_right),
            Paragraph("0%", td_style_center),
            Paragraph("₹0.00", td_style_right),
            Paragraph("0%", td_style_center),
            Paragraph("₹0.00", td_style_right),
            Paragraph(f"₹{shipping_fee:.2f}", td_style_right_bold),
        ])

    # Add total row
    items_rows.append([
        Paragraph("Total", td_style_bold),
        Paragraph("", td_style),
        Paragraph("", td_style_right),
        Paragraph(str(total_qty + (1 if shipping_fee > 0 else 0)), td_style_center),
        Paragraph(f"₹{final_taxable:.2f}", td_style_right_bold),
        Paragraph("", td_style_center),
        Paragraph(f"₹{total_cgst:.2f}", td_style_right_bold),
        Paragraph("", td_style_center),
        Paragraph(f"₹{total_sgst:.2f}", td_style_right_bold),
        Paragraph(f"₹{total_amount:.2f}", td_style_right_bold),
    ])

    items_table = Table(
        items_rows,
        colWidths=[10 * mm, 56 * mm, 16 * mm, 10 * mm, 18 * mm, 12 * mm, 15 * mm, 12 * mm, 15 * mm, 18 * mm]
    )

    items_table.setStyle(TableStyle([
        # All cells borders
        ("INNERGRID", (0, 0), (-1, -1), 0.5, PRIMARY),
        ("BOX", (0, 0), (-1, -1), 1.5, PRIMARY),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        # Header Background is White
        ("BACKGROUND", (0, 0), (-1, 0), colors.white),
        # Total Row background
        ("BACKGROUND", (0, -1), (-1, -1), GREEN_LIGHT),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, -0.5 * mm))

    # ─────────────────────────────────────────
    # 5. Amount in Words Box
    # ─────────────────────────────────────────
    amount_in_words_table = Table([[
        Paragraph(f"<b>Amount in Words:</b> {amount_words}", amount_words_style)
    ]], colWidths=[182 * mm])
    amount_in_words_table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1.5, PRIMARY),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    elements.append(amount_in_words_table)
    elements.append(Spacer(1, -0.5 * mm))

    # ─────────────────────────────────────────
    # 6. Corporate & Signatory Block Grid Table
    # ─────────────────────────────────────────
    corp_info = [
        Paragraph("ARGONEST AGRO PRIVATE LIMITED", company_name_style),
    ]

    # Stylized signature graphic using reportlab drawing
    sig_draw = Drawing(100, 24)
    sig_draw.add(Rect(0, 0, 100, 24, fillColor=colors.white, strokeColor=colors.white))
    sig_draw.add(Polygon([
        10, 12, 25, 4, 40, 18, 55, 6, 62, 8, 70, 2, 80, 16, 90, 12, 100, 4, 110, 8
    ], fillColor=colors.white, strokeColor=PRIMARY, strokeWidth=1))

    signatory_cell = [
        sig_draw,
        Spacer(1, 1 * mm),
        Paragraph("AUTHORIZED SIGNATORY", ParagraphStyle("SigLabel", fontName="Helvetica-Bold", fontSize=8, textColor=TEXT, alignment=TA_CENTER))
    ]

    corp_sig_table = Table([[corp_info, signatory_cell]], colWidths=[120 * mm, 62 * mm])
    corp_sig_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (1, 0), "CENTER"),
        ("BOX", (0, 0), (-1, -1), 1.5, PRIMARY),
        ("INNERGRID", (0, 0), (-1, -1), 1.5, PRIMARY),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    elements.append(corp_sig_table)
    elements.append(Spacer(1, -0.5 * mm))

    # ─────────────────────────────────────────
    # 7. Reverse Charge Row
    # ─────────────────────────────────────────
    reverse_charge_table = Table([[
        Paragraph("<b>Whether the tax is payable on reverse charge - No</b>", details_line_bold)
    ]], colWidths=[182 * mm])
    reverse_charge_table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1.5, PRIMARY),
        ("BACKGROUND", (0, 0), (-1, -1), GREEN_LIGHT),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ]))
    elements.append(reverse_charge_table)
    elements.append(Spacer(1, -0.5 * mm))

    # ─────────────────────────────────────────
    # 8. Terms and Conditions
    # ─────────────────────────────────────────
    terms_list = [
        Paragraph("Terms & Conditions:", terms_title_style),
        Paragraph("1. If you have any issues or queries in respect of your order, please contact customer chat support through AgroNest platform or drop an email at support@argonest.com.", terms_line_style),
        Paragraph("2. In case you need to get more information about seller's status, please visit our platform settings or contact support.", terms_line_style),
        Paragraph("3. Please note that we never ask for bank account details such as CVV, account number, UPI Pin, etc. across our support channels. For your safety, please do not share these details with anyone over any medium.", terms_line_style),
        Paragraph("4. MRP displayed on the platform is as printed on the product package. Actual MRP and amount payable may be a function of offers/discounts/gst.", terms_line_style),
        Paragraph("5. Delivery & other charges are ancillary to the principal supply of items/goods, wherever applicable.", terms_line_style),
    ]

    terms_table = Table([[terms_list]], colWidths=[182 * mm])
    terms_table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1.5, PRIMARY),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    elements.append(terms_table)

    # ─────────────────────────────────────────
    # 9. Bottom Footer Bar
    # ─────────────────────────────────────────
    elements.append(Spacer(1, 3 * mm))
    elements.append(Paragraph("THIS IS A COMPUTER GENERATED INVOICE AND DOES NOT REQUIRE A SIGNATURE. &nbsp;|&nbsp; Thank you for shopping with AgroNest! 🍃", footer_bar_style))

    # doc build using NumberedCanvas
    doc.build(elements, canvasmaker=NumberedCanvas)

    if output_path is None:
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

    return None


# ─────────────────────────────────────────
# Indian Number to Words Helper Functions
# ─────────────────────────────────────────
def number_to_words(num):
    if num == 0:
        return "Zero"
    units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    def convert(n):
        if n < 20:
            return units[n]
        if n < 100:
            return tens[n // 10] + (" " + units[n % 10] if n % 10 != 0 else "")
        if n < 1000:
            return units[n // 100] + " Hundred" + (" and " + convert(n % 100) if n % 100 != 0 else "")
        if n < 100000:
            return convert(n // 1000) + " Thousand" + (" " + convert(n % 1000) if n % 1000 != 0 else "")
        if n < 10000000:
            return convert(n // 100000) + " Lakh" + (" " + convert(n % 100000) if n % 100000 != 0 else "")
        return convert(n // 10000000) + " Crore" + (" " + convert(n % 10000000) if n % 10000000 != 0 else "")

    return convert(int(num))


def amount_in_words(amount):
    rounded_amount = round(amount, 2)
    rupees = int(rounded_amount)
    paise = int(round((rounded_amount - rupees) * 100))

    rupees_str = f"{number_to_words(rupees)} Rupees" if rupees > 0 else ""
    paise_str = f"{number_to_words(paise)} Paise" if paise > 0 else ""

    if rupees_str and paise_str:
        return f"{rupees_str} and {paise_str} Only"
    elif rupees_str:
        return f"{rupees_str} Only"
    elif paise_str:
        return f"{paise_str} Only"
    else:
        return "Zero Rupees Only"


# Example usage
if __name__ == "__main__":
    sample_order = {
        "_id": "665f1a2b3c4d5e6f7a8b9c0d",
        "createdAt": "2026-06-15T10:30:00Z",
        "paymentMethod": "UPI",
        "paymentStatus": "Paid",
        "customer": {
            "name": "Test Dummy",
            "address": "dummy, dummy, Arunachal Pradesh",
            "city": "",
            "state": "Arunachal Pradesh",
            "pincode": "101010",
            "phone": "+91 98765 43210",
            "email": "yatharthsachihar@gmail.com",
        },
        "items": [
            {"name": "Drip Irrigation Starter Kit", "variant": "", "price": 1899, "quantity": 1},
            {"name": "Sprinkler Irrigation Set", "variant": "", "price": 1299, "quantity": 2},
        ],
        "subtotal": 4497,
        "discount": 0,
        "couponCode": "",
        "shippingFee": 0,
        "gstRate": 18,
        "totalAmount": 5306.46,
    }

    generate_invoice(sample_order, output_path="AgroNest_Invoice_SAMPLE.pdf")
    print("Invoice generated: AgroNest_Invoice_SAMPLE.pdf")

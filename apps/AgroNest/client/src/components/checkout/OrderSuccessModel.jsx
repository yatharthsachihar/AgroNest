// src/components/checkout/OrderSuccessModel.jsx
import { useRef, useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
    FiCheckCircle,
    FiDownload,
    FiX,
    FiMapPin,
    FiPhone,
    FiMail,
    FiGlobe,
    FiFileText,
    FiCalendar,
    FiBox,
    FiUser,
    FiPackage,
    FiAward,
    FiHeart,
    FiTruck,
    FiShield
} from "react-icons/fi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Navbar from "../navigation/Navbar";
import Footer from "../navigation/Footer";
import { orderApi } from "../../api/orderApi";
import styles from "./OrderSuccessModel.module.css";

export default function OrderSuccessModal({ order, onClose }) {
    const billRef = useRef(null);

    if (!order) return null;

    const {
        _id,
        items = [],
        subtotal = 0,
        discount = 0,
        couponCode = "",
        shippingFee = 0,
        gstRate = 18,
        totalAmount = 0,
        customer = {},
        createdAt,
        paymentMethod = "Online",
    } = order;

    const gstAmount = +(((subtotal - discount) * gstRate) / 100).toFixed(2);
    const orderDate = new Date(createdAt || Date.now());

    const handleDownload = async () => {
        const el = billRef.current;
        if (!el) return;

        // Render the hidden bill to canvas
        const canvas = await html2canvas(el, {
            scale: 2,
            backgroundColor: "#ffffff",
            useCORS: true,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(`AgroNest_Invoice_${_id?.slice(-8).toUpperCase() || "ORDER"}.pdf`);
    };

    return (
        <div className={styles['osm-overlay']}>
            <div className={styles['osm-modal']}>

                <button className={styles['osm-close']} onClick={onClose} aria-label="Close">
                    <FiX size={20} />
                </button>

                {/* ── Success Header ── */}
                <div className={styles['osm-success-icon']}>
                    <FiCheckCircle size={56} />
                </div>

                <h2 className={styles['osm-title']}>Order Placed Successfully!</h2>
                <p className={styles['osm-sub']}>
                    Thank you for shopping with AgroNest. Your order
                    <strong> #{_id?.slice(-8).toUpperCase() || "—"} </strong>
                    has been confirmed and is being processed.
                </p>

                <div className={styles['osm-order-summary']}>
                    <div className={styles['osm-row']}>
                        <span>Order Date</span>
                        <strong>{orderDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong>
                    </div>
                    <div className={styles['osm-row']}>
                        <span>Payment Method</span>
                        <strong>{paymentMethod}</strong>
                    </div>
                    <div className={styles['osm-row-total'] || `${styles['osm-row']} ${styles.total}`}>
                        <span>Total Paid</span>
                        <strong>₹{totalAmount.toLocaleString("en-IN")}</strong>
                    </div>
                </div>

                <p className={styles['osm-bill-note']}>
                    Your invoice is ready — download it for your records, GST claims, or warranty purposes.
                </p>

                <button className={styles['osm-download-btn']} onClick={handleDownload}>
                    <FiDownload size={18} /> Download Bill (PDF)
                </button>

                <button className={styles['osm-continue-btn']} onClick={onClose}>
                    Continue Shopping
                </button>

                {/* ── Hidden Invoice Template — only rendered for PDF capture ── */}
                <div className={styles['osm-bill-hidden']} ref={billRef}>
                    <InvoiceTemplate
                        order={order}
                        gstAmount={gstAmount}
                        orderDate={orderDate}
                    />
                </div>

            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   Invoice Template — what gets rendered to PDF
───────────────────────────────────────── */
function InvoiceTemplate({ order, gstAmount, orderDate }) {
    const {
        _id,
        items = [],
        subtotal = 0,
        discount = 0,
        couponCode = "",
        shippingFee = 0,
        gstRate = 18,
        totalAmount = 0,
        customerName,
        customerEmail,
        customerPhone,
        address,
        city,
        state,
        pincode,
        paymentMethod = "Online",
        paymentStatus = "Paid",
    } = order;

    const currentYear = orderDate.getFullYear();
    const invoiceNo = `ARG/INV/${currentYear}/${_id?.slice(-4).toUpperCase() || "0000"}`;
    const orderNo = `ARG/ORD/${currentYear}/${_id?.slice(-8).toUpperCase() || "00000000"}`;
    const dateFormatted = orderDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    const cgstRate = gstRate / 2;
    const sgstRate = gstRate / 2;

    let totalQty = 0;
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;

    const processedItems = items.map(item => {
        const qty = item.quantity || 1;
        const itemSubtotal = item.price * qty;
        const itemDiscount = subtotal > 0 ? (itemSubtotal / subtotal) * discount : 0;
        const itemTaxable = itemSubtotal - itemDiscount;
        const cgst = itemTaxable * (cgstRate / 100);
        const sgst = itemTaxable * (sgstRate / 100);
        const total = itemTaxable + cgst + sgst;

        totalQty += qty;
        totalTaxable += itemTaxable;
        totalCgst += cgst;
        totalSgst += sgst;

        return {
            ...item,
            qty,
            itemDiscount,
            itemTaxable,
            cgst,
            sgst,
            total
        };
    });

    let finalTaxable = totalTaxable;
    if (shippingFee > 0) {
        finalTaxable += shippingFee;
    }

    const amountWords = convertNumberToWords(totalAmount);

    return (
        <div className={styles['invoice-page']}>
            {/* 1. Header (Brand Info + Title) */}
            <div className={styles['invoice-header']}>
                <div className={styles['invoice-brand-group']}>
                    <div className={styles['invoice-logo-wrapper']}>
                        <img src="/uploads/AgroNest_logo.png" className={styles['invoice-logo']} alt="AgroNest Logo" />
                    </div>
                </div>
                <div className={styles['invoice-title-group']}>
                    <span className={styles['invoice-title-text']}>TAX INVOICE</span>
                </div>
            </div>

            {/* 2. Sold By / Seller block */}
            <table className={styles['invoice-grid-table']}>
                <tbody>
                    <tr>
                        <td style={{ width: '65%' }}>
                            <span className={styles['section-label']}>SOLD BY / SELLER</span>
                            <strong className={styles['seller-company-name']}>ARGONEST AGRO PRIVATE LIMITED</strong>
                            <p className={styles['seller-address']}>123 Green Valley, Pal Road, Jodhpur, Rajasthan - 342003, India</p>
                        </td>
                        <td style={{ width: '35%', textAlign: 'center' }}>
                            <div className={styles['qr-cell']}>
                                <div className={styles['qr-graphic-wrapper']}>
                                    <svg width="60" height="60" viewBox="0 0 40 40">
                                        <rect width="40" height="40" fill="white" />
                                        <rect x="2" y="2" width="10" height="10" fill="#1B5E20" />
                                        <rect x="4" y="4" width="6" height="6" fill="white" />
                                        <rect x="28" y="2" width="10" height="10" fill="#1B5E20" />
                                        <rect x="30" y="4" width="6" height="6" fill="white" />
                                        <rect x="2" y="28" width="10" height="10" fill="#1B5E20" />
                                        <rect x="4" y="30" width="6" height="6" fill="white" />
                                        <rect x="15" y="5" width="4" height="4" fill="#1B5E20" />
                                        <rect x="22" y="8" width="3" height="3" fill="#1B5E20" />
                                        <rect x="14" y="16" width="6" height="6" fill="#1B5E20" />
                                        <rect x="24" y="18" width="8" height="4" fill="#1B5E20" />
                                        <rect x="18" y="28" width="6" height="6" fill="#1B5E20" />
                                        <rect x="28" y="28" width="4" height="4" fill="#1B5E20" />
                                    </svg>
                                </div>
                                <span className={styles['invoice-num-text']}>Invoice Number: {invoiceNo}</span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* 3. Invoice To / Order details block */}
            <table className={styles['invoice-grid-table']}>
                <tbody>
                    <tr>
                        <td style={{ width: '35%' }}>
                            <span className={styles['section-label']}>BILLED TO</span>
                            <table className={styles['details-subtable']}>
                                <tbody>
                                    <tr>
                                        <td className={styles['key-invoice']}>Name</td>
                                        <td className={styles['colon']}>:</td>
                                        <td className={styles['value']}>{customerName || "Valued Customer"}</td>
                                    </tr>
                                    <tr>
                                        <td className={styles['key-invoice']}>Address</td>
                                        <td className={styles['colon']}>:</td>
                                        <td className={styles['value']}>{(address || "—") + ", " + (city || "") + ", " + (state || "")}</td>
                                    </tr>
                                    <tr>
                                        <td className={styles['key-invoice']}>Pin code</td>
                                        <td className={styles['colon']}>:</td>
                                        <td className={styles['value']}>{pincode || "—"}</td>
                                    </tr>
                                    <tr>
                                        <td className={styles['key-invoice']}>State</td>
                                        <td className={styles['colon']}>:</td>
                                        <td className={styles['value']}>{state || "—"}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                        <td style={{ width: '35%' }}>
                            <span className={styles['section-label']}>DELIVERED TO</span>
                            <table className={styles['details-subtable']}>
                                <tbody>
                                    <tr>
                                        <td className={styles['key-invoice']}>Name</td>
                                        <td className={styles['colon']}>:</td>
                                        <td className={styles['value']}>{customerName || "Valued Customer"}</td>
                                    </tr>
                                    <tr>
                                        <td className={styles['key-invoice']}>Address</td>
                                        <td className={styles['colon']}>:</td>
                                        <td className={styles['value']}>{(address || "—") + ", " + (city || "") + ", " + (state || "")}</td>
                                    </tr>
                                    <tr>
                                        <td className={styles['key-invoice']}>Pin code</td>
                                        <td className={styles['colon']}>:</td>
                                        <td className={styles['value']}>{pincode || "—"}</td>
                                    </tr>
                                    <tr>
                                        <td className={styles['key-invoice']}>State</td>
                                        <td className={styles['colon']}>:</td>
                                        <td className={styles['value']}>{state || "—"}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                        <td style={{ width: '30%' }}>
                            <span className={styles['section-label']}>ORDER DETAILS</span>
                            <table className={styles['details-subtable']}>
                                <tbody>
                                    <tr>
                                        <td className={styles['key-order']}>Order Id</td>
                                        <td className={styles['colon']}>:</td>
                                        <td className={styles['value']}>{orderNo}</td>
                                    </tr>
                                    <tr>
                                        <td className={styles['key-order']}>Invoice Date</td>
                                        <td className={styles['colon']}>:</td>
                                        <td className={styles['value']}>{dateFormatted}</td>
                                    </tr>
                                    <tr>
                                        <td className={styles['key-order']}>Place of Supply</td>
                                        <td className={styles['colon']}>:</td>
                                        <td className={styles['value']}>{state || "—"}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* 4. Products Table */}
            <table className={styles['invoice-items-table']}>
                <thead>
                    <tr>
                        <th style={{ width: '6%', textAlign: 'center' }}>SR. NO</th>
                        <th style={{ width: '38%' }}>ITEM DESCRIPTION</th>
                        <th style={{ width: '10%', textAlign: 'right' }}>MRP</th>
                        <th style={{ width: '6%', textAlign: 'center' }}>QTY</th>
                        <th style={{ width: '10%', textAlign: 'right' }}>TAXABLE VALUE</th>
                        <th style={{ width: '8%', textAlign: 'center' }}>CGST (%)</th>
                        <th style={{ width: '8%', textAlign: 'right' }}>CGST (₹)</th>
                        <th style={{ width: '8%', textAlign: 'center' }}>SGST (%)</th>
                        <th style={{ width: '8%', textAlign: 'right' }}>SGST (₹)</th>
                        <th style={{ width: '12%', textAlign: 'right' }}>TOTAL (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    {processedItems.map((item, idx) => (
                        <tr key={idx}>
                            <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                            <td>
                                <strong className={styles['product-title']}>{item.name || "Product"}</strong>
                                {item.variant && <span className={styles['product-variant']}>{item.variant}</span>}
                            </td>
                            <td style={{ textAlign: 'right' }}>₹{item.price.toFixed(2)}</td>
                            <td style={{ textAlign: 'center' }}>{item.qty}</td>
                            <td style={{ textAlign: 'right' }}>₹{item.itemTaxable.toFixed(2)}</td>
                            <td style={{ textAlign: 'center' }}>{cgstRate}%</td>
                            <td style={{ textAlign: 'right' }}>₹{item.cgst.toFixed(2)}</td>
                            <td style={{ textAlign: 'center' }}>{sgstRate}%</td>
                            <td style={{ textAlign: 'right' }}>₹{item.sgst.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', fontWeight: '800' }}>₹{item.total.toFixed(2)}</td>
                        </tr>
                    ))}

                    {shippingFee > 0 && (
                        <tr>
                            <td style={{ textAlign: 'center' }}>{processedItems.length + 1}</td>
                            <td>
                                <strong className={styles['product-title']}>Delivery and other charges</strong>
                            </td>
                            <td style={{ textAlign: 'right' }}>₹{shippingFee.toFixed(2)}</td>
                            <td style={{ textAlign: 'center' }}>1</td>
                            <td style={{ textAlign: 'right' }}>₹{shippingFee.toFixed(2)}</td>
                            <td style={{ textAlign: 'center' }}>0%</td>
                            <td style={{ textAlign: 'right' }}>₹0.00</td>
                            <td style={{ textAlign: 'center' }}>0%</td>
                            <td style={{ textAlign: 'right' }}>₹0.00</td>
                            <td style={{ textAlign: 'right', fontWeight: '800' }}>₹{shippingFee.toFixed(2)}</td>
                        </tr>
                    )}

                    <tr className={styles['total-row']}>
                        <td style={{ textAlign: 'center' }}>Total</td>
                        <td></td>
                        <td style={{ textAlign: 'right' }}></td>
                        <td style={{ textAlign: 'center' }}>{totalQty + (shippingFee > 0 ? 1 : 0)}</td>
                        <td style={{ textAlign: 'right' }}>₹{finalTaxable.toFixed(2)}</td>
                        <td style={{ textAlign: 'center' }}></td>
                        <td style={{ textAlign: 'right' }}>₹{totalCgst.toFixed(2)}</td>
                        <td style={{ textAlign: 'center' }}></td>
                        <td style={{ textAlign: 'right' }}>₹{totalSgst.toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>₹{totalAmount.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            {/* 5. Amount in Words */}
            <div className={styles['amount-words-box']}>
                <strong>Amount in Words:</strong> {amountWords}
            </div>

            {/* 6. Company registration & Signatory bottom table */}
            <table className={styles['invoice-grid-table-bottom']}>
                <tbody>
                    <tr>
                        <td style={{ width: '65%' }}>
                            <strong className={styles['bottom-company-name']}>ARGONEST PRIVATE LIMITED</strong>
                        </td>
                        <td style={{ width: '35%', textAlign: 'center' }}>
                            <div className={styles['signatory-cell']}>
                                <div className={styles['signature-graphic-box']}>
                                    <svg width="120" height="32" viewBox="0 0 120 40">
                                        <path d="M15 28 C 30 12, 45 10, 52 28 C 58 32, 65 14, 70 8 C 76 2, 82 32, 88 28 C 94 24, 100 12, 108 18" fill="none" stroke="#2E7D32" strokeWidth="1.5" />
                                    </svg>
                                </div>
                                <span className={styles['signatory-label-text']}>AUTHORIZED SIGNATORY</span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* 7. Reverse charge row */}
            <div className={styles['reverse-charge-row']}>
                Whether the tax is payable on reverse charge - No
            </div>

            {/* 8. Terms & Conditions */}
            <div className={styles['terms-box']}>
                <strong>Terms & Conditions:</strong>
                <ol>
                    <li>If you have any issues or queries in respect of your order, please contact customer chat support through AgroNest platform or drop an email at support@argonest.com.</li>
                    <li>In case you need to get more information about seller's status, please visit our platform settings or contact support.</li>
                    <li>Please note that we never ask for bank account details such as CVV, account number, UPI Pin, etc. across our support channels. For your safety, please do not share these details with anyone over any medium.</li>
                    <li>MRP displays on the platform is as printed on the product package. Actual MRP and amount payable may be a function of offers/discounts/gst.</li>
                    <li>Delivery & other charges are ancillary to the principal supply of items/goods, wherever applicable.</li>
                </ol>
            </div>

            {/* 9. Formal Footer */}
            <div className={styles['formal-footer-line']}>
                THIS IS A COMPUTER GENERATED INVOICE AND DOES NOT REQUIRE A SIGNATURE. | Thank you for shopping with AgroNest! 🍃
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   Indian Number to Words Helper Functions
───────────────────────────────────────── */
function convertNumberToWords(amount) {
    if (amount === 0) return "Zero Rupees Only";

    const roundedAmount = Math.round(amount * 100) / 100;
    const rupees = Math.floor(roundedAmount);
    const paise = Math.round((roundedAmount - rupees) * 100);

    let rupeesStr = rupees > 0 ? numberToWordsHelper(rupees) + " Rupees" : "";
    let paiseStr = paise > 0 ? numberToWordsHelper(paise) + " Paise" : "";

    let result = "";
    if (rupeesStr && paiseStr) {
        result = rupeesStr + " and " + paiseStr + " Only";
    } else if (rupeesStr) {
        result = rupeesStr + " Only";
    } else if (paiseStr) {
        result = paiseStr + " Only";
    }

    return result;
}

function numberToWordsHelper(num) {
    if (num === 0) return "";
    const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    function convert(n) {
        if (n < 20) return units[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "");
        if (n < 1000) return units[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
        if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
        if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convert(n % 100000) : "");
        return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "");
    }
    return convert(num);
}

export function OrderSuccessPage() {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get("orderId");
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) {
            navigate("/");
            return;
        }
        orderApi.getOne(orderId)
            .then(res => {
                setOrder(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                navigate("/");
            });
    }, [orderId, navigate]);

    if (loading) {
        return (
            <div className="site-root">
                <Navbar />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
                    <div className="checkout-spinner" />
                    <p style={{ color: "var(--site-text-muted)", fontSize: 16, fontWeight: 500 }}>Loading order details...</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="site-root">
            <Navbar />
            <OrderSuccessModal order={order} onClose={() => navigate("/products")} />
            <Footer />
        </div>
    );
}
import { useSettings } from "../../context/SettingsContext";
import { FaWhatsapp } from "react-icons/fa";
import "./WhatsAppButton.css";

/**
 * Floating WhatsApp icon — fixed to the bottom-right of the viewport.
 * Reads its link from admin settings (socialWhatsapp or socialLinks.whatsapp).
 * Only renders when a WhatsApp link has been configured in the admin panel.
 */
export default function WhatsAppButton() {
  const { settings } = useSettings();

  // Support both flat key (socialWhatsapp) and nested (socialLinks.whatsapp)
  const link =
    settings.whatsappFloatingLink ||
    settings.socialWhatsapp ||
    settings.socialLinks?.whatsapp ||
    "";

  if (!link) return null;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="Chat on WhatsApp"
      title="Chat on WhatsApp"
    >
      <FaWhatsapp className="whatsapp-float-icon" />
    </a>
  );
}

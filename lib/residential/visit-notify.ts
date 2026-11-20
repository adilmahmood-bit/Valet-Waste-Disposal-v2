import { residential } from "@/config/residential";
import { SITE } from "@/lib/blog";
import { db, must, type AddressRow, type CustomerRow } from "./db";
import { sendEmail } from "./email";

// Tells people about a finished visit. Customers hear about it only when
// residential.notifications.visitEmails is on; missed visits and problems always alert Adil.

export async function notifyVisit(addressId: string, type: "out" | "back", status: string, note: string | null) {
  try {
    const a = must(
      await db().from("res_addresses").select("*, customer:res_customers(*)").eq("id", addressId).single(),
    ) as AddressRow & { customer: CustomerRow };
    const where = `${a.street}, ${a.city}`;
    const what = type === "out" ? "Cans out" : "Cans back in";

    if (status === "missed" || status === "issue") {
      await sendEmail(
        residential.notifyEmail,
        `${status === "missed" ? "Missed" : "Problem"}: ${what.toLowerCase()} at ${a.street}`,
        [`${what} at ${where} (${a.customer.name}) was marked ${status}.`, note ? `Note: ${note}` : null, "", `${SITE}/admin/residential`]
          .filter((l) => l !== null)
          .join("\n"),
      );
    }

    if (!residential.notifications.visitEmails || status !== "done") return;
    const first = a.customer.name.split(" ")[0] || "there";
    await sendEmail(
      a.customer.email,
      type === "out" ? `Your cans are out at ${a.street}` : `Your cans are back in at ${a.street}`,
      [
        `Hi ${first},`,
        "",
        type === "out"
          ? `Your cans are at the curb at ${where}, ready for pickup.`
          : `Your cans are back in their spot at ${where}.`,
        note ? `Note from the crew: ${note}` : null,
        "",
        `See the photo in your account: ${SITE}/account`,
        "",
        `Questions? Call or text us at ${residential.contact.phone}.`,
      ]
        .filter((l) => l !== null)
        .join("\n"),
    );
  } catch (e) {
    console.error("[notify] visit notification failed", e);
  }
}

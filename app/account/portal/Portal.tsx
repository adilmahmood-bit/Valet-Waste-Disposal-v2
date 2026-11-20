import type { PortalCustomer } from "@/lib/residential/portal-auth";
import { loadPortal } from "@/lib/residential/portal-data";
import { customerRequests, referralCodeFor, referralsFor, teamFor } from "@/lib/residential/portal-requests";
import { Home } from "./Home";
import { PropertyPage } from "./PropertyPage";
import { Shell, type TabId } from "./Shell";
import { AddTab, AlertsTab, BillingTab, OverflowTab, ReferTab } from "./Tabs";

const TAB_TITLES: Record<TabId, string> = {
  home: "Home",
  overflow: "Extra trash pickup",
  add: "Add property",
  refer: "Refer a friend",
  billing: "Billing",
  alerts: "Alerts & team",
};

// The whole signed-in portal for one customer. Used by /account and by the admin
// "View as customer" preview (preview = true hides every form).
export async function Portal({ customer, params, preview = false }: { customer: PortalCustomer; params: Record<string, string | undefined>; preview?: boolean }) {
  const showOverflow = customer.overflow_first_can != null && customer.overflow_per_bag != null;
  const wanted = (params.tab ?? "home") as TabId;
  const tab: TabId = ["home", "add", "refer", "billing", "alerts"].includes(wanted) || (wanted === "overflow" && showOverflow) ? wanted : "home";

  const [properties, requests] = await Promise.all([loadPortal(customer.id), customerRequests(customer.id)]);
  const property = params.p ? properties.find((p) => p.address.id === params.p) : undefined;

  const match = customer.name.match(/\(([^)]+)\)/);
  const company = match?.[1] ?? null;
  const first = customer.name.replace(/\s*\(.*\)\s*/, "").split(" ")[0] || "there";

  if (property) {
    return (
      <Shell name={customer.name} company={company} tab="home" showOverflow={showOverflow} title={property.address.street} subtitle={`${property.address.city} ${property.address.zip} · Trash day ${property.address.trash_day}`} back="?tab=home">
        <PropertyPage p={property} requests={requests} preview={preview} />
      </Shell>
    );
  }

  let body: React.ReactNode;
  if (tab === "overflow") {
    body = <OverflowTab customer={customer} properties={properties} requests={requests} initial={params.for} preview={preview} />;
  } else if (tab === "add") {
    body = <AddTab preview={preview} />;
  } else if (tab === "refer") {
    // In the preview, show the code only if they already have one (don't make one for them).
    const code = preview ? customer.my_referral_code ?? null : await referralCodeFor(customer);
    body = <ReferTab link={code ? `yourdoorstepdisposal.com/r?ref=${code}` : null} referrals={code ? await referralsFor(code) : []} />;
  } else if (tab === "billing") {
    body = <BillingTab customer={customer} properties={properties} />;
  } else if (tab === "alerts") {
    body = <AlertsTab customer={customer} team={await teamFor(customer.id)} preview={preview} />;
  } else {
    body = (
      <Home
        first={first}
        properties={properties}
        requests={requests}
        overflowRate={showOverflow ? { firstCan: Number(customer.overflow_first_can), perBag: Number(customer.overflow_per_bag) } : null}
      />
    );
  }

  return (
    <Shell
      name={customer.name}
      company={company}
      tab={tab}
      showOverflow={showOverflow}
      title={tab === "home" ? `Welcome back, ${first}` : TAB_TITLES[tab]}
      subtitle={tab === "home" ? `${company ?? customer.email} · ${properties.length} ${properties.length === 1 ? "property" : "properties"}` : undefined}
    >
      {body}
    </Shell>
  );
}

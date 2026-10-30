/**
 * Integration checks for the database security model (RLS, moderation, anti-spam).
 * Runs against the local Supabase stack using real sessions, exactly as the browser would.
 *
 *   npm run test:db        (requires `npm run db:seed` first)
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "node:path";
import type { Database } from "../src/lib/database.types";

config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service = createClient<Database>(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  ✔ ${name}`);
  } else {
    failed += 1;
    console.log(`  ✖ ${name}${detail ? `  → ${detail}` : ""}`);
  }
}

async function login(email: string, password: string) {
  const client = createClient<Database>(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`login ${email}: ${error?.message}`);
  return { client, id: data.user.id };
}

async function main() {
  const anon = createClient<Database>(url, anonKey, { auth: { persistSession: false } });
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "EduMap-Admin-2026!";
  const userPassword = process.env.SEED_USER_PASSWORD ?? "EduMap-Parent-2026!";

  console.log("\nAnonymous visitor");
  const { data: schoolsAnon } = await anon.from("schools").select("id,status");
  check("sees only published schools", (schoolsAnon ?? []).length > 0 && (schoolsAnon ?? []).every((s) => s.status === "published"));
  const { data: pendingAnon } = await anon.from("reviews").select("id").eq("status", "pending");
  check("cannot read pending reviews", (pendingAnon ?? []).length === 0);
  const { data: usersAnon } = await anon.from("users").select("id");
  check("cannot read the users table", (usersAnon ?? []).length === 0);
  const { data: auditRows } = await anon.from("audit_logs").select("id");
  check("audit log returns no rows to visitors", (auditRows ?? []).length === 0);
  const insertAnon = await anon.from("favorites").insert({ user_id: "00000000-0000-0000-0000-000000000000", school_id: schoolsAnon![0]!.id });
  check("cannot write favorites without signing in", Boolean(insertAnon.error));
  const rpcAnon = await anon.rpc("admin_dashboard_stats");
  check("cannot call admin RPCs", Boolean(rpcAnon.error));

  console.log("\nSigned-in member");
  const member = await login("tilek@example.com", userPassword);
  const { data: school } = await service.from("schools").select("id,slug").eq("slug", "tengri-stem-gymnasium").single();
  await service.from("reviews").delete().eq("school_id", school!.id).eq("user_id", member.id);
  await service.from("community_posts").delete().eq("user_id", member.id).like("title", "[verify]%");

  const { data: ratingBefore } = await anon.from("schools").select("rating_count,rating_avg").eq("id", school!.id).single();
  const body = "We visited twice and spoke with several teachers; the lab equipment and the calm atmosphere impressed us a lot.";
  const created = await member.client
    .from("reviews")
    .insert({ school_id: school!.id, user_id: member.id, rating: 5, title: "[verify] Great place", body, body_hash: "forged", status: "published", helpful_count: 99, is_flagged: false })
    .select("id,status,helpful_count,body_hash")
    .single();
  check("can submit a review", !created.error, created.error?.message);
  check("review is forced into 'pending' even if the client asks for 'published'", created.data?.status === "pending");
  check("client cannot forge helpful_count or body_hash", created.data?.helpful_count === 0 && created.data?.body_hash !== "forged");

  const { data: ratingWhilePending } = await anon.from("schools").select("rating_count,rating_avg").eq("id", school!.id).single();
  const { data: visibleToAnon } = await anon.from("reviews").select("id").eq("id", created.data!.id);
  check("pending review is hidden from the public", (visibleToAnon ?? []).length === 0);
  check(
    "pending review does not change the school rating",
    ratingWhilePending?.rating_count === ratingBefore?.rating_count && ratingWhilePending?.rating_avg === ratingBefore?.rating_avg
  );

  const selfPublish = await member.client.from("reviews").update({ status: "published" }).eq("id", created.data!.id).select("status").single();
  check("author cannot self-approve", selfPublish.data?.status !== "published");

  const duplicate = await member.client.from("reviews").insert({ school_id: school!.id, user_id: member.id, rating: 4, title: "Second", body, body_hash: "" });
  check("second review for the same school is rejected", Boolean(duplicate.error));

  const spam = await member.client.from("community_posts").insert({
    category_id: (await service.from("community_categories").select("id").eq("slug", "preschool").single()).data!.id,
    user_id: member.id, title: "[verify] Cheap deals", body: "Visit http://a.example http://b.example http://c.example now for amazing casino offers", body_hash: "",
  });
  check("spammy post (many links / blocked words) is rejected", Boolean(spam.error) && /spam_detected/.test(spam.error?.message ?? ""), spam.error?.message);

  const otherUser = await member.client.from("profiles").update({ display_name: "Hacked" }).eq("user_id", (await login("sara@example.com", userPassword)).id).select("user_id");
  check("cannot edit another member's profile", (otherUser.data ?? []).length === 0);

  const selfRole = await member.client.from("users").update({ role: "admin" }).eq("id", member.id).select("role");
  check("cannot promote self to admin", (selfRole.data ?? []).length === 0);
  const { data: me } = await member.client.from("users").select("role").eq("id", member.id).single();
  check("role is still 'user'", me?.role === "user");

  const adminRpc = await member.client.rpc("admin_dashboard_stats");
  check("members cannot read admin statistics", Boolean(adminRpc.error));
  const saveRpc = await member.client.rpc("admin_save_school", { p: {} });
  check("members cannot call admin_save_school", Boolean(saveRpc.error));
  const schoolWrite = await member.client.from("schools").update({ is_featured: true }).eq("id", school!.id).select("id");
  check("members cannot edit schools", (schoolWrite.data ?? []).length === 0);

  // rate limit: a 4th submission within 24h is refused
  const aigerim = await login("aigerim@example.com", userPassword);
  await service.from("community_posts").delete().eq("user_id", aigerim.id).like("title", "[verify]%");
  const { data: cat } = await service.from("community_categories").select("id").eq("slug", "elementary").single();
  const existingToday = await service.from("community_posts").select("id", { count: "exact", head: true }).eq("user_id", aigerim.id).gte("created_at", new Date(Date.now() - 86_400_000).toISOString());
  let lastError = "";
  for (let i = 0; i < 4; i++) {
    const res = await aigerim.client.from("community_posts").insert({
      category_id: cat!.id, user_id: aigerim.id, title: `[verify] rate limit probe ${i} ${Date.now()}`,
      body: `Probe message number ${i} written at ${Date.now()}-${Math.random()} to exercise the limiter.`, body_hash: "",
    });
    if (res.error) lastError = res.error.message;
  }
  check("more than 3 posts per 24 hours is rate limited", /rate_limited/.test(lastError), `existing today: ${existingToday.count}; error: ${lastError}`);

  console.log("\nModerator");
  const mod = await login("moderator@edumap.kg", adminPassword);
  const approve = await mod.client.from("reviews").update({ status: "published", moderation_note: null }).eq("id", created.data!.id).select("status,moderated_by").single();
  check("moderator can approve a review", approve.data?.status === "published", approve.error?.message);
  check("approval is stamped with the moderator", approve.data?.moderated_by === mod.id);
  const { data: ratingAfter } = await anon.from("schools").select("rating_count,rating_avg").eq("id", school!.id).single();
  check("approved review now counts towards the school's rating", (ratingAfter?.rating_count ?? 0) === (ratingBefore?.rating_count ?? 0) + 1);
  const modSchool = await mod.client.from("schools").update({ is_featured: true }).eq("id", school!.id).select("id");
  check("moderator cannot edit schools", (modSchool.data ?? []).length === 0);
  const modStats = await mod.client.rpc("admin_dashboard_stats");
  check("moderator can read dashboard stats", !modStats.error);

  console.log("\nAdministrator");
  const admin = await login(process.env.SEED_ADMIN_EMAIL ?? "admin@edumap.kg", adminPassword);
  const draftInsert = await admin.client.rpc("admin_save_school", {
    p: {
      slug: "verify-temp-school", name: { en: "Verify Temp School" }, city_id: (await service.from("cities").select("id").eq("slug", "bishkek").single()).data!.id,
      school_type: "private", education_systems: ["national"], grade_from: 1, grade_to: 11, status: "draft",
      location: { lat: 42.87, lng: 74.6, address: { en: "Test street" } }, languages: [{ code: "en", is_primary: true }],
      programs: [{ kind: "sport", name: { en: "Tennis" } }], facilities: [{ facility_key: "gym" }], media: [], faqs: [],
    } as never,
  });
  check("admin can create a school transactionally", !draftInsert.error, draftInsert.error?.message);
  const { data: draftVisible } = await anon.from("schools").select("id").eq("slug", "verify-temp-school");
  check("draft school is invisible to visitors", (draftVisible ?? []).length === 0);
  const { data: sportsFlag } = await admin.client.from("schools").select("has_sports").eq("slug", "verify-temp-school").single();
  check("sports flag is maintained by trigger", sportsFlag?.has_sports === true);
  const { data: audit } = await admin.client.from("audit_logs").select("id").eq("entity_type", "schools").limit(1);
  check("admin actions are written to the audit log", (audit ?? []).length > 0);
  if (draftInsert.data) await admin.client.from("schools").delete().eq("id", draftInsert.data as unknown as string);

  const optionAdd = await admin.client.from("facility_types").insert({ key: "verify_planetarium", name: { en: "Planetarium", ru: "Планетарий", kg: "Планетарий" }, icon: "check" });
  check("admin can add a facility option", !optionAdd.error, optionAdd.error?.message);
  const memberOption = await member.client.from("facility_types").insert({ key: "verify_hack", name: { en: "Hack" } }).select("key");
  check("members cannot add options", (memberOption.data ?? []).length === 0);
  const unknownFacility = await admin.client.rpc("admin_save_school", {
    p: { slug: "verify-bad-option", name: { en: "Bad" }, city_id: (await service.from("cities").select("id").eq("slug", "bishkek").single()).data!.id, school_type: "private",
      education_systems: ["no_such_system"], grade_from: 1, grade_to: 11, status: "draft", languages: [], programs: [], facilities: [], media: [], faqs: [] } as never,
  });
  check("unknown education system is rejected by the database", Boolean(unknownFacility.error));
  const inUse = await admin.client.from("education_systems").delete().eq("key", "national");
  check("an option used by schools cannot be deleted", Boolean(inUse.error));
  await admin.client.from("facility_types").delete().eq("key", "verify_planetarium");

  console.log("\nContact form");
  await service.from("contact_messages").delete().like("email", "verify-%@example.com");
  const contactArgs = (n: number, extra: Partial<{ message: string }> = {}) => ({
    p_name: "Verify Visitor", p_email: "verify-contact@example.com", p_topic: "support", p_school: "",
    p_message: extra.message ?? `Please help me find the right school number ${n} at ${Date.now()}.`, p_lang: "en",
  });
  const sent = await anon.rpc("submit_contact_message", contactArgs(1));
  check("a visitor can send a contact message", !sent.error, sent.error?.message);
  const directInsert = await anon.from("contact_messages").insert({ name: "Direct", email: "verify-direct@example.com", topic: "other", message: "Bypassing the function entirely." });
  check("visitors cannot insert contact messages directly", Boolean(directInsert.error));
  const anonRead = await anon.from("contact_messages").select("id");
  check("visitors cannot read contact messages", (anonRead.data ?? []).length === 0);
  const memberRead = await member.client.from("contact_messages").select("id");
  check("members cannot read contact messages", (memberRead.data ?? []).length === 0);
  const modRead = await mod.client.from("contact_messages").select("id");
  check("moderators can read contact messages", (modRead.data ?? []).length > 0, modRead.error?.message);
  const modMsg = await mod.client.from("contact_messages").update({ status: "read" }).eq("id", modRead.data![0]!.id).select("handled_by").single();
  check("moderators can handle contact messages and are recorded", modMsg.data?.handled_by === mod.id, modMsg.error?.message);
  const modDel = await mod.client.from("contact_messages").delete().eq("id", modRead.data![0]!.id).select("id");
  check("moderators cannot delete contact messages", (modDel.data ?? []).length === 0);
  const spamContact = await anon.rpc("submit_contact_message", contactArgs(2, { message: "Visit http://a.example http://b.example http://c.example for casino bonuses" }));
  check("spammy contact messages are rejected", /spam_detected/.test(spamContact.error?.message ?? ""), spamContact.error?.message);
  const dupContact = await anon.rpc("submit_contact_message", contactArgs(1, { message: (await service.from("contact_messages").select("message").like("email", "verify-contact@%").limit(1).single()).data!.message }));
  check("the same message is not accepted twice", /duplicate_content/.test(dupContact.error?.message ?? ""), dupContact.error?.message);
  await anon.rpc("submit_contact_message", contactArgs(3));
  await anon.rpc("submit_contact_message", contactArgs(4));
  const limited = await anon.rpc("submit_contact_message", contactArgs(5));
  check("more than 3 messages per address per day are rate limited", /rate_limited/.test(limited.error?.message ?? ""), limited.error?.message);
  const adminRead = await admin.client.from("contact_messages").select("id,status").like("email", "verify-contact@%");
  check("administrators can read contact messages", (adminRead.data ?? []).length === 3);
  const handled = await admin.client.from("contact_messages").update({ status: "resolved" }).eq("id", adminRead.data![0]!.id).select("handled_by").single();
  check("resolving a message records who handled it", handled.data?.handled_by === admin.id, handled.error?.message);
  await service.from("contact_messages").delete().like("email", "verify-%@example.com");

  console.log("\nFees");
  const bishkek = (await service.from("cities").select("id").eq("slug", "bishkek").single()).data!.id;
  const feeSchool = (patch: Record<string, unknown>) => admin.client.rpc("admin_save_school", {
    p: { slug: "verify-fee-school", name: { en: "Verify Fee School" }, city_id: bishkek, school_type: "private", education_systems: ["national"], grade_from: 1, grade_to: 11,
      status: "published", languages: [], programs: [], facilities: [], media: [], faqs: [], ...patch } as never,
  });
  await service.from("schools").delete().eq("slug", "verify-fee-school");
  const yearly = await feeSchool({ fee_min: 400000, fee_max: 500000, fee_period: "year", fee_billing_months: 10, fee_items: [{ item_key: "meals", included: true }, { item_key: "uniform", included: false, extra_amount: 6000, extra_period: "one_time" }] });
  check("admin can save a yearly fee with covered items", !yearly.error, yearly.error?.message);
  const { data: yr } = await anon.from("schools").select("tuition_min,tuition_max,fee_period").eq("slug", "verify-fee-school").single();
  check("a yearly fee is converted to a monthly equivalent over the school year", yr?.tuition_min === 40000 && yr?.tuition_max === 50000 && yr?.fee_period === "year", JSON.stringify(yr));
  const quarterly = await feeSchool({ id: yearly.data, fee_min: 27000, fee_max: null, fee_period: "quarter", fee_billing_months: 9, fee_items: [] });
  const { data: qr } = await anon.from("schools").select("tuition_min,tuition_max").eq("slug", "verify-fee-school").single();
  check("a quarterly fee is converted too (27 000 per quarter over 9 months = 12 000 per month)", !quarterly.error && qr?.tuition_min === 12000 && qr?.tuition_max === null, quarterly.error?.message ?? JSON.stringify(qr));
  const monthly = await feeSchool({ id: yearly.data, fee_min: 15000, fee_max: 20000, fee_period: "month", fee_billing_months: 9, fee_items: [{ item_key: "meals", included: true }] });
  const { data: mr } = await anon.from("schools").select("tuition_min,tuition_max").eq("slug", "verify-fee-school").single();
  check("a monthly fee stays as entered", !monthly.error && mr?.tuition_min === 15000 && mr?.tuition_max === 20000);
  const badRange = await feeSchool({ id: yearly.data, fee_min: 500, fee_max: 100 });
  check("a maximum below the minimum is rejected", Boolean(badRange.error));
  const badMonths = await feeSchool({ id: yearly.data, fee_min: 500, fee_billing_months: 6 });
  check("a school year shorter than 9 months is rejected", Boolean(badMonths.error));
  const unknownItem = await feeSchool({ id: yearly.data, fee_items: [{ item_key: "no_such_item", included: true }] });
  check("unknown fee items are rejected", Boolean(unknownItem.error));
  const includedWithPrice = await feeSchool({ id: yearly.data, fee_items: [{ item_key: "meals", included: true, extra_amount: 100, extra_period: "month" }] });
  const { data: mealsRow } = await service.from("school_fee_items").select("extra_amount").eq("school_id", yearly.data as unknown as string).eq("item_key", "meals").maybeSingle();
  check("an included item never keeps an extra price", !includedWithPrice.error && mealsRow?.extra_amount === null);
  const halfPrice = await feeSchool({ id: yearly.data, fee_items: [{ item_key: "meals", included: false, extra_amount: 100 }] });
  check("an extra cost needs both an amount and how often it is paid", Boolean(halfPrice.error));
  const memberFee = await member.client.from("school_fee_items").insert({ school_id: yearly.data as unknown as string, item_key: "meals", included: true });
  check("members cannot edit fee items", Boolean(memberFee.error));
  await feeSchool({ id: yearly.data, status: "draft", fee_items: [{ item_key: "meals", included: true }] });
  const { data: draftFees } = await anon.from("school_fee_items").select("item_key").eq("school_id", yearly.data as unknown as string);
  check("fee items of an unpublished school are hidden from visitors", (draftFees ?? []).length === 0);
  const feeInUse = await admin.client.from("fee_items").delete().eq("key", "meals");
  check("a fee item used by schools cannot be deleted", Boolean(feeInUse.error));
  await service.from("schools").delete().eq("slug", "verify-fee-school");

  console.log("\nSchool day and accounts");
  await service.from("schools").delete().eq("slug", "verify-hours-school");
  const hoursSchool = (patch: Record<string, unknown>) => admin.client.rpc("admin_save_school", {
    p: { slug: "verify-hours-school", name: { en: "Verify Hours School" }, city_id: bishkek, school_type: "private", education_systems: ["national"], grade_from: 1, grade_to: 11,
      status: "published", languages: [], programs: [], facilities: [], media: [], faqs: [], fee_items: [], ...patch } as never,
  });
  const hours = await hoursSchool({ opening_time: "08:30", closing_time: "15:00", working_days: [1, 2, 3, 4, 5, 6] });
  check("admin can save opening hours and working days", !hours.error, hours.error?.message);
  const { data: hr } = await anon.from("schools").select("opening_time,closing_time,working_days").eq("slug", "verify-hours-school").single();
  check("the school day is stored and public", hr?.opening_time === "08:30:00" && hr?.closing_time === "15:00:00" && hr?.working_days?.join() === "1,2,3,4,5,6", JSON.stringify(hr));
  const backwards = await hoursSchool({ id: hours.data, opening_time: "15:00", closing_time: "08:30" });
  check("closing before opening is rejected", Boolean(backwards.error));
  const badDay = await hoursSchool({ id: hours.data, working_days: [1, 8] });
  check("a working day outside 1-7 is rejected", Boolean(badDay.error));
  await service.from("schools").delete().eq("slug", "verify-hours-school");

  const tempEmail = `verify-delete-${Date.now()}@example.com`;
  const tempUser = await service.auth.admin.createUser({ email: tempEmail, password: userPassword, email_confirm: true, user_metadata: { display_name: "Verify Delete" } });
  const tempId = tempUser.data.user!.id;
  const temp = await login(tempEmail, userPassword);
  const tempSchool = (await service.from("schools").select("id").eq("slug", "tengri-stem-gymnasium").single()).data!.id;
  await temp.client.from("favorites").insert({ user_id: tempId, school_id: tempSchool });
  await temp.client.from("reviews").insert({ school_id: tempSchool, user_id: tempId, rating: 4, title: "[verify] to be deleted", body: "This review should disappear together with the account that wrote it, as promised.", body_hash: "" });
  const deleted = await temp.client.rpc("delete_my_account");
  check("a member can delete their own account", !deleted.error, deleted.error?.message);
  const gone = await service.auth.admin.getUserById(tempId);
  check("the account no longer exists", !gone.data.user);
  const { count: leftovers } = await service.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", tempId);
  const { count: leftFav } = await service.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", tempId);
  check("their reviews and saved items are deleted with it", leftovers === 0 && leftFav === 0);
  const staffDelete = await mod.client.rpc("delete_my_account");
  check("staff accounts cannot delete themselves", Boolean(staffDelete.error) && /staff_cannot_self_delete/.test(staffDelete.error?.message ?? ""), staffDelete.error?.message);
  const anonDelete = await anon.rpc("delete_my_account");
  check("visitors cannot call delete_my_account", Boolean(anonDelete.error));
  await service.from("reviews").delete().like("title", "[verify]%");

  console.log("\nCorrections and school staff");
  const target = (await service.from("schools").select("id").eq("slug", "tengri-stem-gymnasium").single()).data!.id;
  await service.from("correction_requests").delete().like("message", "[verify]%");
  const correction = (n: number, extra: Partial<{ message: string; email: string; school: string }> = {}) => anon.rpc("submit_correction_request", {
    p_school: extra.school ?? target, p_topic: "contact", p_message: extra.message ?? `[verify] The phone number is wrong, version ${n} ${Date.now()}`, p_source: "", p_name: "", p_email: extra.email ?? "", p_lang: "en",
  });
  const c1 = await correction(1, { email: "verify-corr@example.com" });
  check("a visitor can report a correction without an account", !c1.error, c1.error?.message);
  const directCorr = await anon.from("correction_requests").insert({ school_id: target, topic: "other", message: "[verify] direct insert attempt" });
  check("corrections cannot be inserted directly", Boolean(directCorr.error));
  const readCorr = await anon.from("correction_requests").select("id");
  check("visitors cannot read corrections", (readCorr.data ?? []).length === 0);
  const memberReadCorr = await member.client.from("correction_requests").select("id");
  check("members cannot read other people's corrections", (memberReadCorr.data ?? []).length === 0);
  const spamCorr = await correction(2, { message: "[verify] http://a.example http://b.example http://c.example casino" });
  check("spammy corrections are rejected", /spam_detected/.test(spamCorr.error?.message ?? ""), spamCorr.error?.message);
  const noSchool = await correction(3, { school: "00000000-0000-0000-0000-000000000000" });
  check("a correction for an unknown school is refused", Boolean(noSchool.error));
  const draftSchool = await correction(4, { school: (await service.from("schools").select("id").neq("status", "published").limit(1).maybeSingle()).data?.id ?? "00000000-0000-0000-0000-000000000000" });
  check("a correction for an unpublished school is refused", Boolean(draftSchool.error));
  for (let n = 5; n < 10; n++) await correction(n, { email: "verify-corr@example.com" });
  const limitedCorr = await correction(10, { email: "verify-corr@example.com" });
  check("more than 5 corrections per address per day are rate limited", /rate_limited/.test(limitedCorr.error?.message ?? ""), limitedCorr.error?.message);
  const modCorr = await mod.client.from("correction_requests").select("id").like("message", "[verify]%").limit(1).single();
  check("moderators can read corrections", Boolean(modCorr.data), modCorr.error?.message);
  const modHandled = await mod.client.from("correction_requests").update({ status: "reviewing" }).eq("id", modCorr.data!.id).select("handled_by").single();
  check("moderators can handle corrections and are recorded", modHandled.data?.handled_by === mod.id, modHandled.error?.message);
  const modCorrDel = await mod.client.from("correction_requests").delete().eq("id", modCorr.data!.id).select("id");
  check("moderators cannot delete corrections", (modCorrDel.data ?? []).length === 0);
  const adminCorr = await admin.client.from("correction_requests").select("id,status").like("message", "[verify]%").limit(1).single();
  const handledCorr = await admin.client.from("correction_requests").update({ status: "applied" }).eq("id", adminCorr.data!.id).select("handled_by").single();
  check("administrators can handle corrections and are recorded", handledCorr.data?.handled_by === admin.id, handledCorr.error?.message);
  await service.from("correction_requests").delete().like("message", "[verify]%");

  const staffNoContact = await anon.rpc("submit_correction_request", { p_school: target, p_topic: "missing", p_message: "[verify] We are the school and the opening hours are missing.", p_source: "", p_name: "", p_email: "", p_lang: "en", p_role: "school_staff", p_phone: "" });
  check("school staff must leave an email or phone so the information can be verified", /contact_needed/.test(staffNoContact.error?.message ?? ""), staffNoContact.error?.message);
  const staff = await anon.rpc("submit_correction_request", { p_school: target, p_topic: "missing", p_message: "[verify] We are the school and the opening hours are missing.", p_source: "", p_name: "Office", p_email: "", p_lang: "en", p_role: "school_staff", p_phone: "+996 312 000 999" });
  check("school staff can send missing information", !staff.error, staff.error?.message);
  const { data: staffRow } = await service.from("correction_requests").select("reporter_role,reporter_phone,topic").like("message", "[verify] We are the school%").single();
  check("the sender's role and phone are stored for the administrator", staffRow?.reporter_role === "school_staff" && staffRow?.reporter_phone === "+996 312 000 999" && staffRow?.topic === "missing");
  await service.from("correction_requests").delete().like("message", "[verify]%");

  const direct = await member.client.from("schools").update({ phone: "+996 700 111 111" }).eq("id", target).select("id");
  check("members cannot edit a school directly: only administrators change school pages", (direct.data ?? []).length === 0);

  console.log("\nWhatsApp and interest statistics");
  const wa = await admin.client.rpc("admin_save_school", { p: { slug: "verify-wa-school", name: { en: "Verify WA School" }, city_id: bishkek, school_type: "private", education_systems: ["national"], grade_from: 1, grade_to: 11, status: "published", whatsapp: "+996555123456", languages: [], programs: [], facilities: [], media: [], faqs: [], fee_items: [] } as never });
  check("an administrator can save a WhatsApp number", !wa.error, wa.error?.message);
  const badWa = await admin.client.rpc("admin_save_school", { p: { id: wa.data, slug: "verify-wa-school", name: { en: "Verify WA School" }, city_id: bishkek, school_type: "private", education_systems: ["national"], grade_from: 1, grade_to: 11, status: "published", whatsapp: "0555 123 456", languages: [], programs: [], facilities: [], media: [], faqs: [], fee_items: [] } as never });
  check("a WhatsApp number must be in international format in the database", Boolean(badWa.error));
  const waId = wa.data as unknown as string;
  // map links kept next to the address
  const withLinks = (loc: Record<string, unknown>) => admin.client.rpc("admin_save_school", { p: { id: waId, slug: "verify-wa-school", name: { en: "Verify WA School" }, city_id: bishkek, school_type: "private", education_systems: ["national"], grade_from: 1, grade_to: 11, status: "published", whatsapp: "+996555123456", location: { lat: "", lng: "", address: { en: "Test street 1" }, district: "", ...loc }, languages: [], programs: [], facilities: [], media: [], faqs: [], fee_items: [] } as never });
  const linked = await withLinks({ google_maps_url: "https://maps.app.goo.gl/AbCdEf123", twogis_url: "https://2gis.kg/bishkek?m=74.6%2C42.8%2F16" });
  const linkRow = await service.from("school_locations").select("google_maps_url,twogis_url,lat").eq("school_id", waId).single();
  check("a school keeps the Google Maps and 2GIS links next to its address", !linked.error && linkRow.data?.google_maps_url === "https://maps.app.goo.gl/AbCdEf123" && linkRow.data?.twogis_url?.startsWith("https://2gis.kg/") && linkRow.data?.lat === null, linked.error?.message);
  check("a map link that is not https is refused by the database", Boolean((await withLinks({ google_maps_url: "http://maps.app.goo.gl/x" })).error));
  check("a map link longer than 500 characters is refused by the database", Boolean((await withLinks({ twogis_url: `https://2gis.kg/${"a".repeat(500)}` })).error));
  const cleared = await withLinks({});
  const clearedRow = await service.from("school_locations").select("google_maps_url,twogis_url").eq("school_id", waId).single();
  check("saving without links clears them", !cleared.error && clearedRow.data?.google_maps_url === null && clearedRow.data?.twogis_url === null, cleared.error?.message);
  const stat = async () => (await admin.client.rpc("admin_school_stats_detail", { p_school: waId, p_days: 30 })).data as { contacts: Record<string, number>; sections: Record<string, number>; time: Record<string, number>; views: number; compare_adds: number } | null;
  await anon.rpc("track_event", { p_type: "school_view", p_entity: waId, p_lang: "kg", p_meta: "directory" });
  await anon.rpc("track_event", { p_type: "contact_click", p_entity: waId, p_lang: "kg", p_meta: "whatsapp" });
  await anon.rpc("track_event", { p_type: "section_view", p_entity: waId, p_lang: "kg", p_meta: "tuition" });
  await anon.rpc("track_event", { p_type: "time_on_page", p_entity: waId, p_lang: "kg", p_meta: "s10_30" });
  await anon.rpc("track_event", { p_type: "compare_add", p_entity: waId, p_lang: "kg" });
  const s1 = await stat();
  check("views, WhatsApp presses, sections, time and comparisons are counted for the school", s1?.views === 1 && s1.contacts.whatsapp === 1 && s1.sections.tuition === 1 && s1.time.s10_30 === 1 && s1.compare_adds === 1, JSON.stringify(s1));
  await anon.rpc("track_event", { p_type: "contact_click", p_entity: waId, p_lang: "kg" });
  await anon.rpc("track_event", { p_type: "contact_click", p_entity: "00000000-0000-0000-0000-000000000000", p_lang: "kg", p_meta: "whatsapp" });
  const s2 = await stat();
  check("a press without a button name, or for an unknown school, is not counted", s2?.contacts.whatsapp === 1 && Object.keys(s2.contacts).length === 1);
  const memberStats = await member.client.rpc("admin_school_stats", { p_days: 30 });
  check("members cannot read school statistics", Boolean(memberStats.error));
  const anonStats = await anon.rpc("admin_school_stats_detail", { p_school: waId, p_days: 30 });
  check("visitors cannot read school statistics", Boolean(anonStats.error));
  const modStats2 = await mod.client.rpc("admin_school_stats", { p_days: 30 });
  check("moderators cannot read school statistics", Boolean(modStats2.error));
  // the introduction campaign list is for administrators only
  const outreachRow = { school_id: waId, status: "sent" as const, channel: "whatsapp" as const };
  const anonOutreach = await anon.from("school_outreach").insert(outreachRow);
  check("visitors cannot record outreach", Boolean(anonOutreach.error));
  const memberOutreach = await member.client.from("school_outreach").insert(outreachRow);
  check("members cannot record outreach", Boolean(memberOutreach.error));
  const modOutreach = await mod.client.from("school_outreach").insert(outreachRow);
  check("moderators cannot record outreach", Boolean(modOutreach.error));
  const adminOutreach = await admin.client.from("school_outreach").upsert({ ...outreachRow, note: "verify" }).select("status").single();
  check("administrators can record outreach", adminOutreach.data?.status === "sent", adminOutreach.error?.message);
  const readOutreach = async (who: { client: typeof admin.client }) => ((await who.client.from("school_outreach").select("school_id").eq("school_id", waId)).data ?? []).length;
  check("only administrators can read outreach", (await readOutreach(admin)) === 1 && (await readOutreach(mod)) === 0 && (await readOutreach(member)) === 0);
  const badOutreach = await admin.client.from("school_outreach").upsert({ school_id: waId, status: "spam" as never });
  check("an unknown outreach status is refused", Boolean(badOutreach.error));
  await service.from("school_outreach").delete().eq("school_id", waId);
  const adminStats = await admin.client.rpc("admin_school_stats", { p_days: 30 });
  check("administrators see the summary for all schools", !adminStats.error && (adminStats.data ?? []).some((r) => r.school_id === waId && Number(r.whatsapp) === 1), adminStats.error?.message);
  const directEvents = await anon.from("page_events").select("id");
  check("visitors cannot read the raw events", (directEvents.data ?? []).length === 0);
  await service.from("schools").delete().eq("slug", "verify-wa-school");

  console.log("\nOpinions about the site");
  const opinionText = `[verify] The site made choosing a school much easier for our family ${Date.now()}.`;
  await service.from("site_testimonials").delete().like("quote->>en", "[verify]%");
  const anonOpinion = await anon.rpc("submit_site_testimonial", { p_quote: opinionText, p_lang: "en", p_title: "Parent" });
  check("visitors cannot send an opinion", Boolean(anonOpinion.error));
  const shortOpinion = await member.client.rpc("submit_site_testimonial", { p_quote: "Too short", p_lang: "en", p_title: "" });
  check("an opinion shorter than 20 characters is refused", Boolean(shortOpinion.error));
  const spamOpinion = await member.client.rpc("submit_site_testimonial", { p_quote: "[verify] http://a.example http://b.example http://c.example casino", p_lang: "en", p_title: "" });
  check("a spammy opinion is refused", /spam_detected/.test(spamOpinion.error?.message ?? ""), spamOpinion.error?.message);
  const sentOp = await member.client.rpc("submit_site_testimonial", { p_quote: opinionText, p_lang: "en", p_title: "Parent" });
  check("a member can send an opinion", !sentOp.error, sentOp.error?.message);
  const { data: pendingPublic } = await anon.from("public_testimonials").select("id").eq("id", sentOp.data as string);
  check("it is not public while it waits for review", (pendingPublic ?? []).length === 0);
  const rawRead = await anon.from("site_testimonials").select("id");
  check("visitors cannot read the opinions table directly", (rawRead.data ?? []).length === 0);
  const selfPublishOp = await member.client.from("site_testimonials").update({ status: "published" }).eq("id", sentOp.data as string).select("status");
  check("a member cannot approve their own opinion", (selfPublishOp.data ?? []).length === 0);
  const again = await member.client.rpc("submit_site_testimonial", { p_quote: opinionText + " Edited.", p_lang: "en", p_title: "Parent" });
  const { count: rows } = await service.from("site_testimonials").select("id", { count: "exact", head: true }).eq("user_id", member.id);
  check("sending again replaces the earlier opinion (one per member)", !again.error && rows === 1);
  const approved = await admin.client.from("site_testimonials").update({ status: "published" }).eq("id", sentOp.data as string).select("reviewed_by").single();
  check("an administrator approves it and is recorded", approved.data?.reviewed_by === admin.id, approved.error?.message);
  const { data: shown } = await anon.from("public_testimonials").select("*").eq("id", sentOp.data as string).single();
  check("once approved it is public, without the account id", Boolean(shown) && !("user_id" in (shown as object)) && !("admin_note" in (shown as object)));
  const edited = await member.client.rpc("submit_site_testimonial", { p_quote: opinionText + " Edited again.", p_lang: "en", p_title: "Parent" });
  const { data: afterEdit } = await anon.from("public_testimonials").select("id").eq("id", sentOp.data as string);
  check("editing a published opinion sends it back to review", !edited.error && (afterEdit ?? []).length === 0);
  const noConsent = await admin.client.from("site_testimonials").insert({ kind: "invited", author_name: "Guest", quote: { en: "[verify] guest opinion without a permission note" } });
  check("a guest opinion cannot be saved without a permission note", Boolean(noConsent.error));
  const guest = await admin.client.from("site_testimonials").insert({ kind: "invited", author_name: "Guest", quote: { en: "[verify] guest opinion with permission" }, consent_note: "Agreed by email", status: "published" }).select("id").single();
  check("an administrator can add a guest opinion with a permission note", !guest.error, guest.error?.message);
  const memberGuest = await member.client.from("site_testimonials").insert({ kind: "invited", author_name: "Fake", quote: { en: "[verify] member trying to add a guest" }, consent_note: "no", status: "published" });
  check("members cannot add guest opinions", Boolean(memberGuest.error));
  const tooLong = await admin.client.from("site_testimonials").insert({ kind: "invited", author_name: "Guest", quote: { en: "x".repeat(401) }, consent_note: "Agreed by email" });
  check("an opinion longer than 400 characters is refused", Boolean(tooLong.error));
  const deletedOwn = await member.client.from("site_testimonials").delete().eq("user_id", member.id).select("id");
  check("a member can delete their own opinion", (deletedOwn.data ?? []).length === 1);
  await service.from("site_testimonials").delete().like("quote->>en", "[verify]%");

  const homeAds = await admin.client.from("advertisements").select("id").eq("placement", "home_grid");
  check("the home page card placement exists and has sample campaigns", (homeAds.data ?? []).length >= 2);

  const adAnon = await anon.from("advertisements").select("id,is_active,starts_at,ends_at");
  check("visitors only see live ads", (adAnon.data ?? []).every((a) => a.is_active && new Date(a.starts_at) <= new Date()));
  const before = await service.from("advertisements").select("id,impressions").limit(1).single();
  await anon.rpc("track_ad_event", { p_ad: before.data!.id, p_event: "impression", p_lang: "kg" });
  const after = await service.from("advertisements").select("impressions").eq("id", before.data!.id).single();
  check("ad impressions are counted through the RPC", Number(after.data?.impressions) === Number(before.data?.impressions) + 1);

  // cleanup
  await service.from("reviews").delete().eq("school_id", school!.id).eq("user_id", member.id);
  await service.from("community_posts").delete().like("title", "[verify]%");

  console.log(`\n${failed === 0 ? "All" : `${passed}/${passed + failed}`} checks ${failed === 0 ? `passed (${passed})` : "passed — FAILURES above"}\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

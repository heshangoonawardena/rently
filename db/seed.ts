import { sql, Table } from "drizzle-orm";

import { db, DB } from "@/db/db";
import * as seeds from "@/db/seeds";
import * as schema from "@/db/schema/index";

async function resetTable(db: DB, table: Table) {
	return db.execute(sql`truncate table ${table} restart identity cascade`);
}

async function main() {
	try {
		console.log("🗑️ Resetting database tables...");
		for (const table of [
			schema.notificationLog,
			schema.notificationPreference,
			schema.leaseDocument,
			schema.tenantDocument,
			schema.unitDocument,
			schema.inspection,
			schema.repairUpdate,
			schema.repairRequest,
			schema.utilityBill,
			schema.utility,
			schema.payment,
			schema.lease,
			schema.tenant,
			schema.unit,
			schema.invitation,
			schema.member,
			schema.organization,
			schema.verification,
			schema.account,
			schema.session,
			schema.user,
		]) {
			await resetTable(db, table);
		}

		console.log("\n✅ Database reset completed!\n");

		await seeds.auth(db);
		await seeds.units(db);
		await seeds.tenants(db);
		await seeds.leases(db);
		await seeds.payments(db);
		await seeds.utilities(db);
		await seeds.repairs(db);
		await seeds.inspections(db);
		await seeds.documents(db);

		console.log("🌱 Database seeding completed successfully!");
	} catch (error) {
		console.error("Error during seeding:", error);
		process.exit(1);
	}
}

main();

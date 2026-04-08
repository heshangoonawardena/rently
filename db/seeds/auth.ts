import { DB } from "@/db/db";
import { user, organization, member, account, session } from "@/db/schema/auth";

export const auth = async (db: DB) => {
	// Create user
	const users = await db
		.insert(user)
		.values([
			{
				id: "8CLXlYoFHakQS3TiqJc86zwk784CBdzY",
				name: "Heshan",
				email: "heshangoonawardena@gmail.com",
				emailVerified: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		])
		.returning();

	// Create session
	await db.insert(session).values([
		{
			id: "vGWDliHktzvXUcAb9kiNoWXj2QV9mdnO",
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
			token: "x8zoEsWV0UNeH07UEEPRxyf8OOxk6FvI",
			createdAt: new Date(),
			updatedAt: new Date(),
			userId: users[0].id,
		},
	]);

	// Create account
	await db.insert(account).values([
		{
			id: "5fUR71oKrWaB1TSvx4OF5RZGDrxR8GQ0",
			accountId: users[0].id,
			providerId: "credential",
			userId: users[0].id,
			password:
				"6d505ac34798bbefd4e04c589dce8ea5:8bd4a8721e1caf13a8b71cb7b9ffcb40c9975960e6fdaf4c21939a1a899841a2ffaef7ccc23b01149d6ef1e3096f1f334f1521f24ed7d7d750940c2f93d0535d",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	]);

	// Create organization
	const organizations = await db
		.insert(organization)
		.values([
			{
				id: "org_1",
				name: "Rently Property Management",
				slug: "org-1",
				createdAt: new Date(),
			},
		])
		.returning();

	// Create members
	await db.insert(member).values([
		{
			id: "member_1",
			organizationId: organizations[0].id,
			userId: users[0].id,
			role: "owner",
			createdAt: new Date(),
		},
		{
			id: "member_2",
			organizationId: organizations[0].id,
			userId: users[0].id,
			createdAt: new Date(),
		},
		{
			id: "member_3",
			organizationId: organizations[0].id,
			userId: users[0].id,
			createdAt: new Date(),
		},
	]);

	console.log("Auth data seeded successfully");
};

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
			{
				id: "3gcrOBz2grTR20amB6MlFesshy3Oon7G",
				name: "John",
				email: "heshangoonawardena2@gmail.com",
				emailVerified: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: "zP41e7ZCZBMFpOKA2CwIno0cHmulr9AQ",
				name: "Marcus",
				email: "heshangoonawardena3@gmail.com",
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
		{
			id: "glB404Fehyj2IK2Y3TRtn0xaDyYWAYs5",
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
			token: "xQLZM0Oi5SBKI43oVpFo6pPfQloDoTZF",
			createdAt: new Date(),
			updatedAt: new Date(),
			userId: users[1].id,
		},
		{
			id: "5ONSttp4imp98et8tyChyAT6F3xtL9K5",
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
			token: "xPm0J4TxadiwN8sLUL6RqVaydESpP6Ol",
			createdAt: new Date(),
			updatedAt: new Date(),
			userId: users[2].id,
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
		{
			id: "ysx2IsjGgQzWtyFDEloa7ib3Yh1DMiQK",
			accountId: users[1].id,
			providerId: "credential",
			userId: users[1].id,
			password:
				"c984f4958136e1d639eceef6d449163c:ebeb29ed80ac79c9857ec8763cab0f584165e882f2665e7d34e482d091792584389496d7124cb8506b5740e45bc95ee672fcb3c6c41aacbb21b722f8a4905ffb",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: "Pq2NAfHsn9tfUSwdPjTaKdaKt7WxAUTZ",
			accountId: users[2].id,
			providerId: "credential",
			userId: users[2].id,
			password:
				"0bf153c5990be4bbc4af9866024a141c:63804676a3bfd7d2c3cf8e313fe630922efe99dc7961d054b040edea1aaa6f718ede64c6ec1ecb741a1f72ef7206bc174d62abf34789513c7d15c3004b28ee58",
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
			userId: users[2].id,
			role: "manager",
			createdAt: new Date(),
		},
		{
			id: "member_3",
			organizationId: organizations[0].id,
			userId: users[1].id,
			createdAt: new Date(),
		},
	]);

	console.log("Auth data seeded successfully");
};

import { oc } from "@orpc/contract";
import z from "zod";
import {
	createUnit,
	deleteUnit,
	listUnitInput,
	listUnitOutput,
	unitInput,
	unitOutput,
	updateUnit,
} from "../schemas/unit.schema";

export const base = oc.errors({
	UNAUTHORIZED: {
		status: 401,
		message: "Authentication required",
	},
	FORBIDDEN: {
		status: 403,
		message: "You do not have permission to perform this action",
	},
	NOT_FOUND: {
		status: 404,
		message: "Resource not found",
		data: z.object({
			resourceType: z.string(),
			resourceId: z.number(),
		}),
	},
	CONFLICT: {
		status: 409,
		message: "Resource conflict",
		data: z.object({
			field: z.string(),
			value: z.string(),
		}),
	},
	DOMAIN_RULE_VIOLATION: {
		status: 422,
		message: "Business rule violation",
		data: z.object({
			rule: z.string(),
		}),
	},
});

export const createUnitContract = base
	.route({
		method: "POST",
		path: "/units",
		successStatus: 201,
		summary: "Create a new unit",
		description:
			"Creates a new unit with the provided details. Requires authentication.",
		tags: ["Units"],
	})
	.input(createUnit)
	.output(unitOutput);

export const updateUnitContract = base
	.route({
		method: "PATCH",
		path: "/units/{id}",
		summary: "Update an existing unit",
		description:
			"Updates the details of an existing unit. Requires authentication.",
		tags: ["Units"],
	})
	.input(updateUnit)
	.output(unitOutput);

export const deleteUnitContract = base
	.route({
		method: "DELETE",
		path: "/units/{id}",
		summary: "Delete a unit",
		description: "Soft deletes a unit by setting its status to inactive",
		tags: ["Units"],
	})
	.input(deleteUnit)
	.output(unitOutput);

export const getUnitContract = base
	.route({
		method: "GET",
		path: "/units/{id}",
		summary: "Get a unit",
		description: "Retrieves a single unit by ID.",
		tags: ["Units"],
	})
	.input(unitInput)
	.output(unitOutput);

export const listUnitContract = base
	.route({
		method: "GET",
		path: "/units",
		summary: "List units",
		description:
			"Returns a cursor-paginated list of units with active lease, current rent, and tenant details. activeLease is null if no active or extended lease exists for the unit.",
		tags: ["Units"],
	})
	.input(listUnitInput)
	.output(listUnitOutput);

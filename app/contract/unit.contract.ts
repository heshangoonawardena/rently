import { oc } from "@orpc/contract";
import z from "zod";
import {
	CreateUnit,
	DeleteUnit,
	ListUnitInput,
	ListUnitOutput,
	UnitInput,
	UnitOutput,
	UpdateUnit,
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
	.input(CreateUnit)
	.output(UnitOutput);

export const updateUnitContract = base
	.route({
		method: "PATCH",
		path: "/units/{id}",
		summary: "Update an existing unit",
		description:
			"Updates the details of an existing unit. Requires authentication.",
		tags: ["Units"],
	})
	.input(UpdateUnit)
	.output(UnitOutput);

export const deleteUnitContract = base
	.route({
		method: "DELETE",
		path: "/units/{id}",
		summary: "Delete a unit",
		description: "Soft deletes a unit by setting its status to inactive",
		tags: ["Units"],
	})
	.input(DeleteUnit)
	.output(UnitOutput);

export const getUnitContract = base
	.route({
		method: "GET",
		path: "/units/{id}",
		summary: "Get a unit",
		description: "Retrieves a single unit by ID.",
		tags: ["Units"],
	})
	.input(UnitInput)
	.output(UnitOutput);

export const listUnitContract = base
	.route({
		method: "GET",
		path: "/units",
		summary: "List units",
		description:
			"Lists units with cursor-based pagination and optional status filtering.",
		tags: ["Units"],
	})
	.input(ListUnitInput)
	.output(ListUnitOutput);

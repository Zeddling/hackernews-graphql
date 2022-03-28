import { Prisma } from "@prisma/client";
import { arg, enumType, extendType, inputObjectType, intArg, list, nonNull, objectType, stringArg } from "nexus";

export const Sort = enumType({
    name: "Sort",
    members: ["asc", "desc"]
})

export const Feed = objectType({
    name: "Feed",
    definition(t) {
        t.nonNull.list.nonNull.field("links", { type: Link })
        t.nonNull.int("count")
    }
})

export const LinkOrderByInput = inputObjectType({
    name: "LinkOrderByInput",
    definition(t) {
        t.field("description", { type: Sort })
        t.field("url", { type: Sort })
        t.field("createdAt", { type: Sort })
    }
})

export const Link = objectType({
    name: "Link",
    definition(t) {
        t.nonNull.int("id")
        t.nonNull.string("description")
        t.nonNull.string("url")
        t.nonNull.dateTime("createdAt")
        t.field("postedBy", {
            type: "User",
            resolve(parent, args, context) {
                return context.prisma.link
                    .findUnique({
                        where: {
                            id: parent.id
                        }
                    })
                    .postedBy()
            }
        }),
        t.nonNull.list.nonNull.field("voters", {
            type: "User",
            resolve(parent, args, context) {
                return context.prisma.link
                    .findUnique({ where: { id: parent.id } })
                    .voters()
            }
        })
    }
})

export const LinkQuery = extendType({
    type: "Query",
    definition(t) {
        t.nonNull.field("feed", {
            type: "Feed",
            args: {
                filter: stringArg(),
                orderBy: arg({ type: list(nonNull(LinkOrderByInput)) }),
                skip: intArg(),
                take: intArg(),
            },
            async resolve(parent, args, context) {
                const { userId } = context

                if (!userId) {
                    throw new Error("Unauthorized");
                }

                const where = args.filter ? {
                    OR: [
                        { description: { contains: args.filter } },
                        { url: { contains: args.filter   } }
                    ]
                } : {}

                const links = context.prisma.link.findMany({ 
                    where,
                    skip: args?.skip as number | undefined,
                    orderBy: args?.orderBy as Prisma.Enumerable<Prisma.LinkOrderByWithRelationInput> | undefined,
                    take: args?.take as number | undefined
                })

                const count = await context.prisma.link.count({ where })

                return {
                    links,
                    count
                }
            }
        }),

        t.field("link", {
            type: "Link",
            args: {
                id: nonNull(intArg())
            },
            //  @ts-ignore
            resolve(parent, args, context) {
                let {id} = args
                const { userId } = context

                if (!userId) {
                    throw new Error("Unauthorized");
                }
                return context.prisma.link.findUnique({
                    where: {
                        id
                    }
                })
            }
        })
    },
})

export const LinkMutation = extendType({
    type: "Mutation",
    definition(t) {
        t.nonNull.field("createLink", {
            type: "Link",
            args: {
                description: nonNull(stringArg()),
                url: nonNull(stringArg()),
            },

            resolve(parent, args, context) {
                const {description, url} = args
                const { userId } = context

                if (!userId) {
                    throw new Error("Unauthorized");
                }

                const newLink = context.prisma.link.create({
                    data: {
                        description,
                        url,
                        postedBy: { connect: { id: userId } }
                    }
                })
                return newLink
            }
        }),
        t.nonNull.field("updateLink", {
            type: "Link",
            args: {
                id: nonNull(intArg()),
                description: stringArg(),
                url: stringArg()
            },
            resolve(parent, args, context) {
                const {id, description, url} = args
                const { userId } = context

                if (!userId) {
                    throw new Error("Unauthorized");
                }

                const updated = context.prisma.link.update({
                    where: {
                        id: id
                    },
                    data: {
                        description: description || undefined,
                        url: url || undefined
                    }
                })

                return updated
            }
        }),
        t.nonNull.field("deleteLink", {
            type: "Link",
            args: {
                id: nonNull(intArg())
            },
            resolve(parent, args, context) {
                const {id} = args
                const { userId } = context

                if (!userId) {
                    throw new Error("Unauthorized");
                }

                const deleted = context.prisma.link.delete({
                    where: {
                        id
                    }
                })

                return deleted
            }
        })
    }
})

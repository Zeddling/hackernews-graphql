import * as bcrypt from "bcryptjs"
import * as jwt from "jsonwebtoken"
import { extendType, nonNull, objectType, stringArg } from "nexus";

const TEST_SECRET = "Test Secret"

export const AuthPayload = objectType({
    name: "AuthPayload",
    definition(t) {
        t.nonNull.string("token"),
        t.nonNull.field("user", {
            type: "User"
        })
    }
})

export const AuthMutation = extendType({
    type: "Mutation",
    definition(t) {
        t.nonNull.field("login", {
            type: "AuthPayload",
            args: {
                email: nonNull(stringArg()),
                password: nonNull(stringArg()),
            }, 
            async resolve(parent, args, context) {
                const user = await context.prisma.user.findUnique({
                    where: {
                        email: args.email
                    }
                })

                if (!user) {
                    throw new Error("No such user found");
                }

                const valid = await bcrypt.compare(
                    args.password, user.password
                )

                if (!valid) {
                    throw new Error("Invalid Password");
                }

                const token = jwt.sign({
                    userId: user.id
                }, process.env.REACT_APP_SECRET || TEST_SECRET)

                return {
                    token,
                    user
                }
            }
        }),
        t.nonNull.field("signup", {
            type: "AuthPayload",
            args: {
                email: nonNull(stringArg()),
                name: nonNull(stringArg()),
                password: nonNull(stringArg())
            },
            async resolve(parent, args, context) {
                const { email, name } = args
                const password = await bcrypt.hash(args.password, 10)
                const user = await context.prisma.user.create({
                    data: { email, name, password }
                })
                const token = jwt.sign({
                    userId: user.id
                }, process.env.REACT_APP_SECRET || TEST_SECRET)

                return {
                    token, user
                }
            }
        })
    }
})

const { v4: uuidv4 } = require('uuid');
const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const graphiql = require('graphql-playground-middleware-express');
const {jobs, skills, providers, complex, complexTasks, complexTaskStatus} = require('./data');
const schema = require('./schema');

(async () => {
    const typeDefs = gql`${schema}`;

    const randomIntFromInterval = (min, max) => { // min and max included
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    let providersCache = {}

    const resolvers = {
        Query: {
            skills: (obj, args) => {
                if (args.type) {
                    return skills.filter(skill => skill.type === args.type)
                }
                return skills
            },
            jobs: (obj, args) => {
                if (args.state) {
                    return jobs.filter(job => job.location.state === args.state)
                }
                return jobs
            },
            complex: () => {
                return complex
            },
            providers: () => {
                const uuid = uuidv4()
                providersCache[uuid] = []
                providers.forEach(provider => {
                    setTimeout(() => {
                        providersCache[uuid].push({
                            id: provider.id,
                            price: randomIntFromInterval(30, 100),
                            seen: false,
                        })
                    }, randomIntFromInterval(1000, 10000))
                })

                return {
                    providers: providers,
                    uuid
                }
            },
            providerPrices: (obj, args) => {
                const results = providersCache[args.uuid].filter(provider => !provider.seen);

                providersCache[args.uuid] = providersCache[args.uuid].map(provider => ({
                    ...provider,
                    seen: true
                }))

                const returned = results.map(item => ({
                    id: item.id,
                    price: item.price
                }));
                return returned;
            }
        },
        Mutation: {
            addProvider: (obj, args) => {
                const maxId = providers.reduce((agr, cur) => {
                    if (cur.id > agr) {
                        return cur.id
                    }
                    return agr
                }, 0)
                const newProvider= {
                    id: maxId + 1,
                    ...args.provider,
                }
                // Would add to list of providers here,
                // but with this being serverless and not hooked up to any database,
                // would be pointless
                return newProvider
            }
        },
        Complex: {
            tasks: () => {
                return complexTasks;
            }
        },
        Task: {
            status: (obj, args) => {
                return complexTaskStatus.find(status => status.id === obj.id).status
            }
        }

    };

    const app = express();

    const server = new ApolloServer({
        typeDefs,
        resolvers,
    });

    await server.start();
    server.applyMiddleware({
        app,
        path: '/graphql',
    });

    // app.get(
    //     '/playground',
    //     graphiql({
    //         endpoint: '/graphql',
    //     })
    // );

    app.listen(3000, () => {
        console.log(`🚀🚀🚀 Server ready 🚀🚀🚀`);
    });
})()





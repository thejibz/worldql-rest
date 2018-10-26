process.env.DEBUG = ['worldql-rest']

const request = require('supertest')
const debug = require('debug')('worldql-rest')

describe('Test the worldql path', () => {

    jest.setTimeout(10000)

    let worldql

    beforeEach(function () {
        worldql = require('../bin/www')
    })

    afterEach(function () {
        worldql.close()
    })

    const openAPIschemaWeather = "https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/weatherbit.io/2.0.0/swagger.yaml"
    const openAPIschemaTwitter = "https://raw.githubusercontent.com/thejibz/openapi-directory/master/APIs/twitter.com/1.1/swagger.yaml"
    const openAPIschemaGoogle = "https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/customsearch/v1/swagger.yaml"

    const twitterHeaders = {
        "x-oauth-v1-consumer-key": process.env.WORLDQL_TWITTER_CONSUMER_KEY,
        "x-oauth-v1-consumer-secret": process.env.WORLDQL_TWITTER_CONSUMER_SECRET,
        "x-oauth-v1-signature-method": "HMAC-SHA1"
    }

    test('POST request for tweet and temp of Bordeaux with variables', () => {

        const gqlApis = [
            {
                schema: {
                    url: openAPIschemaTwitter
                },
                headers: twitterHeaders
            },
            {
                schema: {
                    url: openAPIschemaWeather
                }
            },
            {
                schema: {
                    url: openAPIschemaGoogle
                }
            }
        ]

        const gqlQuery = `
        query($city: String!, $country: String!, $key: String!, $result_type: String!) {
            get_current_city_city_country_country(city: $city, country: $country, key: $key) {
                data {
                    temp
                }
            }
            
            get_search_tweets_json (q: $city, result_type: $result_type) {
                statuses {
                    text
                }
            }

            get_v1(
                cx: "${process.env.WORLDQL_GOOGLE_CSE_CX}", 
                key: "${process.env.WORLDQL_GOOGLE_CSE_KEY}", 
                safe: "active", 
                rights: "cc_publicdomain", 
                searchType: "image", 
                q: $city) {
                items {
                  link
                }
            }
        }`
        const gqlVariables = {
            "city": "bordeaux",
            "country": "france",
            "key": process.env.WORLDQL_WEATHERBIT_KEY,
            "result_type": "popular"
        }

        const gqlRequest = {
            gqlApis: gqlApis,
            gqlQuery: gqlQuery,
            gqlVariables: gqlVariables,
        }
        debug("(gqlRequest) %o", gqlRequest)

        return request(worldql)
            .post("/worldql")
            .send(gqlRequest)
            .then(gqlResponse => {

                expect(gqlResponse.statusCode).toBe(200)
                expect(gqlResponse.body).toMatchObject(
                    {
                        "data": {
                            "get_search_tweets_json": {
                                "statuses": expect.any(Array)
                            },
                            "get_current_city_city_country_country": {
                                "data": [{ "temp": expect.anything() }]
                            },
                            "get_v1": {
                                "items": expect.any(Array)
                            }
                        }
                    }
                )

            })
    })

    test("POST request for temp and temps's picture for Blois with stitching", () => {

        const gqlApis = [
            {
                schema: {
                    url: openAPIschemaWeather
                },
                link: {
                    inType: "get_current_cities_cities_data_items_weather",
                    on: {
                        field: {
                            name: "search",
                            type: "get_v1",
                            schemaUrl: openAPIschemaGoogle,
                            query: {
                                name: "get_v1",
                                params: {
                                    static: {
                                        cx: process.env.WORLDQL_GOOGLE_CSE_CX, 
                                        key: process.env.WORLDQL_GOOGLE_CSE_KEY, 
                                        safe: "active",
                                        rights: "cc_publicdomain",
                                        searchType: "image",
                                        num: 1
                                    },
                                    parent: [{
                                        q: "description"
                                    }],
                                    variables: {

                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                schema: { url: openAPIschemaGoogle }
            }
        ]

        const gqlQuery = `
        query($city: String!, $country: String!, $key: String!) {
            get_current_city_city_country_country(city: $city, country: $country, key: $key) {
                data {
                    temp
                    weather {
                        description
                        search {
                            items {
                                link
                            }
                        }
                    }
                }
            }

            get_v1(
                cx: "${process.env.WORLDQL_GOOGLE_CSE_CX}", 
                key: "${process.env.WORLDQL_GOOGLE_CSE_KEY}", 
                safe: "active", 
                rights: "cc_publicdomain", 
                searchType: "image", 
                q: $city) {
                items {
                  link
                }
            }
      }`
        const gqlVariables = {
            "city": "rennes",
            "country": "france",
            "key": process.env.WORLDQL_WEATHERBIT_KEY,
        }

        const gqlRequest = {
            gqlApis: gqlApis,
            gqlQuery: gqlQuery,
            gqlVariables: gqlVariables,
        }
        debug("(gqlRequest) %o", gqlRequest)

        return request(worldql)
            .post("/worldql")
            .send(gqlRequest)
            .then(gqlResponse => {

                expect(gqlResponse.statusCode).toBe(200)
                expect(gqlResponse.body).toMatchObject(
                    {
                        "data": {
                            "get_current_city_city_country_country": {
                                "data": [{
                                    "temp": expect.any(Number),
                                    "weather": {
                                        "search": {
                                            "items": expect.any(Object)
                                        }
                                    }
                                }]
                            },
                            "get_v1": {
                                "items": expect.any(Array)
                            }
                        }
                    }
                )

            })
    })
})
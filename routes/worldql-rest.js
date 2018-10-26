process.env.DEBUG = ['worldql-rest', 'worldql-core']

var express = require('express');
var router = express.Router();

const worldql = require('worldql-core')
const debug = require('debug')('worldql-rest')


const globalTunnel = require('global-tunnel')
globalTunnel.initialize() // use ENV http_proxy for all requests


router.post('/', function (req, res, next) {
    debug("call to POST /worldql")
    
    const body = req.body
    debug("(body) %o", req.body)
    
    const gqlApis = body.gqlApis
    debug("(gqlApis) %o", gqlApis)
    const gqlQuery = body.gqlQuery
    debug("(gqlQuery) %o", gqlQuery)
    const gqlVariables = body.gqlVariables
    debug("(gqlVariables) %o", gqlVariables)

    return worldql.exec(gqlApis, gqlQuery, gqlVariables).then(gqlResponse => {

        debug("(gqlResponse) %o", gqlResponse)
        res.send(gqlResponse)
    })
})

module.exports = router;
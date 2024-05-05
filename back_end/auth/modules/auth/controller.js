const clientService = require("./services/ClientService");
const codeService = require("./services/CodeService")
const tokenService = require("./services/TokenService")
const helpers = require('../../helpers');
const randomstring = require("randomstring");
const Crypto = require("crypto-js");
const { json } = require("body-parser");
const { generateKeyPairSync, KeyObject } = require("node:crypto")
const { createPrivateKey } = require("crypto")
const jwt = require('jsonwebtoken')
const axios = require('axios');
const { response } = require("express");
const buffer = require('buffer');
const crypto = require('crypto');
const responseTrait = require('../../traits/responseTrait')

const getUser = async (user_id) => {
    try {
        const {data} = await axios.get(`${process.env.IDEN_URL}/api/iden/user/${user_id}`)
        return data.user
    } catch (error) {
        console.log(error)
        return false
    }
}

const getScope = async (user_id, scopes) => {
    // gọi role module để lấy scope
    const user = await getUser(user_id)
    if (!user)
        return ""
    
    if (!scopes)
        return ""
    
    try {
        const {data} = await axios.get(`${process.env.ROLE_URL}/api/get-scopes-from-role/${user.role_id}`)
        const req_scopes = scopes.split(' ')

        console.log('request scopes: ', req_scopes)

        let valid_scopes = ''

        for (const req_scope of req_scopes) {
            if (data.data.scopes.includes(req_scope))
                valid_scopes = valid_scopes + req_scope + ' '
        }

        return valid_scopes.trim()
    } catch (error) {
        console.log(error)
        return ""
    }
}

exports.AuthCodeGrant = async (req, res) => {
    try {
        const data = req.body
        console.log(data)
        // generate code
        // co the nen de rieng khai bao cac truong cua code
        const code = helpers.Generator.generateCode({
            user_id: data.user_id,
            client_id: data.client_id,
            scope: data?.scope,
            redirect_uri: data.redirect_uri,
            created_at: Math.floor(Date.now() / 1000),
        })

        // save code for checking
        await codeService.saveAuthCode(code, data.client_id, data.user_id, process.env.AUTH_CODE_EXP)

        return responseTrait.ResponseSuccess(res, {
            code: code,
            user_id: data.user_id,
            state: data.state == null ? null : data.state,
        })

    } catch (error) {
        return responseTrait.ResponseInternalServer(res)
    }
}

exports.TokenGrant = async (req, res) => {
    let id_token = ''
    let access_token = ''
    let refresh_token = ''
    let scope = ''
    let user_id = ''
    const data = req.body
    
    if (data.grant_type != null && data.grant_type == 'refresh_token') {
        if (data.refresh_token == null ||
            data.client_id == null ||
            data.user_id == null ||
            data.scope == null)
            return responseTrait.ResponseInvalid(res)

        const refresh_token = await tokenService.getRefreshToken(data.client_id, data.user_id)
        
        if (refresh_token != data.refresh_token) {
            return responseTrait.ResponseInvalid(res)
        }

        // verify refresh token bang publicKey
        const public_key = await tokenService.getPublicKey(data.client_id, data.user_id)
        try {
            jwt.verify(refresh_token, public_key, function(err, decoded) {
                console.log(decoded.string)
            });
        } catch (error) {
            console.log(error)
            return responseTrait.ResponseInvalid(res)
        }

        // generate scope
        scope = await getScope(data.user_id, data.scope)
        user_id = data.user_id
    } else if (data.grant_type != null && data.grant_type == 'authorization_code') {

        if (data.code == null ||
            data.redirect_uri == null ||
            data.client_id == null)
            return responseTrait.ResponseInvalid(res)
    
        // get code for checking
        const dataFromCode = helpers.Generator.getDataFromCode(data.code) ? helpers.Generator.getDataFromCode(data.code) : undefined

        const code = await codeService.getAuthCode(dataFromCode?.client_id, dataFromCode?.user_id)
    
        if (!code)
            return responseTrait.ResponseInvalid(res)
    
        if (code != data.code) {
            return responseTrait.ResponseInvalid(res)
        } else {
            await codeService.removeAuthCode(dataFromCode.client_id, dataFromCode.user_id)
        }

        if (data.redirect_uri != dataFromCode?.redirect_uri) {
            return responseTrait.ResponseInvalid(res)
        }
        
        // create id token jwt payload
        if (dataFromCode.scope != undefined && dataFromCode.scope.includes("openid")) {
            // call to identity module to get user
            const user = await getUser(data.user_id)

            if (user) {
                // id token claims
                const id_token_claims = {
                    iss: `https://${process.env.HOST}:${process.env.PORT}`,
                    sub: data.user_id,
                    aud: [
                        data.client_id,
                    ],
                    exp: Math.floor(Date.now() / 1000) + parseInt(process.env.TOKEN_EXP),
                    iat: Math.floor(Date.now() / 1000),
                    user
                }
        
                id_token = helpers.JWT.genToken(id_token_claims)
            }

        }

        // create scope
        scope = await getScope(dataFromCode.user_id, dataFromCode.scope)
        user_id = dataFromCode.user_id
    } else {
        return responseTrait.ResponseInvalid(res)
    }

    // create access token jwt payload + cần thêm claims về scopes
    const access_token_claims = {
        iss: `https://${process.env.HOST}:${process.env.PORT}`,
        exp: Math.floor(Date.now() / 1000) + parseInt(process.env.TOKEN_EXP),
        aud: [
            data.client_id,
        ],
        sub: user_id,
        client_id: data.client_id,
        scope: scope,
        iat: Math.floor(Date.now() / 1000),
        jti: 'jwtid'
    }
    // public key và private key
    const { publicKey, privateKey } = helpers.Generator.generateKeyPair()

    access_token = helpers.JWT.genAccessToken(access_token_claims, privateKey)
    refresh_token = helpers.JWT.genAccessToken({string: randomstring.generate(30)}, privateKey)

    await tokenService.savePublicKey(publicKey, data.client_id, user_id)
    await tokenService.saveRefreshToken(refresh_token, data.client_id, user_id)

    return responseTrait.ResponseSuccess(res, {
        access_token: access_token,
        token_type: 'Bearer',
        expires_in: process.env.TOKEN_EXP,
        refresh_token: refresh_token,
        id_token: id_token,
    })
}

// exports.ClientRegistration = async (req, res) => {
//     const data = req.body

//     if (data.redirect_uri == null ||
//         data.homepage_url == null ||
//         data.name == null )
//         return responseTrait.ResponseInvalid(res)
    
//     if (!Array.isArray(data.redirect_uri) || (Array.isArray(data.redirect_uri) && data.redirect_uri.length == 0))
//         return responseTrait.ResponseInvalid(res)
    
//     const client_id = randomstring.generate(20)
//     const client_secret = randomstring.generate(20)
//     const hash = Crypto.SHA256(client_secret)
    
//     const config = {
//         id: client_id,
//         client_secret: hash.toString(Crypto.enc.Hex),
//         redirect_uri: data.redirect_uri.toString(),
//         client_type: true,
//         name: data.name,
//         homepage_url: data.homepage_url,
//         description: data.description != null ? data.description : null,
//     }

//     await clientService.createClient(config)

//     return responseTrait.ResponseSuccess(res, {
//         client_id: client_id,
//         client_secret: client_secret
//     })
// }

exports.getPublicKey = async (req, res) => {
    const data = req.query

    if (data.client_id == null || 
        data.user_id == null)
        return responseTrait.ResponseInvalid(res)

    const public_key = await tokenService.getPublicKey(data.client_id, data.user_id)

    if (!public_key)
        return responseTrait.ResponseInvalid(res)

    return responseTrait.ResponseSuccess(res, {
        public_key: public_key
    })
}

exports.Logout = async (req, res) => {
    const data = req.body
    await tokenService.destroyAccessToken(data.client_id, data.user_id)

    return responseTrait.ResponseSuccess(res, null)
}

exports.Test = async (req, res) => {
    return responseTrait.ResponseInvalid(res)
}
/**
 * Created by saix on 16/9/2.
 */


var Promise = require("promise");
var PromiseSeries = require('promise-series');
var xml2js = require("xml2js");
var http = require("http");
var jsonxml = require('jsontoxml');
var iconv = require('iconv-lite');
var user_agent = "宗易汇/2.0.6.1 CFNetwork/758.4.3 Darwin/15.5.0";

var markets = {
    '安贵' : {
        id : 89,
        ip : '180.168.67.10',
        port : 15930,
        path : '/Issue4ariesMobileServer/communicateServlet'
    }
}

function zyh(/*pincode, hostname, user, password, SI*/market, user)
{
    this.pincode = market.pin;
    //this.hostname = hostname;
    this.user = user.name;
    this.password = user.password;
    this.marketId = market.id;//markets[hostname].id;
    this.marketIp = market.ip;//markets[hostname].ip;
    this.marketPort = market.port;//markets[hostname].port;
    this.marketPath = market.path;//markets[hostname].path;

    this.session = '';
    this.encryption = '';
    this.SI = user.token;

    function formatResult(result)
    {
        result.MEBS = result.MEBS || {};
        result.MEBS.REP = result.MEBS.REP || [];
        result.MEBS.REP[0].RESULT = result.MEBS.REP[0].RESULT || [];
        result.MEBS.REP[0].RESULT[0].RETCODE = result.MEBS.REP[0].RESULT[0].RETCODE || [];
    }

    function getReturnCode(result)
    {
        formatResult(result);
        var returnCode = result.MEBS.REP[0].RESULT[0].RETCODE[0];

        return '' + returnCode;
    }

    function formatMobileResult(result){
        result.MEBS_MOBILE = result.MEBS_MOBILE || {};
        result.MEBS_MOBILE.REP = result.MEBS_MOBILE.REP || [];
        result.MEBS_MOBILE.REP[0].RESULT = result.MEBS_MOBILE.REP[0].RESULT || [];
        result.MEBS_MOBILE.REP[0].RESULT[0].RETCODE = result.MEBS_MOBILE.REP[0].RESULT[0].RETCODE || [];

    }
    function getMobileReturnCode(result)
    {
        formatMobileResult(result);
        var returnCode = result.MEBS_MOBILE.REP[0].RESULT[0].RETCODE[0];

        return '' + returnCode;
    }


    function MEBSHttpRequest(bodyString, resultCheck){

        resultCheck = resultCheck || function(result, resolve, reject){
                var returnCode = getReturnCode(result);
                if(returnCode.indexOf('-') == 0){
                    reject(result);
                }
                else {
                    resolve(returnCode);
                }
            };

        var headers = {
            'Content-Type': 'text/xml',
            'Content-Length': bodyString.length,
            'User-Agent' : user_agent
        };
        var options = {
            host: 'm.zongyihui.cn',
            port: 30200,
            path: '/nuclear/communicateServlet',
            method: 'POST',
            headers: headers
        };

        return new Promise(function(resolve, reject){
            var req = http.request(options, function(res) {

                //res.setEncoding('utf-8');
                var responseString = '';
                var chunks = [];

                res.on('data', function (data) {
                    responseString += data;
                    chunks.push(data);
                });

                res.on('end', function () {
                    //console.log(iconv.decode(responseString, 'gbk'));
                    var decodedBody = iconv.decode(Buffer.concat(chunks), 'gbk');
                    console.log(decodedBody);

                    xml2js.parseString(responseString, function (err, result) {
                        formatResult(result);
                        resultCheck(result, resolve, reject);
                    });
                });
            });
            req.on('error', function(e) {
                console.log('-----error-------',e);
                reject(e);
            });
            console.log(bodyString);
            req.write(bodyString);
            req.end();
        });
    }

    this.startDeviceInfo = function(){
        var xml = jsonxml({
            MEBS_MOBILE:[
                { name : 'REQ', attrs:{name:'startdeviceinfo'}, children:[
                    {name : 'DEVICEID', text : 'iBD2F32C5-BBFD-4F7D-A465-51ACA0C5A7DC'},
                    {name : 'DEVICETYPE', text : '1'},
                    {name : 'MARKETID', text : '-1'},
                    {name : 'MODEL', text : 'iPhone 6'},
                    {name : 'BRAND', text : 'iPhone'},
                    {name : 'NETWORKTYPE', text : 'WiFi'},
                    {name : 'NETPROVIDER', text : 'CMCC'},
                    {name : 'TOKEN', text : 'd488014c06b11e578321b9d6f3bbd0d16d5e675ca6068d140ce89dfe67cd27e4'},
                    {name : 'PINSCODE', text : this.pincode}
                ]}
            ]
        });

        return MEBSHttpRequest(xml);
    };

    this.checkpin = function(){
        var xml = jsonxml({
            MEBS_MOBILE:[
                { name : 'REQ', attrs:{name:'checkpins'}, children:[
                    {name : 'PINSCODE', text : this.pincode},
                    {name : 'DEVICEID', text : 'iBD2F32C5-BBFD-4F7D-A465-51ACA0C5A7DC'}
                ]}
            ]
        });

        return MEBSHttpRequest(xml);
    };

    this.encryptstr = function(){
        var xml = jsonxml({
            MEBS_MOBILE:[
                { name : 'REQ', attrs:{name:'encryptstr'}, children:[
                    {name : 'PINSCODE', text : this.pincode},
                    {name : 'SESSIONID', text : this.session},
                    {name : 'MARKETID', text : this.marketId},
                    {name : 'TRADERID', text : this.user},
                    {name : 'PASSWORD', text : this.password}
                ]}
            ]
        });
        return MEBSHttpRequest(xml, function(result, resolve, reject){
            var returnCode = getReturnCode(result);
            if(returnCode.indexOf('-') == 0){
                reject(result);
            }
            else {
                result.MEBS.REP[0].RESULT[0].ENCRYPTION = result.MEBS.REP[0].RESULT[0].ENCRYPTION || [];
                var ENCRYPTION = result.MEBS.REP[0].RESULT[0].ENCRYPTION[0];
                if(ENCRYPTION.length > 0){
                    resolve(ENCRYPTION);
                }
                else {
                    reject(result);
                }
            }
        });
    };


    function MEBSMOBILEHttpRequest(bodyString, resultCheck){

        resultCheck = resultCheck || function(result, resolve, reject){
                var returnCode = getMobileReturnCode(result);
                if(returnCode.indexOf('-') == 0){
                    reject(result);
                }
                else {
                    resolve(returnCode);
                }
            };

        var headers = {
            'Content-Type': 'text/xml',
            'Content-Length': bodyString.length,
            'User-Agent' : user_agent
        };
        var options = {
            host: this.marketIp,
            port: this.marketPort,
            path: this.marketPath,
            method: 'POST',
            headers: headers
        };

        return new Promise(function(resolve, reject){
            var req = http.request(options, function(res) {
                //res.setEncoding('utf-8');
                var responseString = '';
                var chunks = [];

                res.on('data', function (data) {
                    responseString += data;
                    chunks.push(data);
                });

                res.on('end', function () {
                    var decodedBody = iconv.decode(Buffer.concat(chunks), 'gbk');
                    console.log(decodedBody);
                    xml2js.parseString(responseString, function (err, result) {
                        formatMobileResult(result);
                        resultCheck(result, resolve, reject);
                    });
                });
            });
            req.on('error', function(e) {
                console.log('-----error-------',e);
                reject(e);
            });
            console.log(bodyString);
            req.write(bodyString);
            req.end();
        });
    }

    this.login = function(){
        var xml = jsonxml({
            MEBS_MOBILE:[
                { name : 'REQ', attrs:{name:'user_login'}, children:[
                    {name : 'U', text : this.user},
                    {name : 'PASSWORD', text : this.password},
                    {name : 'IC', text : this.encryption},
                    {name : 'RANDOM_KEY', text:''}
                ]}
            ]
        });
        return MEBSMOBILEHttpRequest.call(this, xml);
    }.bind(this);

    this.issue_commodity = function(SI){
        this.SI = SI || this.SI;
        var xml = jsonxml({
            MEBS_MOBILE:[
                { name : 'REQ', attrs:{name:'issue_commodity'}, children:[
                    {name : 'U', text : this.user},
                    {name : 'CI', text : ''},
                    {name : 'S_I', text : this.SI}
                ]}
            ]
        });

        return MEBSMOBILEHttpRequest.call(this, xml, function(result, resolve, reject){
            formatMobileResult(result);
            var returnCode = getMobileReturnCode(result);
            if(returnCode.indexOf('-') == 0){
                reject(result);
            }
            else {
                result.MEBS_MOBILE.REP[0].RESULTLIST = result.MEBS_MOBILE.REP[0].RESULTLIST || [];
                var resultLists = result.MEBS_MOBILE.REP[0].RESULTLIST;
                resolve(resultLists);
            }
        });
    }.bind(this);

    this.issue_order = function(productId, productAmount){
        var xml = jsonxml({
            MEBS_MOBILE:[
                { name : 'REQ', attrs:{name:'issue_order'}, children:[
                    {name : 'U', text : this.user},
                    {name : 'C_I', text : productId},
                    {name : 'I_QTY', text : productAmount},
                    {name : 'S_I', text : this.SI}
                ]}
            ]
        });

        return MEBSMOBILEHttpRequest.call(this, xml);
    }.bind(this);

}

//var pincode = 'ozGwruLoMDDdbk7RMS65lMw2TRA07140812755492777474';
//var hostname = '安贵';
//var user = '0088099379526';
//var password = 'clj831011';
//
//var zyh = new zyh(pincode, hostname, user, password);
//zyh.checkpin().then(function(session){
//    zyh.session = session;
//    return zyh.encryptstr();
//})
//    .then(function(encryption){
//        zyh.encryption = encryption;
//    })
//    .then(zyh.login)
//    .then(zyh.issue_commodity)
//    .catch(function(e){
//        console.log(e);
//    });

module.exports = zyh;


var decodeString = iconv.decode(
    '<?xml version="1.0" encoding = "GBK"?><MEBS_MOBILE><REP name="issue_commodity"><RESULTLIST>' +
    '<REC><CO_I>100056</CO_I><CO_N>�ȶ�������ˮƽ</CO_N><BR>1004</BR><PRC>6.70</PRC>' +
    '<QTY>15000.00</QTY>' +
    '<S_D>2016-09-01</S_D><E_D>2016-09-01</E_D></REC></RESULTLIST><RESULT><TTLREC>1</TTLREC>' +
    '<RETCODE>0</RETCODE><MESSAGE></MESSAGE></RESULT></REP></MEBS_MOBILE>', 'utf-8');
console.log(iconv.decode(decodeString, 'gbk'))

xml2js.parseString(decodeString, function (err, result){

});
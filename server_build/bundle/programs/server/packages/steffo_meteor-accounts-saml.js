(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var ECMAScript = Package.ecmascript.ECMAScript;
var RoutePolicy = Package.routepolicy.RoutePolicy;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var Accounts = Package['accounts-base'].Accounts;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var SAML;

var require = meteorInstall({"node_modules":{"meteor":{"steffo:meteor-accounts-saml":{"saml_server.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/steffo_meteor-accounts-saml/saml_server.js                                                               //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let fiber;
module.watch(require("fibers"), {
  default(v) {
    fiber = v;
  }

}, 1);
let connect;
module.watch(require("connect"), {
  default(v) {
    connect = v;
  }

}, 2);

if (!Accounts.saml) {
  Accounts.saml = {
    settings: {
      debug: true,
      generateUsername: false,
      providers: []
    }
  };
}

RoutePolicy.declare('/_saml/', 'network');
/**
 * Fetch SAML provider configs for given 'provider'.
 */

function getSamlProviderConfig(provider) {
  if (!provider) {
    throw new Meteor.Error('no-saml-provider', 'SAML internal error', {
      method: 'getSamlProviderConfig'
    });
  }

  const samlProvider = function (element) {
    return element.provider === provider;
  };

  return Accounts.saml.settings.providers.filter(samlProvider)[0];
}

Meteor.methods({
  samlLogout(provider) {
    // Make sure the user is logged in before initiate SAML SLO
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'samlLogout'
      });
    }

    const providerConfig = getSamlProviderConfig(provider);

    if (Accounts.saml.settings.debug) {
      console.log(`Logout request from ${JSON.stringify(providerConfig)}`);
    } // This query should respect upcoming array of SAML logins


    const user = Meteor.users.findOne({
      _id: Meteor.userId(),
      'services.saml.provider': provider
    }, {
      'services.saml': 1
    });
    let nameID = user.services.saml.nameID;
    const sessionIndex = user.services.saml.idpSession;
    nameID = sessionIndex;

    if (Accounts.saml.settings.debug) {
      console.log(`NameID for user ${Meteor.userId()} found: ${JSON.stringify(nameID)}`);
    }

    const _saml = new SAML(providerConfig);

    const request = _saml.generateLogoutRequest({
      nameID,
      sessionIndex
    }); // request.request: actual XML SAML Request
    // request.id: comminucation id which will be mentioned in the ResponseTo field of SAMLResponse


    Meteor.users.update({
      _id: Meteor.userId()
    }, {
      $set: {
        'services.saml.inResponseTo': request.id
      }
    });

    const _syncRequestToUrl = Meteor.wrapAsync(_saml.requestToUrl, _saml);

    const result = _syncRequestToUrl(request.request, 'logout');

    if (Accounts.saml.settings.debug) {
      console.log(`SAML Logout Request ${result}`);
    }

    return result;
  }

});
Accounts.registerLoginHandler(function (loginRequest) {
  if (!loginRequest.saml || !loginRequest.credentialToken) {
    return undefined;
  }

  const loginResult = Accounts.saml.retrieveCredential(loginRequest.credentialToken);

  if (Accounts.saml.settings.debug) {
    console.log(`RESULT :${JSON.stringify(loginResult)}`);
  }

  if (loginResult === undefined) {
    return {
      type: 'saml',
      error: new Meteor.Error(Accounts.LoginCancelledError.numericError, 'No matching login attempt found')
    };
  }

  if (loginResult && loginResult.profile && loginResult.profile.email) {
    const email = RegExp.escape(loginResult.profile.email);
    const emailRegex = new RegExp(`^${email}$`, 'i');
    let user = Meteor.users.findOne({
      'emails.address': emailRegex
    });

    if (!user) {
      const newUser = {
        name: loginResult.profile.cn || loginResult.profile.username,
        active: true,
        globalRoles: ['user'],
        emails: [{
          address: loginResult.profile.email,
          verified: true
        }]
      };

      if (Accounts.saml.settings.generateUsername === true) {
        const username = RocketChat.generateUsernameSuggestion(newUser);

        if (username) {
          newUser.username = username;
        }
      } else if (loginResult.profile.username) {
        newUser.username = loginResult.profile.username;
      }

      const userId = Accounts.insertUserDoc({}, newUser);
      user = Meteor.users.findOne(userId);
    } //creating the token and adding to the user


    const stampedToken = Accounts._generateStampedLoginToken();

    Meteor.users.update(user, {
      $push: {
        'services.resume.loginTokens': stampedToken
      }
    });
    const samlLogin = {
      provider: Accounts.saml.RelayState,
      idp: loginResult.profile.issuer,
      idpSession: loginResult.profile.sessionIndex,
      nameID: loginResult.profile.nameID
    };
    Meteor.users.update({
      _id: user._id
    }, {
      $set: {
        // TBD this should be pushed, otherwise we're only able to SSO into a single IDP at a time
        'services.saml': samlLogin
      }
    }); //sending token along with the userId

    const result = {
      userId: user._id,
      token: stampedToken.token
    };
    return result;
  } else {
    throw new Error('SAML Profile did not contain an email address');
  }
});

Accounts.saml.hasCredential = function (credentialToken) {
  return RocketChat.models.CredentialTokens.findOneById(credentialToken) != null;
};

Accounts.saml.retrieveCredential = function (credentialToken) {
  // The credentialToken in all these functions corresponds to SAMLs inResponseTo field and is mandatory to check.
  const data = RocketChat.models.CredentialTokens.findOneById(credentialToken);

  if (data) {
    return data.userInfo;
  }
};

Accounts.saml.storeCredential = function (credentialToken, loginResult) {
  RocketChat.models.CredentialTokens.create(credentialToken, loginResult);
};

const closePopup = function (res, err) {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  let content = '<html><head><script>window.close()</script></head><body><H1>Verified</H1></body></html>';

  if (err) {
    content = `<html><body><h2>Sorry, an annoying error occured</h2><div>${err}</div><a onclick="window.close();">Close Window</a></body></html>`;
  }

  res.end(content, 'utf-8');
};

const samlUrlToObject = function (url) {
  // req.url will be '/_saml/<action>/<service name>/<credentialToken>'
  if (!url) {
    return null;
  }

  const splitUrl = url.split('?');
  const splitPath = splitUrl[0].split('/'); // Any non-saml request will continue down the default
  // middlewares.

  if (splitPath[1] !== '_saml') {
    return null;
  }

  const result = {
    actionName: splitPath[2],
    serviceName: splitPath[3],
    credentialToken: splitPath[4]
  };

  if (Accounts.saml.settings.debug) {
    console.log(result);
  }

  return result;
};

const middleware = function (req, res, next) {
  // Make sure to catch any exceptions because otherwise we'd crash
  // the runner
  try {
    const samlObject = samlUrlToObject(req.url);

    if (!samlObject || !samlObject.serviceName) {
      next();
      return;
    }

    if (!samlObject.actionName) {
      throw new Error('Missing SAML action');
    }

    console.log(Accounts.saml.settings.providers);
    console.log(samlObject.serviceName);

    const service = _.find(Accounts.saml.settings.providers, function (samlSetting) {
      return samlSetting.provider === samlObject.serviceName;
    }); // Skip everything if there's no service set by the saml middleware


    if (!service) {
      throw new Error(`Unexpected SAML service ${samlObject.serviceName}`);
    }

    let _saml;

    switch (samlObject.actionName) {
      case 'metadata':
        _saml = new SAML(service);
        service.callbackUrl = Meteor.absoluteUrl(`_saml/validate/${service.provider}`);
        res.writeHead(200);
        res.write(_saml.generateServiceProviderMetadata(service.callbackUrl));
        res.end(); //closePopup(res);

        break;

      case 'logout':
        // This is where we receive SAML LogoutResponse
        _saml = new SAML(service);

        _saml.validateLogoutResponse(req.query.SAMLResponse, function (err, result) {
          if (!err) {
            const logOutUser = function (inResponseTo) {
              if (Accounts.saml.settings.debug) {
                console.log(`Logging Out user via inResponseTo ${inResponseTo}`);
              }

              const loggedOutUser = Meteor.users.find({
                'services.saml.inResponseTo': inResponseTo
              }).fetch();

              if (loggedOutUser.length === 1) {
                if (Accounts.saml.settings.debug) {
                  console.log(`Found user ${loggedOutUser[0]._id}`);
                }

                Meteor.users.update({
                  _id: loggedOutUser[0]._id
                }, {
                  $set: {
                    'services.resume.loginTokens': []
                  }
                });
                Meteor.users.update({
                  _id: loggedOutUser[0]._id
                }, {
                  $unset: {
                    'services.saml': ''
                  }
                });
              } else {
                throw new Meteor.Error('Found multiple users matching SAML inResponseTo fields');
              }
            };

            fiber(function () {
              logOutUser(result);
            }).run();
            res.writeHead(302, {
              'Location': req.query.RelayState
            });
            res.end();
          } //  else {
          // 	// TBD thinking of sth meaning full.
          // }

        });

        break;

      case 'sloRedirect':
        res.writeHead(302, {
          // credentialToken here is the SAML LogOut Request that we'll send back to IDP
          'Location': req.query.redirect
        });
        res.end();
        break;

      case 'authorize':
        service.callbackUrl = Meteor.absoluteUrl(`_saml/validate/${service.provider}`);
        service.id = samlObject.credentialToken;
        _saml = new SAML(service);

        _saml.getAuthorizeUrl(req, function (err, url) {
          if (err) {
            throw new Error('Unable to generate authorize url');
          }

          res.writeHead(302, {
            'Location': url
          });
          res.end();
        });

        break;

      case 'validate':
        _saml = new SAML(service);
        Accounts.saml.RelayState = req.body.RelayState;

        _saml.validateResponse(req.body.SAMLResponse, req.body.RelayState, function (err, profile
        /*, loggedOut*/
        ) {
          if (err) {
            throw new Error(`Unable to validate response url: ${err}`);
          }

          const credentialToken = profile.inResponseToId && profile.inResponseToId.value || profile.inResponseToId || profile.InResponseTo || samlObject.credentialToken;
          const loginResult = {
            profile
          };

          if (!credentialToken) {
            // No credentialToken in IdP-initiated SSO
            const saml_idp_credentialToken = Random.id();
            Accounts.saml.storeCredential(saml_idp_credentialToken, loginResult);
            const url = `${Meteor.absoluteUrl('home')}?saml_idp_credentialToken=${saml_idp_credentialToken}`;
            res.writeHead(302, {
              'Location': url
            });
            res.end();
          } else {
            Accounts.saml.storeCredential(credentialToken, loginResult);
            closePopup(res);
          }
        });

        break;

      default:
        throw new Error(`Unexpected SAML action ${samlObject.actionName}`);
    }
  } catch (err) {
    closePopup(res, err);
  }
}; // Listen to incoming SAML http requests


WebApp.connectHandlers.use(connect.bodyParser()).use(function (req, res, next) {
  // Need to create a fiber since we're using synchronous http calls and nothing
  // else is wrapping this in a fiber automatically
  fiber(function () {
    middleware(req, res, next);
  }).run();
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saml_utils.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/steffo_meteor-accounts-saml/saml_utils.js                                                                //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let zlib;
module.watch(require("zlib"), {
  default(v) {
    zlib = v;
  }

}, 0);
let xml2js;
module.watch(require("xml2js"), {
  default(v) {
    xml2js = v;
  }

}, 1);
let xmlCrypto;
module.watch(require("xml-crypto"), {
  default(v) {
    xmlCrypto = v;
  }

}, 2);
let crypto;
module.watch(require("crypto"), {
  default(v) {
    crypto = v;
  }

}, 3);
let xmldom;
module.watch(require("xmldom"), {
  default(v) {
    xmldom = v;
  }

}, 4);
let querystring;
module.watch(require("querystring"), {
  default(v) {
    querystring = v;
  }

}, 5);
let xmlbuilder;
module.watch(require("xmlbuilder"), {
  default(v) {
    xmlbuilder = v;
  }

}, 6);

// var prefixMatch = new RegExp(/(?!xmlns)^.*:/);
SAML = function (options) {
  this.options = this.initialize(options);
}; // var stripPrefix = function(str) {
// 	return str.replace(prefixMatch, '');
// };


SAML.prototype.initialize = function (options) {
  if (!options) {
    options = {};
  }

  if (!options.protocol) {
    options.protocol = 'https://';
  }

  if (!options.path) {
    options.path = '/saml/consume';
  }

  if (!options.issuer) {
    options.issuer = 'onelogin_saml';
  }

  if (options.identifierFormat === undefined) {
    options.identifierFormat = 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress';
  }

  if (options.authnContext === undefined) {
    options.authnContext = 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport';
  }

  return options;
};

SAML.prototype.generateUniqueID = function () {
  const chars = 'abcdef0123456789';
  let uniqueID = 'id-';

  for (let i = 0; i < 20; i++) {
    uniqueID += chars.substr(Math.floor(Math.random() * 15), 1);
  }

  return uniqueID;
};

SAML.prototype.generateInstant = function () {
  return new Date().toISOString();
};

SAML.prototype.signRequest = function (xml) {
  const signer = crypto.createSign('RSA-SHA1');
  signer.update(xml);
  return signer.sign(this.options.privateKey, 'base64');
};

SAML.prototype.generateAuthorizeRequest = function (req) {
  let id = `_${this.generateUniqueID()}`;
  const instant = this.generateInstant(); // Post-auth destination

  let callbackUrl;

  if (this.options.callbackUrl) {
    callbackUrl = this.options.callbackUrl;
  } else {
    callbackUrl = this.options.protocol + req.headers.host + this.options.path;
  }

  if (this.options.id) {
    id = this.options.id;
  }

  let request = `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="${id}" Version="2.0" IssueInstant="${instant}" ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" AssertionConsumerServiceURL="${callbackUrl}" Destination="${this.options.entryPoint}">` + `<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${this.options.issuer}</saml:Issuer>\n`;

  if (this.options.identifierFormat) {
    request += `<samlp:NameIDPolicy xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" Format="${this.options.identifierFormat}" AllowCreate="true"></samlp:NameIDPolicy>\n`;
  }

  request += '<samlp:RequestedAuthnContext xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" Comparison="exact">' + '<saml:AuthnContextClassRef xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef></samlp:RequestedAuthnContext>\n' + '</samlp:AuthnRequest>';
  return request;
};

SAML.prototype.generateLogoutRequest = function (options) {
  // options should be of the form
  // nameId: <nameId as submitted during SAML SSO>
  // sessionIndex: sessionIndex
  // --- NO SAMLsettings: <Meteor.setting.saml  entry for the provider you want to SLO from
  const id = `_${this.generateUniqueID()}`;
  const instant = this.generateInstant();
  let request = `${'<samlp:LogoutRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ' + 'xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="'}${id}" Version="2.0" IssueInstant="${instant}" Destination="${this.options.idpSLORedirectURL}">` + `<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${this.options.issuer}</saml:Issuer>` + `<saml:NameID Format="${this.options.identifierFormat}">${options.nameID}</saml:NameID>` + '</samlp:LogoutRequest>';
  request = `${'<samlp:LogoutRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"  ' + 'ID="'}${id}" ` + 'Version="2.0" ' + `IssueInstant="${instant}" ` + `Destination="${this.options.idpSLORedirectURL}" ` + '>' + `<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${this.options.issuer}</saml:Issuer>` + '<saml:NameID xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ' + 'NameQualifier="http://id.init8.net:8080/openam" ' + `SPNameQualifier="${this.options.issuer}" ` + `Format="${this.options.identifierFormat}">${options.nameID}</saml:NameID>` + `<samlp:SessionIndex xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">${options.sessionIndex}</samlp:SessionIndex>` + '</samlp:LogoutRequest>';

  if (Meteor.settings.debug) {
    console.log('------- SAML Logout request -----------');
    console.log(request);
  }

  return {
    request,
    id
  };
};

SAML.prototype.requestToUrl = function (request, operation, callback) {
  const self = this;
  zlib.deflateRaw(request, function (err, buffer) {
    if (err) {
      return callback(err);
    }

    const base64 = buffer.toString('base64');
    let target = self.options.entryPoint;

    if (operation === 'logout') {
      if (self.options.idpSLORedirectURL) {
        target = self.options.idpSLORedirectURL;
      }
    }

    if (target.indexOf('?') > 0) {
      target += '&';
    } else {
      target += '?';
    } // TBD. We should really include a proper RelayState here


    let relayState;

    if (operation === 'logout') {
      // in case of logout we want to be redirected back to the Meteor app.
      relayState = Meteor.absoluteUrl();
    } else {
      relayState = self.options.provider;
    }

    const samlRequest = {
      SAMLRequest: base64,
      RelayState: relayState
    };

    if (self.options.privateCert) {
      samlRequest.SigAlg = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
      samlRequest.Signature = self.signRequest(querystring.stringify(samlRequest));
    }

    target += querystring.stringify(samlRequest);

    if (Meteor.settings.debug) {
      console.log(`requestToUrl: ${target}`);
    }

    if (operation === 'logout') {
      // in case of logout we want to be redirected back to the Meteor app.
      return callback(null, target);
    } else {
      callback(null, target);
    }
  });
};

SAML.prototype.getAuthorizeUrl = function (req, callback) {
  const request = this.generateAuthorizeRequest(req);
  this.requestToUrl(request, 'authorize', callback);
};

SAML.prototype.getLogoutUrl = function (req, callback) {
  const request = this.generateLogoutRequest(req);
  this.requestToUrl(request, 'logout', callback);
};

SAML.prototype.certToPEM = function (cert) {
  cert = cert.match(/.{1,64}/g).join('\n');
  cert = `-----BEGIN CERTIFICATE-----\n${cert}`;
  cert = `${cert}\n-----END CERTIFICATE-----\n`;
  return cert;
}; // functionfindChilds(node, localName, namespace) {
// 	var res = [];
// 	for (var i = 0; i < node.childNodes.length; i++) {
// 		var child = node.childNodes[i];
// 		if (child.localName === localName && (child.namespaceURI === namespace || !namespace)) {
// 			res.push(child);
// 		}
// 	}
// 	return res;
// }


SAML.prototype.validateSignature = function (xml, cert) {
  const self = this;
  const doc = new xmldom.DOMParser().parseFromString(xml);
  const signature = xmlCrypto.xpath(doc, '//*[local-name(.)=\'Signature\' and namespace-uri(.)=\'http://www.w3.org/2000/09/xmldsig#\']')[0];
  const sig = new xmlCrypto.SignedXml();
  sig.keyInfoProvider = {
    getKeyInfo()
    /*key*/
    {
      return '<X509Data></X509Data>';
    },

    getKey()
    /*keyInfo*/
    {
      return self.certToPEM(cert);
    }

  };
  sig.loadSignature(signature);
  return sig.checkSignature(xml);
};

SAML.prototype.getElement = function (parentElement, elementName) {
  if (parentElement[`saml:${elementName}`]) {
    return parentElement[`saml:${elementName}`];
  } else if (parentElement[`samlp:${elementName}`]) {
    return parentElement[`samlp:${elementName}`];
  } else if (parentElement[`saml2p:${elementName}`]) {
    return parentElement[`saml2p:${elementName}`];
  } else if (parentElement[`saml2:${elementName}`]) {
    return parentElement[`saml2:${elementName}`];
  } else if (parentElement[`ns0:${elementName}`]) {
    return parentElement[`ns0:${elementName}`];
  } else if (parentElement[`ns1:${elementName}`]) {
    return parentElement[`ns1:${elementName}`];
  }

  return parentElement[elementName];
};

SAML.prototype.validateLogoutResponse = function (samlResponse, callback) {
  const self = this;
  const compressedSAMLResponse = new Buffer(samlResponse, 'base64');
  zlib.inflateRaw(compressedSAMLResponse, function (err, decoded) {
    if (err) {
      if (Meteor.settings.debug) {
        console.log(err);
      }
    } else {
      const parser = new xml2js.Parser({
        explicitRoot: true
      });
      parser.parseString(decoded, function (err, doc) {
        const response = self.getElement(doc, 'LogoutResponse');

        if (response) {
          // TBD. Check if this msg corresponds to one we sent
          const inResponseTo = response.$.InResponseTo;

          if (Meteor.settings.debug) {
            console.log(`In Response to: ${inResponseTo}`);
          }

          const status = self.getElement(response, 'Status');
          const statusCode = self.getElement(status[0], 'StatusCode')[0].$.Value;

          if (Meteor.settings.debug) {
            console.log(`StatusCode: ${JSON.stringify(statusCode)}`);
          }

          if (statusCode === 'urn:oasis:names:tc:SAML:2.0:status:Success') {
            // In case of a successful logout at IDP we return inResponseTo value.
            // This is the only way how we can identify the Meteor user (as we don't use Session Cookies)
            callback(null, inResponseTo);
          } else {
            callback('Error. Logout not confirmed by IDP', null);
          }
        } else {
          callback('No Response Found', null);
        }
      });
    }
  });
};

SAML.prototype.validateResponse = function (samlResponse, relayState, callback) {
  const self = this;
  const xml = new Buffer(samlResponse, 'base64').toString('utf8'); // We currently use RelayState to save SAML provider

  if (Meteor.settings.debug) {
    console.log(`Validating response with relay state: ${xml}`);
  }

  const parser = new xml2js.Parser({
    explicitRoot: true,
    xmlns: true
  });
  parser.parseString(xml, function (err, doc) {
    // Verify signature
    if (Meteor.settings.debug) {
      console.log('Verify signature');
    }

    if (self.options.cert && !self.validateSignature(xml, self.options.cert)) {
      if (Meteor.settings.debug) {
        console.log('Signature WRONG');
      }

      return callback(new Error('Invalid signature'), null, false);
    }

    if (Meteor.settings.debug) {
      console.log('Signature OK');
    }

    const response = self.getElement(doc, 'Response');

    if (Meteor.settings.debug) {
      console.log('Got response');
    }

    if (response) {
      const assertion = self.getElement(response, 'Assertion');

      if (!assertion) {
        return callback(new Error('Missing SAML assertion'), null, false);
      }

      const profile = {};

      if (response.$ && response.$.InResponseTo) {
        profile.inResponseToId = response.$.InResponseTo;
      }

      const issuer = self.getElement(assertion[0], 'Issuer');

      if (issuer) {
        profile.issuer = issuer[0]._;
      }

      const subject = self.getElement(assertion[0], 'Subject');

      if (subject) {
        const nameID = self.getElement(subject[0], 'NameID');

        if (nameID) {
          profile.nameID = nameID[0]._;

          if (nameID[0].$.Format) {
            profile.nameIDFormat = nameID[0].$.Format;
          }
        }
      }

      const authnStatement = self.getElement(assertion[0], 'AuthnStatement');

      if (authnStatement) {
        if (authnStatement[0].$.SessionIndex) {
          profile.sessionIndex = authnStatement[0].$.SessionIndex;

          if (Meteor.settings.debug) {
            console.log(`Session Index: ${profile.sessionIndex}`);
          }
        } else if (Meteor.settings.debug) {
          console.log('No Session Index Found');
        }
      } else if (Meteor.settings.debug) {
        console.log('No AuthN Statement found');
      }

      const attributeStatement = self.getElement(assertion[0], 'AttributeStatement');

      if (attributeStatement) {
        const attributes = self.getElement(attributeStatement[0], 'Attribute');

        if (attributes) {
          attributes.forEach(function (attribute) {
            const value = self.getElement(attribute, 'AttributeValue');
            const key = attribute.$.Name.value;

            if (typeof value[0] === 'string') {
              profile[key] = value[0];
            } else {
              profile[key] = value[0]._;
            }
          });
        }

        if (!profile.mail && profile['urn:oid:0.9.2342.19200300.100.1.3']) {
          // See http://www.incommonfederation.org/attributesummary.html for definition of attribute OIDs
          profile.mail = profile['urn:oid:0.9.2342.19200300.100.1.3'];
        }

        if (!profile.email && profile.mail) {
          profile.email = profile.mail;
        }
      }

      if (!profile.email && profile.nameID && (profile.nameIDFormat && profile.nameIDFormat.value != null ? profile.nameIDFormat.value : profile.nameIDFormat).indexOf('emailAddress') >= 0) {
        profile.email = profile.nameID;
      }

      if (Meteor.settings.debug) {
        console.log(`NameID: ${JSON.stringify(profile)}`);
      }

      const profileKeys = Object.keys(profile);

      for (let i = 0; i < profileKeys.length; i++) {
        const key = profileKeys[i];

        if (key.match(/\./)) {
          profile[key.replace(/\./g, '-')] = profile[key];
          delete profile[key];
        }
      }

      callback(null, profile, false);
    } else {
      const logoutResponse = self.getElement(doc, 'LogoutResponse');

      if (logoutResponse) {
        callback(null, null, true);
      } else {
        return callback(new Error('Unknown SAML response message'), null, false);
      }
    }
  });
};

let decryptionCert;

SAML.prototype.generateServiceProviderMetadata = function (callbackUrl) {
  if (!decryptionCert) {
    decryptionCert = this.options.privateCert;
  }

  if (!this.options.callbackUrl && !callbackUrl) {
    throw new Error('Unable to generate service provider metadata when callbackUrl option is not set');
  }

  const metadata = {
    'EntityDescriptor': {
      '@xmlns': 'urn:oasis:names:tc:SAML:2.0:metadata',
      '@xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
      '@entityID': this.options.issuer,
      'SPSSODescriptor': {
        '@protocolSupportEnumeration': 'urn:oasis:names:tc:SAML:2.0:protocol',
        'SingleLogoutService': {
          '@Binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
          '@Location': `${Meteor.absoluteUrl()}_saml/logout/${this.options.provider}/`,
          '@ResponseLocation': `${Meteor.absoluteUrl()}_saml/logout/${this.options.provider}/`
        },
        'NameIDFormat': this.options.identifierFormat,
        'AssertionConsumerService': {
          '@index': '1',
          '@isDefault': 'true',
          '@Binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
          '@Location': callbackUrl
        }
      }
    }
  };

  if (this.options.privateKey) {
    if (!decryptionCert) {
      throw new Error('Missing decryptionCert while generating metadata for decrypting service provider');
    }

    decryptionCert = decryptionCert.replace(/-+BEGIN CERTIFICATE-+\r?\n?/, '');
    decryptionCert = decryptionCert.replace(/-+END CERTIFICATE-+\r?\n?/, '');
    decryptionCert = decryptionCert.replace(/\r\n/g, '\n');
    metadata['EntityDescriptor']['SPSSODescriptor']['KeyDescriptor'] = {
      'ds:KeyInfo': {
        'ds:X509Data': {
          'ds:X509Certificate': {
            '#text': decryptionCert
          }
        }
      },
      '#list': [// this should be the set that the xmlenc library supports
      {
        'EncryptionMethod': {
          '@Algorithm': 'http://www.w3.org/2001/04/xmlenc#aes256-cbc'
        }
      }, {
        'EncryptionMethod': {
          '@Algorithm': 'http://www.w3.org/2001/04/xmlenc#aes128-cbc'
        }
      }, {
        'EncryptionMethod': {
          '@Algorithm': 'http://www.w3.org/2001/04/xmlenc#tripledes-cbc'
        }
      }]
    };
  }

  return xmlbuilder.create(metadata).end({
    pretty: true,
    indent: '  ',
    newline: '\n'
  });
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saml_rocketchat.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/steffo_meteor-accounts-saml/saml_rocketchat.js                                                           //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.export({
  updateServices: () => updateServices,
  configureSamlService: () => configureSamlService,
  getSamlConfigs: () => getSamlConfigs,
  debounce: () => debounce,
  logger: () => logger
});
const logger = new Logger('steffo:meteor-accounts-saml', {
  methods: {
    updated: {
      type: 'info'
    }
  }
});
RocketChat.settings.addGroup('SAML');
Meteor.methods({
  addSamlService(name) {
    RocketChat.settings.add(`SAML_Custom_${name}`, false, {
      type: 'boolean',
      group: 'SAML',
      section: name,
      i18nLabel: 'Accounts_OAuth_Custom_Enable'
    });
    RocketChat.settings.add(`SAML_Custom_${name}_provider`, 'provider-name', {
      type: 'string',
      group: 'SAML',
      section: name,
      i18nLabel: 'SAML_Custom_Provider'
    });
    RocketChat.settings.add(`SAML_Custom_${name}_entry_point`, 'https://example.com/simplesaml/saml2/idp/SSOService.php', {
      type: 'string',
      group: 'SAML',
      section: name,
      i18nLabel: 'SAML_Custom_Entry_point'
    });
    RocketChat.settings.add(`SAML_Custom_${name}_idp_slo_redirect_url`, 'https://example.com/simplesaml/saml2/idp/SingleLogoutService.php', {
      type: 'string',
      group: 'SAML',
      section: name,
      i18nLabel: 'SAML_Custom_IDP_SLO_Redirect_URL'
    });
    RocketChat.settings.add(`SAML_Custom_${name}_issuer`, 'https://your-rocket-chat/_saml/metadata/provider-name', {
      type: 'string',
      group: 'SAML',
      section: name,
      i18nLabel: 'SAML_Custom_Issuer'
    });
    RocketChat.settings.add(`SAML_Custom_${name}_cert`, '', {
      type: 'string',
      group: 'SAML',
      section: name,
      i18nLabel: 'SAML_Custom_Cert',
      multiline: true
    });
    RocketChat.settings.add(`SAML_Custom_${name}_public_cert`, '', {
      type: 'string',
      group: 'SAML',
      section: name,
      multiline: true,
      i18nLabel: 'SAML_Custom_Public_Cert'
    });
    RocketChat.settings.add(`SAML_Custom_${name}_private_key`, '', {
      type: 'string',
      group: 'SAML',
      section: name,
      multiline: true,
      i18nLabel: 'SAML_Custom_Private_Key'
    });
    RocketChat.settings.add(`SAML_Custom_${name}_button_label_text`, '', {
      type: 'string',
      group: 'SAML',
      section: name,
      i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text'
    });
    RocketChat.settings.add(`SAML_Custom_${name}_button_label_color`, '#FFFFFF', {
      type: 'string',
      group: 'SAML',
      section: name,
      i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color'
    });
    RocketChat.settings.add(`SAML_Custom_${name}_button_color`, '#13679A', {
      type: 'string',
      group: 'SAML',
      section: name,
      i18nLabel: 'Accounts_OAuth_Custom_Button_Color'
    });
    RocketChat.settings.add(`SAML_Custom_${name}_generate_username`, false, {
      type: 'boolean',
      group: 'SAML',
      section: name,
      i18nLabel: 'SAML_Custom_Generate_Username'
    });
    RocketChat.settings.add(`SAML_Custom_${name}_logout_behaviour`, 'SAML', {
      type: 'select',
      values: [{
        key: 'SAML',
        i18nLabel: 'SAML_Custom_Logout_Behaviour_Terminate_SAML_Session'
      }, {
        key: 'Local',
        i18nLabel: 'SAML_Custom_Logout_Behaviour_End_Only_RocketChat'
      }],
      group: 'SAML',
      section: name,
      i18nLabel: 'SAML_Custom_Logout_Behaviour'
    });
  }

});

const getSamlConfigs = function (service) {
  return {
    buttonLabelText: RocketChat.settings.get(`${service.key}_button_label_text`),
    buttonLabelColor: RocketChat.settings.get(`${service.key}_button_label_color`),
    buttonColor: RocketChat.settings.get(`${service.key}_button_color`),
    clientConfig: {
      provider: RocketChat.settings.get(`${service.key}_provider`)
    },
    entryPoint: RocketChat.settings.get(`${service.key}_entry_point`),
    idpSLORedirectURL: RocketChat.settings.get(`${service.key}_idp_slo_redirect_url`),
    generateUsername: RocketChat.settings.get(`${service.key}_generate_username`),
    issuer: RocketChat.settings.get(`${service.key}_issuer`),
    logoutBehaviour: RocketChat.settings.get(`${service.key}_logout_behaviour`),
    secret: {
      privateKey: RocketChat.settings.get(`${service.key}_private_key`),
      publicCert: RocketChat.settings.get(`${service.key}_public_cert`),
      cert: RocketChat.settings.get(`${service.key}_cert`)
    }
  };
};

const debounce = (fn, delay) => {
  let timer = null;
  return () => {
    if (timer != null) {
      Meteor.clearTimeout(timer);
    }

    return timer = Meteor.setTimeout(fn, delay);
  };
};

const serviceName = 'saml';

const configureSamlService = function (samlConfigs) {
  let privateCert = false;
  let privateKey = false;

  if (samlConfigs.secret.privateKey && samlConfigs.secret.publicCert) {
    privateKey = samlConfigs.secret.privateKey;
    privateCert = samlConfigs.secret.publicCert;
  } else if (samlConfigs.secret.privateKey || samlConfigs.secret.publicCert) {
    logger.error('You must specify both cert and key files.');
  } // TODO: the function configureSamlService is called many times and Accounts.saml.settings.generateUsername keeps just the last value


  Accounts.saml.settings.generateUsername = samlConfigs.generateUsername;
  return {
    provider: samlConfigs.clientConfig.provider,
    entryPoint: samlConfigs.entryPoint,
    idpSLORedirectURL: samlConfigs.idpSLORedirectURL,
    issuer: samlConfigs.issuer,
    cert: samlConfigs.secret.cert,
    privateCert,
    privateKey
  };
};

const updateServices = debounce(() => {
  const services = RocketChat.settings.get(/^(SAML_Custom_)[a-z]+$/i);
  Accounts.saml.settings.providers = services.map(service => {
    if (service.value === true) {
      const samlConfigs = getSamlConfigs(service);
      logger.updated(service.key);
      ServiceConfiguration.configurations.upsert({
        service: serviceName.toLowerCase()
      }, {
        $set: samlConfigs
      });
      return configureSamlService(samlConfigs);
    } else {
      ServiceConfiguration.configurations.remove({
        service: serviceName.toLowerCase()
      });
    }
  }).filter(e => e);
}, 2000);
RocketChat.settings.get(/^SAML_.+/, updateServices);
Meteor.startup(() => {
  return Meteor.call('addSamlService', 'Default');
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/steffo:meteor-accounts-saml/saml_server.js");
require("/node_modules/meteor/steffo:meteor-accounts-saml/saml_utils.js");
require("/node_modules/meteor/steffo:meteor-accounts-saml/saml_rocketchat.js");

/* Exports */
Package._define("steffo:meteor-accounts-saml");

})();

//# sourceURL=meteor://💻app/packages/steffo_meteor-accounts-saml.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZmZvOm1ldGVvci1hY2NvdW50cy1zYW1sL3NhbWxfc2VydmVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVmZm86bWV0ZW9yLWFjY291bnRzLXNhbWwvc2FtbF91dGlscy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZmZvOm1ldGVvci1hY2NvdW50cy1zYW1sL3NhbWxfcm9ja2V0Y2hhdC5qcyJdLCJuYW1lcyI6WyJfIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJmaWJlciIsImNvbm5lY3QiLCJBY2NvdW50cyIsInNhbWwiLCJzZXR0aW5ncyIsImRlYnVnIiwiZ2VuZXJhdGVVc2VybmFtZSIsInByb3ZpZGVycyIsIlJvdXRlUG9saWN5IiwiZGVjbGFyZSIsImdldFNhbWxQcm92aWRlckNvbmZpZyIsInByb3ZpZGVyIiwiTWV0ZW9yIiwiRXJyb3IiLCJtZXRob2QiLCJzYW1sUHJvdmlkZXIiLCJlbGVtZW50IiwiZmlsdGVyIiwibWV0aG9kcyIsInNhbWxMb2dvdXQiLCJ1c2VySWQiLCJwcm92aWRlckNvbmZpZyIsImNvbnNvbGUiLCJsb2ciLCJKU09OIiwic3RyaW5naWZ5IiwidXNlciIsInVzZXJzIiwiZmluZE9uZSIsIl9pZCIsIm5hbWVJRCIsInNlcnZpY2VzIiwic2Vzc2lvbkluZGV4IiwiaWRwU2Vzc2lvbiIsIl9zYW1sIiwiU0FNTCIsInJlcXVlc3QiLCJnZW5lcmF0ZUxvZ291dFJlcXVlc3QiLCJ1cGRhdGUiLCIkc2V0IiwiaWQiLCJfc3luY1JlcXVlc3RUb1VybCIsIndyYXBBc3luYyIsInJlcXVlc3RUb1VybCIsInJlc3VsdCIsInJlZ2lzdGVyTG9naW5IYW5kbGVyIiwibG9naW5SZXF1ZXN0IiwiY3JlZGVudGlhbFRva2VuIiwidW5kZWZpbmVkIiwibG9naW5SZXN1bHQiLCJyZXRyaWV2ZUNyZWRlbnRpYWwiLCJ0eXBlIiwiZXJyb3IiLCJMb2dpbkNhbmNlbGxlZEVycm9yIiwibnVtZXJpY0Vycm9yIiwicHJvZmlsZSIsImVtYWlsIiwiUmVnRXhwIiwiZXNjYXBlIiwiZW1haWxSZWdleCIsIm5ld1VzZXIiLCJuYW1lIiwiY24iLCJ1c2VybmFtZSIsImFjdGl2ZSIsImdsb2JhbFJvbGVzIiwiZW1haWxzIiwiYWRkcmVzcyIsInZlcmlmaWVkIiwiUm9ja2V0Q2hhdCIsImdlbmVyYXRlVXNlcm5hbWVTdWdnZXN0aW9uIiwiaW5zZXJ0VXNlckRvYyIsInN0YW1wZWRUb2tlbiIsIl9nZW5lcmF0ZVN0YW1wZWRMb2dpblRva2VuIiwiJHB1c2giLCJzYW1sTG9naW4iLCJSZWxheVN0YXRlIiwiaWRwIiwiaXNzdWVyIiwidG9rZW4iLCJoYXNDcmVkZW50aWFsIiwibW9kZWxzIiwiQ3JlZGVudGlhbFRva2VucyIsImZpbmRPbmVCeUlkIiwiZGF0YSIsInVzZXJJbmZvIiwic3RvcmVDcmVkZW50aWFsIiwiY3JlYXRlIiwiY2xvc2VQb3B1cCIsInJlcyIsImVyciIsIndyaXRlSGVhZCIsImNvbnRlbnQiLCJlbmQiLCJzYW1sVXJsVG9PYmplY3QiLCJ1cmwiLCJzcGxpdFVybCIsInNwbGl0Iiwic3BsaXRQYXRoIiwiYWN0aW9uTmFtZSIsInNlcnZpY2VOYW1lIiwibWlkZGxld2FyZSIsInJlcSIsIm5leHQiLCJzYW1sT2JqZWN0Iiwic2VydmljZSIsImZpbmQiLCJzYW1sU2V0dGluZyIsImNhbGxiYWNrVXJsIiwiYWJzb2x1dGVVcmwiLCJ3cml0ZSIsImdlbmVyYXRlU2VydmljZVByb3ZpZGVyTWV0YWRhdGEiLCJ2YWxpZGF0ZUxvZ291dFJlc3BvbnNlIiwicXVlcnkiLCJTQU1MUmVzcG9uc2UiLCJsb2dPdXRVc2VyIiwiaW5SZXNwb25zZVRvIiwibG9nZ2VkT3V0VXNlciIsImZldGNoIiwibGVuZ3RoIiwiJHVuc2V0IiwicnVuIiwicmVkaXJlY3QiLCJnZXRBdXRob3JpemVVcmwiLCJib2R5IiwidmFsaWRhdGVSZXNwb25zZSIsImluUmVzcG9uc2VUb0lkIiwidmFsdWUiLCJJblJlc3BvbnNlVG8iLCJzYW1sX2lkcF9jcmVkZW50aWFsVG9rZW4iLCJSYW5kb20iLCJXZWJBcHAiLCJjb25uZWN0SGFuZGxlcnMiLCJ1c2UiLCJib2R5UGFyc2VyIiwiemxpYiIsInhtbDJqcyIsInhtbENyeXB0byIsImNyeXB0byIsInhtbGRvbSIsInF1ZXJ5c3RyaW5nIiwieG1sYnVpbGRlciIsIm9wdGlvbnMiLCJpbml0aWFsaXplIiwicHJvdG90eXBlIiwicHJvdG9jb2wiLCJwYXRoIiwiaWRlbnRpZmllckZvcm1hdCIsImF1dGhuQ29udGV4dCIsImdlbmVyYXRlVW5pcXVlSUQiLCJjaGFycyIsInVuaXF1ZUlEIiwiaSIsInN1YnN0ciIsIk1hdGgiLCJmbG9vciIsInJhbmRvbSIsImdlbmVyYXRlSW5zdGFudCIsIkRhdGUiLCJ0b0lTT1N0cmluZyIsInNpZ25SZXF1ZXN0IiwieG1sIiwic2lnbmVyIiwiY3JlYXRlU2lnbiIsInNpZ24iLCJwcml2YXRlS2V5IiwiZ2VuZXJhdGVBdXRob3JpemVSZXF1ZXN0IiwiaW5zdGFudCIsImhlYWRlcnMiLCJob3N0IiwiZW50cnlQb2ludCIsImlkcFNMT1JlZGlyZWN0VVJMIiwib3BlcmF0aW9uIiwiY2FsbGJhY2siLCJzZWxmIiwiZGVmbGF0ZVJhdyIsImJ1ZmZlciIsImJhc2U2NCIsInRvU3RyaW5nIiwidGFyZ2V0IiwiaW5kZXhPZiIsInJlbGF5U3RhdGUiLCJzYW1sUmVxdWVzdCIsIlNBTUxSZXF1ZXN0IiwicHJpdmF0ZUNlcnQiLCJTaWdBbGciLCJTaWduYXR1cmUiLCJnZXRMb2dvdXRVcmwiLCJjZXJ0VG9QRU0iLCJjZXJ0IiwibWF0Y2giLCJqb2luIiwidmFsaWRhdGVTaWduYXR1cmUiLCJkb2MiLCJET01QYXJzZXIiLCJwYXJzZUZyb21TdHJpbmciLCJzaWduYXR1cmUiLCJ4cGF0aCIsInNpZyIsIlNpZ25lZFhtbCIsImtleUluZm9Qcm92aWRlciIsImdldEtleUluZm8iLCJnZXRLZXkiLCJsb2FkU2lnbmF0dXJlIiwiY2hlY2tTaWduYXR1cmUiLCJnZXRFbGVtZW50IiwicGFyZW50RWxlbWVudCIsImVsZW1lbnROYW1lIiwic2FtbFJlc3BvbnNlIiwiY29tcHJlc3NlZFNBTUxSZXNwb25zZSIsIkJ1ZmZlciIsImluZmxhdGVSYXciLCJkZWNvZGVkIiwicGFyc2VyIiwiUGFyc2VyIiwiZXhwbGljaXRSb290IiwicGFyc2VTdHJpbmciLCJyZXNwb25zZSIsIiQiLCJzdGF0dXMiLCJzdGF0dXNDb2RlIiwiVmFsdWUiLCJ4bWxucyIsImFzc2VydGlvbiIsInN1YmplY3QiLCJGb3JtYXQiLCJuYW1lSURGb3JtYXQiLCJhdXRoblN0YXRlbWVudCIsIlNlc3Npb25JbmRleCIsImF0dHJpYnV0ZVN0YXRlbWVudCIsImF0dHJpYnV0ZXMiLCJmb3JFYWNoIiwiYXR0cmlidXRlIiwia2V5IiwiTmFtZSIsIm1haWwiLCJwcm9maWxlS2V5cyIsIk9iamVjdCIsImtleXMiLCJyZXBsYWNlIiwibG9nb3V0UmVzcG9uc2UiLCJkZWNyeXB0aW9uQ2VydCIsIm1ldGFkYXRhIiwicHJldHR5IiwiaW5kZW50IiwibmV3bGluZSIsImV4cG9ydCIsInVwZGF0ZVNlcnZpY2VzIiwiY29uZmlndXJlU2FtbFNlcnZpY2UiLCJnZXRTYW1sQ29uZmlncyIsImRlYm91bmNlIiwibG9nZ2VyIiwiTG9nZ2VyIiwidXBkYXRlZCIsImFkZEdyb3VwIiwiYWRkU2FtbFNlcnZpY2UiLCJhZGQiLCJncm91cCIsInNlY3Rpb24iLCJpMThuTGFiZWwiLCJtdWx0aWxpbmUiLCJ2YWx1ZXMiLCJidXR0b25MYWJlbFRleHQiLCJnZXQiLCJidXR0b25MYWJlbENvbG9yIiwiYnV0dG9uQ29sb3IiLCJjbGllbnRDb25maWciLCJsb2dvdXRCZWhhdmlvdXIiLCJzZWNyZXQiLCJwdWJsaWNDZXJ0IiwiZm4iLCJkZWxheSIsInRpbWVyIiwiY2xlYXJUaW1lb3V0Iiwic2V0VGltZW91dCIsInNhbWxDb25maWdzIiwibWFwIiwiU2VydmljZUNvbmZpZ3VyYXRpb24iLCJjb25maWd1cmF0aW9ucyIsInVwc2VydCIsInRvTG93ZXJDYXNlIiwicmVtb3ZlIiwiZSIsInN0YXJ0dXAiLCJjYWxsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxDQUFKOztBQUFNQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEO0FBQXdELElBQUlDLEtBQUo7QUFBVUwsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFFBQVIsQ0FBYixFQUErQjtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0MsWUFBTUQsQ0FBTjtBQUFROztBQUFwQixDQUEvQixFQUFxRCxDQUFyRDtBQUF3RCxJQUFJRSxPQUFKO0FBQVlOLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxTQUFSLENBQWIsRUFBZ0M7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNFLGNBQVFGLENBQVI7QUFBVTs7QUFBdEIsQ0FBaEMsRUFBd0QsQ0FBeEQ7O0FBSTVJLElBQUksQ0FBQ0csU0FBU0MsSUFBZCxFQUFvQjtBQUNuQkQsV0FBU0MsSUFBVCxHQUFnQjtBQUNmQyxjQUFVO0FBQ1RDLGFBQU8sSUFERTtBQUVUQyx3QkFBa0IsS0FGVDtBQUdUQyxpQkFBVztBQUhGO0FBREssR0FBaEI7QUFPQTs7QUFJREMsWUFBWUMsT0FBWixDQUFvQixTQUFwQixFQUErQixTQUEvQjtBQUVBOzs7O0FBR0EsU0FBU0MscUJBQVQsQ0FBK0JDLFFBQS9CLEVBQXlDO0FBQ3hDLE1BQUksQ0FBRUEsUUFBTixFQUFnQjtBQUNmLFVBQU0sSUFBSUMsT0FBT0MsS0FBWCxDQUFpQixrQkFBakIsRUFDTCxxQkFESyxFQUVMO0FBQUVDLGNBQVE7QUFBVixLQUZLLENBQU47QUFHQTs7QUFDRCxRQUFNQyxlQUFlLFVBQVNDLE9BQVQsRUFBa0I7QUFDdEMsV0FBUUEsUUFBUUwsUUFBUixL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QVNPO0FBQ05FLDJCQUFxQkMsY0FBckIsQ0FBb0NHLE1BQXBDLENBQTJDO0FBQzFDaEwsaUJBQVNMLFlBQVlvTCxXQUFaO0FBRGlDLE9BQTNDO0FBR0E7QUFDRCxHQWZrQyxFQWVoQ3ZRLE1BZmdDLENBZXpCeVEsS0FBS0EsQ0Fmb0IsQ0FBbkM7QUFnQkEsQ0FsQnNCLEVBa0JwQixJQWxCb0IsQ0FBdkI7QUFxQkFyTixXQUFXakUsUUFBWCxDQUFvQm1RLEdBQXBCLENBQXdCLFVBQXhCLEVBQW9DaEIsY0FBcEM7QUFFQTNPLE9BQU8rUSxPQUFQLENBQWUsTUFBTTtBQUNwQixTQUFPL1EsT0FBT2dSLElBQVAsQ0FBWSxnQkFBWixFQUE4QixTQUE5QixDQUFQO0FBQ0EsQ0FGRCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9zdGVmZm9fbWV0ZW9yLWFjY291bnRzLXNhbWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWxzIFJvdXRlUG9saWN5LCBTQU1MICovXG4vKiBqc2hpbnQgbmV3Y2FwOiBmYWxzZSAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbmlmICghQWNjb3VudHMuc2FtbCkge1xuXHRBY2NvdW50cy5zYW1sID0ge1xuXHRcdHNldHRpbmdzOiB7XG5cdFx0XHRkZWJ1ZzogdHJ1ZSxcblx0XHRcdGdlbmVyYXRlVXNlcm5hbWU6IGZhbHNlLFxuXHRcdFx0cHJvdmlkZXJzOiBbXVxuXHRcdH1cblx0fTtcbn1cblxuaW1wb3J0IGZpYmVyIGZyb20gJ2ZpYmVycyc7XG5pbXBvcnQgY29ubmVjdCBmcm9tICdjb25uZWN0JztcblJvdXRlUG9saWN5LmRlY2xhcmUoJy9fc2FtbC8nLCAnbmV0d29yaycpO1xuXG4vKipcbiAqIEZldGNoIFNBTUwgcHJvdmlkZXIgY29uZmlncyBmb3IgZ2l2ZW4gJ3Byb3ZpZGVyJy5cbiAqL1xuZnVuY3Rpb24gZ2V0U2FtbFByb3ZpZGVyQ29uZmlnKHByb3ZpZGVyKSB7XG5cdGlmICghIHByb3ZpZGVyKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignbm8tc2FtbC1wcm92aWRlcicsXG5cdFx0XHQnU0FNTCBpbnRlcm5hbCBlcnJvcicsXG5cdFx0XHR7IG1ldGhvZDogJ2dldFNhbWxQcm92aWRlckNvbmZpZycgfSk7XG5cdH1cblx0Y29uc3Qgc2FtbFByb3ZpZGVyID0gZnVuY3Rpb24oZWxlbWVudCkge1xuXHRcdHJldHVybiAoZWxlbWVudC5wcm92aWRlciA9PT0gcHJvdmlkZXIpO1xuXHR9O1xuXHRyZXR1cm4gQWNjb3VudHMuc2FtbC5zZXR0aW5ncy5wcm92aWRlcnMuZmlsdGVyKHNhbWxQcm92aWRlcilbMF07XG59XG5cbk1ldGVvci5tZXRob2RzKHtcblx0c2FtbExvZ291dChwcm92aWRlcikge1xuXHRcdC8vIE1ha2Ugc3VyZSB0aGUgdXNlciBpcyBsb2dnZWQgaW4gYmVmb3JlIGluaXRpYXRlIFNBTUwgU0xPXG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7IG1ldGhvZDogJ3NhbWxMb2dvdXQnIH0pO1xuXHRcdH1cblx0XHRjb25zdCBwcm92aWRlckNvbmZpZyA9IGdldFNhbWxQcm92aWRlckNvbmZpZyhwcm92aWRlcik7XG5cblx0XHRpZiAoQWNjb3VudHMuc2FtbC5zZXR0aW5ncy5kZWJ1Zykge1xuXHRcdFx0Y29uc29sZS5sb2coYExvZ291dCByZXF1ZXN0IGZyb20gJHsgSlNPTi5zdHJpbmdpZnkocHJvdmlkZXJDb25maWcpIH1gKTtcblx0XHR9XG5cdFx0Ly8gVGhpcyBxdWVyeSBzaG91bGQgcmVzcGVjdCB1cGNvbWluZyBhcnJheSBvZiBTQU1MIGxvZ2luc1xuXHRcdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh7XG5cdFx0XHRfaWQ6IE1ldGVvci51c2VySWQoKSxcblx0XHRcdCdzZXJ2aWNlcy5zYW1sLnByb3ZpZGVyJzogcHJvdmlkZXJcblx0XHR9LCB7XG5cdFx0XHQnc2VydmljZXMuc2FtbCc6IDFcblx0XHR9KTtcblx0XHRsZXQgbmFtZUlEID0gdXNlci5zZXJ2aWNlcy5zYW1sLm5hbWVJRDtcblx0XHRjb25zdCBzZXNzaW9uSW5kZXggPSB1c2VyLnNlcnZpY2VzLnNhbWwuaWRwU2Vzc2lvbjtcblx0XHRuYW1lSUQgPSBzZXNzaW9uSW5kZXg7XG5cdFx0aWYgKEFjY291bnRzLnNhbWwuc2V0dGluZ3MuZGVidWcpIHtcblx0XHRcdGNvbnNvbGUubG9nKGBOYW1lSUQgZm9yIHVzZXIgJHsgTWV0ZW9yLnVzZXJJZCgpIH0gZm91bmQ6ICR7IEpTT04uc3RyaW5naWZ5KG5hbWVJRCkgfWApO1xuXHRcdH1cblxuXHRcdGNvbnN0IF9zYW1sID0gbmV3IFNBTUwocHJvdmlkZXJDb25maWcpO1xuXG5cdFx0Y29uc3QgcmVxdWVzdCA9IF9zYW1sLmdlbmVyYXRlTG9nb3V0UmVxdWVzdCh7XG5cdFx0XHRuYW1lSUQsXG5cdFx0XHRzZXNzaW9uSW5kZXhcblx0XHR9KTtcblxuXHRcdC8vIHJlcXVlc3QucmVxdWVzdDogYWN0dWFsIFhNTCBTQU1MIFJlcXVlc3Rcblx0XHQvLyByZXF1ZXN0LmlkOiBjb21taW51Y2F0aW9uIGlkIHdoaWNoIHdpbGwgYmUgbWVudGlvbmVkIGluIHRoZSBSZXNwb25zZVRvIGZpZWxkIG9mIFNBTUxSZXNwb25zZVxuXG5cdFx0TWV0ZW9yLnVzZXJzLnVwZGF0ZSh7XG5cdFx0XHRfaWQ6IE1ldGVvci51c2VySWQoKVxuXHRcdH0sIHtcblx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0J3NlcnZpY2VzLnNhbWwuaW5SZXNwb25zZVRvJzogcmVxdWVzdC5pZFxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Y29uc3QgX3N5bmNSZXF1ZXN0VG9VcmwgPSBNZXRlb3Iud3JhcEFzeW5jKF9zYW1sLnJlcXVlc3RUb1VybCwgX3NhbWwpO1xuXHRcdGNvbnN0IHJlc3VsdCA9IF9zeW5jUmVxdWVzdFRvVXJsKHJlcXVlc3QucmVxdWVzdCwgJ2xvZ291dCcpO1xuXHRcdGlmIChBY2NvdW50cy5zYW1sLnNldHRpbmdzLmRlYnVnKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhgU0FNTCBMb2dvdXQgUmVxdWVzdCAkeyByZXN1bHQgfWApO1xuXHRcdH1cblxuXG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxufSk7XG5cbkFjY291bnRzLnJlZ2lzdGVyTG9naW5IYW5kbGVyKGZ1bmN0aW9uKGxvZ2luUmVxdWVzdCkge1xuXHRpZiAoIWxvZ2luUmVxdWVzdC5zYW1sIHx8ICFsb2dpblJlcXVlc3QuY3JlZGVudGlhbFRva2VuKSB7XG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXG5cdGNvbnN0IGxvZ2luUmVzdWx0ID0gQWNjb3VudHMuc2FtbC5yZXRyaWV2ZUNyZWRlbnRpYWwobG9naW5SZXF1ZXN0LmNyZWRlbnRpYWxUb2tlbik7XG5cdGlmIChBY2NvdW50cy5zYW1sLnNldHRpbmdzLmRlYnVnKSB7XG5cdFx0Y29uc29sZS5sb2coYFJFU1VMVCA6JHsgSlNPTi5zdHJpbmdpZnkobG9naW5SZXN1bHQpIH1gKTtcblx0fVxuXG5cdGlmIChsb2dpblJlc3VsdCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6ICdzYW1sJyxcblx0XHRcdGVycm9yOiBuZXcgTWV0ZW9yLkVycm9yKEFjY291bnRzLkxvZ2luQ2FuY2VsbGVkRXJyb3IubnVtZXJpY0Vycm9yLCAnTm8gbWF0Y2hpbmcgbG9naW4gYXR0ZW1wdCBmb3VuZCcpXG5cdFx0fTtcblx0fVxuXG5cdGlmIChsb2dpblJlc3VsdCAmJiBsb2dpblJlc3VsdC5wcm9maWxlICYmIGxvZ2luUmVzdWx0LnByb2ZpbGUuZW1haWwpIHtcblx0XHRjb25zdCBlbWFpbCA9IFJlZ0V4cC5lc2NhcGUobG9naW5SZXN1bHQucHJvZmlsZS5lbWFpbCk7XG5cdFx0Y29uc3QgZW1haWxSZWdleCA9IG5ldyBSZWdFeHAoYF4keyBlbWFpbCB9JGAsICdpJyk7XG5cdFx0bGV0IHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh7XG5cdFx0XHQnZW1haWxzLmFkZHJlc3MnOiBlbWFpbFJlZ2V4XG5cdFx0fSk7XG5cblx0XHRpZiAoIXVzZXIpIHtcblx0XHRcdGNvbnN0IG5ld1VzZXIgPSB7XG5cdFx0XHRcdG5hbWU6IGxvZ2luUmVzdWx0LnByb2ZpbGUuY24gfHwgbG9naW5SZXN1bHQucHJvZmlsZS51c2VybmFtZSxcblx0XHRcdFx0YWN0aXZlOiB0cnVlLFxuXHRcdFx0XHRnbG9iYWxSb2xlczogWyd1c2VyJ10sXG5cdFx0XHRcdGVtYWlsczogW3tcblx0XHRcdFx0XHRhZGRyZXNzOiBsb2dpblJlc3VsdC5wcm9maWxlLmVtYWlsLFxuXHRcdFx0XHRcdHZlcmlmaWVkOiB0cnVlXG5cdFx0XHRcdH1dXG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAoQWNjb3VudHMuc2FtbC5zZXR0aW5ncy5nZW5lcmF0ZVVzZXJuYW1lID09PSB0cnVlKSB7XG5cdFx0XHRcdGNvbnN0IHVzZXJuYW1lID0gUm9ja2V0Q2hhdC5nZW5lcmF0ZVVzZXJuYW1lU3VnZ2VzdGlvbihuZXdVc2VyKTtcblx0XHRcdFx0aWYgKHVzZXJuYW1lKSB7XG5cdFx0XHRcdFx0bmV3VXNlci51c2VybmFtZSA9IHVzZXJuYW1lO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKGxvZ2luUmVzdWx0LnByb2ZpbGUudXNlcm5hbWUpIHtcblx0XHRcdFx0bmV3VXNlci51c2VybmFtZSA9IGxvZ2luUmVzdWx0LnByb2ZpbGUudXNlcm5hbWU7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHVzZXJJZCA9IEFjY291bnRzLmluc2VydFVzZXJEb2Moe30sIG5ld1VzZXIpO1xuXHRcdFx0dXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHVzZXJJZCk7XG5cdFx0fVxuXG5cdFx0Ly9jcmVhdGluZyB0aGUgdG9rZW4gYW5kIGFkZGluZyB0byB0aGUgdXNlclxuXHRcdGNvbnN0IHN0YW1wZWRUb2tlbiA9IEFjY291bnRzLl9nZW5lcmF0ZVN0YW1wZWRMb2dpblRva2VuKCk7XG5cdFx0TWV0ZW9yLnVzZXJzLnVwZGF0ZSh1c2VyLCB7XG5cdFx0XHQkcHVzaDoge1xuXHRcdFx0XHQnc2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zJzogc3RhbXBlZFRva2VuXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRjb25zdCBzYW1sTG9naW4gPSB7XG5cdFx0XHRwcm92aWRlcjogQWNjb3VudHMuc2FtbC5SZWxheVN0YXRlLFxuXHRcdFx0aWRwOiBsb2dpblJlc3VsdC5wcm9maWxlLmlzc3Vlcixcblx0XHRcdGlkcFNlc3Npb246IGxvZ2luUmVzdWx0LnByb2ZpbGUuc2Vzc2lvbkluZGV4LFxuXHRcdFx0bmFtZUlEOiBsb2dpblJlc3VsdC5wcm9maWxlLm5hbWVJRFxuXHRcdH07XG5cblx0XHRNZXRlb3IudXNlcnMudXBkYXRlKHtcblx0XHRcdF9pZDogdXNlci5faWRcblx0XHR9LCB7XG5cdFx0XHQkc2V0OiB7XG5cdFx0XHRcdC8vIFRCRCB0aGlzIHNob3VsZCBiZSBwdXNoZWQsIG90aGVyd2lzZSB3ZSdyZSBvbmx5IGFibGUgdG8gU1NPIGludG8gYSBzaW5nbGUgSURQIGF0IGEgdGltZVxuXHRcdFx0XHQnc2VydmljZXMuc2FtbCc6IHNhbWxMb2dpblxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly9zZW5kaW5nIHRva2VuIGFsb25nIHdpdGggdGhlIHVzZXJJZFxuXHRcdGNvbnN0IHJlc3VsdCA9IHtcblx0XHRcdHVzZXJJZDogdXNlci5faWQsXG5cdFx0XHR0b2tlbjogc3RhbXBlZFRva2VuLnRva2VuXG5cdFx0fTtcblxuXHRcdHJldHVybiByZXN1bHQ7XG5cblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ1NBTUwgUHJvZmlsZSBkaWQgbm90IGNvbnRhaW4gYW4gZW1haWwgYWRkcmVzcycpO1xuXHR9XG59KTtcblxuQWNjb3VudHMuc2FtbC5oYXNDcmVkZW50aWFsID0gZnVuY3Rpb24oY3JlZGVudGlhbFRva2VuKSB7XG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5DcmVkZW50aWFsVG9rZW5zLmZpbmRPbmVCeUlkKGNyZWRlbnRpYWxUb2tlbikgIT0gbnVsbDtcbn07XG5cbkFjY291bnRzLnNhbWwucmV0cmlldmVDcmVkZW50aWFsID0gZnVuY3Rpb24oY3JlZGVudGlhbFRva2VuKSB7XG5cdC8vIFRoZSBjcmVkZW50aWFsVG9rZW4gaW4gYWxsIHRoZXNlIGZ1bmN0aW9ucyBjb3JyZXNwb25kcyB0byBTQU1McyBpblJlc3BvbnNlVG8gZmllbGQgYW5kIGlzIG1hbmRhdG9yeSB0byBjaGVjay5cblx0Y29uc3QgZGF0YSA9IFJvY2tldENoYXQubW9kZWxzLkNyZWRlbnRpYWxUb2tlbnMuZmluZE9uZUJ5SWQoY3JlZGVudGlhbFRva2VuKTtcblx0aWYgKGRhdGEpIHtcblx0XHRyZXR1cm4gZGF0YS51c2VySW5mbztcblx0fVxufTtcblxuQWNjb3VudHMuc2FtbC5zdG9yZUNyZWRlbnRpYWwgPSBmdW5jdGlvbihjcmVkZW50aWFsVG9rZW4sIGxvZ2luUmVzdWx0KSB7XG5cdFJvY2tldENoYXQubW9kZWxzLkNyZWRlbnRpYWxUb2tlbnMuY3JlYXRlKGNyZWRlbnRpYWxUb2tlbiwgbG9naW5SZXN1bHQpO1xufTtcblxuY29uc3QgY2xvc2VQb3B1cCA9IGZ1bmN0aW9uKHJlcywgZXJyKSB7XG5cdHJlcy53cml0ZUhlYWQoMjAwLCB7XG5cdFx0J0NvbnRlbnQtVHlwZSc6ICd0ZXh0L2h0bWwnXG5cdH0pO1xuXHRsZXQgY29udGVudCA9ICc8aHRtbD48aGVhZD48c2NyaXB0PndpbmRvdy5jbG9zZSgpPC9zY3JpcHQ+PC9oZWFkPjxib2R5PjxIMT5WZXJpZmllZDwvSDE+PC9ib2R5PjwvaHRtbD4nO1xuXHRpZiAoZXJyKSB7XG5cdFx0Y29udGVudCA9IGA8aHRtbD48Ym9keT48aDI+U29ycnksIGFuIGFubm95aW5nIGVycm9yIG9jY3VyZWQ8L2gyPjxkaXY+JHsgZXJyIH08L2Rpdj48YSBvbmNsaWNrPVwid2luZG93LmNsb3NlKCk7XCI+Q2xvc2UgV2luZG93PC9hPjwvYm9keT48L2h0bWw+YDtcblx0fVxuXHRyZXMuZW5kKGNvbnRlbnQsICd1dGYtOCcpO1xufTtcblxuY29uc3Qgc2FtbFVybFRvT2JqZWN0ID0gZnVuY3Rpb24odXJsKSB7XG5cdC8vIHJlcS51cmwgd2lsbCBiZSAnL19zYW1sLzxhY3Rpb24+LzxzZXJ2aWNlIG5hbWU+LzxjcmVkZW50aWFsVG9rZW4+J1xuXHRpZiAoIXVybCkge1xuXHRcdHJldHVybiBudWxsO1xuXHR9XG5cblx0Y29uc3Qgc3BsaXRVcmwgPSB1cmwuc3BsaXQoJz8nKTtcblx0Y29uc3Qgc3BsaXRQYXRoID0gc3BsaXRVcmxbMF0uc3BsaXQoJy8nKTtcblxuXHQvLyBBbnkgbm9uLXNhbWwgcmVxdWVzdCB3aWxsIGNvbnRpbnVlIGRvd24gdGhlIGRlZmF1bHRcblx0Ly8gbWlkZGxld2FyZXMuXG5cdGlmIChzcGxpdFBhdGhbMV0gIT09ICdfc2FtbCcpIHtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG5cdGNvbnN0IHJlc3VsdCA9IHtcblx0XHRhY3Rpb25OYW1lOiBzcGxpdFBhdGhbMl0sXG5cdFx0c2VydmljZU5hbWU6IHNwbGl0UGF0aFszXSxcblx0XHRjcmVkZW50aWFsVG9rZW46IHNwbGl0UGF0aFs0XVxuXHR9O1xuXHRpZiAoQWNjb3VudHMuc2FtbC5zZXR0aW5ncy5kZWJ1Zykge1xuXHRcdGNvbnNvbGUubG9nKHJlc3VsdCk7XG5cdH1cblx0cmV0dXJuIHJlc3VsdDtcbn07XG5cbmNvbnN0IG1pZGRsZXdhcmUgPSBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuXHQvLyBNYWtlIHN1cmUgdG8gY2F0Y2ggYW55IGV4Y2VwdGlvbnMgYmVjYXVzZSBvdGhlcndpc2Ugd2UnZCBjcmFzaFxuXHQvLyB0aGUgcnVubmVyXG5cdHRyeSB7XG5cdFx0Y29uc3Qgc2FtbE9iamVjdCA9IHNhbWxVcmxUb09iamVjdChyZXEudXJsKTtcblx0XHRpZiAoIXNhbWxPYmplY3QgfHwgIXNhbWxPYmplY3Quc2VydmljZU5hbWUpIHtcblx0XHRcdG5leHQoKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoIXNhbWxPYmplY3QuYWN0aW9uTmFtZSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIFNBTUwgYWN0aW9uJyk7XG5cdFx0fVxuXG5cdFx0Y29uc29sZS5sb2coQWNjb3VudHMuc2FtbC5zZXR0aW5ncy5wcm92aWRlcnMpO1xuXHRcdGNvbnNvbGUubG9nKHNhbWxPYmplY3Quc2VydmljZU5hbWUpO1xuXHRcdGNvbnN0IHNlcnZpY2UgPSBfLmZpbmQoQWNjb3VudHMuc2FtbC5zZXR0aW5ncy5wcm92aWRlcnMsIGZ1bmN0aW9uKHNhbWxTZXR0aW5nKSB7XG5cdFx0XHRyZXR1cm4gc2FtbFNldHRpbmcucHJvdmlkZXIgPT09IHNhbWxPYmplY3Quc2VydmljZU5hbWU7XG5cdFx0fSk7XG5cblx0XHQvLyBTa2lwIGV2ZXJ5dGhpbmcgaWYgdGhlcmUncyBubyBzZXJ2aWNlIHNldCBieSB0aGUgc2FtbCBtaWRkbGV3YXJlXG5cdFx0aWYgKCFzZXJ2aWNlKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgU0FNTCBzZXJ2aWNlICR7IHNhbWxPYmplY3Quc2VydmljZU5hbWUgfWApO1xuXHRcdH1cblx0XHRsZXQgX3NhbWw7XG5cdFx0c3dpdGNoIChzYW1sT2JqZWN0LmFjdGlvbk5hbWUpIHtcblx0XHRcdGNhc2UgJ21ldGFkYXRhJzpcblx0XHRcdFx0X3NhbWwgPSBuZXcgU0FNTChzZXJ2aWNlKTtcblx0XHRcdFx0c2VydmljZS5jYWxsYmFja1VybCA9IE1ldGVvci5hYnNvbHV0ZVVybChgX3NhbWwvdmFsaWRhdGUvJHsgc2VydmljZS5wcm92aWRlciB9YCk7XG5cdFx0XHRcdHJlcy53cml0ZUhlYWQoMjAwKTtcblx0XHRcdFx0cmVzLndyaXRlKF9zYW1sLmdlbmVyYXRlU2VydmljZVByb3ZpZGVyTWV0YWRhdGEoc2VydmljZS5jYWxsYmFja1VybCkpO1xuXHRcdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHRcdC8vY2xvc2VQb3B1cChyZXMpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2xvZ291dCc6XG5cdFx0XHRcdC8vIFRoaXMgaXMgd2hlcmUgd2UgcmVjZWl2ZSBTQU1MIExvZ291dFJlc3BvbnNlXG5cdFx0XHRcdF9zYW1sID0gbmV3IFNBTUwoc2VydmljZSk7XG5cdFx0XHRcdF9zYW1sLnZhbGlkYXRlTG9nb3V0UmVzcG9uc2UocmVxLnF1ZXJ5LlNBTUxSZXNwb25zZSwgZnVuY3Rpb24oZXJyLCByZXN1bHQpIHtcblx0XHRcdFx0XHRpZiAoIWVycikge1xuXHRcdFx0XHRcdFx0Y29uc3QgbG9nT3V0VXNlciA9IGZ1bmN0aW9uKGluUmVzcG9uc2VUbykge1xuXHRcdFx0XHRcdFx0XHRpZiAoQWNjb3VudHMuc2FtbC5zZXR0aW5ncy5kZWJ1Zykge1xuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGBMb2dnaW5nIE91dCB1c2VyIHZpYSBpblJlc3BvbnNlVG8gJHsgaW5SZXNwb25zZVRvIH1gKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRjb25zdCBsb2dnZWRPdXRVc2VyID0gTWV0ZW9yLnVzZXJzLmZpbmQoe1xuXHRcdFx0XHRcdFx0XHRcdCdzZXJ2aWNlcy5zYW1sLmluUmVzcG9uc2VUbyc6IGluUmVzcG9uc2VUb1xuXHRcdFx0XHRcdFx0XHR9KS5mZXRjaCgpO1xuXHRcdFx0XHRcdFx0XHRpZiAobG9nZ2VkT3V0VXNlci5sZW5ndGggPT09IDEpIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAoQWNjb3VudHMuc2FtbC5zZXR0aW5ncy5kZWJ1Zykge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coYEZvdW5kIHVzZXIgJHsgbG9nZ2VkT3V0VXNlclswXS5faWQgfWApO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRNZXRlb3IudXNlcnMudXBkYXRlKHtcblx0XHRcdFx0XHRcdFx0XHRcdF9pZDogbG9nZ2VkT3V0VXNlclswXS5faWRcblx0XHRcdFx0XHRcdFx0XHR9LCB7XG5cdFx0XHRcdFx0XHRcdFx0XHQkc2V0OiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdCdzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMnOiBbXVxuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRcdE1ldGVvci51c2Vycy51cGRhdGUoe1xuXHRcdFx0XHRcdFx0XHRcdFx0X2lkOiBsb2dnZWRPdXRVc2VyWzBdLl9pZFxuXHRcdFx0XHRcdFx0XHRcdH0sIHtcblx0XHRcdFx0XHRcdFx0XHRcdCR1bnNldDoge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQnc2VydmljZXMuc2FtbCc6ICcnXG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignRm91bmQgbXVsdGlwbGUgdXNlcnMgbWF0Y2hpbmcgU0FNTCBpblJlc3BvbnNlVG8gZmllbGRzJyk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRcdGZpYmVyKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRsb2dPdXRVc2VyKHJlc3VsdCk7XG5cdFx0XHRcdFx0XHR9KS5ydW4oKTtcblxuXG5cdFx0XHRcdFx0XHRyZXMud3JpdGVIZWFkKDMwMiwge1xuXHRcdFx0XHRcdFx0XHQnTG9jYXRpb24nOiByZXEucXVlcnkuUmVsYXlTdGF0ZVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vICBlbHNlIHtcblx0XHRcdFx0XHQvLyBcdC8vIFRCRCB0aGlua2luZyBvZiBzdGggbWVhbmluZyBmdWxsLlxuXHRcdFx0XHRcdC8vIH1cblx0XHRcdFx0fSk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnc2xvUmVkaXJlY3QnOlxuXHRcdFx0XHRyZXMud3JpdGVIZWFkKDMwMiwge1xuXHRcdFx0XHRcdC8vIGNyZWRlbnRpYWxUb2tlbiBoZXJlIGlzIHRoZSBTQU1MIExvZ091dCBSZXF1ZXN0IHRoYXQgd2UnbGwgc2VuZCBiYWNrIHRvIElEUFxuXHRcdFx0XHRcdCdMb2NhdGlvbic6IHJlcS5xdWVyeS5yZWRpcmVjdFxuXHRcdFx0XHR9KTtcblx0XHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2F1dGhvcml6ZSc6XG5cdFx0XHRcdHNlcnZpY2UuY2FsbGJhY2tVcmwgPSBNZXRlb3IuYWJzb2x1dGVVcmwoYF9zYW1sL3ZhbGlkYXRlLyR7IHNlcnZpY2UucHJvdmlkZXIgfWApO1xuXHRcdFx0XHRzZXJ2aWNlLmlkID0gc2FtbE9iamVjdC5jcmVkZW50aWFsVG9rZW47XG5cdFx0XHRcdF9zYW1sID0gbmV3IFNBTUwoc2VydmljZSk7XG5cdFx0XHRcdF9zYW1sLmdldEF1dGhvcml6ZVVybChyZXEsIGZ1bmN0aW9uKGVyciwgdXJsKSB7XG5cdFx0XHRcdFx0aWYgKGVycikge1xuXHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gZ2VuZXJhdGUgYXV0aG9yaXplIHVybCcpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXMud3JpdGVIZWFkKDMwMiwge1xuXHRcdFx0XHRcdFx0J0xvY2F0aW9uJzogdXJsXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICd2YWxpZGF0ZSc6XG5cdFx0XHRcdF9zYW1sID0gbmV3IFNBTUwoc2VydmljZSk7XG5cdFx0XHRcdEFjY291bnRzLnNhbWwuUmVsYXlTdGF0ZSA9IHJlcS5ib2R5LlJlbGF5U3RhdGU7XG5cdFx0XHRcdF9zYW1sLnZhbGlkYXRlUmVzcG9uc2UocmVxLmJvZHkuU0FNTFJlc3BvbnNlLCByZXEuYm9keS5SZWxheVN0YXRlLCBmdW5jdGlvbihlcnIsIHByb2ZpbGUvKiwgbG9nZ2VkT3V0Ki8pIHtcblx0XHRcdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byB2YWxpZGF0ZSByZXNwb25zZSB1cmw6ICR7IGVyciB9YCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Y29uc3QgY3JlZGVudGlhbFRva2VuID0gKHByb2ZpbGUuaW5SZXNwb25zZVRvSWQgJiYgcHJvZmlsZS5pblJlc3BvbnNlVG9JZC52YWx1ZSkgfHwgcHJvZmlsZS5pblJlc3BvbnNlVG9JZCB8fCBwcm9maWxlLkluUmVzcG9uc2VUbyB8fCBzYW1sT2JqZWN0LmNyZWRlbnRpYWxUb2tlbjtcblx0XHRcdFx0XHRjb25zdCBsb2dpblJlc3VsdCA9IHtcblx0XHRcdFx0XHRcdHByb2ZpbGVcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdGlmICghY3JlZGVudGlhbFRva2VuKSB7XG5cdFx0XHRcdFx0XHQvLyBObyBjcmVkZW50aWFsVG9rZW4gaW4gSWRQLWluaXRpYXRlZCBTU09cblx0XHRcdFx0XHRcdGNvbnN0IHNhbWxfaWRwX2NyZWRlbnRpYWxUb2tlbiA9IFJhbmRvbS5pZCgpO1xuXHRcdFx0XHRcdFx0QWNjb3VudHMuc2FtbC5zdG9yZUNyZWRlbnRpYWwoc2FtbF9pZHBfY3JlZGVudGlhbFRva2VuLCBsb2dpblJlc3VsdCk7XG5cblx0XHRcdFx0XHRcdGNvbnN0IHVybCA9IGAkeyBNZXRlb3IuYWJzb2x1dGVVcmwoJ2hvbWUnKSB9P3NhbWxfaWRwX2NyZWRlbnRpYWxUb2tlbj0keyBzYW1sX2lkcF9jcmVkZW50aWFsVG9rZW4gfWA7XG5cdFx0XHRcdFx0XHRyZXMud3JpdGVIZWFkKDMwMiwge1xuXHRcdFx0XHRcdFx0XHQnTG9jYXRpb24nOiB1cmxcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRBY2NvdW50cy5zYW1sLnN0b3JlQ3JlZGVudGlhbChjcmVkZW50aWFsVG9rZW4sIGxvZ2luUmVzdWx0KTtcblx0XHRcdFx0XHRcdGNsb3NlUG9wdXAocmVzKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCBTQU1MIGFjdGlvbiAkeyBzYW1sT2JqZWN0LmFjdGlvbk5hbWUgfWApO1xuXG5cdFx0fVxuXHR9IGNhdGNoIChlcnIpIHtcblx0XHRjbG9zZVBvcHVwKHJlcywgZXJyKTtcblx0fVxufTtcblxuLy8gTGlzdGVuIHRvIGluY29taW5nIFNBTUwgaHR0cCByZXF1ZXN0c1xuV2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2UoY29ubmVjdC5ib2R5UGFyc2VyKCkpLnVzZShmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuXHQvLyBOZWVkIHRvIGNyZWF0ZSBhIGZpYmVyIHNpbmNlIHdlJ3JlIHVzaW5nIHN5bmNocm9ub3VzIGh0dHAgY2FsbHMgYW5kIG5vdGhpbmdcblx0Ly8gZWxzZSBpcyB3cmFwcGluZyB0aGlzIGluIGEgZmliZXIgYXV0b21hdGljYWxseVxuXHRmaWJlcihmdW5jdGlvbigpIHtcblx0XHRtaWRkbGV3YXJlKHJlcSwgcmVzLCBuZXh0KTtcblx0fSkucnVuKCk7XG59KTtcbiIsIi8qIGdsb2JhbHMgU0FNTDp0cnVlICovXG5cbmltcG9ydCB6bGliIGZyb20gJ3psaWInO1xuaW1wb3J0IHhtbDJqcyBmcm9tICd4bWwyanMnO1xuaW1wb3J0IHhtbENyeXB0byBmcm9tICd4bWwtY3J5cHRvJztcbmltcG9ydCBjcnlwdG8gZnJvbSAnY3J5cHRvJztcbmltcG9ydCB4bWxkb20gZnJvbSAneG1sZG9tJztcbmltcG9ydCBxdWVyeXN0cmluZyBmcm9tICdxdWVyeXN0cmluZyc7XG5pbXBvcnQgeG1sYnVpbGRlciBmcm9tICd4bWxidWlsZGVyJztcblxuLy8gdmFyIHByZWZpeE1hdGNoID0gbmV3IFJlZ0V4cCgvKD8heG1sbnMpXi4qOi8pO1xuXG5cblNBTUwgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdHRoaXMub3B0aW9ucyA9IHRoaXMuaW5pdGlhbGl6ZShvcHRpb25zKTtcbn07XG5cbi8vIHZhciBzdHJpcFByZWZpeCA9IGZ1bmN0aW9uKHN0cikge1xuLy8gXHRyZXR1cm4gc3RyLnJlcGxhY2UocHJlZml4TWF0Y2gsICcnKTtcbi8vIH07XG5cblNBTUwucHJvdG90eXBlLmluaXRpYWxpemUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdGlmICghb3B0aW9ucykge1xuXHRcdG9wdGlvbnMgPSB7fTtcblx0fVxuXG5cdGlmICghb3B0aW9ucy5wcm90b2NvbCkge1xuXHRcdG9wdGlvbnMucHJvdG9jb2wgPSAnaHR0cHM6Ly8nO1xuXHR9XG5cblx0aWYgKCFvcHRpb25zLnBhdGgpIHtcblx0XHRvcHRpb25zLnBhdGggPSAnL3NhbWwvY29uc3VtZSc7XG5cdH1cblxuXHRpZiAoIW9wdGlvbnMuaXNzdWVyKSB7XG5cdFx0b3B0aW9ucy5pc3N1ZXIgPSAnb25lbG9naW5fc2FtbCc7XG5cdH1cblxuXHRpZiAob3B0aW9ucy5pZGVudGlmaWVyRm9ybWF0ID09PSB1bmRlZmluZWQpIHtcblx0XHRvcHRpb25zLmlkZW50aWZpZXJGb3JtYXQgPSAndXJuOm9hc2lzOm5hbWVzOnRjOlNBTUw6MS4xOm5hbWVpZC1mb3JtYXQ6ZW1haWxBZGRyZXNzJztcblx0fVxuXG5cdGlmIChvcHRpb25zLmF1dGhuQ29udGV4dCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0b3B0aW9ucy5hdXRobkNvbnRleHQgPSAndXJuOm9hc2lzOm5hbWVzOnRjOlNBTUw6Mi4wOmFjOmNsYXNzZXM6UGFzc3dvcmRQcm90ZWN0ZWRUcmFuc3BvcnQnO1xuXHR9XG5cblx0cmV0dXJuIG9wdGlvbnM7XG59O1xuXG5TQU1MLnByb3RvdHlwZS5nZW5lcmF0ZVVuaXF1ZUlEID0gZnVuY3Rpb24oKSB7XG5cdGNvbnN0IGNoYXJzID0gJ2FiY2RlZjAxMjM0NTY3ODknO1xuXHRsZXQgdW5pcXVlSUQgPSAnaWQtJztcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCAyMDsgaSsrKSB7XG5cdFx0dW5pcXVlSUQgKz0gY2hhcnMuc3Vic3RyKE1hdGguZmxvb3IoKE1hdGgucmFuZG9tKCkgKiAxNSkpLCAxKTtcblx0fVxuXHRyZXR1cm4gdW5pcXVlSUQ7XG59O1xuXG5TQU1MLnByb3RvdHlwZS5nZW5lcmF0ZUluc3RhbnQgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbn07XG5cblNBTUwucHJvdG90eXBlLnNpZ25SZXF1ZXN0ID0gZnVuY3Rpb24oeG1sKSB7XG5cdGNvbnN0IHNpZ25lciA9IGNyeXB0by5jcmVhdGVTaWduKCdSU0EtU0hBMScpO1xuXHRzaWduZXIudXBkYXRlKHhtbCk7XG5cdHJldHVybiBzaWduZXIuc2lnbih0aGlzLm9wdGlvbnMucHJpdmF0ZUtleSwgJ2Jhc2U2NCcpO1xufTtcblxuU0FNTC5wcm90b3R5cGUuZ2VuZXJhdGVBdXRob3JpemVSZXF1ZXN0ID0gZnVuY3Rpb24ocmVxKSB7XG5cdGxldCBpZCA9IGBfJHsgdGhpcy5nZW5lcmF0ZVVuaXF1ZUlEKCkgfWA7XG5cdGNvbnN0IGluc3RhbnQgPSB0aGlzLmdlbmVyYXRlSW5zdGFudCgpO1xuXG5cdC8vIFBvc3QtYXV0aCBkZXN0aW5hdGlvblxuXHRsZXQgY2FsbGJhY2tVcmw7XG5cdGlmICh0aGlzLm9wdGlvbnMuY2FsbGJhY2tVcmwpIHtcblx0XHRjYWxsYmFja1VybCA9IHRoaXMub3B0aW9ucy5jYWxsYmFja1VybDtcblx0fSBlbHNlIHtcblx0XHRjYWxsYmFja1VybCA9IHRoaXMub3B0aW9ucy5wcm90b2NvbCArIHJlcS5oZWFkZXJzLmhvc3QgKyB0aGlzLm9wdGlvbnMucGF0aDtcblx0fVxuXG5cdGlmICh0aGlzLm9wdGlvbnMuaWQpIHtcblx0XHRpZCA9IHRoaXMub3B0aW9ucy5pZDtcblx0fVxuXG5cdGxldCByZXF1ZXN0ID1cblx0XHRgPHNhbWxwOkF1dGhuUmVxdWVzdCB4bWxuczpzYW1scD1cInVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDpwcm90b2NvbFwiIElEPVwiJHsgaWQgfVwiIFZlcnNpb249XCIyLjBcIiBJc3N1ZUluc3RhbnQ9XCIkeyBpbnN0YW50XG5cdFx0fVwiIFByb3RvY29sQmluZGluZz1cInVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDpiaW5kaW5nczpIVFRQLVBPU1RcIiBBc3NlcnRpb25Db25zdW1lclNlcnZpY2VVUkw9XCIkeyBjYWxsYmFja1VybCB9XCIgRGVzdGluYXRpb249XCIke1xuXHRcdFx0dGhpcy5vcHRpb25zLmVudHJ5UG9pbnQgfVwiPmAgK1xuXHRcdGA8c2FtbDpJc3N1ZXIgeG1sbnM6c2FtbD1cInVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDphc3NlcnRpb25cIj4keyB0aGlzLm9wdGlvbnMuaXNzdWVyIH08L3NhbWw6SXNzdWVyPlxcbmA7XG5cblx0aWYgKHRoaXMub3B0aW9ucy5pZGVudGlmaWVyRm9ybWF0KSB7XG5cdFx0cmVxdWVzdCArPSBgPHNhbWxwOk5hbWVJRFBvbGljeSB4bWxuczpzYW1scD1cInVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDpwcm90b2NvbFwiIEZvcm1hdD1cIiR7IHRoaXMub3B0aW9ucy5pZGVudGlmaWVyRm9ybWF0XG5cdFx0fVwiIEFsbG93Q3JlYXRlPVwidHJ1ZVwiPjwvc2FtbHA6TmFtZUlEUG9saWN5PlxcbmA7XG5cdH1cblxuXHRyZXF1ZXN0ICs9XG5cdFx0JzxzYW1scDpSZXF1ZXN0ZWRBdXRobkNvbnRleHQgeG1sbnM6c2FtbHA9XCJ1cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6cHJvdG9jb2xcIiBDb21wYXJpc29uPVwiZXhhY3RcIj4nICtcblx0XHQnPHNhbWw6QXV0aG5Db250ZXh0Q2xhc3NSZWYgeG1sbnM6c2FtbD1cInVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDphc3NlcnRpb25cIj51cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6YWM6Y2xhc3NlczpQYXNzd29yZFByb3RlY3RlZFRyYW5zcG9ydDwvc2FtbDpBdXRobkNvbnRleHRDbGFzc1JlZj48L3NhbWxwOlJlcXVlc3RlZEF1dGhuQ29udGV4dD5cXG4nICtcblx0XHQnPC9zYW1scDpBdXRoblJlcXVlc3Q+JztcblxuXHRyZXR1cm4gcmVxdWVzdDtcbn07XG5cblNBTUwucHJvdG90eXBlLmdlbmVyYXRlTG9nb3V0UmVxdWVzdCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0Ly8gb3B0aW9ucyBzaG91bGQgYmUgb2YgdGhlIGZvcm1cblx0Ly8gbmFtZUlkOiA8bmFtZUlkIGFzIHN1Ym1pdHRlZCBkdXJpbmcgU0FNTCBTU08+XG5cdC8vIHNlc3Npb25JbmRleDogc2Vzc2lvbkluZGV4XG5cdC8vIC0tLSBOTyBTQU1Mc2V0dGluZ3M6IDxNZXRlb3Iuc2V0dGluZy5zYW1sICBlbnRyeSBmb3IgdGhlIHByb3ZpZGVyIHlvdSB3YW50IHRvIFNMTyBmcm9tXG5cblx0Y29uc3QgaWQgPSBgXyR7IHRoaXMuZ2VuZXJhdGVVbmlxdWVJRCgpIH1gO1xuXHRjb25zdCBpbnN0YW50ID0gdGhpcy5nZW5lcmF0ZUluc3RhbnQoKTtcblxuXHRsZXQgcmVxdWVzdCA9IGAkeyAnPHNhbWxwOkxvZ291dFJlcXVlc3QgeG1sbnM6c2FtbHA9XCJ1cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6cHJvdG9jb2xcIiAnICtcblx0XHQneG1sbnM6c2FtbD1cInVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDphc3NlcnRpb25cIiBJRD1cIicgfSR7IGlkIH1cIiBWZXJzaW9uPVwiMi4wXCIgSXNzdWVJbnN0YW50PVwiJHsgaW5zdGFudFxuXHR9XCIgRGVzdGluYXRpb249XCIkeyB0aGlzLm9wdGlvbnMuaWRwU0xPUmVkaXJlY3RVUkwgfVwiPmAgK1xuXHRcdGA8c2FtbDpJc3N1ZXIgeG1sbnM6c2FtbD1cInVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDphc3NlcnRpb25cIj4keyB0aGlzLm9wdGlvbnMuaXNzdWVyIH08L3NhbWw6SXNzdWVyPmAgK1xuXHRcdGA8c2FtbDpOYW1lSUQgRm9ybWF0PVwiJHsgdGhpcy5vcHRpb25zLmlkZW50aWZpZXJGb3JtYXQgfVwiPiR7IG9wdGlvbnMubmFtZUlEIH08L3NhbWw6TmFtZUlEPmAgK1xuXHRcdCc8L3NhbWxwOkxvZ291dFJlcXVlc3Q+JztcblxuXHRyZXF1ZXN0ID0gYCR7ICc8c2FtbHA6TG9nb3V0UmVxdWVzdCB4bWxuczpzYW1scD1cInVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDpwcm90b2NvbFwiICAnICtcblx0XHQnSUQ9XCInIH0keyBpZCB9XCIgYCArXG5cdFx0J1ZlcnNpb249XCIyLjBcIiAnICtcblx0XHRgSXNzdWVJbnN0YW50PVwiJHsgaW5zdGFudCB9XCIgYCArXG5cdFx0YERlc3RpbmF0aW9uPVwiJHsgdGhpcy5vcHRpb25zLmlkcFNMT1JlZGlyZWN0VVJMIH1cIiBgICtcblx0XHQnPicgK1xuXHRcdGA8c2FtbDpJc3N1ZXIgeG1sbnM6c2FtbD1cInVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDphc3NlcnRpb25cIj4keyB0aGlzLm9wdGlvbnMuaXNzdWVyIH08L3NhbWw6SXNzdWVyPmAgK1xuXHRcdCc8c2FtbDpOYW1lSUQgeG1sbnM6c2FtbD1cInVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDphc3NlcnRpb25cIiAnICtcblx0XHQnTmFtZVF1YWxpZmllcj1cImh0dHA6Ly9pZC5pbml0OC5uZXQ6ODA4MC9vcGVuYW1cIiAnICtcblx0XHRgU1BOYW1lUXVhbGlmaWVyPVwiJHsgdGhpcy5vcHRpb25zLmlzc3VlciB9XCIgYCArXG5cdFx0YEZvcm1hdD1cIiR7IHRoaXMub3B0aW9ucy5pZGVudGlmaWVyRm9ybWF0IH1cIj4ke1xuXHRcdFx0b3B0aW9ucy5uYW1lSUQgfTwvc2FtbDpOYW1lSUQ+YCArXG5cdFx0YDxzYW1scDpTZXNzaW9uSW5kZXggeG1sbnM6c2FtbHA9XCJ1cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6cHJvdG9jb2xcIj4keyBvcHRpb25zLnNlc3Npb25JbmRleCB9PC9zYW1scDpTZXNzaW9uSW5kZXg+YCArXG5cdFx0Jzwvc2FtbHA6TG9nb3V0UmVxdWVzdD4nO1xuXHRpZiAoTWV0ZW9yLnNldHRpbmdzLmRlYnVnKSB7XG5cdFx0Y29uc29sZS5sb2coJy0tLS0tLS0gU0FNTCBMb2dvdXQgcmVxdWVzdCAtLS0tLS0tLS0tLScpO1xuXHRcdGNvbnNvbGUubG9nKHJlcXVlc3QpO1xuXHR9XG5cdHJldHVybiB7XG5cdFx0cmVxdWVzdCxcblx0XHRpZFxuXHR9O1xufTtcblxuU0FNTC5wcm90b3R5cGUucmVxdWVzdFRvVXJsID0gZnVuY3Rpb24ocmVxdWVzdCwgb3BlcmF0aW9uLCBjYWxsYmFjaykge1xuXHRjb25zdCBzZWxmID0gdGhpcztcblx0emxpYi5kZWZsYXRlUmF3KHJlcXVlc3QsIGZ1bmN0aW9uKGVyciwgYnVmZmVyKSB7XG5cdFx0aWYgKGVycikge1xuXHRcdFx0cmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdFx0fVxuXG5cdFx0Y29uc3QgYmFzZTY0ID0gYnVmZmVyLnRvU3RyaW5nKCdiYXNlNjQnKTtcblx0XHRsZXQgdGFyZ2V0ID0gc2VsZi5vcHRpb25zLmVudHJ5UG9pbnQ7XG5cblx0XHRpZiAob3BlcmF0aW9uID09PSAnbG9nb3V0Jykge1xuXHRcdFx0aWYgKHNlbGYub3B0aW9ucy5pZHBTTE9SZWRpcmVjdFVSTCkge1xuXHRcdFx0XHR0YXJnZXQgPSBzZWxmLm9wdGlvbnMuaWRwU0xPUmVkaXJlY3RVUkw7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKHRhcmdldC5pbmRleE9mKCc/JykgPiAwKSB7XG5cdFx0XHR0YXJnZXQgKz0gJyYnO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0YXJnZXQgKz0gJz8nO1xuXHRcdH1cblxuXHRcdC8vIFRCRC4gV2Ugc2hvdWxkIHJlYWxseSBpbmNsdWRlIGEgcHJvcGVyIFJlbGF5U3RhdGUgaGVyZVxuXHRcdGxldCByZWxheVN0YXRlO1xuXHRcdGlmIChvcGVyYXRpb24gPT09ICdsb2dvdXQnKSB7XG5cdFx0XHQvLyBpbiBjYXNlIG9mIGxvZ291dCB3ZSB3YW50IHRvIGJlIHJlZGlyZWN0ZWQgYmFjayB0byB0aGUgTWV0ZW9yIGFwcC5cblx0XHRcdHJlbGF5U3RhdGUgPSBNZXRlb3IuYWJzb2x1dGVVcmwoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVsYXlTdGF0ZSA9IHNlbGYub3B0aW9ucy5wcm92aWRlcjtcblx0XHR9XG5cblx0XHRjb25zdCBzYW1sUmVxdWVzdCA9IHtcblx0XHRcdFNBTUxSZXF1ZXN0OiBiYXNlNjQsXG5cdFx0XHRSZWxheVN0YXRlOiByZWxheVN0YXRlXG5cdFx0fTtcblxuXHRcdGlmIChzZWxmLm9wdGlvbnMucHJpdmF0ZUNlcnQpIHtcblx0XHRcdHNhbWxSZXF1ZXN0LlNpZ0FsZyA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwLzA5L3htbGRzaWcjcnNhLXNoYTEnO1xuXHRcdFx0c2FtbFJlcXVlc3QuU2lnbmF0dXJlID0gc2VsZi5zaWduUmVxdWVzdChxdWVyeXN0cmluZy5zdHJpbmdpZnkoc2FtbFJlcXVlc3QpKTtcblx0XHR9XG5cblx0XHR0YXJnZXQgKz0gcXVlcnlzdHJpbmcuc3RyaW5naWZ5KHNhbWxSZXF1ZXN0KTtcblxuXHRcdGlmIChNZXRlb3Iuc2V0dGluZ3MuZGVidWcpIHtcblx0XHRcdGNvbnNvbGUubG9nKGByZXF1ZXN0VG9Vcmw6ICR7IHRhcmdldCB9YCk7XG5cdFx0fVxuXHRcdGlmIChvcGVyYXRpb24gPT09ICdsb2dvdXQnKSB7XG5cdFx0XHQvLyBpbiBjYXNlIG9mIGxvZ291dCB3ZSB3YW50IHRvIGJlIHJlZGlyZWN0ZWQgYmFjayB0byB0aGUgTWV0ZW9yIGFwcC5cblx0XHRcdHJldHVybiBjYWxsYmFjayhudWxsLCB0YXJnZXQpO1xuXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNhbGxiYWNrKG51bGwsIHRhcmdldCk7XG5cdFx0fVxuXHR9KTtcbn07XG5cblNBTUwucHJvdG90eXBlLmdldEF1dGhvcml6ZVVybCA9IGZ1bmN0aW9uKHJlcSwgY2FsbGJhY2spIHtcblx0Y29uc3QgcmVxdWVzdCA9IHRoaXMuZ2VuZXJhdGVBdXRob3JpemVSZXF1ZXN0KHJlcSk7XG5cblx0dGhpcy5yZXF1ZXN0VG9VcmwocmVxdWVzdCwgJ2F1dGhvcml6ZScsIGNhbGxiYWNrKTtcbn07XG5cblNBTUwucHJvdG90eXBlLmdldExvZ291dFVybCA9IGZ1bmN0aW9uKHJlcSwgY2FsbGJhY2spIHtcblx0Y29uc3QgcmVxdWVzdCA9IHRoaXMuZ2VuZXJhdGVMb2dvdXRSZXF1ZXN0KHJlcSk7XG5cblx0dGhpcy5yZXF1ZXN0VG9VcmwocmVxdWVzdCwgJ2xvZ291dCcsIGNhbGxiYWNrKTtcbn07XG5cblNBTUwucHJvdG90eXBlLmNlcnRUb1BFTSA9IGZ1bmN0aW9uKGNlcnQpIHtcblx0Y2VydCA9IGNlcnQubWF0Y2goLy57MSw2NH0vZykuam9pbignXFxuJyk7XG5cdGNlcnQgPSBgLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tXFxuJHsgY2VydCB9YDtcblx0Y2VydCA9IGAkeyBjZXJ0IH1cXG4tLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tXFxuYDtcblx0cmV0dXJuIGNlcnQ7XG59O1xuXG4vLyBmdW5jdGlvbmZpbmRDaGlsZHMobm9kZSwgbG9jYWxOYW1lLCBuYW1lc3BhY2UpIHtcbi8vIFx0dmFyIHJlcyA9IFtdO1xuLy8gXHRmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuLy8gXHRcdHZhciBjaGlsZCA9IG5vZGUuY2hpbGROb2Rlc1tpXTtcbi8vIFx0XHRpZiAoY2hpbGQubG9jYWxOYW1lID09PSBsb2NhbE5hbWUgJiYgKGNoaWxkLm5hbWVzcGFjZVVSSSA9PT0gbmFtZXNwYWNlIHx8ICFuYW1lc3BhY2UpKSB7XG4vLyBcdFx0XHRyZXMucHVzaChjaGlsZCk7XG4vLyBcdFx0fVxuLy8gXHR9XG4vLyBcdHJldHVybiByZXM7XG4vLyB9XG5cblNBTUwucHJvdG90eXBlLnZhbGlkYXRlU2lnbmF0dXJlID0gZnVuY3Rpb24oeG1sLCBjZXJ0KSB7XG5cdGNvbnN0IHNlbGYgPSB0aGlzO1xuXG5cdGNvbnN0IGRvYyA9IG5ldyB4bWxkb20uRE9NUGFyc2VyKCkucGFyc2VGcm9tU3RyaW5nKHhtbCk7XG5cdGNvbnN0IHNpZ25hdHVyZSA9IHhtbENyeXB0by54cGF0aChkb2MsICcvLypbbG9jYWwtbmFtZSguKT1cXCdTaWduYXR1cmVcXCcgYW5kIG5hbWVzcGFjZS11cmkoLik9XFwnaHR0cDovL3d3dy53My5vcmcvMjAwMC8wOS94bWxkc2lnI1xcJ10nKVswXTtcblxuXHRjb25zdCBzaWcgPSBuZXcgeG1sQ3J5cHRvLlNpZ25lZFhtbCgpO1xuXG5cdHNpZy5rZXlJbmZvUHJvdmlkZXIgPSB7XG5cdFx0Z2V0S2V5SW5mbygvKmtleSovKSB7XG5cdFx0XHRyZXR1cm4gJzxYNTA5RGF0YT48L1g1MDlEYXRhPic7XG5cdFx0fSxcblx0XHRnZXRLZXkoLyprZXlJbmZvKi8pIHtcblx0XHRcdHJldHVybiBzZWxmLmNlcnRUb1BFTShjZXJ0KTtcblx0XHR9XG5cdH07XG5cblx0c2lnLmxvYWRTaWduYXR1cmUoc2lnbmF0dXJlKTtcblxuXHRyZXR1cm4gc2lnLmNoZWNrU2lnbmF0dXJlKHhtbCk7XG59O1xuXG5TQU1MLnByb3RvdHlwZS5nZXRFbGVtZW50ID0gZnVuY3Rpb24ocGFyZW50RWxlbWVudCwgZWxlbWVudE5hbWUpIHtcblx0aWYgKHBhcmVudEVsZW1lbnRbYHNhbWw6JHsgZWxlbWVudE5hbWUgfWBdKSB7XG5cdFx0cmV0dXJuIHBhcmVudEVsZW1lbnRbYHNhbWw6JHsgZWxlbWVudE5hbWUgfWBdO1xuXHR9IGVsc2UgaWYgKHBhcmVudEVsZW1lbnRbYHNhbWxwOiR7IGVsZW1lbnROYW1lIH1gXSkge1xuXHRcdHJldHVybiBwYXJlbnRFbGVtZW50W2BzYW1scDokeyBlbGVtZW50TmFtZSB9YF07XG5cdH0gZWxzZSBpZiAocGFyZW50RWxlbWVudFtgc2FtbDJwOiR7IGVsZW1lbnROYW1lIH1gXSkge1xuXHRcdHJldHVybiBwYXJlbnRFbGVtZW50W2BzYW1sMnA6JHsgZWxlbWVudE5hbWUgfWBdO1xuXHR9IGVsc2UgaWYgKHBhcmVudEVsZW1lbnRbYHNhbWwyOiR7IGVsZW1lbnROYW1lIH1gXSkge1xuXHRcdHJldHVybiBwYXJlbnRFbGVtZW50W2BzYW1sMjokeyBlbGVtZW50TmFtZSB9YF07XG5cdH0gZWxzZSBpZiAocGFyZW50RWxlbWVudFtgbnMwOiR7IGVsZW1lbnROYW1lIH1gXSkge1xuXHRcdHJldHVybiBwYXJlbnRFbGVtZW50W2BuczA6JHsgZWxlbWVudE5hbWUgfWBdO1xuXHR9IGVsc2UgaWYgKHBhcmVudEVsZW1lbnRbYG5zMTokeyBlbGVtZW50TmFtZSB9YF0pIHtcblx0XHRyZXR1cm4gcGFyZW50RWxlbWVudFtgbnMxOiR7IGVsZW1lbnROYW1lIH1gXTtcblx0fVxuXHRyZXR1cm4gcGFyZW50RWxlbWVudFtlbGVtZW50TmFtZV07XG59O1xuXG5TQU1MLnByb3RvdHlwZS52YWxpZGF0ZUxvZ291dFJlc3BvbnNlID0gZnVuY3Rpb24oc2FtbFJlc3BvbnNlLCBjYWxsYmFjaykge1xuXHRjb25zdCBzZWxmID0gdGhpcztcblxuXHRjb25zdCBjb21wcmVzc2VkU0FNTFJlc3BvbnNlID0gbmV3IEJ1ZmZlcihzYW1sUmVzcG9uc2UsICdiYXNlNjQnKTtcblx0emxpYi5pbmZsYXRlUmF3KGNvbXByZXNzZWRTQU1MUmVzcG9uc2UsIGZ1bmN0aW9uKGVyciwgZGVjb2RlZCkge1xuXG5cdFx0aWYgKGVycikge1xuXHRcdFx0aWYgKE1ldGVvci5zZXR0aW5ncy5kZWJ1Zykge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBwYXJzZXIgPSBuZXcgeG1sMmpzLlBhcnNlcih7XG5cdFx0XHRcdGV4cGxpY2l0Um9vdDogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0XHRwYXJzZXIucGFyc2VTdHJpbmcoZGVjb2RlZCwgZnVuY3Rpb24oZXJyLCBkb2MpIHtcblx0XHRcdFx0Y29uc3QgcmVzcG9uc2UgPSBzZWxmLmdldEVsZW1lbnQoZG9jLCAnTG9nb3V0UmVzcG9uc2UnKTtcblxuXHRcdFx0XHRpZiAocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQvLyBUQkQuIENoZWNrIGlmIHRoaXMgbXNnIGNvcnJlc3BvbmRzIHRvIG9uZSB3ZSBzZW50XG5cdFx0XHRcdFx0Y29uc3QgaW5SZXNwb25zZVRvID0gcmVzcG9uc2UuJC5JblJlc3BvbnNlVG87XG5cdFx0XHRcdFx0aWYgKE1ldGVvci5zZXR0aW5ncy5kZWJ1Zykge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coYEluIFJlc3BvbnNlIHRvOiAkeyBpblJlc3BvbnNlVG8gfWApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRjb25zdCBzdGF0dXMgPSBzZWxmLmdldEVsZW1lbnQocmVzcG9uc2UsICdTdGF0dXMnKTtcblx0XHRcdFx0XHRjb25zdCBzdGF0dXNDb2RlID0gc2VsZi5nZXRFbGVtZW50KHN0YXR1c1swXSwgJ1N0YXR1c0NvZGUnKVswXS4kLlZhbHVlO1xuXHRcdFx0XHRcdGlmIChNZXRlb3Iuc2V0dGluZ3MuZGVidWcpIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGBTdGF0dXNDb2RlOiAkeyBKU09OLnN0cmluZ2lmeShzdGF0dXNDb2RlKSB9YCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChzdGF0dXNDb2RlID09PSAndXJuOm9hc2lzOm5hbWVzOnRjOlNBTUw6Mi4wOnN0YXR1czpTdWNjZXNzJykge1xuXHRcdFx0XHRcdFx0Ly8gSW4gY2FzZSBvZiBhIHN1Y2Nlc3NmdWwgbG9nb3V0IGF0IElEUCB3ZSByZXR1cm4gaW5SZXNwb25zZVRvIHZhbHVlLlxuXHRcdFx0XHRcdFx0Ly8gVGhpcyBpcyB0aGUgb25seSB3YXkgaG93IHdlIGNhbiBpZGVudGlmeSB0aGUgTWV0ZW9yIHVzZXIgKGFzIHdlIGRvbid0IHVzZSBTZXNzaW9uIENvb2tpZXMpXG5cdFx0XHRcdFx0XHRjYWxsYmFjayhudWxsLCBpblJlc3BvbnNlVG8pO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRjYWxsYmFjaygnRXJyb3IuIExvZ291dCBub3QgY29uZmlybWVkIGJ5IElEUCcsIG51bGwpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjYWxsYmFjaygnTm8gUmVzcG9uc2UgRm91bmQnLCBudWxsKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdH0pO1xufTtcblxuU0FNTC5wcm90b3R5cGUudmFsaWRhdGVSZXNwb25zZSA9IGZ1bmN0aW9uKHNhbWxSZXNwb25zZSwgcmVsYXlTdGF0ZSwgY2FsbGJhY2spIHtcblx0Y29uc3Qgc2VsZiA9IHRoaXM7XG5cdGNvbnN0IHhtbCA9IG5ldyBCdWZmZXIoc2FtbFJlc3BvbnNlLCAnYmFzZTY0JykudG9TdHJpbmcoJ3V0ZjgnKTtcblx0Ly8gV2UgY3VycmVudGx5IHVzZSBSZWxheVN0YXRlIHRvIHNhdmUgU0FNTCBwcm92aWRlclxuXHRpZiAoTWV0ZW9yLnNldHRpbmdzLmRlYnVnKSB7XG5cdFx0Y29uc29sZS5sb2coYFZhbGlkYXRpbmcgcmVzcG9uc2Ugd2l0aCByZWxheSBzdGF0ZTogJHsgeG1sIH1gKTtcblx0fVxuXHRjb25zdCBwYXJzZXIgPSBuZXcgeG1sMmpzLlBhcnNlcih7XG5cdFx0ZXhwbGljaXRSb290OiB0cnVlLFxuXHRcdHhtbG5zOnRydWVcblx0fSk7XG5cblx0cGFyc2VyLnBhcnNlU3RyaW5nKHhtbCwgZnVuY3Rpb24oZXJyLCBkb2MpIHtcblx0XHQvLyBWZXJpZnkgc2lnbmF0dXJlXG5cdFx0aWYgKE1ldGVvci5zZXR0aW5ncy5kZWJ1Zykge1xuXHRcdFx0Y29uc29sZS5sb2coJ1ZlcmlmeSBzaWduYXR1cmUnKTtcblx0XHR9XG5cdFx0aWYgKHNlbGYub3B0aW9ucy5jZXJ0ICYmICFzZWxmLnZhbGlkYXRlU2lnbmF0dXJlKHhtbCwgc2VsZi5vcHRpb25zLmNlcnQpKSB7XG5cdFx0XHRpZiAoTWV0ZW9yLnNldHRpbmdzLmRlYnVnKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdTaWduYXR1cmUgV1JPTkcnKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoJ0ludmFsaWQgc2lnbmF0dXJlJyksIG51bGwsIGZhbHNlKTtcblx0XHR9XG5cdFx0aWYgKE1ldGVvci5zZXR0aW5ncy5kZWJ1Zykge1xuXHRcdFx0Y29uc29sZS5sb2coJ1NpZ25hdHVyZSBPSycpO1xuXHRcdH1cblx0XHRjb25zdCByZXNwb25zZSA9IHNlbGYuZ2V0RWxlbWVudChkb2MsICdSZXNwb25zZScpO1xuXHRcdGlmIChNZXRlb3Iuc2V0dGluZ3MuZGVidWcpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdHb3QgcmVzcG9uc2UnKTtcblx0XHR9XG5cdFx0aWYgKHJlc3BvbnNlKSB7XG5cdFx0XHRjb25zdCBhc3NlcnRpb24gPSBzZWxmLmdldEVsZW1lbnQocmVzcG9uc2UsICdBc3NlcnRpb24nKTtcblx0XHRcdGlmICghYXNzZXJ0aW9uKSB7XG5cdFx0XHRcdHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoJ01pc3NpbmcgU0FNTCBhc3NlcnRpb24nKSwgbnVsbCwgZmFsc2UpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBwcm9maWxlID0ge307XG5cblx0XHRcdGlmIChyZXNwb25zZS4kICYmIHJlc3BvbnNlLiQuSW5SZXNwb25zZVRvKSB7XG5cdFx0XHRcdHByb2ZpbGUuaW5SZXNwb25zZVRvSWQgPSByZXNwb25zZS4kLkluUmVzcG9uc2VUbztcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgaXNzdWVyID0gc2VsZi5nZXRFbGVtZW50KGFzc2VydGlvblswXSwgJ0lzc3VlcicpO1xuXHRcdFx0aWYgKGlzc3Vlcikge1xuXHRcdFx0XHRwcm9maWxlLmlzc3VlciA9IGlzc3VlclswXS5fO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBzdWJqZWN0ID0gc2VsZi5nZXRFbGVtZW50KGFzc2VydGlvblswXSwgJ1N1YmplY3QnKTtcblxuXHRcdFx0aWYgKHN1YmplY3QpIHtcblx0XHRcdFx0Y29uc3QgbmFtZUlEID0gc2VsZi5nZXRFbGVtZW50KHN1YmplY3RbMF0sICdOYW1lSUQnKTtcblx0XHRcdFx0aWYgKG5hbWVJRCkge1xuXHRcdFx0XHRcdHByb2ZpbGUubmFtZUlEID0gbmFtZUlEWzBdLl87XG5cblx0XHRcdFx0XHRpZiAobmFtZUlEWzBdLiQuRm9ybWF0KSB7XG5cdFx0XHRcdFx0XHRwcm9maWxlLm5hbWVJREZvcm1hdCA9IG5hbWVJRFswXS4kLkZvcm1hdDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgYXV0aG5TdGF0ZW1lbnQgPSBzZWxmLmdldEVsZW1lbnQoYXNzZXJ0aW9uWzBdLCAnQXV0aG5TdGF0ZW1lbnQnKTtcblxuXHRcdFx0aWYgKGF1dGhuU3RhdGVtZW50KSB7XG5cdFx0XHRcdGlmIChhdXRoblN0YXRlbWVudFswXS4kLlNlc3Npb25JbmRleCkge1xuXG5cdFx0XHRcdFx0cHJvZmlsZS5zZXNzaW9uSW5kZXggPSBhdXRoblN0YXRlbWVudFswXS4kLlNlc3Npb25JbmRleDtcblx0XHRcdFx0XHRpZiAoTWV0ZW9yLnNldHRpbmdzLmRlYnVnKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhgU2Vzc2lvbiBJbmRleDogJHsgcHJvZmlsZS5zZXNzaW9uSW5kZXggfWApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIGlmIChNZXRlb3Iuc2V0dGluZ3MuZGVidWcpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnTm8gU2Vzc2lvbiBJbmRleCBGb3VuZCcpO1xuXHRcdFx0XHR9XG5cblxuXHRcdFx0fSBlbHNlIGlmIChNZXRlb3Iuc2V0dGluZ3MuZGVidWcpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ05vIEF1dGhOIFN0YXRlbWVudCBmb3VuZCcpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBhdHRyaWJ1dGVTdGF0ZW1lbnQgPSBzZWxmLmdldEVsZW1lbnQoYXNzZXJ0aW9uWzBdLCAnQXR0cmlidXRlU3RhdGVtZW50Jyk7XG5cdFx0XHRpZiAoYXR0cmlidXRlU3RhdGVtZW50KSB7XG5cdFx0XHRcdGNvbnN0IGF0dHJpYnV0ZXMgPSBzZWxmLmdldEVsZW1lbnQoYXR0cmlidXRlU3RhdGVtZW50WzBdLCAnQXR0cmlidXRlJyk7XG5cblx0XHRcdFx0aWYgKGF0dHJpYnV0ZXMpIHtcblx0XHRcdFx0XHRhdHRyaWJ1dGVzLmZvckVhY2goZnVuY3Rpb24oYXR0cmlidXRlKSB7XG5cdFx0XHRcdFx0XHRjb25zdCB2YWx1ZSA9IHNlbGYuZ2V0RWxlbWVudChhdHRyaWJ1dGUsICdBdHRyaWJ1dGVWYWx1ZScpO1xuXHRcdFx0XHRcdFx0Y29uc3Qga2V5ID0gYXR0cmlidXRlLiQuTmFtZS52YWx1ZTtcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgdmFsdWVbMF0gPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdFx0XHRcdHByb2ZpbGVba2V5XSA9IHZhbHVlWzBdO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0cHJvZmlsZVtrZXldID0gdmFsdWVbMF0uXztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICghcHJvZmlsZS5tYWlsICYmIHByb2ZpbGVbJ3VybjpvaWQ6MC45LjIzNDIuMTkyMDAzMDAuMTAwLjEuMyddKSB7XG5cdFx0XHRcdFx0Ly8gU2VlIGh0dHA6Ly93d3cuaW5jb21tb25mZWRlcmF0aW9uLm9yZy9hdHRyaWJ1dGVzdW1tYXJ5Lmh0bWwgZm9yIGRlZmluaXRpb24gb2YgYXR0cmlidXRlIE9JRHNcblx0XHRcdFx0XHRwcm9maWxlLm1haWwgPSBwcm9maWxlWyd1cm46b2lkOjAuOS4yMzQyLjE5MjAwMzAwLjEwMC4xLjMnXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICghcHJvZmlsZS5lbWFpbCAmJiBwcm9maWxlLm1haWwpIHtcblx0XHRcdFx0XHRwcm9maWxlLmVtYWlsID0gcHJvZmlsZS5tYWlsO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICghcHJvZmlsZS5lbWFpbCAmJiBwcm9maWxlLm5hbWVJRCAmJiAocHJvZmlsZS5uYW1lSURGb3JtYXQgJiYgcHJvZmlsZS5uYW1lSURGb3JtYXQudmFsdWUgIT0gbnVsbCA/IHByb2ZpbGUubmFtZUlERm9ybWF0LnZhbHVlIDogcHJvZmlsZS5uYW1lSURGb3JtYXQpLmluZGV4T2YoJ2VtYWlsQWRkcmVzcycpID49IDApIHtcblx0XHRcdFx0cHJvZmlsZS5lbWFpbCA9IHByb2ZpbGUubmFtZUlEO1xuXHRcdFx0fVxuXHRcdFx0aWYgKE1ldGVvci5zZXR0aW5ncy5kZWJ1Zykge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhgTmFtZUlEOiAkeyBKU09OLnN0cmluZ2lmeShwcm9maWxlKSB9YCk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHByb2ZpbGVLZXlzID0gT2JqZWN0LmtleXMocHJvZmlsZSk7XG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHByb2ZpbGVLZXlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGNvbnN0IGtleSA9IHByb2ZpbGVLZXlzW2ldO1xuXG5cdFx0XHRcdGlmIChrZXkubWF0Y2goL1xcLi8pKSB7XG5cdFx0XHRcdFx0cHJvZmlsZVtrZXkucmVwbGFjZSgvXFwuL2csICctJyldID0gcHJvZmlsZVtrZXldO1xuXHRcdFx0XHRcdGRlbGV0ZSBwcm9maWxlW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Y2FsbGJhY2sobnVsbCwgcHJvZmlsZSwgZmFsc2UpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBsb2dvdXRSZXNwb25zZSA9IHNlbGYuZ2V0RWxlbWVudChkb2MsICdMb2dvdXRSZXNwb25zZScpO1xuXG5cdFx0XHRpZiAobG9nb3V0UmVzcG9uc2UpIHtcblx0XHRcdFx0Y2FsbGJhY2sobnVsbCwgbnVsbCwgdHJ1ZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKCdVbmtub3duIFNBTUwgcmVzcG9uc2UgbWVzc2FnZScpLCBudWxsLCBmYWxzZSk7XG5cdFx0XHR9XG5cblx0XHR9XG5cdH0pO1xufTtcblxubGV0IGRlY3J5cHRpb25DZXJ0O1xuU0FNTC5wcm90b3R5cGUuZ2VuZXJhdGVTZXJ2aWNlUHJvdmlkZXJNZXRhZGF0YSA9IGZ1bmN0aW9uKGNhbGxiYWNrVXJsKSB7XG5cblx0aWYgKCFkZWNyeXB0aW9uQ2VydCkge1xuXHRcdGRlY3J5cHRpb25DZXJ0ID0gdGhpcy5vcHRpb25zLnByaXZhdGVDZXJ0O1xuXHR9XG5cblx0aWYgKCF0aGlzLm9wdGlvbnMuY2FsbGJhY2tVcmwgJiYgIWNhbGxiYWNrVXJsKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0J1VuYWJsZSB0byBnZW5lcmF0ZSBzZXJ2aWNlIHByb3ZpZGVyIG1ldGFkYXRhIHdoZW4gY2FsbGJhY2tVcmwgb3B0aW9uIGlzIG5vdCBzZXQnKTtcblx0fVxuXG5cdGNvbnN0IG1ldGFkYXRhID0ge1xuXHRcdCdFbnRpdHlEZXNjcmlwdG9yJzoge1xuXHRcdFx0J0B4bWxucyc6ICd1cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6bWV0YWRhdGEnLFxuXHRcdFx0J0B4bWxuczpkcyc6ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwLzA5L3htbGRzaWcjJyxcblx0XHRcdCdAZW50aXR5SUQnOiB0aGlzLm9wdGlvbnMuaXNzdWVyLFxuXHRcdFx0J1NQU1NPRGVzY3JpcHRvcic6IHtcblx0XHRcdFx0J0Bwcm90b2NvbFN1cHBvcnRFbnVtZXJhdGlvbic6ICd1cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6cHJvdG9jb2wnLFxuXHRcdFx0XHQnU2luZ2xlTG9nb3V0U2VydmljZSc6IHtcblx0XHRcdFx0XHQnQEJpbmRpbmcnOiAndXJuOm9hc2lzOm5hbWVzOnRjOlNBTUw6Mi4wOmJpbmRpbmdzOkhUVFAtUmVkaXJlY3QnLFxuXHRcdFx0XHRcdCdATG9jYXRpb24nOiBgJHsgTWV0ZW9yLmFic29sdXRlVXJsKCkgfV9zYW1sL2xvZ291dC8keyB0aGlzLm9wdGlvbnMucHJvdmlkZXIgfS9gLFxuXHRcdFx0XHRcdCdAUmVzcG9uc2VMb2NhdGlvbic6IGAkeyBNZXRlb3IuYWJzb2x1dGVVcmwoKSB9X3NhbWwvbG9nb3V0LyR7IHRoaXMub3B0aW9ucy5wcm92aWRlciB9L2Bcblx0XHRcdFx0fSxcblx0XHRcdFx0J05hbWVJREZvcm1hdCc6IHRoaXMub3B0aW9ucy5pZGVudGlmaWVyRm9ybWF0LFxuXHRcdFx0XHQnQXNzZXJ0aW9uQ29uc3VtZXJTZXJ2aWNlJzoge1xuXHRcdFx0XHRcdCdAaW5kZXgnOiAnMScsXG5cdFx0XHRcdFx0J0Bpc0RlZmF1bHQnOiAndHJ1ZScsXG5cdFx0XHRcdFx0J0BCaW5kaW5nJzogJ3VybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDpiaW5kaW5nczpIVFRQLVBPU1QnLFxuXHRcdFx0XHRcdCdATG9jYXRpb24nOiBjYWxsYmFja1VybFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdGlmICh0aGlzLm9wdGlvbnMucHJpdmF0ZUtleSkge1xuXHRcdGlmICghZGVjcnlwdGlvbkNlcnQpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcblx0XHRcdFx0J01pc3NpbmcgZGVjcnlwdGlvbkNlcnQgd2hpbGUgZ2VuZXJhdGluZyBtZXRhZGF0YSBmb3IgZGVjcnlwdGluZyBzZXJ2aWNlIHByb3ZpZGVyJyk7XG5cdFx0fVxuXG5cdFx0ZGVjcnlwdGlvbkNlcnQgPSBkZWNyeXB0aW9uQ2VydC5yZXBsYWNlKC8tK0JFR0lOIENFUlRJRklDQVRFLStcXHI/XFxuPy8sICcnKTtcblx0XHRkZWNyeXB0aW9uQ2VydCA9IGRlY3J5cHRpb25DZXJ0LnJlcGxhY2UoLy0rRU5EIENFUlRJRklDQVRFLStcXHI/XFxuPy8sICcnKTtcblx0XHRkZWNyeXB0aW9uQ2VydCA9IGRlY3J5cHRpb25DZXJ0LnJlcGxhY2UoL1xcclxcbi9nLCAnXFxuJyk7XG5cblx0XHRtZXRhZGF0YVsnRW50aXR5RGVzY3JpcHRvciddWydTUFNTT0Rlc2NyaXB0b3InXVsnS2V5RGVzY3JpcHRvciddID0ge1xuXHRcdFx0J2RzOktleUluZm8nOiB7XG5cdFx0XHRcdCdkczpYNTA5RGF0YSc6IHtcblx0XHRcdFx0XHQnZHM6WDUwOUNlcnRpZmljYXRlJzoge1xuXHRcdFx0XHRcdFx0JyN0ZXh0JzogZGVjcnlwdGlvbkNlcnRcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHQnI2xpc3QnOiBbXG5cdFx0XHRcdC8vIHRoaXMgc2hvdWxkIGJlIHRoZSBzZXQgdGhhdCB0aGUgeG1sZW5jIGxpYnJhcnkgc3VwcG9ydHNcblx0XHRcdFx0e1xuXHRcdFx0XHRcdCdFbmNyeXB0aW9uTWV0aG9kJzoge1xuXHRcdFx0XHRcdFx0J0BBbGdvcml0aG0nOiAnaHR0cDovL3d3dy53My5vcmcvMjAwMS8wNC94bWxlbmMjYWVzMjU2LWNiYydcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQnRW5jcnlwdGlvbk1ldGhvZCc6IHtcblx0XHRcdFx0XHRcdCdAQWxnb3JpdGhtJzogJ2h0dHA6Ly93d3cudzMub3JnLzIwMDEvMDQveG1sZW5jI2FlczEyOC1jYmMnXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0J0VuY3J5cHRpb25NZXRob2QnOiB7XG5cdFx0XHRcdFx0XHQnQEFsZ29yaXRobSc6ICdodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGVuYyN0cmlwbGVkZXMtY2JjJ1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XVxuXHRcdH07XG5cdH1cblxuXHRyZXR1cm4geG1sYnVpbGRlci5jcmVhdGUobWV0YWRhdGEpLmVuZCh7XG5cdFx0cHJldHR5OiB0cnVlLFxuXHRcdGluZGVudDogJyAgJyxcblx0XHRuZXdsaW5lOiAnXFxuJ1xuXHR9KTtcbn07XG4iLCJjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCdzdGVmZm86bWV0ZW9yLWFjY291bnRzLXNhbWwnLCB7XG5cdG1ldGhvZHM6IHtcblx0XHR1cGRhdGVkOiB7XG5cdFx0XHR0eXBlOiAnaW5mbydcblx0XHR9XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmFkZEdyb3VwKCdTQU1MJyk7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0YWRkU2FtbFNlcnZpY2UobmFtZSkge1xuXHRcdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKGBTQU1MX0N1c3RvbV8keyBuYW1lIH1gLCBmYWxzZSwge1xuXHRcdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdFx0Z3JvdXA6ICdTQU1MJyxcblx0XHRcdHNlY3Rpb246IG5hbWUsXG5cdFx0XHRpMThuTGFiZWw6ICdBY2NvdW50c19PQXV0aF9DdXN0b21fRW5hYmxlJ1xuXHRcdH0pO1xuXHRcdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKGBTQU1MX0N1c3RvbV8keyBuYW1lIH1fcHJvdmlkZXJgLCAncHJvdmlkZXItbmFtZScsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0Z3JvdXA6ICdTQU1MJyxcblx0XHRcdHNlY3Rpb246IG5hbWUsXG5cdFx0XHRpMThuTGFiZWw6ICdTQU1MX0N1c3RvbV9Qcm92aWRlcidcblx0XHR9KTtcblx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZChgU0FNTF9DdXN0b21fJHsgbmFtZSB9X2VudHJ5X3BvaW50YCwgJ2h0dHBzOi8vZXhhbXBsZS5jb20vc2ltcGxlc2FtbC9zYW1sMi9pZHAvU1NPU2VydmljZS5waHAnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGdyb3VwOiAnU0FNTCcsXG5cdFx0XHRzZWN0aW9uOiBuYW1lLFxuXHRcdFx0aTE4bkxhYmVsOiAnU0FNTF9DdXN0b21fRW50cnlfcG9pbnQnXG5cdFx0fSk7XG5cdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoYFNBTUxfQ3VzdG9tXyR7IG5hbWUgfV9pZHBfc2xvX3JlZGlyZWN0X3VybGAsICdodHRwczovL2V4YW1wbGUuY29tL3NpbXBsZXNhbWwvc2FtbDIvaWRwL1NpbmdsZUxvZ291dFNlcnZpY2UucGhwJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRncm91cDogJ1NBTUwnLFxuXHRcdFx0c2VjdGlvbjogbmFtZSxcblx0XHRcdGkxOG5MYWJlbDogJ1NBTUxfQ3VzdG9tX0lEUF9TTE9fUmVkaXJlY3RfVVJMJ1xuXHRcdH0pO1xuXHRcdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKGBTQU1MX0N1c3RvbV8keyBuYW1lIH1faXNzdWVyYCwgJ2h0dHBzOi8veW91ci1yb2NrZXQtY2hhdC9fc2FtbC9tZXRhZGF0YS9wcm92aWRlci1uYW1lJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRncm91cDogJ1NBTUwnLFxuXHRcdFx0c2VjdGlvbjogbmFtZSxcblx0XHRcdGkxOG5MYWJlbDogJ1NBTUxfQ3VzdG9tX0lzc3Vlcidcblx0XHR9KTtcblx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZChgU0FNTF9DdXN0b21fJHsgbmFtZSB9X2NlcnRgLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRncm91cDogJ1NBTUwnLFxuXHRcdFx0c2VjdGlvbjogbmFtZSxcblx0XHRcdGkxOG5MYWJlbDogJ1NBTUxfQ3VzdG9tX0NlcnQnLFxuXHRcdFx0bXVsdGlsaW5lOiB0cnVlXG5cdFx0fSk7XG5cdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoYFNBTUxfQ3VzdG9tXyR7IG5hbWUgfV9wdWJsaWNfY2VydGAsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGdyb3VwOiAnU0FNTCcsXG5cdFx0XHRzZWN0aW9uOiBuYW1lLFxuXHRcdFx0bXVsdGlsaW5lOiB0cnVlLFxuXHRcdFx0aTE4bkxhYmVsOiAnU0FNTF9DdXN0b21fUHVibGljX0NlcnQnXG5cdFx0fSk7XG5cdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoYFNBTUxfQ3VzdG9tXyR7IG5hbWUgfV9wcml2YXRlX2tleWAsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGdyb3VwOiAnU0FNTCcsXG5cdFx0XHRzZWN0aW9uOiBuYW1lLFxuXHRcdFx0bXVsdGlsaW5lOiB0cnVlLFxuXHRcdFx0aTE4bkxhYmVsOiAnU0FNTF9DdXN0b21fUHJpdmF0ZV9LZXknXG5cdFx0fSk7XG5cdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoYFNBTUxfQ3VzdG9tXyR7IG5hbWUgfV9idXR0b25fbGFiZWxfdGV4dGAsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGdyb3VwOiAnU0FNTCcsXG5cdFx0XHRzZWN0aW9uOiBuYW1lLFxuXHRcdFx0aTE4bkxhYmVsOiAnQWNjb3VudHNfT0F1dGhfQ3VzdG9tX0J1dHRvbl9MYWJlbF9UZXh0J1xuXHRcdH0pO1xuXHRcdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKGBTQU1MX0N1c3RvbV8keyBuYW1lIH1fYnV0dG9uX2xhYmVsX2NvbG9yYCwgJyNGRkZGRkYnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGdyb3VwOiAnU0FNTCcsXG5cdFx0XHRzZWN0aW9uOiBuYW1lLFxuXHRcdFx0aTE4bkxhYmVsOiAnQWNjb3VudHNfT0F1dGhfQ3VzdG9tX0J1dHRvbl9MYWJlbF9Db2xvcidcblx0XHR9KTtcblx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZChgU0FNTF9DdXN0b21fJHsgbmFtZSB9X2J1dHRvbl9jb2xvcmAsICcjMTM2NzlBJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRncm91cDogJ1NBTUwnLFxuXHRcdFx0c2VjdGlvbjogbmFtZSxcblx0XHRcdGkxOG5MYWJlbDogJ0FjY291bnRzX09BdXRoX0N1c3RvbV9CdXR0b25fQ29sb3InXG5cdFx0fSk7XG5cdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoYFNBTUxfQ3VzdG9tXyR7IG5hbWUgfV9nZW5lcmF0ZV91c2VybmFtZWAsIGZhbHNlLCB7XG5cdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0XHRncm91cDogJ1NBTUwnLFxuXHRcdFx0c2VjdGlvbjogbmFtZSxcblx0XHRcdGkxOG5MYWJlbDogJ1NBTUxfQ3VzdG9tX0dlbmVyYXRlX1VzZXJuYW1lJ1xuXHRcdH0pO1xuXHRcdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKGBTQU1MX0N1c3RvbV8keyBuYW1lIH1fbG9nb3V0X2JlaGF2aW91cmAsICdTQU1MJywge1xuXHRcdFx0dHlwZTogJ3NlbGVjdCcsXG5cdFx0XHR2YWx1ZXM6IFtcblx0XHRcdFx0e2tleTogJ1NBTUwnLCBpMThuTGFiZWw6ICdTQU1MX0N1c3RvbV9Mb2dvdXRfQmVoYXZpb3VyX1Rlcm1pbmF0ZV9TQU1MX1Nlc3Npb24nfSxcblx0XHRcdFx0e2tleTogJ0xvY2FsJywgaTE4bkxhYmVsOiAnU0FNTF9DdXN0b21fTG9nb3V0X0JlaGF2aW91cl9FbmRfT25seV9Sb2NrZXRDaGF0J31cblx0XHRcdF0sXG5cdFx0XHRncm91cDogJ1NBTUwnLFxuXHRcdFx0c2VjdGlvbjogbmFtZSxcblx0XHRcdGkxOG5MYWJlbDogJ1NBTUxfQ3VzdG9tX0xvZ291dF9CZWhhdmlvdXInXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5jb25zdCBnZXRTYW1sQ29uZmlncyA9IGZ1bmN0aW9uKHNlcnZpY2UpIHtcblx0cmV0dXJuIHtcblx0XHRidXR0b25MYWJlbFRleHQ6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KGAkeyBzZXJ2aWNlLmtleSB9X2J1dHRvbl9sYWJlbF90ZXh0YCksXG5cdFx0YnV0dG9uTGFiZWxDb2xvcjogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoYCR7IHNlcnZpY2Uua2V5IH1fYnV0dG9uX2xhYmVsX2NvbG9yYCksXG5cdFx0YnV0dG9uQ29sb3I6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KGAkeyBzZXJ2aWNlLmtleSB9X2J1dHRvbl9jb2xvcmApLFxuXHRcdGNsaWVudENvbmZpZzoge1xuXHRcdFx0cHJvdmlkZXI6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KGAkeyBzZXJ2aWNlLmtleSB9X3Byb3ZpZGVyYClcblx0XHR9LFxuXHRcdGVudHJ5UG9pbnQ6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KGAkeyBzZXJ2aWNlLmtleSB9X2VudHJ5X3BvaW50YCksXG5cdFx0aWRwU0xPUmVkaXJlY3RVUkw6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KGAkeyBzZXJ2aWNlLmtleSB9X2lkcF9zbG9fcmVkaXJlY3RfdXJsYCksXG5cdFx0Z2VuZXJhdGVVc2VybmFtZTogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoYCR7IHNlcnZpY2Uua2V5IH1fZ2VuZXJhdGVfdXNlcm5hbWVgKSxcblx0XHRpc3N1ZXI6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KGAkeyBzZXJ2aWNlLmtleSB9X2lzc3VlcmApLFxuXHRcdGxvZ291dEJlaGF2aW91cjogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoYCR7IHNlcnZpY2Uua2V5IH1fbG9nb3V0X2JlaGF2aW91cmApLFxuXHRcdHNlY3JldDoge1xuXHRcdFx0cHJpdmF0ZUtleTogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoYCR7IHNlcnZpY2Uua2V5IH1fcHJpdmF0ZV9rZXlgKSxcblx0XHRcdHB1YmxpY0NlcnQ6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KGAkeyBzZXJ2aWNlLmtleSB9X3B1YmxpY19jZXJ0YCksXG5cdFx0XHRjZXJ0OiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldChgJHsgc2VydmljZS5rZXkgfV9jZXJ0YClcblx0XHR9XG5cdH07XG59O1xuXG5jb25zdCBkZWJvdW5jZSA9IChmbiwgZGVsYXkpID0+IHtcblx0bGV0IHRpbWVyID0gbnVsbDtcblx0cmV0dXJuICgpID0+IHtcblx0XHRpZiAodGltZXIgIT0gbnVsbCkge1xuXHRcdFx0TWV0ZW9yLmNsZWFyVGltZW91dCh0aW1lcik7XG5cdFx0fVxuXHRcdHJldHVybiB0aW1lciA9IE1ldGVvci5zZXRUaW1lb3V0KGZuLCBkZWxheSk7XG5cdH07XG59O1xuY29uc3Qgc2VydmljZU5hbWUgPSAnc2FtbCc7XG5cbmNvbnN0IGNvbmZpZ3VyZVNhbWxTZXJ2aWNlID0gZnVuY3Rpb24oc2FtbENvbmZpZ3MpIHtcblx0bGV0IHByaXZhdGVDZXJ0ID0gZmFsc2U7XG5cdGxldCBwcml2YXRlS2V5ID0gZmFsc2U7XG5cdGlmIChzYW1sQ29uZmlncy5zZWNyZXQucHJpdmF0ZUtleSAmJiBzYW1sQ29uZmlncy5zZWNyZXQucHVibGljQ2VydCkge1xuXHRcdHByaXZhdGVLZXkgPSBzYW1sQ29uZmlncy5zZWNyZXQucHJpdmF0ZUtleTtcblx0XHRwcml2YXRlQ2VydCA9IHNhbWxDb25maWdzLnNlY3JldC5wdWJsaWNDZXJ0O1xuXHR9IGVsc2UgaWYgKHNhbWxDb25maWdzLnNlY3JldC5wcml2YXRlS2V5IHx8IHNhbWxDb25maWdzLnNlY3JldC5wdWJsaWNDZXJ0KSB7XG5cdFx0bG9nZ2VyLmVycm9yKCdZb3UgbXVzdCBzcGVjaWZ5IGJvdGggY2VydCBhbmQga2V5IGZpbGVzLicpO1xuXHR9XG5cdC8vIFRPRE86IHRoZSBmdW5jdGlvbiBjb25maWd1cmVTYW1sU2VydmljZSBpcyBjYWxsZWQgbWFueSB0aW1lcyBhbmQgQWNjb3VudHMuc2FtbC5zZXR0aW5ncy5nZW5lcmF0ZVVzZXJuYW1lIGtlZXBzIGp1c3QgdGhlIGxhc3QgdmFsdWVcblx0QWNjb3VudHMuc2FtbC5zZXR0aW5ncy5nZW5lcmF0ZVVzZXJuYW1lID0gc2FtbENvbmZpZ3MuZ2VuZXJhdGVVc2VybmFtZTtcblx0cmV0dXJuIHtcblx0XHRwcm92aWRlcjogc2FtbENvbmZpZ3MuY2xpZW50Q29uZmlnLnByb3ZpZGVyLFxuXHRcdGVudHJ5UG9pbnQ6IHNhbWxDb25maWdzLmVudHJ5UG9pbnQsXG5cdFx0aWRwU0xPUmVkaXJlY3RVUkw6IHNhbWxDb25maWdzLmlkcFNMT1JlZGlyZWN0VVJMLFxuXHRcdGlzc3Vlcjogc2FtbENvbmZpZ3MuaXNzdWVyLFxuXHRcdGNlcnQ6IHNhbWxDb25maWdzLnNlY3JldC5jZXJ0LFxuXHRcdHByaXZhdGVDZXJ0LFxuXHRcdHByaXZhdGVLZXlcblx0fTtcbn07XG5cbmNvbnN0IHVwZGF0ZVNlcnZpY2VzID0gZGVib3VuY2UoKCkgPT4ge1xuXHRjb25zdCBzZXJ2aWNlcyA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KC9eKFNBTUxfQ3VzdG9tXylbYS16XSskL2kpO1xuXHRBY2NvdW50cy5zYW1sLnNldHRpbmdzLnByb3ZpZGVycyA9IHNlcnZpY2VzLm1hcCgoc2VydmljZSkgPT4ge1xuXHRcdGlmIChzZXJ2aWNlLnZhbHVlID09PSB0cnVlKSB7XG5cdFx0XHRjb25zdCBzYW1sQ29uZmlncyA9IGdldFNhbWxDb25maWdzKHNlcnZpY2UpO1xuXHRcdFx0bG9nZ2VyLnVwZGF0ZWQoc2VydmljZS5rZXkpO1xuXHRcdFx0U2VydmljZUNvbmZpZ3VyYXRpb24uY29uZmlndXJhdGlvbnMudXBzZXJ0KHtcblx0XHRcdFx0c2VydmljZTogc2VydmljZU5hbWUudG9Mb3dlckNhc2UoKVxuXHRcdFx0fSwge1xuXHRcdFx0XHQkc2V0OiBzYW1sQ29uZmlnc1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gY29uZmlndXJlU2FtbFNlcnZpY2Uoc2FtbENvbmZpZ3MpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRTZXJ2aWNlQ29uZmlndXJhdGlvbi5jb25maWd1cmF0aW9ucy5yZW1vdmUoe1xuXHRcdFx0XHRzZXJ2aWNlOiBzZXJ2aWNlTmFtZS50b0xvd2VyQ2FzZSgpXG5cdFx0XHR9KTtcblx0XHR9XG5cdH0pLmZpbHRlcihlID0+IGUpO1xufSwgMjAwMCk7XG5cblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoL15TQU1MXy4rLywgdXBkYXRlU2VydmljZXMpO1xuXG5NZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG5cdHJldHVybiBNZXRlb3IuY2FsbCgnYWRkU2FtbFNlcnZpY2UnLCAnRGVmYXVsdCcpO1xufSk7XG5cbmV4cG9ydCB7XG5cdHVwZGF0ZVNlcnZpY2VzLFxuXHRjb25maWd1cmVTYW1sU2VydmljZSxcblx0Z2V0U2FtbENvbmZpZ3MsXG5cdGRlYm91bmNlLFxuXHRsb2dnZXJcbn07XG4iXX0=

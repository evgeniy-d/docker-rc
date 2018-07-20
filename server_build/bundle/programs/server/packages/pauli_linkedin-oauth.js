(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var OAuth = Package.oauth.OAuth;
var Oauth = Package.oauth.Oauth;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var _ = Package.underscore._;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var LinkedIn;

var require = meteorInstall({"node_modules":{"meteor":{"pauli:linkedin-oauth":{"linkedin-server.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                             //
// packages/pauli_linkedin-oauth/linkedin-server.js                                            //
//                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                               //
LinkedIn = {};
OAuth.registerService('linkedin', 2, null, function (query) {
  var response = getTokenResponse(query);
  var accessToken = response.accessToken;
  var identity = getIdentity(accessToken);
  var id = identity.id;

  if (!id) {
    throw new Error("LinkedIn did not provide an id");
  }

  var serviceData = {
    id: id,
    accessToken: accessToken,
    expiresAt: +new Date() + 1000 * response.expiresIn
  };
  var whiteListed = ['firstName', 'headline', 'lastName']; // include all fields from linkedin
  // https://developer.linkedin.com/documents/authentication

  var fields = _.pick(identity, whiteListed); // list of extra fields
  // http://developer.linkedin.com/documents/profile-fields


  var extraFields = 'email-address,location:(name),num-connections,picture-url,public-profile-url,skills,languages,three-current-positions,recommendations-received'; // remove the whitespaces which could break the request

  extraFields = extraFields.replace(/\s+/g, '');
  fields = getExtraData(accessToken, extraFields, fields);

  _.extend(serviceData, fields);

  return {
    serviceData: serviceData,
    options: {
      profile: fields
    }
  };
});

var getExtraData = function (accessToken, extraFields, fields) {
  var url = 'https://api.linkedin.com/v1/people/~:(' + extraFields + ')';
  var response = Meteor.http.get(url, {
    params: {
      oauth2_access_token: accessToken,
      format: 'json'
    }
  }).data;
  return _.extend(fields, response);
}; // checks whether a string parses as JSON


var isJSON = function (str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}; // returns an object containing:
// - accessToken
// - expiresIn: lifetime of token in seconds


var getTokenResponse = function (query) {
  var config = ServiceConfiguration.configurations.findOne({
    service: 'linkedin'
  });
  if (!config) throw new ServiceConfiguration.ConfigError("Service not configured");
  var responseContent;

  try {
    //Request an access token
    responseContent = Meteor.http.post("https://api.linkedin.com/uas/oauth2/accessToken", {
      params: {
        grant_type: 'authorization_code',
        client_id: config.clientId,
        client_secret: OAuth.openSecret(config.secret),
        code: query.code,
        redirect_uri: OAuth._redirectUri('linkedin', config)
      }
    }).content;
  } catch (err) {
    throw new Error("Failed to complete OAuth handshake with LinkedIn. " + err.message);
  } // If 'responseContent' does not parse as JSON, it is an error.


  if (!isJSON(responseContent)) {
    throw new Error("Failed to complete OAuth handshake with LinkedIn. " + responseContent);
  } // Success! Extract access token and expiration


  var parsedResponse = JSON.parse(responseContent);
  var accessToken = parsedResponse.access_token;
  var expiresIn = parsedResponse.expires_in;

  if (!accessToken) {
    throw new Error("Failed to complete OAuth handshake with LinkedIn " + "-- can't find access token in HTTP response. " + responseContent);
  }

  return {
    accessToken: accessToken,
    expiresIn: expiresIn
  };
};

var getIdentity = function (accessToken) {
  try {
    return Meteor.http.get("https://www.linkedin.com/v1/people/~", {
      params: {
        oauth2_access_token: accessToken,
        format: 'json'
      }
    }).data;
  } catch (err) {
    throw new Error("Failed to fetch identity from LinkedIn. " + err.message);
  }
};

LinkedIn.retrieveCredential = function (credentialToken, credentialSecret) {
  return OAuth.retrieveCredential(credentialToken, credentialSecret);
};
/////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/pauli:linkedin-oauth/linkedin-server.js");

/* Exports */
Package._define("pauli:linkedin-oauth", {
  LinkedIn: LinkedIn
});

})();

//# sourceURL=meteor://💻app/packages/pauli_linkedin-oauth.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcGF1bGk6bGlua2VkaW4tb2F1dGgvbGlua2VkaW4tc2VydmVyLmpzIl0sIm5hbWVzIjpbIkxpbmtlZEluIiwiT0F1dGgiLCJyZWdpc3RlclNlcnZpY2UiLCJxdWVyeSIsInJlc3BvbnNlIiwiZ2V0VG9rZW5SZXNwb25zZSIsImFjY2Vzc1Rva2VuIiwiaWRlbnRpdHkiLCJnZXRJZGVudGl0eSIsImlkIiwiRXJyb3IiLCJzZXJ2aWNlRGF0YSIsImV4cGlyZXNBdCIsIkRhdGUiLCJleHBpcmVzSW4iLCJ3aGl0ZUxpc3RlZCIsImZpZWxkcyIsIl8iLCJwaWNrIiwiZXh0cmFGaWVsZHMiLCJyZXBsYWNlIiwiZ2V0RXh0cmFEYXRhIiwiZXh0ZW5kIiwib3B0aW9ucyIsInByb2ZpbGUiLCJ1cmwiLCJNZXRlb3IiLCJodHRwIiwiZ2V0IiwicGFyYW1zIiwib2F1dGgyX2FjY2Vzc190b2tlbiIsImZvcm1hdCIsImRhdGEiLCJpc0pTT04iLCJzdHIiLCJKU09OIiwicGFyc2UiLCJlIiwiY29uZmlnIiwiU2VydmljZUNvbmZpZ3VyYXRpb24iLCJjb25maWd1cmF0aW9ucyIsImZpbmRPbmUiLCJzZXJ2aWNlIiwiQ29uZmlnRXJyb3IiLCJyZXNwb25zZUNvbnRlbnQiLCJwb3N0IiwiZ3JhbnRfdHlwZSIsImNsaWVudF9pZCIsImNsaWVudElkIiwiY2xpZW50X3NlY3JldCIsIm9wZW5TZWNyZXQiLCJzZWNyZXQiLCJjb2RlIiwicmVkaXJlY3RfdXJpIiwiX3JlZGlyZWN0VXJpIiwiY29udGVudCIsImVyciIsIm1lc3NhZ2UiLCJwYXJzZWRSZXNwb25zZSIsImFjY2Vzc190b2tlbiIsImV4cGlyZXNfaW4iLCJyZXRyaWV2ZUNyZWRlbnRpYWwiLCJjcmVkZW50aWFsVG9rZW4iLCJjcmVkZW50aWFsU2VjcmV0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLFdBQVcsRUFBWDtBQUVBQyxNQUFNQyxlQUFOLENBQXNCLFVBQXRCLEVBQWtDLENBQWxDLEVBQXFDLElBQXJDLEVBQTJDLFVBQVNDLEtBQVQsRUFBZ0I7QUFFekQsTUFBSUMsV0FBV0MsaUJBQWlCRixLQUFqQixDQUFmO0FBQ0EsTUFBSUcsY0FBY0YsU0FBU0UsV0FBM0I7QUFDQSxNQUFJQyxXQUFXQyxZQUFZRixXQUFaLENBQWY7QUFFQSxNQUFJRyxLQUFLRixTQUFTRSxFQUFsQjs7QUFDQSxNQUFJLENBQUNBLEVBQUwsRUFBUztBQUNQLFVBQU0sSUFBSUMsS0FBSixDQUFVLGdDQUFWLENBQU47QUFDRDs7QUFDRCxNQUFJQyxjQUFjO0FBQ2hCRixRQUFJQSxFQURZO0FBRWhCSCxpQkFBYUEsV0FGRztBQUdoQk0sZUFBWSxDQUFDLElBQUlDLElBQUosRUFBRixHQUFlLE9BQU9ULFNBQVNVO0FBSDFCLEdBQWxCO0FBTUEsTUFBSUMsY0FBYyxDQUFDLFdBQUQsRUFBYyxVQUFkLEVBQTBCLFVBQTFCLENBQWxCLENBaEJ5RCxDQWtCekQ7QUFDQTs7QUFDQSxNQUFJQyxTQUFTQyxFQUFFQyxJQUFGLENBQU9YLFFBQVAsRUFBaUJRLFdBQWpCLENBQWIsQ0FwQnlELENBc0J6RDtBQUNBOzs7QUFDQSxNQUFJSSxjQUFjLGdKQUFsQixDQXhCeUQsQ0EwQnpEOztBQUNBQSxnQkFBY0EsWUFBWUMsT0FBWixDQUFvQixNQUFwQixFQUE0QixFQUE1QixDQUFkO0FBRUFKLFdBQVNLLGFBQWFmLFdBQWIsRUFBMEJhLFdBQTFCLEVBQXVDSCxNQUF2QyxDQUFUOztBQUVBQyxJQUFFSyxNQUFGLENBQVNYLFdBQVQsRUFBc0JLLE1BQXRCOztBQUVBLFNBQU87QUFDTEwsaUJBQWFBLFdBRFI7QUFFTFksYUFBUztBQUNQQyxlQUFTUjtBQURGO0FBRkosR0FBUDtBQU1ELENBdkNEOztBQXlDQSxJQUFJSyxlQUFlLFVBQVNmLFdBQVQsRUFBc0JhLFdBQXRCLEVBQW1DSCxNQUFuQyxFQUEyQztBQUM1RCxNQUFJUyxNQUFNLDJDQUEyQ04sV0FBM0MsR0FBeUQsR0FBbkU7QUFDQSxNQUFJZixXQUFXc0IsT0FBT0MsSUFBUCxDQUFZQyxHQUFaLENBQWdCSCxHQUFoQixFQUFxQjtBQUNsQ0ksWUFBUTtBQUNOQywyQkFBcUJ4QixXQURmO0FBRU55QixjQUFRO0FBRkY7QUFEMEIsR0FBckIsRUFLWkMsSUFMSDtBQU1BLFNBQU9mLEVBQUVLLE1BQUYsQ0FBU04sTUFBVCxFQUFpQlosUUFBakIsQ0FBUDtBQUNELENBVEQsQyxDQVdBOzs7QUFDQSxJQUFJNkIsU0FBUyxVQUFVQyxHQUFWLEVBQWU7QUFDMUIsTUFBSTtBQUNGQyxTQUFLQyxLQUFMLENBQVdGLEdBQVg7QUFDQSxXQUFPLElBQVA7QUFDRCxHQUhELENBR0UsT0FBT0csQ0FBUCxFQUFVO0FBQ1YsV0FBTyxLQUFQO0FBQ0Q7QUFDRixDQVBELEMsQ0FTQTtBQUNBO0FBQ0E7OztBQUNBLElBQUloQyxtQkFBbUIsVUFBVUYsS0FBVixFQUFpQjtBQUN0QyxNQUFJbUMsU0FBU0MscUJBQXFCQyxjQUFyQixDQUFvQ0MsT0FBcEMsQ0FBNEM7QUFBQ0MsYUFBUztBQUFWLEdBQTVDLENBQWI7QUFDQSxNQUFJLENBQUNKLE1BQUwsRUFDRSxNQUFNLElBQUlDLHFCQUFxQkksV0FBekIsQ0FBcUMsd0JBQXJDLENBQU47QUFFRixNQUFJQyxlQUFKOztBQUNBLE1BQUk7QUFDRjtBQUNBQSxzQkFBa0JsQixPQUFPQyxJQUFQLENBQVlrQixJQUFaLENBQ2YsaURBRGUsRUFDb0M7QUFDakRoQixjQUFRO0FBQ05pQixvQkFBWSxvQkFETjtBQUVOQyxtQkFBV1QsT0FBT1UsUUFGWjtBQUdOQyx1QkFBZWhELE1BQU1pRCxVQUFOLENBQWlCWixPQUFPYSxNQUF4QixDQUhUO0FBSU5DLGNBQU1qRCxNQUFNaUQsSUFKTjtBQUtOQyxzQkFBY3BELE1BQU1xRCxZQUFOLENBQW1CLFVBQW5CLEVBQStCaEIsTUFBL0I7QUFMUjtBQUR5QyxLQURwQyxFQVNaaUIsT0FUTjtBQVVELEdBWkQsQ0FZRSxPQUFPQyxHQUFQLEVBQVk7QUFDWixVQUFNLElBQUk5QyxLQUFKLENBQVUsdURBQXVEOEMsSUFBSUMsT0FBckUsQ0FBTjtBQUNELEdBcEJxQyxDQXNCdEM7OztBQUNBLE1BQUksQ0FBQ3hCLE9BQU9XLGVBQVAsQ0FBTCxFQUE4QjtBQUM1QixVQUFNLElBQUlsQyxLQUFKLENBQVUsdURBQXVEa0MsZUFBakUsQ0FBTjtBQUNELEdBekJxQyxDQTJCdEM7OztBQUNBLE1BQUljLGlCQUFpQnZCLEtBQUtDLEtBQUwsQ0FBV1EsZUFBWCxDQUFyQjtBQUNBLE1BQUl0QyxjQUFjb0QsZUFBZUMsWUFBakM7QUFDQSxNQUFJN0MsWUFBWTRDLGVBQWVFLFVBQS9COztBQUVBLE1BQUksQ0FBQ3RELFdBQUwsRUFBa0I7QUFDaEIsVUFBTSxJQUFJSSxLQUFKLENBQVUsc0RBQ2QsK0NBRGMsR0FDb0NrQyxlQUQ5QyxDQUFOO0FBRUQ7O0FBRUQsU0FBTztBQUNMdEMsaUJBQWFBLFdBRFI7QUFFTFEsZUFBV0E7QUFGTixHQUFQO0FBSUQsQ0F6Q0Q7O0FBMkNBLElBQUlOLGNBQWMsVUFBVUYsV0FBVixFQUF1QjtBQUN2QyxNQUFJO0FBQ0YsV0FBT29CLE9BQU9DLElBQVAsQ0FBWUMsR0FBWixDQUFnQixzQ0FBaEIsRUFBd0Q7QUFDN0RDLGNBQVE7QUFBQ0MsNkJBQXFCeEIsV0FBdEI7QUFBbUN5QixnQkFBUTtBQUEzQztBQURxRCxLQUF4RCxFQUN3REMsSUFEL0Q7QUFFRCxHQUhELENBR0UsT0FBT3dCLEdBQVAsRUFBWTtBQUNaLFVBQU0sSUFBSTlDLEtBQUosQ0FBVSw2Q0FBNkM4QyxJQUFJQyxPQUEzRCxDQUFOO0FBQ0Q7QUFDRixDQVBEOztBQVNBekQsU0FBUzZELGtCQUFULEdBQThCLFVBQVNDLGVBQVQsRUFBMEJDLGdCQUExQixFQUE0QztBQUN4RSxTQUFPOUQsTUFBTTRELGtCQUFOLENBQXlCQyxlQUF6QixFQUEwQ0MsZ0JBQTFDLENBQVA7QUFDRCxDQUZELEMiLCJmaWxlIjoiL3BhY2thZ2VzL3BhdWxpX2xpbmtlZGluLW9hdXRoLmpzIiwic291cmNlc0NvbnRlbnQiOlsiTGlua2VkSW4gPSB7fTtcblxuT0F1dGgucmVnaXN0ZXJTZXJ2aWNlKCdsaW5rZWRpbicsIDIsIG51bGwsIGZ1bmN0aW9uKHF1ZXJ5KSB7XG5cbiAgdmFyIHJlc3BvbnNlID0gZ2V0VG9rZW5SZXNwb25zZShxdWVyeSk7XG4gIHZhciBhY2Nlc3NUb2tlbiA9IHJlc3BvbnNlLmFjY2Vzc1Rva2VuO1xuICB2YXIgaWRlbnRpdHkgPSBnZXRJZGVudGl0eShhY2Nlc3NUb2tlbik7XG5cbiAgdmFyIGlkID0gaWRlbnRpdHkuaWQ7XG4gIGlmICghaWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJMaW5rZWRJbiBkaWQgbm90IHByb3ZpZGUgYW4gaWRcIik7XG4gIH1cbiAgdmFyIHNlcnZpY2VEYXRhID0ge1xuICAgIGlkOiBpZCxcbiAgICBhY2Nlc3NUb2tlbjogYWNjZXNzVG9rZW4sXG4gICAgZXhwaXJlc0F0OiAoK25ldyBEYXRlKSArICgxMDAwICogcmVzcG9uc2UuZXhwaXJlc0luKVxuICB9O1xuXG4gIHZhciB3aGl0ZUxpc3RlZCA9IFsnZmlyc3ROYW1lJywgJ2hlYWRsaW5lJywgJ2xhc3ROYW1lJ107XG5cbiAgLy8gaW5jbHVkZSBhbGwgZmllbGRzIGZyb20gbGlua2VkaW5cbiAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubGlua2VkaW4uY29tL2RvY3VtZW50cy9hdXRoZW50aWNhdGlvblxuICB2YXIgZmllbGRzID0gXy5waWNrKGlkZW50aXR5LCB3aGl0ZUxpc3RlZCk7XG5cbiAgLy8gbGlzdCBvZiBleHRyYSBmaWVsZHNcbiAgLy8gaHR0cDovL2RldmVsb3Blci5saW5rZWRpbi5jb20vZG9jdW1lbnRzL3Byb2ZpbGUtZmllbGRzXG4gIHZhciBleHRyYUZpZWxkcyA9ICdlbWFpbC1hZGRyZXNzLGxvY2F0aW9uOihuYW1lKSxudW0tY29ubmVjdGlvbnMscGljdHVyZS11cmwscHVibGljLXByb2ZpbGUtdXJsLHNraWxscyxsYW5ndWFnZXMsdGhyZWUtY3VycmVudC1wb3NpdGlvbnMscmVjb21tZW5kYXRpb25zLXJlY2VpdmVkJztcblxuICAvLyByZW1vdmUgdGhlIHdoaXRlc3BhY2VzIHdoaWNoIGNvdWxkIGJyZWFrIHRoZSByZXF1ZXN0XG4gIGV4dHJhRmllbGRzID0gZXh0cmFGaWVsZHMucmVwbGFjZSgvXFxzKy9nLCAnJyk7XG5cbiAgZmllbGRzID0gZ2V0RXh0cmFEYXRhKGFjY2Vzc1Rva2VuLCBleHRyYUZpZWxkcywgZmllbGRzKTtcblxuICBfLmV4dGVuZChzZXJ2aWNlRGF0YSwgZmllbGRzKTtcblxuICByZXR1cm4ge1xuICAgIHNlcnZpY2VEYXRhOiBzZXJ2aWNlRGF0YSxcbiAgICBvcHRpb25zOiB7XG4gICAgICBwcm9maWxlOiBmaWVsZHNcbiAgICB9XG4gIH07XG59KTtcblxudmFyIGdldEV4dHJhRGF0YSA9IGZ1bmN0aW9uKGFjY2Vzc1Rva2VuLCBleHRyYUZpZWxkcywgZmllbGRzKSB7XG4gIHZhciB1cmwgPSAnaHR0cHM6Ly9hcGkubGlua2VkaW4uY29tL3YxL3Blb3BsZS9+OignICsgZXh0cmFGaWVsZHMgKyAnKSc7XG4gIHZhciByZXNwb25zZSA9IE1ldGVvci5odHRwLmdldCh1cmwsIHtcbiAgICBwYXJhbXM6IHtcbiAgICAgIG9hdXRoMl9hY2Nlc3NfdG9rZW46IGFjY2Vzc1Rva2VuLFxuICAgICAgZm9ybWF0OiAnanNvbidcbiAgICB9XG4gIH0pLmRhdGE7XG4gIHJldHVybiBfLmV4dGVuZChmaWVsZHMsIHJlc3BvbnNlKTtcbn1cblxuLy8gY2hlY2tzIHdoZXRoZXIgYSBzdHJpbmcgcGFyc2VzIGFzIEpTT05cbnZhciBpc0pTT04gPSBmdW5jdGlvbiAoc3RyKSB7XG4gIHRyeSB7XG4gICAgSlNPTi5wYXJzZShzdHIpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8vIHJldHVybnMgYW4gb2JqZWN0IGNvbnRhaW5pbmc6XG4vLyAtIGFjY2Vzc1Rva2VuXG4vLyAtIGV4cGlyZXNJbjogbGlmZXRpbWUgb2YgdG9rZW4gaW4gc2Vjb25kc1xudmFyIGdldFRva2VuUmVzcG9uc2UgPSBmdW5jdGlvbiAocXVlcnkpIHtcbiAgdmFyIGNvbmZpZyA9IFNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zLmZpbmRPbmUoe3NlcnZpY2U6ICdsaW5rZWRpbid9KTtcbiAgaWYgKCFjb25maWcpXG4gICAgdGhyb3cgbmV3IFNlcnZpY2VDb25maWd1cmF0aW9uLkNvbmZpZ0Vycm9yKFwiU2VydmljZSBub3QgY29uZmlndXJlZFwiKTtcblxuICB2YXIgcmVzcG9uc2VDb250ZW50O1xuICB0cnkge1xuICAgIC8vUmVxdWVzdCBhbiBhY2Nlc3MgdG9rZW5cbiAgICByZXNwb25zZUNvbnRlbnQgPSBNZXRlb3IuaHR0cC5wb3N0KFxuICAgICAgIFwiaHR0cHM6Ly9hcGkubGlua2VkaW4uY29tL3Vhcy9vYXV0aDIvYWNjZXNzVG9rZW5cIiwge1xuICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgIGdyYW50X3R5cGU6ICdhdXRob3JpemF0aW9uX2NvZGUnLFxuICAgICAgICAgICBjbGllbnRfaWQ6IGNvbmZpZy5jbGllbnRJZCxcbiAgICAgICAgICAgY2xpZW50X3NlY3JldDogT0F1dGgub3BlblNlY3JldChjb25maWcuc2VjcmV0KSxcbiAgICAgICAgICAgY29kZTogcXVlcnkuY29kZSxcbiAgICAgICAgICAgcmVkaXJlY3RfdXJpOiBPQXV0aC5fcmVkaXJlY3RVcmkoJ2xpbmtlZGluJywgY29uZmlnKVxuICAgICAgICAgfVxuICAgICAgIH0pLmNvbnRlbnQ7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBjb21wbGV0ZSBPQXV0aCBoYW5kc2hha2Ugd2l0aCBMaW5rZWRJbi4gXCIgKyBlcnIubWVzc2FnZSk7XG4gIH1cblxuICAvLyBJZiAncmVzcG9uc2VDb250ZW50JyBkb2VzIG5vdCBwYXJzZSBhcyBKU09OLCBpdCBpcyBhbiBlcnJvci5cbiAgaWYgKCFpc0pTT04ocmVzcG9uc2VDb250ZW50KSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBjb21wbGV0ZSBPQXV0aCBoYW5kc2hha2Ugd2l0aCBMaW5rZWRJbi4gXCIgKyByZXNwb25zZUNvbnRlbnQpO1xuICB9XG5cbiAgLy8gU3VjY2VzcyEgRXh0cmFjdCBhY2Nlc3MgdG9rZW4gYW5kIGV4cGlyYXRpb25cbiAgdmFyIHBhcnNlZFJlc3BvbnNlID0gSlNPTi5wYXJzZShyZXNwb25zZUNvbnRlbnQpO1xuICB2YXIgYWNjZXNzVG9rZW4gPSBwYXJzZWRSZXNwb25zZS5hY2Nlc3NfdG9rZW47XG4gIHZhciBleHBpcmVzSW4gPSBwYXJzZWRSZXNwb25zZS5leHBpcmVzX2luO1xuXG4gIGlmICghYWNjZXNzVG9rZW4pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gY29tcGxldGUgT0F1dGggaGFuZHNoYWtlIHdpdGggTGlua2VkSW4gXCIgK1xuICAgICAgXCItLSBjYW4ndCBmaW5kIGFjY2VzcyB0b2tlbiBpbiBIVFRQIHJlc3BvbnNlLiBcIiArIHJlc3BvbnNlQ29udGVudCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFjY2Vzc1Rva2VuOiBhY2Nlc3NUb2tlbixcbiAgICBleHBpcmVzSW46IGV4cGlyZXNJblxuICB9O1xufTtcblxudmFyIGdldElkZW50aXR5ID0gZnVuY3Rpb24gKGFjY2Vzc1Rva2VuKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIE1ldGVvci5odHRwLmdldChcImh0dHBzOi8vd3d3LmxpbmtlZGluLmNvbS92MS9wZW9wbGUvflwiLCB7XG4gICAgICBwYXJhbXM6IHtvYXV0aDJfYWNjZXNzX3Rva2VuOiBhY2Nlc3NUb2tlbiwgZm9ybWF0OiAnanNvbid9fSkuZGF0YTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGZldGNoIGlkZW50aXR5IGZyb20gTGlua2VkSW4uIFwiICsgZXJyLm1lc3NhZ2UpO1xuICB9XG59O1xuXG5MaW5rZWRJbi5yZXRyaWV2ZUNyZWRlbnRpYWwgPSBmdW5jdGlvbihjcmVkZW50aWFsVG9rZW4sIGNyZWRlbnRpYWxTZWNyZXQpIHtcbiAgcmV0dXJuIE9BdXRoLnJldHJpZXZlQ3JlZGVudGlhbChjcmVkZW50aWFsVG9rZW4sIGNyZWRlbnRpYWxTZWNyZXQpO1xufTtcbiJdfQ==

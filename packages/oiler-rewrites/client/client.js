function renderMessageOiler(message) {
	if (message.html.indexOf(RocketChat.settings.get('Site_Url')) !== -1) {
		let quoteSiteUrl = RocketChat.settings.get('Site_Url').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\-]', 'g'), '\\$&');

		message.html = message.html.replace(new RegExp('<a.+?href=\\"'+quoteSiteUrl+'.+?\\".*?\/a>', 'g'),"");
	}

	if (message.attachments) {
		for (var i in message.attachments) {
			if (message.attachments.hasOwnProperty(i) && message.attachments[i].message_link && message.attachments[i].message_link.indexOf(RocketChat.settings.get('Site_Url')) !== -1) {
				message.attachments[i].message_link = '';
			}
		}
	}

	return message;
}

RocketChat.callbacks.add('renderMessage', renderMessageOiler, RocketChat.callbacks.priority.LOW, 'renderMessageOiler');

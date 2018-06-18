// Insert server unique id if it doesn't exist
RocketChat.settings.add('uniqueID', process.env.DEPLOYMENT_ID || Random.id(), {
	'public': true,
	hidden: true
});

// When you define a setting and want to add a description, you don't need to automatically define the i18nDescription
// if you add a node to the i18n.json with the same setting name but with `_Description` it will automatically work.

RocketChat.settings.addGroup('Accounts', function() {
	this.add('Accounts_AllowAnonymousRead', false, {
		type: 'boolean',
		public: true
	});
	this.add('Accounts_AllowAnonymousWrite', false, {
		type: 'boolean',
		public: true,
		enableQuery: {
			_id: 'Accounts_AllowAnonymousRead',
			value: true
		}
	});
	this.add('Accounts_AllowDeleteOwnAccount', false, {
		type: 'boolean',
		'public': true,
		enableQuery: {
			_id: 'Accounts_AllowUserProfileChange',
			value: true
		}
	});
	this.add('Accounts_AllowUserProfileChange', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Accounts_AllowUserAvatarChange', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Accounts_AllowRealNameChange', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Accounts_AllowUsernameChange', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Accounts_AllowEmailChange', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Accounts_AllowPasswordChange', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Accounts_CustomFieldsToShowInUserInfo', '', {
		type: 'string',
		public: true
	});
	this.add('Accounts_LoginExpiration', 90, {
		type: 'int',
		'public': true
	});
	this.add('Accounts_ShowFormLogin', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Accounts_EmailOrUsernamePlaceholder', '', {
		type: 'string',
		'public': true,
		i18nLabel: 'Placeholder_for_email_or_username_login_field'
	});
	this.add('Accounts_PasswordPlaceholder', '', {
		type: 'string',
		'public': true,
		i18nLabel: 'Placeholder_for_password_login_field'
	});
	this.add('Accounts_ConfirmPasswordPlaceholder', '', {
		type: 'string',
		'public': true,
		i18nLabel: 'Placeholder_for_password_login_field'
	});
	this.add('Accounts_ForgetUserSessionOnWindowClose', false, {
		type: 'boolean',
		'public': true
	});
	this.add('Accounts_SearchFields', 'username, name, emails.address', {
		type: 'string',
		public: true
	});

	this.section('Two Factor Authentication', function() {
		this.add('Accounts_TwoFactorAuthentication_MaxDelta', 1, {
			type: 'int',
			public: true,
			i18nLabel: 'Accounts_TwoFactorAuthentication_MaxDelta'
		});
	});

	this.section('Registration', function() {
		this.add('Accounts_DefaultUsernamePrefixSuggestion', 'user', {
			type: 'string'
		});
		this.add('Accounts_RequireNameForSignUp', true, {
			type: 'boolean',
			'public': true
		});
		this.add('Accounts_RequirePasswordConfirmation', true, {
			type: 'boolean',
			'public': true
		});
		this.add('Accounts_EmailVerification', false, {
			type: 'boolean',
			'public': true,
			enableQuery: {
				_id: 'SMTP_Host',
				value: {
					$exists: 1,
					$ne: ''
				}
			}
		});
		this.add('Accounts_ManuallyApproveNewUsers', false, {
			'public': true,
			type: 'boolean'
		});
		this.add('Accounts_AllowedDomainsList', '', {
			type: 'string',
			'public': true
		});
		this.add('Accounts_BlockedDomainsList', '', {
			type: 'string'
		});
		this.add('Accounts_BlockedUsernameList', '', {
			type: 'string'
		});
		this.add('Accounts_UseDefaultBlockedDomainsList', true, {
			type: 'boolean'
		});
		this.add('Accounts_UseDNSDomainCheck', false, {
			type: 'boolean'
		});
		this.add('Accounts_RegistrationForm', 'Public', {
			type: 'select',
			'public': true,
			values: [
				{
					key: 'Public',
					i18nLabel: 'Accounts_RegistrationForm_Public'
				}, {
					key: 'Disabled',
					i18nLabel: 'Accounts_RegistrationForm_Disabled'
				}, {
					key: 'Secret URL',
					i18nLabel: 'Accounts_RegistrationForm_Secret_URL'
				}
			]
		});
		this.add('Accounts_RegistrationForm_SecretURL', Random.id(), {
			type: 'string'
		});
		this.add('Accounts_RegistrationForm_LinkReplacementText', 'New user registration is currently disabled', {
			type: 'string',
			'public': true
		});
		this.add('Accounts_Registration_AuthenticationServices_Enabled', true, {
			type: 'boolean',
			'public': true
		});
		this.add('Accounts_Registration_AuthenticationServices_Default_Roles', 'user', {
			type: 'string',
			enableQuery: {
				_id: 'Accounts_Registration_AuthenticationServices_Enabled',
				value: true
			}
		});
		this.add('Accounts_PasswordReset', true, {
			type: 'boolean',
			'public': true
		});
		this.add('Accounts_CustomFields', '', {
			type: 'code',
			'public': true,
			i18nLabel: 'Custom_Fields'
		});
	});

	this.section('Accounts_Default_User_Preferences', function() {
		this.add('Accounts_Default_User_Preferences_enableAutoAway', true, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Enable_Auto_Away'
		});
		this.add('Accounts_Default_User_Preferences_idleTimeLimit', 300, {
			type: 'int',
			'public': true,
			i18nLabel: 'Idle_Time_Limit'
		});
		this.add('Accounts_Default_User_Preferences_desktopNotificationDuration', 0, {
			type: 'int',
			'public': true,
			i18nLabel: 'Notification_Duration'
		});
		this.add('Accounts_Default_User_Preferences_audioNotifications', 'mentions', {
			type: 'select',
			values: [
				{
					key: 'all',
					i18nLabel: 'All_messages'
				},
				{
					key: 'mentions',
					i18nLabel: 'Mentions'
				},
				{
					key: 'nothing',
					i18nLabel: 'Nothing'
				}
			],
			public: true
		});
		this.add('Accounts_Default_User_Preferences_desktopNotifications', 'mentions', {
			type: 'select',
			values: [
				{
					key: 'all',
					i18nLabel: 'All_messages'
				},
				{
					key: 'mentions',
					i18nLabel: 'Mentions'
				},
				{
					key: 'nothing',
					i18nLabel: 'Nothing'
				}
			],
			'public': true
		});
		this.add('Accounts_Default_User_Preferences_mobileNotifications', 'mentions', {
			type: 'select',
			values: [
				{
					key : 'all',
					i18nLabel : 'All_messages'
				},
				{
					key : 'mentions',
					i18nLabel : 'Mentions'
				},
				{
					key : 'nothing',
					i18nLabel : 'Nothing'
				}
			],
			'public': true
		});
		this.add('Accounts_Default_User_Preferences_unreadAlert', true, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Unread_Tray_Icon_Alert'
		});
		this.add('Accounts_Default_User_Preferences_useEmojis', true, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Use_Emojis'
		});
		this.add('Accounts_Default_User_Preferences_convertAsciiEmoji', true, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Convert_Ascii_Emojis'
		});
		this.add('Accounts_Default_User_Preferences_autoImageLoad', true, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Auto_Load_Images'
		});
		this.add('Accounts_Default_User_Preferences_saveMobileBandwidth', true, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Save_Mobile_Bandwidth'
		});
		this.add('Accounts_Default_User_Preferences_collapseMediaByDefault', false, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Collapse_Embedded_Media_By_Default'
		});
		this.add('Accounts_Default_User_Preferences_hideUsernames', false, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Hide_usernames'
		});
		this.add('Accounts_Default_User_Preferences_hideRoles', false, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Hide_roles'
		});
		this.add('Accounts_Default_User_Preferences_hideFlexTab', false, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Hide_flextab'
		});
		this.add('Accounts_Default_User_Preferences_hideAvatars', false, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Hide_Avatars'
		});
		this.add('Accounts_Default_User_Preferences_sidebarGroupByType', true, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Group_by_Type'
		});
		this.add('Accounts_Default_User_Preferences_sidebarViewMode', 'medium', {
			type: 'select',
			values: [
				{
					key: 'extended',
					i18nLabel: 'Extended'
				},
				{
					key: 'medium',
					i18nLabel: 'Medium'
				},
				{
					key: 'condensed',
					i18nLabel: 'Condensed'
				}
			],
			'public': true,
			i18nLabel: 'Sidebar_list_mode'
		});
		this.add('Accounts_Default_User_Preferences_sidebarHideAvatar', false, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Hide_Avatars'
		});
		this.add('Accounts_Default_User_Preferences_sidebarShowUnread', false, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Unread_on_top'
		});
		this.add('Accounts_Default_User_Preferences_sidebarShowFavorites', true, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Group_favorites'
		});
		this.add('Accounts_Default_User_Preferences_sendOnEnter', 'normal', {
			type: 'select',
			values: [
				{
					key: 'normal',
					i18nLabel: 'Enter_Normal'
				},
				{
					key: 'alternative',
					i18nLabel: 'Enter_Alternative'
				},
				{
					key: 'desktop',
					i18nLabel: 'Only_On_Desktop'
				}
			],
			'public': true,
			i18nLabel: 'Enter_Behaviour'
		});
		this.add('Accounts_Default_User_Preferences_messageViewMode', 0, {
			type: 'select',
			values: [
				{
					key: 0,
					i18nLabel: 'Normal'
				},
				{
					key: 1,
					i18nLabel: 'Cozy'
				},
				{
					key: 2,
					i18nLabel: 'Compact'
				}
			],
			'public': true,
			i18nLabel: 'MessageBox_view_mode'
		});
		this.add('Accounts_Default_User_Preferences_emailNotificationMode', 'mentions', {
			type: 'select',
			values: [
				{
					key: 'nothing',
					i18nLabel: 'Email_Notification_Mode_Disabled'
				},
				{
					key: 'mentions',
					i18nLabel: 'Email_Notification_Mode_All'
				}
			],
			'public': true,
			i18nLabel: 'Email_Notification_Mode'
		});
		this.add('Accounts_Default_User_Preferences_roomCounterSidebar', false, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Show_room_counter_on_sidebar'
		});
		this.add('Accounts_Default_User_Preferences_newRoomNotification', 'door', {
			type: 'select',
			values: [
				{
					key: 'none',
					i18nLabel: 'None'
				},
				{
					key: 'door',
					i18nLabel: 'Default'
				}
			],
			'public': true,
			i18nLabel: 'New_Room_Notification'
		});
		this.add('Accounts_Default_User_Preferences_newMessageNotification', 'chime', {
			type: 'select',
			values: [
				{
					key: 'none',
					i18nLabel: 'None'
				},
				{
					key: 'chime',
					i18nLabel: 'Default'
				}
			],
			'public': true,
			i18nLabel: 'New_Message_Notification'
		});
		this.add('Accounts_Default_User_Preferences_muteFocusedConversations', true, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Mute_Focused_Conversations'
		});
		this.add('Accounts_Default_User_Preferences_notificationsSoundVolume', 100, {
			type: 'int',
			'public': true,
			i18nLabel: 'Notifications_Sound_Volume'
		});
	});

	this.section('Avatar', function() {
		this.add('Accounts_AvatarResize', true, {
			type: 'boolean'
		});
		this.add('Accounts_AvatarSize', 200, {
			type: 'int',
			enableQuery: {
				_id: 'Accounts_AvatarResize',
				value: true
			}
		});
		this.add('Accounts_AvatarCacheTime', 3600, {
			type: 'int',
			i18nDescription: 'Accounts_AvatarCacheTime_description'
		});

		return this.add('Accounts_SetDefaultAvatar', true, {
			type: 'boolean'
		});
	});

	this.section('Password_Policy', function() {
		this.add('Accounts_Password_Policy_Enabled', false, {
			type: 'boolean'
		});

		const enableQuery = {
			_id: 'Accounts_Password_Policy_Enabled',
			value: true
		};

		this.add('Accounts_Password_Policy_MinLength', 7, {
			type: 'int',
			enableQuery
		});

		this.add('Accounts_Password_Policy_MaxLength', -1, {
			type: 'int',
			enableQuery
		});

		this.add('Accounts_Password_Policy_ForbidRepeatingCharacters', true, {
			type: 'boolean',
			enableQuery
		});

		this.add('Accounts_Password_Policy_ForbidRepeatingCharactersCount', 3, {
			type: 'int',
			enableQuery
		});

		this.add('Accounts_Password_Policy_AtLeastOneLowercase', true, {
			type: 'boolean',
			enableQuery
		});

		this.add('Accounts_Password_Policy_AtLeastOneUppercase', true, {
			type: 'boolean',
			enableQuery
		});

		this.add('Accounts_Password_Policy_AtLeastOneNumber', true, {
			type: 'boolean',
			enableQuery
		});

		this.add('Accounts_Password_Policy_AtLeastOneSpecialCharacter', true, {
			type: 'boolean',
			enableQuery
		});
	});
});

RocketChat.settings.addGroup('OAuth', function() {
	this.section('Facebook', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_Facebook',
			value: true
		};
		this.add('Accounts_OAuth_Facebook', false, {
			type: 'boolean',
			'public': true
		});
		this.add('Accounts_OAuth_Facebook_id', '', {
			type: 'string',
			enableQuery
		});
		this.add('Accounts_OAuth_Facebook_secret', '', {
			type: 'string',
			enableQuery
		});
		return this.add('Accounts_OAuth_Facebook_callback_url', '_oauth/facebook', {
			type: 'relativeUrl',
			readonly: true,
			force: true,
			enableQuery
		});
	});
	this.section('Google', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_Google',
			value: true
		};
		this.add('Accounts_OAuth_Google', false, {
			type: 'boolean',
			'public': true
		});
		this.add('Accounts_OAuth_Google_id', '', {
			type: 'string',
			enableQuery
		});
		this.add('Accounts_OAuth_Google_secret', '', {
			type: 'string',
			enableQuery
		});
		return this.add('Accounts_OAuth_Google_callback_url', '_oauth/google', {
			type: 'relativeUrl',
			readonly: true,
			force: true,
			enableQuery
		});
	});
	this.section('GitHub', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_Github',
			value: true
		};
		this.add('Accounts_OAuth_Github', false, {
			type: 'boolean',
			'public': true
		});
		this.add('Accounts_OAuth_Github_id', '', {
			type: 'string',
			enableQuery
		});
		this.add('Accounts_OAuth_Github_secret', '', {
			type: 'string',
			enableQuery
		});
		return this.add('Accounts_OAuth_Github_callback_url', '_oauth/github', {
			type: 'relativeUrl',
			readonly: true,
			force: true,
			enableQuery
		});
	});
	this.section('Linkedin', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_Linkedin',
			value: true
		};
		this.add('Accounts_OAuth_Linkedin', false, {
			type: 'boolean',
			'public': true
		});
		this.add('Accounts_OAuth_Linkedin_id', '', {
			type: 'string',
			enableQuery
		});
		this.add('Accounts_OAuth_Linkedin_secret', '', {
			type: 'string',
			enableQuery
		});
		return this.add('Accounts_OAuth_Linkedin_callback_url', '_oauth/linkedin', {
			type: 'relativeUrl',
			readonly: true,
			force: true,
			enableQuery
		});
	});
	this.section('Meteor', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_Meteor',
			value: true
		};
		this.add('Accounts_OAuth_Meteor', false, {
			type: 'boolean',
			'public': true
		});
		this.add('Accounts_OAuth_Meteor_id', '', {
			type: 'string',
			enableQuery
		});
		this.add('Accounts_OAuth_Meteor_secret', '', {
			type: 'string',
			enableQuery
		});
		return this.add('Accounts_OAuth_Meteor_callback_url', '_oauth/meteor', {
			type: 'relativeUrl',
			readonly: true,
			force: true,
			enableQuery
		});
	});
	this.section('Twitter', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_Twitter',
			value: true
		};
		this.add('Accounts_OAuth_Twitter', false, {
			type: 'boolean',
			'public': true
		});
		this.add('Accounts_OAuth_Twitter_id', '', {
			type: 'string',
			enableQuery
		});
		this.add('Accounts_OAuth_Twitter_secret', '', {
			type: 'string',
			enableQuery
		});
		return this.add('Accounts_OAuth_Twitter_callback_url', '_oauth/twitter', {
			type: 'relativeUrl',
			readonly: true,
			force: true,
			enableQuery
		});
	});
	return this.section('Proxy', function() {
		this.add('Accounts_OAuth_Proxy_host', 'https://oauth-proxy.rocket.chat', {
			type: 'string',
			'public': true
		});
		return this.add('Accounts_OAuth_Proxy_services', '', {
			type: 'string',
			'public': true
		});
	});
});

RocketChat.settings.addGroup('General', function() {
	this.add('Show_Setup_Wizard', 'pending', {
		type: 'select',
		public: true,
		values: [
			{
				key: 'pending',
				i18nLabel: 'Pending'
			}, {
				key: 'in_progress',
				i18nLabel: 'In_progress'
			}, {
				key: 'completed',
				i18nLabel: 'Completed'
			}
		]
	});
	this.add('Site_Url', typeof __meteor_runtime_config__ !== 'undefined' && __meteor_runtime_config__ !== null ? __meteor_runtime_config__.ROOT_URL : null, {
		type: 'string',
		i18nDescription: 'Site_Url_Description',
		'public': true
	});
	this.add('Site_Name', 'Rocket.Chat', {
		type: 'string',
		'public': true,
		wizard: {
			step: 3,
			order: 0
		}
	});
	this.add('Language', '', {
		type: 'language',
		'public': true,
		wizard: {
			step: 3,
			order: 1
		}
	});
	this.add('Allow_Invalid_SelfSigned_Certs', false, {
		type: 'boolean'
	});
	this.add('Favorite_Rooms', true, {
		type: 'boolean',
		'public': true
	});
	this.add('First_Channel_After_Login', '', {
		type: 'string',
		'public': true
	});
	this.add('Unread_Count', 'user_and_group_mentions_only', {
		type: 'select',
		values: [
			{
				key: 'all_messages',
				i18nLabel: 'All_messages'
			}, {
				key: 'user_mentions_only',
				i18nLabel: 'User_mentions_only'
			}, {
				key: 'group_mentions_only',
				i18nLabel: 'Group_mentions_only'
			}, {
				key: 'user_and_group_mentions_only',
				i18nLabel: 'User_and_group_mentions_only'
			}
		],
		'public': true
	});
	this.add('Unread_Count_DM', 'all_messages', {
		type: 'select',
		values: [
			{
				key: 'all_messages',
				i18nLabel: 'All_messages'
			}, {
				key: 'mentions_only',
				i18nLabel: 'Mentions_only'
			}
		],
		'public': true
	});
	this.add('CDN_PREFIX', '', {
		type: 'string',
		'public': true
	});
	this.add('Force_SSL', false, {
		type: 'boolean',
		'public': true
	});
	this.add('GoogleTagManager_id', '', {
		type: 'string',
		'public': true
	});
	this.add('Bugsnag_api_key', '', {
		type: 'string',
		'public': false
	});
	this.add('Force_Disable_OpLog_For_Cache', false, {
		type: 'boolean',
		'public': false
	});
	this.add('Restart', 'restart_server', {
		type: 'action',
		actionText: 'Restart_the_server'
	});
	this.add('Store_Last_Message', true, {
		type: 'boolean',
		public: true,
		i18nDescription: 'Store_Last_Message_Sent_per_Room'
	});
	this.section('UTF8', function() {
		this.add('UTF8_Names_Validation', '[0-9a-zA-Z-_.]+', {
			type: 'string',
			'public': true,
			i18nDescription: 'UTF8_Names_Validation_Description'
		});
		return this.add('UTF8_Names_Slugify', true, {
			type: 'boolean',
			'public': true
		});
	});
	this.section('Reporting', function() {
		return this.add('Statistics_reporting', true, {
			type: 'boolean'
		});
	});
	this.section('Notifications', function() {
		this.add('Notifications_Max_Room_Members', 100, {
			type: 'int',
			public: true,
			i18nDescription: 'Notifications_Max_Room_Members_Description'
		});

		this.add('Notifications_Always_Notify_Mobile', false, {
			type: 'boolean',
			public: true,
			i18nDescription: 'Notifications_Always_Notify_Mobile_Description'
		});
	});
	this.section('REST API', function() {
		return this.add('API_User_Limit', 500, {
			type: 'int',
			'public': true,
			i18nDescription: 'API_User_Limit'
		});
	});
	this.section('Iframe_Integration', function() {
		this.add('Iframe_Integration_send_enable', false, {
			type: 'boolean',
			'public': true
		});
		this.add('Iframe_Integration_send_target_origin', '*', {
			type: 'string',
			'public': true,
			enableQuery: {
				_id: 'Iframe_Integration_send_enable',
				value: true
			}
		});
		this.add('Iframe_Integration_receive_enable', false, {
			type: 'boolean',
			'public': true
		});
		return this.add('Iframe_Integration_receive_origin', '*', {
			type: 'string',
			'public': true,
			enableQuery: {
				_id: 'Iframe_Integration_receive_enable',
				value: true
			}
		});
	});
	this.section('Translations', function() {
		return this.add('Custom_Translations', '', {
			type: 'code',
			'public': true
		});
	});
	return this.section('Stream_Cast', function() {
		return this.add('Stream_Cast_Address', '', {
			type: 'string'
		});
	});
});

RocketChat.settings.addGroup('Email', function() {
	this.section('Subject', function() {
		this.add('Offline_DM_Email', '[[Site_Name]] You have been direct messaged by [User]', {
			type: 'code',
			code: 'text',
			multiline: true,
			i18nLabel: 'Offline_DM_Email',
			i18nDescription: 'Offline_Email_Subject_Description'
		});
		this.add('Offline_Mention_Email', '[[Site_Name]] You have been mentioned by [User] in #[Room]', {
			type: 'code',
			code: 'text',
			multiline: true,
			i18nLabel: 'Offline_Mention_Email',
			i18nDescription: 'Offline_Email_Subject_Description'
		});
		return this.add('Offline_Mention_All_Email', '[User] has posted a message in #[Room]', {
			type: 'code',
			code: 'text',
			multiline: true,
			i18nLabel: 'Offline_Mention_All_Email',
			i18nDescription: 'Offline_Email_Subject_Description'
		});
	});
	this.section('Header_and_Footer', function() {
		this.add('Email_Header', '<html><table border="0" cellspacing="0" cellpadding="0" width="100%" bgcolor="#f3f3f3" style="color:#4a4a4a;font-family: Helvetica,Arial,sans-serif;font-size:14px;line-height:20px;border-collapse:collapse;border-spacing:0;margin:0 auto"><tr><td style="padding:1em"><table border="0" cellspacing="0" cellpadding="0" align="center" width="100%" style="width:100%;margin:0 auto;max-width:800px"><tr><td bgcolor="#ffffff" style="background-color:#ffffff; border: 1px solid #DDD; font-size: 10pt; font-family: Helvetica,Arial,sans-serif;"><table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td style="background-color: #04436a;"><h1 style="font-family: Helvetica,Arial,sans-serif; padding: 0 1em; margin: 0; line-height: 70px; color: #FFF;">[Site_Name]</h1></td></tr><tr><td style="padding: 1em; font-size: 10pt; font-family: Helvetica,Arial,sans-serif;">', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Header'
		});
		this.add('Email_Footer', '</td></tr></table></td></tr><tr><td border="0" cellspacing="0" cellpadding="0" width="100%" style="font-family: Helvetica,Arial,sans-serif; max-width: 800px; margin: 0 auto; padding: 1.5em; text-align: center; font-size: 8pt; color: #999;">Powered by <a href="https://rocket.chat" target="_blank">Rocket.Chat</a></td></tr></table></td></tr></table></html>', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Footer'
		});
		return this.add('Email_Footer_Direct_Reply', '</td></tr></table></td></tr><tr><td border="0" cellspacing="0" cellpadding="0" width="100%" style="font-family: Helvetica,Arial,sans-serif; max-width: 800px; margin: 0 auto; padding: 1.5em; text-align: center; font-size: 8pt; color: #999;">You can directly reply to this email.<br>Do not modify previous emails in the thread.<br>Powered by <a href="https://rocket.chat" target="_blank">Rocket.Chat</a></td></tr></table></td></tr></table></html>', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Footer_Direct_Reply'
		});
	});
	this.section('Direct_Reply', function() {
		this.add('Direct_Reply_Enable', false, {
			type: 'boolean',
			env: true,
			i18nLabel: 'Direct_Reply_Enable'
		});
		this.add('Direct_Reply_Debug', false, {
			type: 'boolean',
			env: true,
			i18nLabel: 'Direct_Reply_Debug',
			i18nDescription: 'Direct_Reply_Debug_Description'
		});
		this.add('Direct_Reply_Protocol', 'IMAP', {
			type: 'select',
			values: [
				{
					key: 'IMAP',
					i18nLabel: 'IMAP'
				}, {
					key: 'POP',
					i18nLabel: 'POP'
				}
			],
			env: true,
			i18nLabel: 'Protocol'
		});
		this.add('Direct_Reply_Host', '', {
			type: 'string',
			env: true,
			i18nLabel: 'Host'
		});
		this.add('Direct_Reply_Port', '', {
			type: 'string',
			env: true,
			i18nLabel: 'Port'
		});
		this.add('Direct_Reply_IgnoreTLS', false, {
			type: 'boolean',
			env: true,
			i18nLabel: 'IgnoreTLS'
		});
		this.add('Direct_Reply_Frequency', 5, {
			type: 'int',
			env: true,
			i18nLabel: 'Direct_Reply_Frequency',
			enableQuery: {
				_id: 'Direct_Reply_Protocol',
				value: 'POP'
			}
		});
		this.add('Direct_Reply_Delete', true, {
			type: 'boolean',
			env: true,
			i18nLabel: 'Direct_Reply_Delete',
			enableQuery: {
				_id: 'Direct_Reply_Protocol',
				value: 'IMAP'
			}
		});
		this.add('Direct_Reply_Separator', '+', {
			type: 'select',
			values: [
				{
					key: '!',
					i18nLabel: '!'
				}, {
					key: '#',
					i18nLabel: '#'
				}, {
					key: '$',
					i18nLabel: '$'
				}, {
					key: '%',
					i18nLabel: '%'
				}, {
					key: '&',
					i18nLabel: '&'
				}, {
					key: '\'',
					i18nLabel: '\''
				}, {
					key: '*',
					i18nLabel: '*'
				}, {
					key: '+',
					i18nLabel: '+'
				}, {
					key: '-',
					i18nLabel: '-'
				}, {
					key: '/',
					i18nLabel: '/'
				}, {
					key: '=',
					i18nLabel: '='
				}, {
					key: '?',
					i18nLabel: '?'
				}, {
					key: '^',
					i18nLabel: '^'
				}, {
					key: '_',
					i18nLabel: '_'
				}, {
					key: '`',
					i18nLabel: '`'
				}, {
					key: '{',
					i18nLabel: '{'
				}, {
					key: '|',
					i18nLabel: '|'
				}, {
					key: '}',
					i18nLabel: '}'
				}, {
					key: '~',
					i18nLabel: '~'
				}
			],
			env: true,
			i18nLabel: 'Direct_Reply_Separator'
		});
		this.add('Direct_Reply_Username', '', {
			type: 'string',
			env: true,
			i18nLabel: 'Username',
			placeholder: 'email@domain'
		});
		this.add('Direct_Reply_ReplyTo', '', {
			type: 'string',
			env: true,
			i18nLabel: 'ReplyTo',
			placeholder: 'email@domain'
		});
		return this.add('Direct_Reply_Password', '', {
			type: 'password',
			env: true,
			i18nLabel: 'Password'
		});
	});
	this.section('SMTP', function() {
		this.add('SMTP_Protocol', 'smtp', {
			type: 'select',
			values: [
				{
					key: 'smtp',
					i18nLabel: 'smtp'
				}, {
					key: 'smtps',
					i18nLabel: 'smtps'
				}
			],
			env: true,
			i18nLabel: 'Protocol'
		});
		this.add('SMTP_Host', '', {
			type: 'string',
			env: true,
			i18nLabel: 'Host'
		});
		this.add('SMTP_Port', '', {
			type: 'string',
			env: true,
			i18nLabel: 'Port'
		});
		this.add('SMTP_IgnoreTLS', false, {
			type: 'boolean',
			env: true,
			i18nLabel: 'IgnoreTLS',
			enableQuery: {
				_id: 'SMTP_Protocol',
				value: 'smtp'
			}
		});
		this.add('SMTP_Pool', true, {
			type: 'boolean',
			env: true,
			i18nLabel: 'Pool'
		});
		this.add('SMTP_Username', '', {
			type: 'string',
			env: true,
			i18nLabel: 'Username',
			autocomplete: false
		});
		this.add('SMTP_Password', '', {
			type: 'password',
			env: true,
			i18nLabel: 'Password',
			autocomplete: false
		});
		this.add('From_Email', '', {
			type: 'string',
			placeholder: 'email@domain'
		});
		return this.add('SMTP_Test_Button', 'sendSMTPTestEmail', {
			type: 'action',
			actionText: 'Send_a_test_mail_to_my_user'
		});
	});
	this.section('Invitation', function() {
		this.add('Invitation_Customized', false, {
			type: 'boolean',
			i18nLabel: 'Custom'
		});
		this.add('Invitation_Subject', '', {
			type: 'string',
			i18nLabel: 'Subject',
			enableQuery: {
				_id: 'Invitation_Customized',
				value: true
			},
			i18nDefaultQuery: {
				_id: 'Invitation_Customized',
				value: false
			}
		});
		return this.add('Invitation_HTML', '', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Body',
			i18nDescription: 'Invitation_HTML_Description',
			enableQuery: {
				_id: 'Invitation_Customized',
				value: true
			},
			i18nDefaultQuery: {
				_id: 'Invitation_Customized',
				value: false
			}
		});
	});
	this.section('Registration', function() {
		this.add('Accounts_Enrollment_Customized', false, {
			type: 'boolean',
			i18nLabel: 'Custom'
		});
		this.add('Accounts_Enrollment_Email_Subject', '', {
			type: 'string',
			i18nLabel: 'Subject',
			enableQuery: {
				_id: 'Accounts_Enrollment_Customized',
				value: true
			},
			i18nDefaultQuery: {
				_id: 'Accounts_Enrollment_Customized',
				value: false
			}
		});
		return this.add('Accounts_Enrollment_Email', '', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Body',
			enableQuery: {
				_id: 'Accounts_Enrollment_Customized',
				value: true
			},
			i18nDefaultQuery: {
				_id: 'Accounts_Enrollment_Customized',
				value: false
			}
		});
	});
	this.section('Registration_via_Admin', function() {
		this.add('Accounts_UserAddedEmail_Customized', false, {
			type: 'boolean',
			i18nLabel: 'Custom'
		});
		this.add('Accounts_UserAddedEmailSubject', '', {
			type: 'string',
			i18nLabel: 'Subject',
			enableQuery: {
				_id: 'Accounts_UserAddedEmail_Customized',
				value: true
			},
			i18nDefaultQuery: {
				_id: 'Accounts_UserAddedEmail_Customized',
				value: false
			}
		});
		return this.add('Accounts_UserAddedEmail', '', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Body',
			i18nDescription: 'Accounts_UserAddedEmail_Description',
			enableQuery: {
				_id: 'Accounts_UserAddedEmail_Customized',
				value: true
			},
			i18nDefaultQuery: {
				_id: 'Accounts_UserAddedEmail_Customized',
				value: false
			}
		});
	});
	this.section('Forgot_password_section', function() {
		this.add('Forgot_Password_Customized', false, {
			type: 'boolean',
			i18nLabel: 'Custom'
		});
		this.add('Forgot_Password_Email_Subject', '', {
			type: 'string',
			i18nLabel: 'Subject',
			enableQuery: {
				_id: 'Forgot_Password_Customized',
				value: true
			},
			i18nDefaultQuery: {
				_id: 'Forgot_Password_Customized',
				value: false
			}
		});
		return this.add('Forgot_Password_Email', '', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Body',
			i18nDescription: 'Forgot_Password_Description',
			enableQuery: {
				_id: 'Forgot_Password_Customized',
				value: true
			},
			i18nDefaultQuery: {
				_id: 'Forgot_Password_Customized',
				value: false
			}
		});
	});
	return this.section('Verification', function() {
		this.add('Verification_Customized', false, {
			type: 'boolean',
			i18nLabel: 'Custom'
		});
		this.add('Verification_Email_Subject', '', {
			type: 'string',
			i18nLabel: 'Subject',
			enableQuery: {
				_id: 'Verification_Customized',
				value: true
			},
			i18nDefaultQuery: {
				_id: 'Verification_Customized',
				value: false
			}
		});
		return this.add('Verification_Email', '', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Body',
			i18nDescription: 'Verification_Description',
			enableQuery: {
				_id: 'Verification_Customized',
				value: true
			},
			i18nDefaultQuery: {
				_id: 'Verification_Customized',
				value: false
			}
		});
	});
});

RocketChat.settings.addGroup('Message', function() {
	this.section('Message_Attachments', function() {
		this.add('Message_Attachments_GroupAttach', false, {
			type: 'boolean',
			'public': true,
			i18nDescription: 'Message_Attachments_GroupAttachDescription'
		});
	});
	this.section('Message_Audio', function() {
		this.add('Message_AudioRecorderEnabled', true, {
			type: 'boolean',
			'public': true,
			i18nDescription: 'Message_AudioRecorderEnabledDescription'
		});
		this.add('Message_Audio_bitRate', 32, {
			type: 'int',
			'public': true
		});
	});
	this.add('Message_AllowEditing', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_AllowEditing_BlockEditInMinutes', 0, {
		type: 'int',
		'public': true,
		i18nDescription: 'Message_AllowEditing_BlockEditInMinutesDescription'
	});
	this.add('Message_AllowDeleting', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_AllowDeleting_BlockDeleteInMinutes', 0, {
		type: 'int',
		'public': true,
		i18nDescription: 'Message_AllowDeleting_BlockDeleteInMinutes'
	});
	this.add('Message_AllowUnrecognizedSlashCommand', false, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_AllowDirectMessagesToYourself', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_AlwaysSearchRegExp', false, {
		type: 'boolean'
	});
	this.add('Message_ShowEditedStatus', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_ShowDeletedStatus', false, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_AllowBadWordsFilter', false, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_BadWordsFilterList', '', {
		type: 'string',
		'public': true
	});
	this.add('Message_KeepHistory', false, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_MaxAll', 0, {
		type: 'int',
		'public': true
	});
	this.add('Message_MaxAllowedSize', 5000, {
		type: 'int',
		'public': true
	});
	this.add('Message_ShowFormattingTips', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_SetNameToAliasEnabled', false, {
		type: 'boolean',
		'public': false,
		i18nDescription: 'Message_SetNameToAliasEnabled_Description'
	});
	this.add('Message_GroupingPeriod', 300, {
		type: 'int',
		'public': true,
		i18nDescription: 'Message_GroupingPeriodDescription'
	});
	this.add('API_Embed', true, {
		type: 'boolean',
		'public': true
	});
	this.add('API_Embed_UserAgent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36', {
		type: 'string',
		'public': true
	});
	this.add('API_EmbedCacheExpirationDays', 30, {
		type: 'int',
		'public': false
	});
	this.add('API_Embed_clear_cache_now', 'OEmbedCacheCleanup', {
		type: 'action',
		actionText: 'clear',
		i18nLabel: 'clear_cache_now'
	});
	this.add('API_EmbedDisabledFor', '', {
		type: 'string',
		'public': true,
		i18nDescription: 'API_EmbedDisabledFor_Description'
	});
	this.add('API_EmbedIgnoredHosts', 'localhost, 127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16', {
		type: 'string',
		i18nDescription: 'API_EmbedIgnoredHosts_Description'
	});
	this.add('API_EmbedSafePorts', '80, 443', {
		type: 'string'
	});
	this.add('Message_TimeFormat', 'LT', {
		type: 'string',
		'public': true,
		i18nDescription: 'Message_TimeFormat_Description'
	});
	this.add('Message_DateFormat', 'LL', {
		type: 'string',
		'public': true,
		i18nDescription: 'Message_DateFormat_Description'
	});
	this.add('Message_TimeAndDateFormat', 'LLL', {
		type: 'string',
		'public': true,
		i18nDescription: 'Message_TimeAndDateFormat_Description'
	});
	this.add('Message_QuoteChainLimit', 2, {
		type: 'int',
		'public': true
	});
	this.add('Message_HideType_uj', false, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_HideType_ul', false, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_HideType_ru', false, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_HideType_au', false, {
		type: 'boolean',
		'public': true
	});

	this.add('Message_HideType_mute_unmute', false, {
		type: 'boolean',
		'public': true
	});

	this.add('Message_ErasureType', 'Delete', {
		type: 'select',
		'public': true,
		values: [
			{
				key: 'Keep',
				i18nLabel: 'Message_ErasureType_Keep'
			}, {
				key: 'Delete',
				i18nLabel: 'Message_ErasureType_Delete'
			}, {
				key: 'Unlink',
				i18nLabel: 'Message_ErasureType_Unlink'
			}
		]
	});
});

RocketChat.settings.addGroup('Meta', function() {
	this.add('Meta_language', '', {
		type: 'string'
	});
	this.add('Meta_fb_app_id', '', {
		type: 'string'
	});
	this.add('Meta_robots', 'INDEX,FOLLOW', {
		type: 'string'
	});
	this.add('Meta_google-site-verification', '', {
		type: 'string'
	});
	this.add('Meta_msvalidate01', '', {
		type: 'string'
	});
	return this.add('Meta_custom', '', {
		type: 'code',
		code: 'text/html',
		multiline: true
	});
});

RocketChat.settings.addGroup('Push', function() {
	this.add('Push_enable', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Push_debug', false, {
		type: 'boolean',
		'public': true,
		enableQuery: {
			_id: 'Push_enable',
			value: true
		}
	});
	this.add('Push_enable_gateway', true, {
		type: 'boolean',
		enableQuery: {
			_id: 'Push_enable',
			value: true
		}
	});
	this.add('Push_gateway', 'https://gateway.rocket.chat', {
		type: 'string',
		enableQuery: [
			{
				_id: 'Push_enable',
				value: true
			}, {
				_id: 'Push_enable_gateway',
				value: true
			}
		]
	});
	this.add('Push_production', true, {
		type: 'boolean',
		'public': true,
		enableQuery: [
			{
				_id: 'Push_enable',
				value: true
			}, {
				_id: 'Push_enable_gateway',
				value: false
			}
		]
	});
	this.add('Push_test_push', 'push_test', {
		type: 'action',
		actionText: 'Send_a_test_push_to_my_user',
		enableQuery: {
			_id: 'Push_enable',
			value: true
		}
	});
	this.section('Certificates_and_Keys', function() {
		this.add('Push_apn_passphrase', '', {
			type: 'string'
		});
		this.add('Push_apn_key', '', {
			type: 'string',
			multiline: true
		});
		this.add('Push_apn_cert', '', {
			type: 'string',
			multiline: true
		});
		this.add('Push_apn_dev_passphrase', '', {
			type: 'string'
		});
		this.add('Push_apn_dev_key', '', {
			type: 'string',
			multiline: true
		});
		this.add('Push_apn_dev_cert', '', {
			type: 'string',
			multiline: true
		});
		this.add('Push_gcm_api_key', '', {
			type: 'string'
		});
		return this.add('Push_gcm_project_number', '', {
			type: 'string',
			'public': true
		});
	});
	return this.section('Privacy', function() {
		this.add('Push_show_username_room', true, {
			type: 'boolean',
			'public': true
		});
		return this.add('Push_show_message', true, {
			type: 'boolean',
			'public': true
		});
	});
});

RocketChat.settings.addGroup('Layout', function() {
	this.section('Content', function() {
		this.add('Layout_Home_Title', 'Home', {
			type: 'string',
			'public': true
		});
		this.add('Layout_Home_Body', '<p>Welcome to Rocket.Chat!</p>\n<p>The Rocket.Chat desktops apps for Windows, macOS and Linux are available to download <a title="Rocket.Chat desktop apps" href="https://rocket.chat/download" target="_blank" rel="noopener">here</a>.</p><p>The native mobile app, Rocket.Chat+,\n  for Android and iOS is available from <a title="Rocket.Chat+ on Google Play" href="https://play.google.com/store/apps/details?id=chat.rocket.android" target="_blank" rel="noopener">Google Play</a> and the <a title="Rocket.Chat+ on the App Store" href="https://itunes.apple.com/app/rocket-chat/id1148741252" target="_blank" rel="noopener">App Store</a>.</p>\n<p>For further help, please consult the <a title="Rocket.Chat Documentation" href="https://rocket.chat/docs/" target="_blank" rel="noopener">documentation</a>.</p>\n<p>If you\'re an admin, feel free to change this content via <strong>Administration</strong> -> <strong>Layout</strong> -> <strong>Home Body</strong>. Or clicking <a title="Home Body Layout" href="/admin/Layout">here</a>.</p>', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			'public': true
		});
		this.add('Layout_Terms_of_Service', 'Terms of Service <br> Go to APP SETTINGS -> Layout to customize this page.', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			'public': true
		});
		this.add('Layout_Login_Terms', 'By proceeding you are agreeing to our <a href="terms-of-service">Terms of Service</a> and <a href="privacy-policy">Privacy Policy</a>.', {
			type: 'string',
			multiline: true,
			'public': true
		});
		this.add('Layout_Privacy_Policy', 'Privacy Policy <br> Go to APP SETTINGS -> Layout to customize this page.', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			'public': true
		});
		return this.add('Layout_Sidenav_Footer', '<a href="/home"><img src="assets/logo"/></a>', {
			type: 'code',
			code: 'text/html',
			'public': true,
			i18nDescription: 'Layout_Sidenav_Footer_description'
		});
	});
	this.section('Custom_Scripts', function() {
		this.add('Custom_Script_Logged_Out', '//Add your script', {
			type: 'code',
			multiline: true,
			'public': true
		});
		return this.add('Custom_Script_Logged_In', '//Add your script', {
			type: 'code',
			multiline: true,
			'public': true
		});
	});
	return this.section('User_Interface', function() {
		this.add('UI_DisplayRoles', true, {
			type: 'boolean',
			'public': true
		});
		this.add('UI_Group_Channels_By_Type', true, {
			type: 'boolean',
			'public': false
		});
		this.add('UI_Use_Name_Avatar', false, {
			type: 'boolean',
			'public': true
		});
		this.add('UI_Use_Real_Name', false, {
			type: 'boolean',
			'public': true
		});
		this.add('UI_Click_Direct_Message', false, {
			type: 'boolean',
			'public': true
		});
		this.add('UI_Unread_Counter_Style', 'Different_Style_For_User_Mentions', {
			type: 'select',
			values: [
				{
					key: 'Same_Style_For_Mentions',
					i18nLabel: 'Same_Style_For_Mentions'
				}, {
					key: 'Different_Style_For_User_Mentions',
					i18nLabel: 'Different_Style_For_User_Mentions'
				}
			],
			'public': true
		});
		this.add('UI_Allow_room_names_with_special_chars', false, {
			type: 'boolean',
			public: true
		});
	});
});

RocketChat.settings.addGroup('Logs', function() {
	this.add('Log_Level', '0', {
		type: 'select',
		values: [
			{
				key: '0',
				i18nLabel: '0_Errors_Only'
			}, {
				key: '1',
				i18nLabel: '1_Errors_and_Information'
			}, {
				key: '2',
				i18nLabel: '2_Erros_Information_and_Debug'
			}
		],
		'public': true
	});
	this.add('Log_Package', false, {
		type: 'boolean',
		'public': true
	});
	this.add('Log_File', false, {
		type: 'boolean',
		'public': true
	});
	this.add('Log_View_Limit', 1000, {
		type: 'int'
	});

	this.add('Log_Trace_Methods', false, {
		type: 'boolean'
	});

	this.add('Log_Trace_Methods_Filter', '', {
		type: 'string',
		enableQuery: {
			_id: 'Log_Trace_Methods',
			value: true
		}
	});

	this.add('Log_Trace_Subscriptions', false, {
		type: 'boolean'
	});

	this.add('Log_Trace_Subscriptions_Filter', '', {
		type: 'string',
		enableQuery: {
			_id: 'Log_Trace_Subscriptions',
			value: true
		}
	});

	this.section('Prometheus', function() {
		this.add('Prometheus_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled'
		});
		this.add('Prometheus_Port', 9100, {
			type: 'string',
			i18nLabel: 'Port'
		});
	});
});

RocketChat.settings.addGroup('Setup_Wizard', function() {
	this.section('Organization_Info', function() {
		this.add('Organization_Type', '', {
			type: 'select',
			values: [
				{
					key: 'nonprofit',
					i18nLabel: 'Nonprofit'
				},
				{
					key: 'enterprise',
					i18nLabel: 'Enterprise'
				},
				{
					key: 'government',
					i18nLabel: 'Government'
				},
				{
					key: 'community',
					i18nLabel: 'Community'
				}
			],
			wizard: {
				step: 2,
				order: 0
			}
		});
		this.add('Organization_Name', '', {
			type: 'string',
			wizard: {
				step: 2,
				order: 1
			}
		});
		this.add('Industry', '', {
			type: 'select',
			values: [
				{
					key: 'advocacy',
					i18nLabel: 'Advocacy'
				},
				{
					key: 'blockchain',
					i18nLabel: 'Blockchain'
				},
				{
					key: 'helpCenter',
					i18nLabel: 'Help_Center'
				},
				{
					key: 'manufacturing',
					i18nLabel: 'Manufacturing'
				},
				{
					key: 'education',
					i18nLabel: 'Education'
				},
				{
					key: 'insurance',
					i18nLabel: 'Insurance'
				},
				{
					key: 'logistics',
					i18nLabel: 'Logistics'
				},
				{
					key: 'consulting',
					i18nLabel: 'Consulting'
				},
				{
					key: 'entertainment',
					i18nLabel: 'Entertainment'
				},
				{
					key: 'publicRelations',
					i18nLabel: 'Public_Relations'
				},
				{
					key: 'religious',
					i18nLabel: 'Religious'
				},
				{
					key: 'gaming',
					i18nLabel: 'Gaming'
				},
				{
					key: 'socialNetwork',
					i18nLabel: 'Social_Network'
				},
				{
					key: 'realEstate',
					i18nLabel: 'Real_Estate'
				},
				{
					key: 'tourism',
					i18nLabel: 'Tourism'
				},
				{
					key: 'telecom',
					i18nLabel: 'Telecom'
				},
				{
					key: 'consumerGoods',
					i18nLabel: 'Consumer_Goods'
				},
				{
					key: 'financialServices',
					i18nLabel: 'Financial_Services'
				},
				{
					key: 'healthcarePharmaceutical',
					i18nLabel: 'Healthcare_and_Pharmaceutical'
				},
				{
					key: 'industry',
					i18nLabel: 'Industry'
				},
				{
					key: 'media',
					i18nLabel: 'Media'
				},
				{
					key: 'retail',
					i18nLabel: 'Retail'
				},
				{
					key: 'technologyServices',
					i18nLabel: 'Technology_Services'
				},
				{
					key: 'technologyProvider',
					i18nLabel: 'Technology_Provider'
				},
				{
					key: 'other',
					i18nLabel: 'Other'
				}
			],
			wizard: {
				step: 2,
				order: 2
			}
		});
		this.add('Size', '', {
			type: 'select',
			values: [
				{
					key: '0',
					i18nLabel: '1-10 people'
				},
				{
					key: '1',
					i18nLabel: '11-50 people'
				},
				{
					key: '2',
					i18nLabel: '51-100 people'
				},
				{
					key: '3',
					i18nLabel: '101-250 people'
				},
				{
					key: '4',
					i18nLabel: '251-500 people'
				},
				{
					key: '5',
					i18nLabel: '501-1000 people'
				},
				{
					key: '6',
					i18nLabel: '1001-4000 people'
				},
				{
					key: '7',
					i18nLabel: '4000 or more people'
				}
			],
			wizard: {
				step: 2,
				order: 3
			}
		});
		this.add('Country', '', {
			type: 'select',
			values: [
				{
					key: 'worldwide',
					i18nLabel: 'Worldwide'
				},
				{
					key: 'afghanistan',
					i18nLabel: 'Country_Afghanistan'
				},
				{
					key: 'albania',
					i18nLabel: 'Country_Albania'
				},
				{
					key: 'algeria',
					i18nLabel: 'Country_Algeria'
				},
				{
					key: 'americanSamoa',
					i18nLabel: 'Country_American_Samoa'
				},
				{
					key: 'andorra',
					i18nLabel: 'Country_Andorra'
				},
				{
					key: 'angola',
					i18nLabel: 'Country_Angola'
				},
				{
					key: 'anguilla',
					i18nLabel: 'Country_Anguilla'
				},
				{
					key: 'antarctica',
					i18nLabel: 'Country_Antarctica'
				},
				{
					key: 'antiguaAndBarbuda',
					i18nLabel: 'Country_Antigua_and_Barbuda'
				},
				{
					key: 'argentina',
					i18nLabel: 'Country_Argentina'
				},
				{
					key: 'armenia',
					i18nLabel: 'Country_Armenia'
				},
				{
					key: 'aruba',
					i18nLabel: 'Country_Aruba'
				},
				{
					key: 'australia',
					i18nLabel: 'Country_Australia'
				},
				{
					key: 'austria',
					i18nLabel: 'Country_Austria'
				},
				{
					key: 'azerbaijan',
					i18nLabel: 'Country_Azerbaijan'
				},
				{
					key: 'bahamas',
					i18nLabel: 'Country_Bahamas'
				},
				{
					key: 'bahrain',
					i18nLabel: 'Country_Bahrain'
				},
				{
					key: 'bangladesh',
					i18nLabel: 'Country_Bangladesh'
				},
				{
					key: 'barbados',
					i18nLabel: 'Country_Barbados'
				},
				{
					key: 'belarus',
					i18nLabel: 'Country_Belarus'
				},
				{
					key: 'belgium',
					i18nLabel: 'Country_Belgium'
				},
				{
					key: 'belize',
					i18nLabel: 'Country_Belize'
				},
				{
					key: 'benin',
					i18nLabel: 'Country_Benin'
				},
				{
					key: 'bermuda',
					i18nLabel: 'Country_Bermuda'
				},
				{
					key: 'bhutan',
					i18nLabel: 'Country_Bhutan'
				},
				{
					key: 'bolivia',
					i18nLabel: 'Country_Bolivia'
				},
				{
					key: 'bosniaAndHerzegovina',
					i18nLabel: 'Country_Bosnia_and_Herzegovina'
				},
				{
					key: 'botswana',
					i18nLabel: 'Country_Botswana'
				},
				{
					key: 'bouvetIsland',
					i18nLabel: 'Country_Bouvet_Island'
				},
				{
					key: 'brazil',
					i18nLabel: 'Country_Brazil'
				},
				{
					key: 'britishIndianOceanTerritory',
					i18nLabel: 'Country_British_Indian_Ocean_Territory'
				},
				{
					key: 'bruneiDarussalam',
					i18nLabel: 'Country_Brunei_Darussalam'
				},
				{
					key: 'bulgaria',
					i18nLabel: 'Country_Bulgaria'
				},
				{
					key: 'burkinaFaso',
					i18nLabel: 'Country_Burkina_Faso'
				},
				{
					key: 'burundi',
					i18nLabel: 'Country_Burundi'
				},
				{
					key: 'cambodia',
					i18nLabel: 'Country_Cambodia'
				},
				{
					key: 'cameroon',
					i18nLabel: 'Country_Cameroon'
				},
				{
					key: 'canada',
					i18nLabel: 'Country_Canada'
				},
				{
					key: 'capeVerde',
					i18nLabel: 'Country_Cape_Verde'
				},
				{
					key: 'caymanIslands',
					i18nLabel: 'Country_Cayman_Islands'
				},
				{
					key: 'centralAfricanRepublic',
					i18nLabel: 'Country_Central_African_Republic'
				},
				{
					key: 'chad',
					i18nLabel: 'Country_Chad'
				},
				{
					key: 'chile',
					i18nLabel: 'Country_Chile'
				},
				{
					key: 'china',
					i18nLabel: 'Country_China'
				},
				{
					key: 'christmasIsland',
					i18nLabel: 'Country_Christmas_Island'
				},
				{
					key: 'cocosKeelingIslands',
					i18nLabel: 'Country_Cocos_Keeling_Islands'
				},
				{
					key: 'colombia',
					i18nLabel: 'Country_Colombia'
				},
				{
					key: 'comoros',
					i18nLabel: 'Country_Comoros'
				},
				{
					key: 'congo',
					i18nLabel: 'Country_Congo'
				},
				{
					key: 'congoTheDemocraticRepublicOfThe',
					i18nLabel: 'Country_Congo_The_Democratic_Republic_of_The'
				},
				{
					key: 'cookIslands',
					i18nLabel: 'Country_Cook_Islands'
				},
				{
					key: 'costaRica',
					i18nLabel: 'Country_Costa_Rica'
				},
				{
					key: 'coteDivoire',
					i18nLabel: 'Country_Cote_Divoire'
				},
				{
					key: 'croatia',
					i18nLabel: 'Country_Croatia'
				},
				{
					key: 'cuba',
					i18nLabel: 'Country_Cuba'
				},
				{
					key: 'cyprus',
					i18nLabel: 'Country_Cyprus'
				},
				{
					key: 'czechRepublic',
					i18nLabel: 'Country_Czech_Republic'
				},
				{
					key: 'denmark',
					i18nLabel: 'Country_Denmark'
				},
				{
					key: 'djibouti',
					i18nLabel: 'Country_Djibouti'
				},
				{
					key: 'dominica',
					i18nLabel: 'Country_Dominica'
				},
				{
					key: 'dominicanRepublic',
					i18nLabel: 'Country_Dominican_Republic'
				},
				{
					key: 'ecuador',
					i18nLabel: 'Country_Ecuador'
				},
				{
					key: 'egypt',
					i18nLabel: 'Country_Egypt'
				},
				{
					key: 'elSalvador',
					i18nLabel: 'Country_El_Salvador'
				},
				{
					key: 'equatorialGuinea',
					i18nLabel: 'Country_Equatorial_Guinea'
				},
				{
					key: 'eritrea',
					i18nLabel: 'Country_Eritrea'
				},
				{
					key: 'estonia',
					i18nLabel: 'Country_Estonia'
				},
				{
					key: 'ethiopia',
					i18nLabel: 'Country_Ethiopia'
				},
				{
					key: 'falklandIslandsMalvinas',
					i18nLabel: 'Country_Falkland_Islands_Malvinas'
				},
				{
					key: 'faroeIslands',
					i18nLabel: 'Country_Faroe_Islands'
				},
				{
					key: 'fiji',
					i18nLabel: 'Country_Fiji'
				},
				{
					key: 'finland',
					i18nLabel: 'Country_Finland'
				},
				{
					key: 'france',
					i18nLabel: 'Country_France'
				},
				{
					key: 'frenchGuiana',
					i18nLabel: 'Country_French_Guiana'
				},
				{
					key: 'frenchPolynesia',
					i18nLabel: 'Country_French_Polynesia'
				},
				{
					key: 'frenchSouthernTerritories',
					i18nLabel: 'Country_French_Southern_Territories'
				},
				{
					key: 'gabon',
					i18nLabel: 'Country_Gabon'
				},
				{
					key: 'gambia',
					i18nLabel: 'Country_Gambia'
				},
				{
					key: 'georgia',
					i18nLabel: 'Country_Georgia'
				},
				{
					key: 'germany',
					i18nLabel: 'Country_Germany'
				},
				{
					key: 'ghana',
					i18nLabel: 'Country_Ghana'
				},
				{
					key: 'gibraltar',
					i18nLabel: 'Country_Gibraltar'
				},
				{
					key: 'greece',
					i18nLabel: 'Country_Greece'
				},
				{
					key: 'greenland',
					i18nLabel: 'Country_Greenland'
				},
				{
					key: 'grenada',
					i18nLabel: 'Country_Grenada'
				},
				{
					key: 'guadeloupe',
					i18nLabel: 'Country_Guadeloupe'
				},
				{
					key: 'guam',
					i18nLabel: 'Country_Guam'
				},
				{
					key: 'guatemala',
					i18nLabel: 'Country_Guatemala'
				},
				{
					key: 'guinea',
					i18nLabel: 'Country_Guinea'
				},
				{
					key: 'guineaBissau',
					i18nLabel: 'Country_Guinea_bissau'
				},
				{
					key: 'guyana',
					i18nLabel: 'Country_Guyana'
				},
				{
					key: 'haiti',
					i18nLabel: 'Country_Haiti'
				},
				{
					key: 'heardIslandAndMcdonaldIslands',
					i18nLabel: 'Country_Heard_Island_and_Mcdonald_Islands'
				},
				{
					key: 'holySeeVaticanCityState',
					i18nLabel: 'Country_Holy_See_Vatican_City_State'
				},
				{
					key: 'honduras',
					i18nLabel: 'Country_Honduras'
				},
				{
					key: 'hongKong',
					i18nLabel: 'Country_Hong_Kong'
				},
				{
					key: 'hungary',
					i18nLabel: 'Country_Hungary'
				},
				{
					key: 'iceland',
					i18nLabel: 'Country_Iceland'
				},
				{
					key: 'india',
					i18nLabel: 'Country_India'
				},
				{
					key: 'indonesia',
					i18nLabel: 'Country_Indonesia'
				},
				{
					key: 'iranIslamicRepublicOf',
					i18nLabel: 'Country_Iran_Islamic_Republic_of'
				},
				{
					key: 'iraq',
					i18nLabel: 'Country_Iraq'
				},
				{
					key: 'ireland',
					i18nLabel: 'Country_Ireland'
				},
				{
					key: 'israel',
					i18nLabel: 'Country_Israel'
				},
				{
					key: 'italy',
					i18nLabel: 'Country_Italy'
				},
				{
					key: 'jamaica',
					i18nLabel: 'Country_Jamaica'
				},
				{
					key: 'japan',
					i18nLabel: 'Country_Japan'
				},
				{
					key: 'jordan',
					i18nLabel: 'Country_Jordan'
				},
				{
					key: 'kazakhstan',
					i18nLabel: 'Country_Kazakhstan'
				},
				{
					key: 'kenya',
					i18nLabel: 'Country_Kenya'
				},
				{
					key: 'kiribati',
					i18nLabel: 'Country_Kiribati'
				},
				{
					key: 'koreaDemocraticPeoplesRepublicOf',
					i18nLabel: 'Country_Korea_Democratic_Peoples_Republic_of'
				},
				{
					key: 'koreaRepublicOf',
					i18nLabel: 'Country_Korea_Republic_of'
				},
				{
					key: 'kuwait',
					i18nLabel: 'Country_Kuwait'
				},
				{
					key: 'kyrgyzstan',
					i18nLabel: 'Country_Kyrgyzstan'
				},
				{
					key: 'laoPeoplesDemocraticRepublic',
					i18nLabel: 'Country_Lao_Peoples_Democratic_Republic'
				},
				{
					key: 'latvia',
					i18nLabel: 'Country_Latvia'
				},
				{
					key: 'lebanon',
					i18nLabel: 'Country_Lebanon'
				},
				{
					key: 'lesotho',
					i18nLabel: 'Country_Lesotho'
				},
				{
					key: 'liberia',
					i18nLabel: 'Country_Liberia'
				},
				{
					key: 'libyanArabJamahiriya',
					i18nLabel: 'Country_Libyan_Arab_Jamahiriya'
				},
				{
					key: 'liechtenstein',
					i18nLabel: 'Country_Liechtenstein'
				},
				{
					key: 'lithuania',
					i18nLabel: 'Country_Lithuania'
				},
				{
					key: 'luxembourg',
					i18nLabel: 'Country_Luxembourg'
				},
				{
					key: 'macao',
					i18nLabel: 'Country_Macao'
				},
				{
					key: 'macedoniaTheFormerYugoslavRepublicOf',
					i18nLabel: 'Country_Macedonia_The_Former_Yugoslav_Republic_of'
				},
				{
					key: 'madagascar',
					i18nLabel: 'Country_Madagascar'
				},
				{
					key: 'malawi',
					i18nLabel: 'Country_Malawi'
				},
				{
					key: 'malaysia',
					i18nLabel: 'Country_Malaysia'
				},
				{
					key: 'maldives',
					i18nLabel: 'Country_Maldives'
				},
				{
					key: 'mali',
					i18nLabel: 'Country_Mali'
				},
				{
					key: 'malta',
					i18nLabel: 'Country_Malta'
				},
				{
					key: 'marshallIslands',
					i18nLabel: 'Country_Marshall_Islands'
				},
				{
					key: 'martinique',
					i18nLabel: 'Country_Martinique'
				},
				{
					key: 'mauritania',
					i18nLabel: 'Country_Mauritania'
				},
				{
					key: 'mauritius',
					i18nLabel: 'Country_Mauritius'
				},
				{
					key: 'mayotte',
					i18nLabel: 'Country_Mayotte'
				},
				{
					key: 'mexico',
					i18nLabel: 'Country_Mexico'
				},
				{
					key: 'micronesiaFederatedStatesOf',
					i18nLabel: 'Country_Micronesia_Federated_States_of'
				},
				{
					key: 'moldovaRepublicOf',
					i18nLabel: 'Country_Moldova_Republic_of'
				},
				{
					key: 'monaco',
					i18nLabel: 'Country_Monaco'
				},
				{
					key: 'mongolia',
					i18nLabel: 'Country_Mongolia'
				},
				{
					key: 'montserrat',
					i18nLabel: 'Country_Montserrat'
				},
				{
					key: 'morocco',
					i18nLabel: 'Country_Morocco'
				},
				{
					key: 'mozambique',
					i18nLabel: 'Country_Mozambique'
				},
				{
					key: 'myanmar',
					i18nLabel: 'Country_Myanmar'
				},
				{
					key: 'namibia',
					i18nLabel: 'Country_Namibia'
				},
				{
					key: 'nauru',
					i18nLabel: 'Country_Nauru'
				},
				{
					key: 'nepal',
					i18nLabel: 'Country_Nepal'
				},
				{
					key: 'netherlands',
					i18nLabel: 'Country_Netherlands'
				},
				{
					key: 'netherlandsAntilles',
					i18nLabel: 'Country_Netherlands_Antilles'
				},
				{
					key: 'newCaledonia',
					i18nLabel: 'Country_New_Caledonia'
				},
				{
					key: 'newZealand',
					i18nLabel: 'Country_New_Zealand'
				},
				{
					key: 'nicaragua',
					i18nLabel: 'Country_Nicaragua'
				},
				{
					key: 'niger',
					i18nLabel: 'Country_Niger'
				},
				{
					key: 'nigeria',
					i18nLabel: 'Country_Nigeria'
				},
				{
					key: 'niue',
					i18nLabel: 'Country_Niue'
				},
				{
					key: 'norfolkIsland',
					i18nLabel: 'Country_Norfolk_Island'
				},
				{
					key: 'northernMarianaIslands',
					i18nLabel: 'Country_Northern_Mariana_Islands'
				},
				{
					key: 'norway',
					i18nLabel: 'Country_Norway'
				},
				{
					key: 'oman',
					i18nLabel: 'Country_Oman'
				},
				{
					key: 'pakistan',
					i18nLabel: 'Country_Pakistan'
				},
				{
					key: 'palau',
					i18nLabel: 'Country_Palau'
				},
				{
					key: 'palestinianTerritoryOccupied',
					i18nLabel: 'Country_Palestinian_Territory_Occupied'
				},
				{
					key: 'panama',
					i18nLabel: 'Country_Panama'
				},
				{
					key: 'papuaNewGuinea',
					i18nLabel: 'Country_Papua_New_Guinea'
				},
				{
					key: 'paraguay',
					i18nLabel: 'Country_Paraguay'
				},
				{
					key: 'peru',
					i18nLabel: 'Country_Peru'
				},
				{
					key: 'philippines',
					i18nLabel: 'Country_Philippines'
				},
				{
					key: 'pitcairn',
					i18nLabel: 'Country_Pitcairn'
				},
				{
					key: 'poland',
					i18nLabel: 'Country_Poland'
				},
				{
					key: 'portugal',
					i18nLabel: 'Country_Portugal'
				},
				{
					key: 'puertoRico',
					i18nLabel: 'Country_Puerto_Rico'
				},
				{
					key: 'qatar',
					i18nLabel: 'Country_Qatar'
				},
				{
					key: 'reunion',
					i18nLabel: 'Country_Reunion'
				},
				{
					key: 'romania',
					i18nLabel: 'Country_Romania'
				},
				{
					key: 'russianFederation',
					i18nLabel: 'Country_Russian_Federation'
				},
				{
					key: 'rwanda',
					i18nLabel: 'Country_Rwanda'
				},
				{
					key: 'saintHelena',
					i18nLabel: 'Country_Saint_Helena'
				},
				{
					key: 'saintKittsAndNevis',
					i18nLabel: 'Country_Saint_Kitts_and_Nevis'
				},
				{
					key: 'saintLucia',
					i18nLabel: 'Country_Saint_Lucia'
				},
				{
					key: 'saintPierreAndMiquelon',
					i18nLabel: 'Country_Saint_Pierre_and_Miquelon'
				},
				{
					key: 'saintVincentAndTheGrenadines',
					i18nLabel: 'Country_Saint_Vincent_and_The_Grenadines'
				},
				{
					key: 'samoa',
					i18nLabel: 'Country_Samoa'
				},
				{
					key: 'sanMarino',
					i18nLabel: 'Country_San_Marino'
				},
				{
					key: 'saoTomeAndPrincipe',
					i18nLabel: 'Country_Sao_Tome_and_Principe'
				},
				{
					key: 'saudiArabia',
					i18nLabel: 'Country_Saudi_Arabia'
				},
				{
					key: 'senegal',
					i18nLabel: 'Country_Senegal'
				},
				{
					key: 'serbiaAndMontenegro',
					i18nLabel: 'Country_Serbia_and_Montenegro'
				},
				{
					key: 'seychelles',
					i18nLabel: 'Country_Seychelles'
				},
				{
					key: 'sierraLeone',
					i18nLabel: 'Country_Sierra_Leone'
				},
				{
					key: 'singapore',
					i18nLabel: 'Country_Singapore'
				},
				{
					key: 'slovakia',
					i18nLabel: 'Country_Slovakia'
				},
				{
					key: 'slovenia',
					i18nLabel: 'Country_Slovenia'
				},
				{
					key: 'solomonIslands',
					i18nLabel: 'Country_Solomon_Islands'
				},
				{
					key: 'somalia',
					i18nLabel: 'Country_Somalia'
				},
				{
					key: 'southAfrica',
					i18nLabel: 'Country_South_Africa'
				},
				{
					key: 'southGeorgiaAndTheSouthSandwichIslands',
					i18nLabel: 'Country_South_Georgia_and_The_South_Sandwich_Islands'
				},
				{
					key: 'spain',
					i18nLabel: 'Country_Spain'
				},
				{
					key: 'sriLanka',
					i18nLabel: 'Country_Sri_Lanka'
				},
				{
					key: 'sudan',
					i18nLabel: 'Country_Sudan'
				},
				{
					key: 'suriname',
					i18nLabel: 'Country_Suriname'
				},
				{
					key: 'svalbardAndJanMayen',
					i18nLabel: 'Country_Svalbard_and_Jan_Mayen'
				},
				{
					key: 'swaziland',
					i18nLabel: 'Country_Swaziland'
				},
				{
					key: 'sweden',
					i18nLabel: 'Country_Sweden'
				},
				{
					key: 'switzerland',
					i18nLabel: 'Country_Switzerland'
				},
				{
					key: 'syrianArabRepublic',
					i18nLabel: 'Country_Syrian_Arab_Republic'
				},
				{
					key: 'taiwanProvinceOfChina',
					i18nLabel: 'Country_Taiwan_Province_of_China'
				},
				{
					key: 'tajikistan',
					i18nLabel: 'Country_Tajikistan'
				},
				{
					key: 'tanzaniaUnitedRepublicOf',
					i18nLabel: 'Country_Tanzania_United_Republic_of'
				},
				{
					key: 'thailand',
					i18nLabel: 'Country_Thailand'
				},
				{
					key: 'timorLeste',
					i18nLabel: 'Country_Timor_leste'
				},
				{
					key: 'togo',
					i18nLabel: 'Country_Togo'
				},
				{
					key: 'tokelau',
					i18nLabel: 'Country_Tokelau'
				},
				{
					key: 'tonga',
					i18nLabel: 'Country_Tonga'
				},
				{
					key: 'trinidadAndTobago',
					i18nLabel: 'Country_Trinidad_and_Tobago'
				},
				{
					key: 'tunisia',
					i18nLabel: 'Country_Tunisia'
				},
				{
					key: 'turkey',
					i18nLabel: 'Country_Turkey'
				},
				{
					key: 'turkmenistan',
					i18nLabel: 'Country_Turkmenistan'
				},
				{
					key: 'turksAndCaicosIslands',
					i18nLabel: 'Country_Turks_and_Caicos_Islands'
				},
				{
					key: 'tuvalu',
					i18nLabel: 'Country_Tuvalu'
				},
				{
					key: 'uganda',
					i18nLabel: 'Country_Uganda'
				},
				{
					key: 'ukraine',
					i18nLabel: 'Country_Ukraine'
				},
				{
					key: 'unitedArabEmirates',
					i18nLabel: 'Country_United_Arab_Emirates'
				},
				{
					key: 'unitedKingdom',
					i18nLabel: 'Country_United_Kingdom'
				},
				{
					key: 'unitedStates',
					i18nLabel: 'Country_United_States'
				},
				{
					key: 'unitedStatesMinorOutlyingIslands',
					i18nLabel: 'Country_United_States_Minor_Outlying_Islands'
				},
				{
					key: 'uruguay',
					i18nLabel: 'Country_Uruguay'
				},
				{
					key: 'uzbekistan',
					i18nLabel: 'Country_Uzbekistan'
				},
				{
					key: 'vanuatu',
					i18nLabel: 'Country_Vanuatu'
				},
				{
					key: 'venezuela',
					i18nLabel: 'Country_Venezuela'
				},
				{
					key: 'vietNam',
					i18nLabel: 'Country_Viet_Nam'
				},
				{
					key: 'virginIslandsBritish',
					i18nLabel: 'Country_Virgin_Islands_British'
				},
				{
					key: 'virginIslandsUS',
					i18nLabel: 'Country_Virgin_Islands_US'
				},
				{
					key: 'wallisAndFutuna',
					i18nLabel: 'Country_Wallis_and_Futuna'
				},
				{
					key: 'westernSahara',
					i18nLabel: 'Country_Western_Sahara'
				},
				{
					key: 'yemen',
					i18nLabel: 'Country_Yemen'
				},
				{
					key: 'zambia',
					i18nLabel: 'Country_Zambia'
				},
				{
					key: 'zimbabwe',
					i18nLabel: 'Country_Zimbabwe'
				}
			],
			wizard: {
				step: 2,
				order: 4
			}
		});
		this.add('Website', '', {
			type: 'string',
			wizard: {
				step: 2,
				order: 5
			}
		});
		this.add('Server_Type', '', {
			type: 'select',
			values: [
				{
					key: 'privateTeam',
					i18nLabel: 'Private_Team'
				},
				{
					key: 'publicCommunity',
					i18nLabel: 'Public_Community'
				}
			],
			wizard: {
				step: 3,
				order: 2
			}
		});
	});
});

RocketChat.settings.init();


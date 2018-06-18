/* globals RocketChat */
import { UiTextContext } from 'meteor/rocketchat:lib';
import _ from 'underscore';

//console.log(Template.roomList.__helpers[' rooms'];


Template.roomList.__helpers[' rooms'] = function() {
	/*
		modes:
			sortby activity/alphabetical
			merge channels into one list
			show favorites
			show unread
	*/
	if (this.anonymous) {
		return RocketChat.models.Rooms.find({t: 'c'}, {sort: {name: 1}});
	}
	const user = Meteor.userId();
	const sortBy = RocketChat.getUserPreference(user, 'sidebarSortby') || 'alphabetical';
	const query = {
		open: true
	};

	const sort = {};

	if (sortBy === 'activity') {
		sort.lm = -1;
	} else { // alphabetical
		sort[this.identifier === 'd' && RocketChat.settings.get('UI_Use_Real_Name') ? 'lowerCaseFName' : 'lowerCaseName'] = /descending/.test(sortBy) ? -1 : 1;
		sort['name'] = /descending/.test(sortBy) ? -1 : 1;
	}

	if (this.identifier === 'unread') {
		query.alert = true;
		query.hideUnreadStatus = {$ne: true};

		return ChatSubscription.find(query, {sort});
	}

	const favoritesEnabled = !!(RocketChat.settings.get('Favorite_Rooms') && RocketChat.getUserPreference(user, 'sidebarShowFavorites'));

	if (this.identifier === 'f') {
		query.f = favoritesEnabled;
	} else {
		let types = [this.identifier];

		if (this.identifier === 'merged') {
			types = ['c', 'p', 'd'];
		}

		if (this.identifier === 'unread' || this.identifier === 'tokens') {
			types = ['c', 'p'];
		}

		if (['c', 'p'].includes(this.identifier)) {
			query.tokens = { $exists: false };
		} else if (this.identifier === 'tokens' && user && user.services && user.services.tokenpass) {
			query.tokens = { $exists: true };
		}

		if (RocketChat.getUserPreference(user, 'sidebarShowUnread')) {
			query.$or = [
				{alert: {$ne: true}},
				{hideUnreadStatus: true}
			];
		}
		query.t = {$in: types};
		if (favoritesEnabled) {
			query.f = {$ne: favoritesEnabled};
		}
	}

	//statistic rooms
	/*let subscriptionStatistic = ChatSubscription.find({isStatistic: {$eq: true}});

	if (!subscriptionStatistic || !subscriptionStatistic._id) {
		Meteor.call('createSubscriptionStatistic');
	}*/

	let result = ChatSubscription.find(query, {sort});
	console.log(query);
	return result;
}
